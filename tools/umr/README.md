# UMR 演示的模型转换

站点构建直接使用 `source/labs/umr/assets/`，不依赖 Python、原机器人工作区或网络。只有需要更换模型、姿态或采样时才运行转换。

转换需要 Python 3、NumPy、SciPy、trimesh 5.1.0 与 fast-simplification 0.2.0。准备一个临时输入目录，将 MakeHuman 固定提交 `a8bc2d54ff0ac92e78ff71431b1023eda42bf482` 中的 `makehuman/data/3dobjs/base.obj` 保存为 `human-base.obj`，并放入同提交的 `makehuman/data/rigs/default.mhskel` 与 `default_weights.mhw`。这三份资源为 CC0，来源说明见输出目录的 `ATTRIBUTION.txt`。

```bash
python tools/umr/build-models.py \
  --human-dir /tmp/blog-umr-models \
  --urdf /home/bruce/桌面/HOPETableTennis/agibot/URDF/a3_t2d5/urdf/model.urdf
```

脚本只读取 URDF 工作区，不修改原文件。它处理 URDF 的关节树、origin、axis、visual origin 与 mesh scale；本次 A3 肩 roll 为左右 ±π/2，双肘为 +π/2，其余关节为零。人体按原骨骼蒙皮权重将肩肘腕调整为展开姿态。两者分别归一化到单位高度，因此浏览器中的 r 为无量纲长度。

几何数据按 position float32、normal float32、index uint32 写入小端二进制文件，偏移与链接名记录在 `models.json`。人体面上的重心坐标与目标面编号记录在 `samples.json`。面积加权候选经最远点选择得到人体 768 个点与目标 1,152 个点；源网格最短路的 6 近邻构成固定平滑图。减面影响的是 A3 可视表面，目标点就在减面后的表面采样。

修改采样数或减面策略后，应同步更新页面与来源说明中的数量，并运行 `npm test`、`npm run build`、`npm run check:site` 和浏览器测试。`tools/umr-assets.test.js` 检查采样点确实绑定在显示的三角面上；损失测试检查解析梯度与实际模型优化，浏览器测试检查真实网格渲染、视图控制与降级。
