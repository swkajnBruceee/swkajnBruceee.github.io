---
title: 三天血泪史：我在RTX 4060上部署DeepSeek R1的完整指南
date: 2025-08-20 19:30:24
updated: 2025-08-20 19:46:32
location: 北京
tags:
  - DeepSeek
  - AI部署
  - Docker
  - Ubuntu
  - GPU
  - 本地AI
  - Ollama
categories:
  - 技术分享
description: 详细记录在RTX 4060显卡上部署DeepSeek R1大语言模型的完整过程，包括踩坑经历和解决方案
keywords: DeepSeek R1,本地AI部署,RTX 4060,Ollama,Docker,Ubuntu,GPU部署
top_img: /img/covers/deepseek-deployment.svg
cover: /img/covers/deepseek-deployment.svg
ai: false
comments: true
toc: true
toc_number: true
copyright: true
mathjax: false
katex: false
---

# 三天血泪史：我在RTX 4060上部署DeepSeek R1的完整指南

## 前言：为什么我要选择本地部署？

最近大语言模型很火，但用API总有种"受制于人"的感觉，同时还常常遇到高峰期请求失败的情况。作为一名开发者，我决定在自己的电脑上搭建一个完全本地的AI助手。没想到，这个决定让我开始了72小时的"渡劫"之旅...


## 硬件环境检查

**我的配置**：

- 💻 拯救者R9000P ARX8
- 🎮 NVIDIA RTX 4060 Laptop GPU (8GB VRAM)
- 🧠 16GB DDR5 RAM
- 🐧 Ubuntu 24.04 LTS

**DeepSeek R1 模型参数与显卡需求**（来自官方文档）

![DeepSeek R1 模型参数表](/img/posts/deepseek-deployment/docker-deployment.png)

## 第一阶段：正确的部署流程（避坑版）

### 1.在 Ubuntu 上安装 Ollama

**官方方法（网络好时推荐）**：
```bash
# 一键安装
curl -fsSL https://ollama.com/install.sh | sh

# 验证安装
ollama --version
```

![Ollama安装成功截图](/img/posts/deepseek-deployment/model-download.png)

**离线安装（我的实际方案）**：
```bash
#1. 下载离线包（在其他机器上）
#从 https://github.com/ollama/ollama/releases 下载 ollama-linux-amd64.tar.gz

#2. 传输到Ubuntu（我用U盘，你也可以用scp）
cp /media/username/U盘/ollama-linux-amd64.tar.gz ~/

#3. 解压安装
tar -xzvf ollama-linux-amd64.tar.gz
sudo mv ollama /usr/local/bin/
sudo chmod +x /usr/local/bin/ollama

#4. 创建数据目录
mkdir -p ~/.ollama

#5. 验证
ollama --version
#应该输出：ollama version 0.5.7
```

### 2. 下载DeepSeek R1 模型

```bash
#直接运行会自动下载
ollama run deepseek-r1:1.5b

#如果下载中断，可以重复执行，支持断点续传
#下载完成后会自动进入对话模式
>>> 你好，我是DeepSeek-R1...
```
![DeepSeek R1 模型下载过程](/img/posts/deepseek-deployment/model-requirements.png)

### 3. Docker部署（GPU版本）

**步骤1：安装NVIDIA容器工具包**
```bash
# 添加NVIDIA包仓库
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# 安装工具包
sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker

# 验证GPU支持
docker run --rm --gpus=all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

**步骤2：拉取Ollama Docker镜像**
```bash
# 使用可用镜像源
docker pull docker.1ms.run/ollama/ollama

# 或者构建别名
docker tag docker.1ms.run/ollama/ollama ollama/ollama
```

**步骤3：运行ollama**
```bash
docker run -d \
  --gpus=all \
  -v ollama-data:/root/.ollama \
  -p 11434:11434 \
  --name ollama \
  ollama/ollama
# 参数解释：
• -d：后台运⾏容器
• --name ollama：容器命名为ollama
• -p 11434:11434：映射Ollama的API端⼝

**步骤4：启动模型服务**
# (1) 进⼊容器内
docker exec -it ollama /bin/bash
# (2) 启动模型服务
ollama run deepseek-r1:1.5b
```
![Docker部署成功截图](/img/posts/deepseek-deployment/ollama-install.png)

### 4. OpenWebUI部署与交互

```bash
# 参考链接：https://github.com/open-webui/open-webui.gi
# 1.拉取镜像
docker pull ghcr.io/open-webui/open-webui:main

# 2.启动并运行一个新的容器
docker run -d \
  -p 8805:8080 \
  --add-host=host.docker.internal:host-gateway \
  -v open-webui-data:/app/backend/data \
  --name open-webui \
  ghcr.io/open-webui/open-webui:main
```

![运行容器](/img/posts/deepseek-deployment/openwebui-interface.png)

```bash
# 3. 启动 ollama docker 模型服务
docker restart ollama

# 4. Web UI 交互
localhost:8805
```
![OpenWebUI交互截图](/img/posts/deepseek-deployment/openwebui-interaction.png)

## 第二阶段：我踩过的坑和解决方案

### 坑1：网络限制导致安装失败

**问题现象**：
```bash
# 一直卡住或者报错
curl -fsSL https://ollama.com/install.sh | sh
# => curl: (7) Failed to connect to ollama.com port 443: Connection timed out
```

**尝试的解决方案**：
1. ❌ 换国内源（发现没有Ollama的源）
2. ❌ 配置HTTP代理（公司网络限制）
3. ❌ 手机热点（速度太慢且不稳定）
4. ✅ **离线安装**：下载离线包+U盘传输

### 坑2：模型下载中途失败

**问题现象**：
```bash
ollama run deepseek-r1:1.5b
# => pulling manifest... 50% then disconnected
```

**解决方案**：
- 发现Ollama支持断点续传，重复执行即可
- 选择网络较好的时段
- 耐心重试了3次才完成

### 坑3：Docker GPU支持问题

**错误信息**：
```bash
docker: Error response from daemon: could not select device driver "" with capabilities: [[gpu]].
```

**根本原因**：缺少NVIDIA容器工具包

**解决过程**：
1. 先安装NVIDIA驱动：
```bash
sudo apt install nvidia-driver-550
```
2. 然后安装容器工具包（见前面正确步骤）
3. 验证：`docker run --rm --gpus=all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi`

### 坑4：Docker镜像拉取失败

**问题**：国内镜像源大面积停止服务
```bash
docker pull ollama/ollama
# => net/http: request canceled (Client.Timeout exceeded...)
```

**解决方案**：
- 尝试阿里云、网易、中科大镜像，都失败
- 最终找到可用的私人镜像源：`docker.1ms.run/ollama/ollama`

### 坑5：端口冲突

**问题**：11434端口被占用
```bash
docker: Error response from daemon: Ports are not available: listen tcp 0.0.0.0:11434: bind: address already in use.
```

**解决方案**：
```bash
# 查找占用进程
lsof -i :11434
# 或者
ss -tulpn | grep :11434

# 杀死进程
kill -9 <PID>

# 或者改用其他端口
docker run -p 11435:11434 ...
```

## 第三阶段：最终效果与性能测试

### 成功部署后的界面
访问 `http://localhost:8805` 可以看到：
- 🎨 漂亮的聊天界面
- ⚡ 实时响应
- 📁 对话历史管理
- ⚙️ 模型切换功能

### 实际对话测试
**我**：请解释一下PPO强化学习算法  
**DeepSeek-R1**：PPO（Proximal Policy Optimization）是一种策略梯度算法，它通过限制策略更新的幅度来保证训练的稳定性。主要优点是实现简单、效果稳定、适用于连续和离散动作空间...

## 经验总结与建议

### 给新手的建议
1. **硬件选择**：8GB显存老老实实用1.5B模型，别想7B
2. **网络准备**：提前下载好离线安装包
3. **镜像源**：多准备几个备选源
4. **耐心**：模型下载很耗时，做好心理准备

### 必备检查清单
- [ ] NVIDIA驱动已安装 (`nvidia-smi` 有输出)
- [ ] Docker已安装 (`docker --version`)
- [ ] NVIDIA容器工具包已安装
- [ ] 11434端口未被占用
- [ ] 磁盘空间充足 (至少10GB)

### 性能优化技巧
```bash
# 调整Ollama的线程数
OLLAMA_NUM_PARALLEL=4 ollama run deepseek-r1:1.5b

# 使用更高效的数据格式
OLLAMA_QUANTIZE=q4_0 ollama run deepseek-r1:1.5b
```

## 未来计划

1. **接入本地文档**：实现真正的RAG功能
2. **尝试微调**：用自己数据训练专业模型
3. **优化部署**：使用Docker Compose管理
4. **监控系统**：添加性能监控和日志

## 结语

这72小时的部署之旅虽然曲折，但收获巨大。从一次次失败到最终成功，每个错误都让我对Linux、Docker、GPU驱动有了更深的理解。现在我的本地AI助手已经稳定运行，这种"一切尽在掌握"的感觉真的很棒！

如果你也想在本地部署大模型，希望我的经验能帮你少走弯路。记住：每个错误都是成长的机会，坚持下去一定能成功！

---

**资源下载**：
- [Ollama官方发布页面](https://github.com/ollama/ollama/releases)
- [DeepSeek官方页面](https://huggingface.co/deepseek-ai)

欢迎在评论区分享你的部署经历和问题！