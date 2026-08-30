---
title: LSTM + Kalman 分层融合自瞄：5 帧预判 20 帧的高精度坐标预测
date: 2025-12-03 16:30:00
location: 北京
tags:
  - 自瞄
  - 时序预测
  - Kalman Filter
  - LSTM
  - YOLO
categories: CV
cover: /img/vision/coordinate_prediction_distribution_comparison.png
ai: false
---

## 1. 背景与目标
在自瞄/跟踪场景里，我们希望只用前 5 帧 ROI，就能给出第 20 帧的边界框 `(x, y, w, h)`，而且：
- 精度高：R² 接近 1，MSE 够低。
- 实时：端到端毫秒级。
- 稳定：遮挡、噪声、尺度变化下抖动小。

本文记录的方案把 LSTM 的时序感知和 Kalman 的稳健估计分层融合，同时保持极轻的推理开销。

## 2. 系统总览
```
视频帧 → YOLO 检测 → 64×64 ROI+上下文 → LSTM 时序编码
              ↘（检测掩码）
LSTM 隐状态 → 自适应 Kalman 滤波 → 分层门控融合 → 坐标/置信度头 → 预测第20帧
```
- 输入：5 帧 ROI（灰度 64×64 展平 4096 维）。
- 训练：20 帧序列（5 输入 + 15 间隔 + 1 目标）。
- 推理：仅需 5 帧，直接输出第 20 帧坐标。

## 3. 关键代码与设计
### 3.1 分层融合（门控 + 投影）
```python
class FusionModule(nn.Module):
    def __init__(self, hidden_size):
        super().__init__()
        self.lstm_enc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size), nn.ReLU(), nn.Dropout(0.1))
        self.kf_enc = nn.Sequential(
            nn.Linear(hidden_size, hidden_size), nn.ReLU(), nn.Dropout(0.1))
        self.gate = nn.Sequential(
            nn.Linear(hidden_size * 2, hidden_size), nn.ReLU(),
            nn.Linear(hidden_size, 1), nn.Sigmoid())
        self.proj = nn.Sequential(
            nn.Linear(hidden_size, hidden_size), nn.ReLU(),
            nn.Dropout(0.1), nn.Linear(hidden_size, hidden_size))

    def forward(self, h_lstm, h_kf):
        hl = self.lstm_enc(h_lstm)
        hk = self.kf_enc(h_kf)
        g = self.gate(torch.cat([hl, hk], dim=-1))
        return self.proj(g * hl + (1 - g) * hk)
```
门控动态决定“信 LSTM 还是信 Kalman”，再统一投影，兼顾敏捷与平滑。

### 3.2 自适应 Kalman（可学习噪声 + 状态转移）
```python
class AdaptiveKalmanFilter(nn.Module):
    def __init__(self, hidden_size):
        super().__init__()
        self.log_q = nn.Parameter(torch.tensor(-2.0))
        self.log_r = nn.Parameter(torch.tensor(-2.0))
        self.A = nn.Parameter(torch.eye(hidden_size) * 0.95)
        self.P0 = torch.eye(hidden_size) * 1.0

    def forward(self, h_prev, h_obs):
        Q = torch.eye(self.A.size(0), device=h_prev.device) * torch.exp(self.log_q)
        R = torch.eye(self.A.size(0), device=h_prev.device) * torch.exp(self.log_r)
        P = self.P0.to(h_prev.device)

        h_pred = torch.mm(h_prev, self.A.t())
        P_pred = self.A @ P @ self.A.t() + Q
        P_pred = P_pred.unsqueeze(0).expand(h_prev.size(0), -1, -1)

        P_plus_R = P_pred + R.unsqueeze(0).expand_as(P_pred)
        try:
            L = torch.linalg.cholesky(P_plus_R)
            inv = torch.cholesky_inverse(L)
        except:
            inv = torch.pinverse(P_plus_R)

        K = torch.bmm(P_pred, inv)
        return h_pred + torch.bmm(K, (h_obs - h_pred).unsqueeze(-1)).squeeze(-1)
```
噪声与状态转移矩阵参与训练，对分布漂移更稳。

### 3.3 主干与双头输出
```python
class CoordinatePredictionModel(nn.Module):
    def __init__(self, input_size=4096, hidden_size=128, num_layers=2, dropout=0.1):
        super().__init__()
        self.lstm = LSTMFeatureExtractor(input_size, hidden_size, num_layers, dropout)
        self.kf = AdaptiveKalmanFilter(hidden_size)
        self.fusion = FusionModule(hidden_size)
        self.coord_head = nn.Sequential(
            nn.Linear(hidden_size, hidden_size//2), nn.ReLU(), nn.Dropout(dropout),
            nn.Linear(hidden_size//2, hidden_size//4), nn.ReLU(),
            nn.Linear(hidden_size//4, 4), nn.Sigmoid())
        self.conf_head = nn.Sequential(
            nn.Linear(hidden_size, hidden_size//4), nn.ReLU(),
            nn.Linear(hidden_size//4, 1), nn.Sigmoid())

    def forward(self, x, h_prev=None):
        if h_prev is None:
            h_prev = torch.zeros(x.size(0), self.kf.A.size(0), device=x.device)
        h_lstm, _ = self.lstm(x)
        h_kf = self.kf(h_prev, h_lstm)
        h_fused = self.fusion(h_lstm, h_kf)
        return self.coord_head(h_fused), self.conf_head(h_fused)
```
坐标头 + 置信度头分开，便于后处理/可视化。

### 3.4 ROI 与掩码
```python
gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
resized = cv2.resize(gray, (64, 64))
if use_detection:
    mask = create_mask_from_yolo(boxes, padding=15)
    resized = resized * (mask/255.0) + resized * (1 - mask/255.0) * 0.1  # 留少量上下文
normalized = resized.astype(np.float32) / 255.0
```
检测掩码 + padding 保留目标上下文，抑制背景噪声。

## 4. 训练与推理配置
- 输入：5 帧 ROI（4096 维），预测第 20 帧。
- 模型：hidden=128，LSTM 层=2，dropout=0.1。
- 优化：batch=32，lr=1e-3，epoch=100。
- 数据：小视频训练（~668 帧），大视频验证（~7669 帧），检验泛化。
- 推理：端到端 2–3 ms（检测为主要开销，轻量化/缓存可再降）。

运行命令：
```bash
conda create -n py310 python=3.10
conda activate py310
pip install -r requirements.txt
pip install scikit-learn joblib scipy pandas tqdm seaborn

# 训练
python train_coordinate_prediction.py

# 三列演示（原始 / 检测 / 预测）
python coordinate_prediction_demo.py

# 多模型对比
python coordinate_prediction_comparison.py
```

## 5. 结果与对比（5→20 帧）

![多模型指标对比](/img/vision/coordinate_prediction_metrics_comparison.png)
![误差分布对比](/img/vision/coordinate_prediction_distribution_comparison.png)

| 模型                        | MSE               | RMSE              | MAE                | R²              | 推理(ms)        |
|-----------------------------|-------------------|-------------------|--------------------|-----------------|-----------------|
| **LSTM-KF-Fusion-Hierarchical** | **0.000425 ± 0.000551** | **0.01709 ± 0.01152** | **0.01205 ± 0.00805** | **0.9934 ± 0.0091** | **2.46 ± 1.71** |
| DT                          | 0.00312 ± 0.00321 | 0.04746 ± 0.02945 | 0.03852 ± 0.02869 | 0.9579 ± 0.0380 | 48.94 ± 0.11    |
| AR                          | 0.00425 ± 0.00347 | 0.05923 ± 0.02714 | 0.04603 ± 0.02644 | 0.9422 ± 0.0410 | 1.13 ± 0.07     |
| SVR                         | 0.00719 ± 0.00166 | 0.08426 ± 0.00967 | 0.07866 ± 0.01117 | 0.8960 ± 0.0131 | 19.94 ± 0.24    |
| KNN                         | 0.00160 ± 0.00171 | 0.03425 ± 0.02059 | 0.02613 ± 0.01619 | 0.9786 ± 0.0201 | 52.49 ± 1.88    |
| Serial Kalman→LSTM          | 0.00551 ± 0.00726 | 0.06188 ± 0.04095 | 0.05149 ± 0.03431 | 0.9192 ± 0.1105 | 1.62 ± 0.18     |
| Serial LSTM→Kalman          | 0.00485 ± 0.00585 | 0.06030 ± 0.03488 | 0.05038 ± 0.02966 | 0.9280 ± 0.0893 | 1.74 ± 0.19     |
| ANN                         | 0.01929 ± 0.01547 | 0.12179 ± 0.06678 | 0.10229 ± 0.05234 | 0.7369 ± 0.1843 | 25.88 ± 0.27    |
| Standalone LSTM             | 0.02593 ± 0.00653 | 0.15929 ± 0.02356 | 0.14124 ± 0.02395 | 0.6248 ± 0.0742 | 2.54 ± 0.14     |
| Standalone Kalman           | 0.02667 ± 0.00655 | 0.16163 ± 0.02346 | 0.14362 ± 0.02396 | 0.6137 ± 0.0746 | 2.51 ± 0.12     |

## 6. 更多细节与亮点
- 为什么要分层融合：Kalman 擅长平滑与抗噪，LSTM 擅长捕捉序列模式，门控让二者动态取长补短。
- 5→20 的设定：比常见的短期预测更具挑战，能验证模型对长跨度运动的外推能力。
- ROI + 上下文：在小目标/遮挡场景中，少量上下文能显著降低误检与漂移。
- 置信度头：可用于过滤低置信度预测，或在可视化中用透明度/颜色区分。

## 7. 消融与经验
- 去掉 Kalman：MSE 上升一个数量级，远期抖动明显。
- 去掉融合门控：快变/遮挡下不稳，误差方差增大。
- 关闭上下文 padding：小目标易漏检，R² 明显下降。
- 序列长度减到 10：实时性更好但远期精度显著下降。

调参提示：
- 目标小且易抖：增大 padding，抬高置信度阈值。
- 剧烈运动：放宽 Kalman 噪声初值或增大 hidden。
- 部署：检测是瓶颈，先轻量化/缓存检测；融合头极轻，可 ONNX/TensorRT。

## 8. 复现路线
1. Python 3.10，安装依赖：`requirements.txt` + `scikit-learn joblib scipy pandas tqdm seaborn`。
2. 放置视频与 `best.pt` 权重。
3. 训练：`python train_coordinate_prediction.py`。
4. 演示：`python coordinate_prediction_demo.py` 生成三列视频（原始/检测/预测）。
5. 评测：`python coordinate_prediction_comparison.py` 自动产出表和图。
6. 无 GPU：降低 `num_sequences` 与 `sequence_length`，逻辑仍可跑通。

## 9. 结语
分层融合让 LSTM 的时序感知与 Kalman 的稳健估计互补，在“5 帧看穿 20 帧”的自瞄任务里兼顾了精度、延迟与稳定性。接下来可以尝试多尺度金字塔、检测-预测联合训练，以及端侧加速（多线程解码 + 轻量化检测）进一步压榨时延。
