---
title: 让人形机器人接住下一颗球：HOPE 乒乓球项目的物理规划与全身控制
date: 2026-08-30 16:20:00
updated: 2026-08-30 16:20:00
location: 北京
categories:
  - 机器人
  - 具身智能
tags:
  - 乒乓球机器人
  - 具身智能
  - 强化学习
  - 全身控制
  - Isaac Lab
  - MuJoCo
  - ROS 2
  - 模型预测
keywords:
  - HOPE 乒乓球机器人
  - Agibot A3
  - 全身强化学习
  - 球轨迹预测
  - 击球规划
  - MuJoCo 闭环
  - Isaac Lab
top_img: /img/covers/hitch2.png
cover: /img/covers/hitch2.png
description: 以 HOPE 开源工程为线索，拆解 Agibot A3 人形机器人打乒乓球时从球物理、轨迹估计、击球目标规划到全身强化学习和部署审计的完整技术链路。
comments: true
toc: true
toc_number: true
copyright: true
mathjax: true
katex: false
ai: false
hope_lab: true
---

# 让人形机器人接住下一颗球：HOPE 乒乓球项目的物理规划与全身控制

机器人打乒乓球最容易被误解的地方，是人们往往只看见了“挥拍”这个动作。球飞过来，机器人把拍子伸过去，球被击回去——视频里看起来不过是一瞬间；但从控制系统的角度看，这一瞬间同时包含了观测、状态估计、空气动力学预测、击球时刻选择、末端目标生成、全身协调、接触动力学与安全执行。

我最近整理的 [HOPE: Hitch Open Ping-Pong Embodied AI Challenge](https://github.com/swkajnBruceee/hope-training) 工程，正好提供了一个很适合拆开的案例。它不是一个已经被包装成“成功率数字”的黑盒模型，而是一套持续演化的研究与工程记录：里面既有 Isaac Lab 中的 A3 球台场景，也有模型驱动的击球规划器、MuJoCo 闭环、ROS 2 接口、训练合同、部署审计和明确写下来的未完成事项。

这篇文章不把“人形机器人打球”当作一个单独的神经网络问题，而是把它看成一个带有离散碰撞事件的闭环系统，沿着一颗球的生命周期，解释这个项目究竟在解决什么、为什么这样拆、目前哪些结论已经被证据支持，以及哪些事情还不能提前宣布完成。

> **先说结论**
> - HOPE 当前最清晰的成果是把球物理、轨迹规划、全身策略和部署接口接成了可审计的闭环。
> - 单球 `RACKET CONTACT`、场景 smoke run 和接口合同检查，不能直接等同于稳定回合率，更不能等同于真机部署完成。
> - 这篇文章重点解释“每一层负责什么、证据在哪里、还缺什么”，而不是给项目包装一个未经验证的成功数字。
>
> **状态截点**：以下结论以 2026-08-30 的仓库状态为准；项目持续更新后，应以对应提交中的脚本、日志和配置为准。

<!-- more -->

## 一、乒乓球为什么是一个很尖锐的具身智能问题

标准球台长 $2.74\,\mathrm{m}$、宽 $1.525\,\mathrm{m}$，球网高 $0.1525\,\mathrm{m}$，球的直径只有 $40\,\mathrm{mm}$，质量约 $2.7\,\mathrm{g}$。对于人类来说，我们会把视觉、经验和身体反应压缩成一个整体动作；对于机器人来说，这几个数字构成的是一个相当苛刻的时间—空间约束。

球在飞行中不是一个只受重力影响的质点。速度越高，阻力越显著；击台时，法向速度、切向速度、接触点和摩擦共同决定反弹；如果考虑旋转，还会出现 Magnus 力。机器人也不是一条可以随意移动的机械臂：它要在击球时保持骨盆和双脚的支撑关系，手臂加速会反作用于躯干，躯干倾斜又会改变球拍的可达空间。于是，“把球拍移到球旁边”只是问题的几何部分；真正要完成的是让球拍在正确的时间，以正确的速度和拍面方向到达一个有容差的接触区域。

从形式上看，可以将任务写成一个部分可观测、带碰撞事件的控制问题。系统状态可以抽象为

$$
 x_t = [q_t,\dot q_t, p^b_t, v^b_t,\omega^b_t, c_t],
$$

其中 $q,\dot q$ 是机器人关节状态，$p^b,v^b,\omega^b$ 是球的位置、线速度和角速度，$c_t$ 表示当前飞行、触台、击球等阶段。传感器得到的是带噪声的观测 $o_t$，策略输出的是关节目标或动作增量 $a_t$。撞击台面、球网或球拍时，状态并非平滑地连续演化，而是发生一次速度跃迁：这使它更接近一个混合动力系统，而不是普通的连续轨迹跟踪。

这也是为什么项目没有从“端到端网络直接看球出动作”开始。先把物理世界、坐标系和接口合同写清楚，实际上是在给学习器建立一个可解释的外骨架。

![HOPE 乒乓球控制闭环：从观测到规划、控制和执行](/img/posts/hope-robot-pingpong/architecture.svg)

## 二、先统一世界：坐标系比模型大小更重要

HOPE 工程采用一个固定的 canonical world frame，并且让仿真、规划器、动捕和部署接口都尽量使用同一套语义：球台近侧左角是原点，$X$ 轴沿球台长度指向对手，$Y$ 轴从 P1 视角向左，$Z$ 轴向上，球台表面为 $z=0$，地面为 $z=-0.76\,\mathrm{m}$。球网中心线位于 $x=1.37\,\mathrm{m}$，对手半台中心为

$$
 p_{\mathrm{land}} = (2.055,-0.7625,0).
$$

这个选择看起来只是“把常数集中起来”，实际上决定了整个系统能不能闭环。若仿真里的 $z=0$ 是地面、规划器里的 $z=0$ 是台面，球拍目标就会整体错开 $0.76\,\mathrm{m}$；若某一层把 $Y$ 方向理解成向右，反手和正手区域会发生镜像；若模型的关节顺序与部署散射顺序不一致，即使每个张量的维度都正确，机器人也会执行另一组关节动作。

因此，项目里把球台尺寸、网位置、站位、joint order、ready pose、observation contract 和 action scale 分别固定在文档与配置中，并用测试和审计脚本对齐。具体入口可以参看 [运行时配置](https://github.com/swkajnBruceee/hope-training/blob/main/a3_deploy/a3_deploy_example/config/hope_pingpong_runtime.yaml)、[关节映射](https://github.com/swkajnBruceee/hope-training/blob/main/a3_deploy/a3_deploy_example/src/a3/a3_deploy_onnx_ref/include/a3_pingpong/pp_joint_map.hpp) 和 [运行时合同](https://github.com/swkajnBruceee/hope-training/blob/main/a3_deploy/a3_deploy_example/src/a3/a3_deploy_onnx_ref/include/a3_pingpong/pp_runtime_contract.hpp)。对具身系统而言，这些“看起来不像算法”的内容，往往就是 sim-to-real 最昂贵的部分。

## 三、球的物理：一个小球迫使仿真承认空气的存在

Isaac Lab/PhysX 可以处理重力和刚体接触，但不会自动给这个轻量球体补上符合项目模型的空气阻力。因此，HOPE 的 `TableTennisEnv` 在每个物理子步读取球的线速度，并通过 physics-step callback 写入额外的外力。当前无旋转基础模型的阻力项写作

$$
 a_{\mathrm{drag}} = -k\|v\|v,
 \qquad
 F_{\mathrm{drag}} = m a_{\mathrm{drag}}.
$$

这里的关键不只是公式，而是施加频率：场景物理运行在 $360\,\mathrm{Hz}$，控制 decimation 为 4，对应 $90\,\mathrm{Hz}$ 的环境控制节拍。高速小球如果只在较慢的控制回调里修正轨迹，薄球网和约 $2.9\,\mathrm{mm}$ 的球拍碰撞几何都可能出现穿透或误差放大。

碰撞则由 PhysX 的接触材料负责。项目明确区分了“法向反弹”和“切向速度保持”：球台反弹的法向恢复系数可以通过球与台面的材料组合近似实现，而水平方向的速度损失更多由摩擦决定，不能简单地把一个 $C_h$ 当作另一个法向 restitution。球拍接触也有自己的 $C_r$，并不等于球台反弹的 $C_v$。这类区分很重要，因为训练中如果用一个过于理想化的接触模型，策略学到的可能只是模拟器的漏洞。

旋转的 Magnus 项已经作为可选项提供：

$$
 a_{\mathrm{Magnus}} = k_M(\omega\times v).
$$

但规划器的控制主线目前仍采用 zero-spin 模型，旋转估计和 Magnus 传播只作为 shadow analysis 记录，不直接改变控制击球命令。这个取舍并不意味着旋转不重要，而是先保持因果链可审计：如果同时改变球的角速度估计、未来落点和击球目标，出现误差时很难判断究竟是观测、模型还是策略导致的。

下面这个小实验可以直接在文章里操作。它不是项目的高保真仿真，只用来展示一个直观事实：在相同初始速度下，忽略空气阻力会让轨迹预测逐渐偏离；旋转项则会把偏差从纵向速度传播到横向或竖直方向。这里的“旋转项”是教学用的近似，不等同于工程模型中的完整 Magnus 力计算。

<div class="hope-trajectory-lab" data-hope-trajectory-lab>
  <div class="hope-lab-heading">
    <div>
      <span class="hope-eyebrow">INTERACTIVE PHYSICS NOTEBOOK</span>
      <h3>一颗球的三种飞行假设</h3>
    </div>
    <button class="hope-lab-reset" type="button" data-hope-reset>重新发球</button>
  </div>
  <div class="hope-lab-controls" role="group" aria-label="选择球的物理模型">
    <button type="button" class="is-active" data-hope-mode="gravity" aria-pressed="true">只受重力</button>
    <button type="button" data-hope-mode="drag" aria-pressed="false">加入空气阻力</button>
    <button type="button" data-hope-mode="spin" aria-pressed="false">加入旋转近似</button>
    <button type="button" data-hope-mode="compare" aria-pressed="false">同时对比三种</button>
  </div>
  <div class="hope-lab-canvas-wrap">
    <p class="hope-lab-fallback">当前浏览器未启用 JavaScript。你仍可以阅读上下文中的公式；轨迹图是一个用于解释趋势的定性示意。</p>
    <canvas id="hope-trajectory-canvas" data-hope-canvas width="920" height="420" aria-label="球在三种物理假设下的轨迹对比"></canvas>
  </div>
  <div class="hope-lab-readout" aria-live="polite"><span data-hope-readout>模型：重力 · 轨迹已归一化展示</span><span>点击模型切换轨迹；这是定性示意，不是高保真仿真</span></div>
</div>

在工程版本中，这个简化实验对应的是更严格的分层：Isaac Lab 负责高频物理接触和阻力注入，规划器使用可校准的飞行模型，MuJoCo 闭环再检查规划器与策略的接口是否在连续时间中仍然成立。仿真不是为了“看起来像真的”，而是为了让每一层的假设可以被单独替换和验证。

## 四、从观测到击球目标：规划器不直接控制关节

HOPE 的模型驱动规划器将任务分成三个阶段。第一阶段从动捕或仿真球的位置流中估计球状态；第二阶段向前积分球的飞行轨迹；第三阶段把未来的击球事件转成球拍目标。它输出的不是“右肩抬高多少”，而是一个更适合跨机器人复用的任务空间命令：击球位置、击球速度、拍面法向和击球时间。规划器的接口和参考设置可以参看 [HOPE 规划器参考文档](https://github.com/swkajnBruceee/hope-training/blob/main/HOPE_7DOF_Racket_Model_based_Planner_Reference_Setup.md)。

### 1. 状态估计：速度不是传感器直接给你的

动捕系统通常可靠地给出位置，但规划需要速度。工程实现对最近的 $31$ 个位置样本做二阶多项式拟合：

$$
 p(t) \approx a_2t^2+a_1t+a_0,
 \qquad
 \hat v(t)=2a_2t+a_1.
$$

在 $360\,\mathrm{Hz}$ 下，这个窗口约为 $86\,\mathrm{ms}$。它用少量延迟换取速度估计的稳定性，并在确认球触台后清空历史，避免把碰撞前后的速度不连续硬拟合成一条平滑曲线。触台检测采用“下降—接近台面—上升”的三采样模式，而不是只看一次 $z$ 穿越阈值；后者很容易在球下落途中提前触发。

这类细节有一个共同点：它们把物理事件变成显式状态机。系统宁愿承认“这里发生了一个 bounce”，也不让滤波器在没有语义的情况下把两段不同动力学混在一起。

### 2. 轨迹预测：击球时间本身就是决策变量

规划器把当前估计的 $(p,v)$ 带入带重力和阻力的飞行模型，并通过小步长积分寻找目标击球平面 $x=x_{\mathrm{hit}}$ 的穿越时刻。若飞行过程中与球台发生接触，就在跨越台面高度的时间步内做子步插值，再施加反弹后的速度更新；如果轨迹在球网处的高度不足，则增加或拒绝该候选飞行时间。

这一步体现了模型驱动方法的优势：它能把“必须越网”“必须在击球走廊内”“必须先在近侧台面反弹”等约束写成可读的判定条件，而不是等待强化学习用稀疏奖励慢慢试错。

### 3. 击球目标：位置、速度、方向、时刻缺一不可

球拍目标可以写成

$$
 g_t = (\hat p_{\mathrm{racket}},\hat v_{\mathrm{racket}},
 \hat n_{\mathrm{racket}},t_{\mathrm{hit}}).
$$

只给位置不够：球拍虽然到了球旁边，但没有相对速度，可能只是“挡住”球；只给速度也不够：拍面法向决定碰撞后球速的方向。项目中的 racket command 使用 schema-2 的 19 个 double 字段承载这个目标，规划器在击球后只发布一次冻结的目标快照，避免策略执行过程中目标被不断改写。

球拍实际位置也不是由动捕直接测出来的。系统跟踪的是球台原点、机器人 `base_link` 和球；球拍位置通过 base pose、关节编码器和固定的腕部安装偏移做正向运动学得到。这个设计让系统可以换机器人，但也把 frame、joint order 和 mounting offset 的一致性变成必须审计的前提。

从控制理论的分类看，这条规划链路更接近“事件驱动的模型预测求解”，而不是把完整人形机器人塞进一个高维 MPC。它在每次观测到来时更新球状态，向未来滚动预测并选择一个击球目标，但并不在线优化未来几十个控制周期的全部关节序列；高维身体动作由低层全身策略去完成。这样的分工保留了模型预测对时间和几何的解释力，也避免了在实时环里求解一个包含接触、不等式约束和全身动力学的巨大优化问题。换句话说，规划器给的是“未来事件的条件”，策略负责把条件变成身体行为。

## 五、强化学习真正学的是什么：不是“找球”，而是执行任务空间意图

规划器解决的是“应该在什么时空状态击球”，全身策略解决的是“如何让一个会失衡、有关节限制、会产生反作用力的人形身体做到这件事”。这两者的职责不能混淆。

项目的训练路线遵循从简单到复杂的 curriculum：先验证球台与球物理，再做固定底座击球，随后学习定向回球；平行地训练站稳，之后才把站稳和击球合并，最后引入移动到位和连续回合。固定底座的意义不是偷换问题，而是隔离变量：如果站立、脚步、挥拍、落点和连续来球同时失败，reward 曲线没有足够的信息告诉我们是哪一层出了问题。

Isaac Lab 的 `ManagerBasedRLEnv` 很适合承载这种拆解：场景、观测、动作、奖励、终止、随机化和 curriculum 可以按 manager 组织。项目当前公开的 table-tennis task 已经包括 Agibot A3、球台、球网、动态乒乓球、重力、接触和空气阻力；`--fix_base` 场景 smoke run 的目标是验证场景与球物理，而不是宣称机器人已经学会平衡或回球。

在策略层，较新的 V1.3B runtime 采用“三模型协调”的思路。这里的“三模型”不是把三个网络的输出粗暴拼接，而是让它们承担不同的先验职责：

| 模块 | 输入合同 | 输出与职责 |
| --- | --- | --- |
| `model_3396_lower_prior` | 126D | 14D 历史下肢/支撑先验，当前 A3 通道实际使用 12D |
| `model_900_upper_prior` | 56D | 10D 固定基座上肢击球先验，带 READY、lookahead 与速度前馈 |
| `model_5000_student` | 98D actor | 26D reference-free 学生动作，负责在任务目标条件下修正全身行为 |

学生策略的 98D actor observation 包含 base 速度、重力投影、22 个关节位置、22 个关节速度、球拍位置/速度/法向、10D goal 和 previous action。这个 `goal_10d` 不是球心坐标，而是 pelvis/root 的 base-yaw local frame 下的“目标球拍位置、目标球拍速度、目标拍面法向、带符号的剩余击球时间”。把目标的物理语义写进 observation，是在告诉策略“你要完成什么”；把当前的球拍状态写进去，是在告诉策略“你离它还差多少”。

动作融合可以概括为：

$$
 q_{\mathrm{lower}}=q_{\mathrm{ready}}+
 \alpha_l(q_{3396}-q_{\mathrm{ready}})+s_l a_{\mathrm{student}}^{0:12},
$$

$$
 q_{\mathrm{upper}}=q_{\mathrm{ready}}+
 \alpha_u q_{900}+s_u a_{\mathrm{student}}^{12:22},
$$

而学生动作的最后 4 维承担 microstep command。这里的 ready pose、normalizer、局部坐标、动作 scale、速率限制和 clipping 都属于合同的一部分。少一个字段，网络就算成功前向推理，也不能说明它仍然在执行训练时学到的控制问题。

训练主线采用 PPO 时，策略更新并不是无约束地追逐当前 batch 的高回报动作。对旧策略与新策略的概率比值

$$
 r_t(\theta)=\frac{\pi_\theta(a_t\mid o_t)}{\pi_{\theta_{\mathrm{old}}}(a_t\mid o_t)},
$$

PPO 用裁剪后的 surrogate objective 限制单次更新幅度：

$$
 L^{\mathrm{CLIP}}(\theta)=
 \mathbb{E}_t\left[\min\left(r_t(\theta)\hat A_t,
 \operatorname{clip}(r_t(\theta),1-\epsilon,1+\epsilon)\hat A_t\right)\right].
$$

在这个任务里，PPO 的价值并不只是“能训练起来”。更实际的意义是，它允许我们在大量并行仿真环境中反复试探动作，同时用动作变化惩罚、关节限制、站稳和任务目标等信号把探索留在可执行区域。真正困难的仍然是 reward 和 curriculum 的设计：如果一开始就把“击中、过网、落台、站稳、移动和连续回合”全部压在一个稀疏成功指标上，策略很可能学不到任何有用的局部行为；把问题分成固定底座击球、定向回球、站稳和移动，是在改善 credit assignment，而不只是把项目拆成几个目录。

## 六、从 Isaac Lab 到 MuJoCo：闭环不是把模型文件换个后缀

训练环境和部署环境之间最危险的误区，是只比较 checkpoint 能不能加载。真正需要比较的是：相同的观测顺序是否成立，相同的坐标变换是否成立，相同的动作语义是否成立，接触和低层执行器是否给出了相近的状态转移。

项目因此加入了一个独立的 MuJoCo runtime adapter。它按 31 个 canonical joint name 从 A3 XML 提取 $q,\dot q$，计算训练侧一致的球拍挂点正向运动学，构造 98D/126D/56D 三套观测，加载各自的 normalizer，执行先验与学生策略的 blending，并在输出前施加关节、速度、扭矩和安全停机约束。MuJoCo 使用与 Isaac tracking 对齐的 $0.005\,\mathrm{s}\times4=50\,\mathrm{Hz}$ 策略节拍；它是接线和状态转移的审计平台，不等于真实硬件。

官方闭环脚本把 AimRT MuJoCo、native runner、base-pose relay、HOPE planner、Gate3 物理球和策略连成一条链。对应的 [闭环审计脚本](https://github.com/swkajnBruceee/hope-training/blob/main/a3_deploy/a3_deploy_example/scripts/pp_closed_loop_audit.py) 和 [规划包络审计](https://github.com/swkajnBruceee/hope-training/blob/main/a3_deploy/a3_deploy_example/scripts/pp_planner_envelope_audit.py) 可以帮助复核这条链路。启动顺序之所以被固定，是因为它本身就是实验条件：先让机器人完成 `PD_STAND` 与静态稳定，再进入 `MOTION level=0` 准备态，最后才发球。如果球先启动，planner 可能在 robot、frame 或 policy 尚未准备好时消费一段不完整轨迹，之后的“失败”就没有清晰归因。

> **证据说明**：下文视频用于直观展示 MuJoCo 仿真环境，不等同于正式成功率或真机部署完成。关于闭环状态的判断，仍应以 HOPE 工程中的脚本、日志和部署审计结果为准。

<div class="hope-evidence-grid">
  <div class="hope-evidence-card is-done"><span>STAGE 0</span><strong>场景与球物理</strong><small>Isaac Lab smoke run 已写入验收路径</small></div>
  <div class="hope-evidence-card is-done"><span>LOOP</span><strong>单球 RACKET CONTACT</strong><small>MuJoCo + planner 闭环已实际观测到</small></div>
  <div class="hope-evidence-card is-open"><span>DEPLOY</span><strong>官方策略资产</strong><small>当前审计结论：dry_run_ready，但 policy_ready=false</small></div>
</div>

这里要特别区分三个结论。第一，单球 `RACKET CONTACT` 说明规划器、runner、策略和球拍接触事件在闭环中至少连接起来了；第二，随机多球模式已经完成发球和连续 planner 压力链路，但并未因此获得“十球全部成功”的正式成功率；第三，policy bundle 能通过 shape/normalizer/contract smoke，也不等于已经完成真机部署。工程上，诚实地保留这三个边界，比给出一个失去实验条件的成功数字更有价值。

## 七、这个项目与近期研究路线的关系

近两年的人形乒乓球研究大致出现了几条互补路线。

一条路线是 [HITTER](https://arxiv.org/abs/2508.21043) 所代表的层级式方法：高层模型规划器负责球的轨迹、击球位置、速度与时刻，低层强化学习全身控制器负责将这些任务目标执行成协调的手臂和腿部运动，并用人类动作先验改善运动质量。HOPE 当前的 planner—target—whole-body controller 分层，和这条路线在问题分解上高度相通。

另一条路线是 [PACE](https://arxiv.org/abs/2509.21690) 的端到端全身强化学习：将球的位置等预测信号直接纳入策略，通过密集的、物理引导的 reward 同时学习击球与脚步。它强调统一策略在不同来球和移动条件下的能力，也提醒我们：模块化规划虽然可解释，但当可达域和脚步变化扩大后，策略仍要学会把预测误差转化为身体动作。

更近的 [SMASH](https://arxiv.org/abs/2604.01158) 则把重点推进到机载视觉、动态全身击球和更丰富的动作生成，目标是摆脱对外部动捕的依赖。[BeyondMimic](https://arxiv.org/abs/2508.08241) 代表的运动先验路线，则说明人类动作数据和 guided diffusion 可以为人形机器人提供更广的全身运动空间。它们共同指向一个趋势：未来的机器人不会只是在一个固定击球点做局部反应，而要在感知、预测、动作先验和接触控制之间形成更强的统一。

HOPE 目前更像是一条“工程可验证的中间道路”：用模型驱动规划把极短时间内的关键几何目标明确化，用 PPO 及其先验结构解决高维全身执行，再用 MuJoCo、ROS 2 和部署合同检查每层的语义有没有在迁移时丢失。这个选择牺牲了一部分端到端的简洁，却换来了更清楚的失败解释路径。

## 八、部署合同：最容易被低估的研究内容

在普通深度学习实验里，模型文件通常是中心；在机器人部署里，模型只是合同的一部分。HOPE 的 V1.3B 包把以下内容一起视为可复现条件：

* 学生策略的输入必须是 98D actor observation，输出必须是 26D action；critic 的 99D 输入不进入真机。
* lower prior 与 upper prior 必须分别使用各自的 observation contract、normalizer、joint mapping 和 ready/prelude 逻辑。
* `goal_10d` 必须是训练合同中定义的局部球拍目标，不能替换成世界坐标、球心速度或击球后的出球速度。
* 31-DOF canonical joint order、动作 scale、previous action、速率限制和 clipping 必须保持一致。
* `tau_ff`、低层 PD、硬件限位、扭矩/速度约束和急停必须沿真实执行链路审计，不能把 MuJoCo 的 `data.ctrl` 直接当成机器人命令。

这类合同的价值，在于把“模型没学好”和“模型被错误地接上了”区分开。比如官方 A3 部署资产审计已经发现，某些模型虽然同样输出 29 个动作，但输入维度、tensor name 或观测语义不同，不能因为文件名相似就互换；一份模型能被 ONNX Runtime 加载，也不代表它适合当前的 observation contract。观测和球拍命令的具体实现可参看 [observation.py](https://github.com/swkajnBruceee/hope-training/blob/main/a3_deploy/a3_deploy_example/reference/a3_deploy_onnx_ref_pingpong/observation.py) 与 [racket_command.py](https://github.com/swkajnBruceee/hope-training/blob/main/a3_deploy/a3_deploy_example/reference/a3_deploy_onnx_ref_pingpong/racket_command.py)。

当前官方 A3 控制链路的审计结论也很克制：AimRT/MOTION 的 SIL、TA protobuf、ROS 2 包装和部分 body-drive waist path 已分别被验证，但本地缺少配置中的官方 policy ONNX，因此不能把训练 checkpoint 描述成 deployment-ready。下一步应当是受控的 TA-to-SIL 命令测试、无负载硬件测试和逐级安全门，而不是跳过资产和通道验证直接开放策略。

## 九、从这次整理中得到的三个判断

第一，乒乓球机器人不是“视觉 + 强化学习”的简单叠加，而是一个事件驱动的闭环控制系统。球的触台和击拍会改变动力学，估计器、规划器和策略必须共享事件语义；否则每个模块都可能在自己的局部指标上看似正确，组合起来却无法工作。

第二，模型驱动和学习驱动并不是互相排斥的阵营。规划器擅长利用规则、几何和物理约束压缩搜索空间，强化学习擅长在高维、强耦合、难以显式建模的身体动力学中寻找协调动作。更合理的问题不是“到底该用 MPC 还是 RL”，而是“哪些语义应该由模型保证，哪些残差应该交给策略学习”。

第三，真正决定系统能不能走出仿真的，往往是接口合同和证据纪律。把 `policy_ready=false` 保留下来，把 shadow-only 的 spin 结果和 control-zero-spin 明确分开，把单球接触和多球成功率分开，把 local x86 timing 和 HDU ARM qualification 分开——这些看似保守的表述，实际上是在保护实验的可复现性。

## 十、下一步：让“能接触”走向“能回合”

从当前工程状态出发，合理的推进顺序不是立刻追求更复杂的网络，而是继续缩小证据与真实能力之间的距离：先补齐官方 policy asset 并完成 TA 到 SIL 的受控命令闭环，再做无负载硬件动作和硬件限位/急停审计；随后把单球接触扩展为可统计的逐球协议，分别报告击球接触、过网、落台和下一球生命周期；再把当前 shadow 的旋转项通过跨场次因果回放和实场校准提升为真正的控制变量。

在学习侧，固定底座击球、站稳击球、移动到位和正反手混合来球仍然应该保持清晰的 curriculum。未来如果引入机载视觉，则需要把外部动捕的低延迟优势换成对自运动、遮挡、视野和观测不确定性的显式建模；如果引入更强的运动先验，则要验证它是否真的扩大了可达击球域，而不是只让动作视频更自然。

一颗球从对手半台飞来时，机器人并不知道“下一帧该怎么做”。它只能依据当前观测建立状态估计，利用物理模型预测还没有发生的事件，把事件翻译成球拍目标，再让一整个身体在有限的支撑和执行器约束下完成动作。HOPE 项目最值得记录的，正是这条从公式、代码、仿真到证据的完整链路：机器人智能不是某一个网络突然产生的，它是在每一次坐标对齐、每一个接触模型、每一项动作约束和每一道安全门里逐渐变得可信。

## 十一、效果展示：MuJoCo 仿真环境

前面的公式和接口合同描述了系统如何工作，下面的视频把它放回 MuJoCo 中的 A3 乒乓球场景。它更适合用来观察模型、球台和控制界面的运行状态，不应被解读为完整的性能评测。

### 1. MuJoCo 仿真环境

这段视频展示了 MuJoCo 中的 A3 模型、球台、球网和控制界面。它的价值在于帮助检查模型、接触场景和运行时状态是否已经准备好，是闭环调试和接口审计的重要中间层。

<video class="hope-project-video" controls autoplay muted loop preload="metadata" playsinline poster="/img/posts/hope-robot-pingpong/hope-mujoco-poster.jpg" aria-label="HOPE MuJoCo 乒乓球仿真视频">
  <source src="/img/posts/hope-robot-pingpong/hope-mujoco-simulation.mp4" type="video/mp4">
  你的浏览器不支持 HTML5 视频，请直接下载 <a href="/img/posts/hope-robot-pingpong/hope-mujoco-simulation.mp4">MuJoCo 仿真视频</a>。
</video>

## 参考资料与代码

1. [HOPE training repository](https://github.com/swkajnBruceee/hope-training)：本文讨论的项目代码、规划器、Isaac Lab 场景、MuJoCo 闭环与部署合同。
2. [HITTER: A HumanoId Table TEnnis Robot via Hierarchical Planning and Learning](https://arxiv.org/abs/2508.21043)：层级规划与全身强化学习的人形乒乓球系统。
3. [PACE: Physics Augmentation for Coordinated End-to-end Reinforcement Learning toward Versatile Humanoid Table Tennis](https://arxiv.org/abs/2509.21690)：物理引导的端到端全身强化学习路线，附[官方实现](https://github.com/purdue-tracelab/PACE-ICRA2026)。
4. [SMASH: Mastering Scalable Whole-Body Skills for Humanoid Ping-Pong with Egocentric Vision](https://arxiv.org/abs/2604.01158)：机载视觉与可扩展全身击球。
5. [BeyondMimic: From Motion Tracking to Versatile Humanoid Control via Guided Diffusion](https://arxiv.org/abs/2508.08241)：人类运动先验、guided diffusion 与全身控制。
6. [Isaac Lab：Manager-Based RL Environment](https://isaac-sim.github.io/IsaacLab/main/source/tutorials/03_envs/create_manager_rl_env.html)：任务环境中观测、动作、奖励、终止和 curriculum 的组织方式。
7. [Proximal Policy Optimization Algorithms](https://arxiv.org/abs/1707.06347)：HOPE 训练链路使用的 PPO 理论来源。
