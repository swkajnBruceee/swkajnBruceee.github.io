---
title: 曲折之路：在无法科学上网的Ubuntu上安装Clash Verge的实战记录
date: 2025-08-20 10:24:00
location: 北京
categories:
  - 技术分享
tags:
  - Ubuntu
  - Clash Verge
  - 科学上网
  - Linux
  - 网络工具
keywords:
  - Ubuntu安装Clash Verge
  - 无法科学上网解决方案
  - Linux网络代理工具
  - 曲线救国方法
  - 双系统网络配置
top_img: /img/covers/clash-verge-ubuntu.svg
cover: /img/covers/clash-verge-ubuntu.svg
description: 记录在无法科学上网的Ubuntu系统上安装Clash Verge的完整过程，分享"曲线救国"的解决方案。
ai: false
comments: true
toc: true
toc_number: true
copyright: true
---

# 曲折之路：在无法科学上网的Ubuntu上安装Clash Verge的实战记录

## 前言

作为一名双系统用户，我在Windows上一直用Clash Verge进行科学上网，体验非常顺畅。最近因为开发需要，要经常使用Ubuntu系统，自然就想着把Clash Verge也装过去，这样就能无缝使用我已有的订阅，省下一笔额外的开销。

想法很美好，现实却很骨感。我的Ubuntu系统是一个全新的环境，**本身无法科学上网**，而这恰恰是安装这类工具的最大悖论：**你需要先科学上网，才能顺利下载科学上网的工具**。这个过程耗费了我大量时间，搜寻了B站、油管上的无数教程，最终找到了一条"曲线救国"的路子。记录于此，希望能帮到有同样困境的朋友。

## 一、 徒劳的尝试：在Ubuntu内直接操作

和大多数人的第一反应一样，我首先选择在Ubuntu系统内解决问题。

我打开了终端，输入了各种教程里雷打不动的第一句命令：

```bash
wget https://github.com/zzzgydi/clash-verge/releases/download/v1.6.6/clash-verge_1.6.6_amd64.deb
```

结果不言而喻，速度只有几十KB/s，最后必然是 `Connection timed out`。尝试了无数个版本号，换了好几个镜像站，结果都一样。在没有加速的情况下，从GitHub拉取大型文件实在是一种煎熬。

**误区：** 很多教程还会让你安装一堆依赖，例如：

```bash
sudo dpkg -i libjavascriptcoregtk-4.0-18_2.43.3-1_amd64.deb
sudo dpkg -i libwebkit2gtk-4.0-37_2.43.3-1_amd64.deb
```

我按照指示苦苦寻找这些依赖包，但在新版的Clash Verge发布包中，**这些依赖包早已被合并或不再需要**，盲目寻找只是徒增烦恼。在焦头烂额地折腾了几个小时后，我意识到此路不通。在"绝缘"的环境下，想通过常规手段安装，根本就是死循环。

## 二、 破局思路：跳出Ubuntu的围墙

既然在Ubuntu内部无法下载，那就在能下载的地方下载好了。我的Windows系统是完全可以科学上网的。思路瞬间清晰：

1. **在Windows上下载最新的Clash Verge安装包（.deb文件）。**
2. 将下载好的文件拷贝到Ubuntu系统。
3. 在Ubuntu中进行本地安装。

这看似简单的一步，才是真正解决问题的关键。

## 三、 实战步骤：手把手教你离线安装

### 步骤一：在Windows端获取资源

1. 在**Windows系统**中，打开你的Clash Verge，确保处于科学上网环境。
2. 打开浏览器，访问Clash Verge的官方GitHub Release页面：
   `https://github.com/zzzgydi/clash-verge/releases`
3. 找到最新版本（我当时用的是 **v2.3.2**）。在资源列表中，找到适用于Ubuntu的DEB包。它的名字应该是 `Clash.Verge_2.3.2_amd64.deb`。注意，**只需要这一个文件就够了**，新版已经包含了所有依赖。
4. 点击下载，等待片刻即可完成。

### 步骤二：跨系统文件传输

将下载好的 `Clash.Verge_2.3.2_amd64.deb` 文件从Windows拷贝到Ubuntu。你有N种选择：

* **U盘拷贝**：最直接物理的方式。
* **使用飞鸽、LANDrop等跨平台传输工具**：在同一个局域网内非常方便。
* **借助云盘（如百度网盘）**：在Windows上传，然后在Ubuntu里用官方客户端或网页版下载。虽然Ubuntu没加速，但下载国内云盘的速度还是可以的。

我选择的是第一种，用U拷贝过去了。但其实后来我还发现了一种方法，虽然我单独为Ubuntu系统分了一个盘，但是它还是挂载了Windows的其他几个盘，这就导致了我下载在Windows中的东西，在Ubuntu中也能看到。

![图片1](/img/图片1.png)

![图片2](/img/图片2.png)

后续我也尝试了能否直接在Ubuntu中访问这些盘然后直接拷贝数据，答案是成功的。这就省略了U盘拷贝这一步骤，只需下载即可（不过这一步涉及跨系统移动数据，还不能确定它是否有风险，调研清楚后，我会再写一篇博客）

但请注意，这并不是真正意义上的"数据互通"，因为后期我在Ubuntu系统中尝试将文件放在"499G卷"中，发现在Windows下看不到，再打开Ubuntu后，发现这个文件也消失了，这说明，目前情况下，只能是从Ubuntu中获取Windows的文件

### 步骤三：在Ubuntu中完成安装

1. 打开Ubuntu的终端，导航到你存放 `.deb` 文件的目录，通常是 `~/Downloads`。

   ```bash
   cd ~/Downloads
   ```

2. 执行安装命令。注意，文件名要和你下载的保持一致。

   ```bash
   sudo dpkg -i Clash.Verge_2.3.2_amd64.deb
   ```

   如果运气好，会直接安装成功。但很多时候可能会报依赖错误。

3. **修复依赖问题（很大概率需要这一步）**：

   ```bash
   sudo apt --fix-broken install -y
   ```

   这个命令会自动安装刚才缺失的依赖。完成后，Clash Verge就已经静静地躺在你的应用程序列表里了。

### 步骤四：导入订阅并享受

1. 在Ubuntu的应用菜单中搜索并启动 **Clash Verge**。
2. 它的界面和Windows版一模一样。点击左侧的 **Profiles**。
3. 点击新增按钮，选择 **URL**，然后将你在Windows版里使用的**同一个订阅链接**粘贴进去。
4. 导入成功后，回到 **Proxies** 页面，选择节点，将系统代理（System Proxy）开关打开。

*大功告成！现在你的Ubuntu已经可以自由访问网络了。*

## 四、 总结与反思

回顾整个过程，核心的教训就是：**不要被问题困在发生问题的系统里思考解决方案**。

* **坑点：** 大多数教程都假设你的Ubuntu网络是通畅的，忽略了"需要先装梯子才能装梯子"这个经典悖论。
* **解决方案：** 利用其他可用的资源（另一台能科学上网的电脑）来获取关键文件，通过外部存储方式完成"输血"。
* **关键：** 只需要下载一个最新的 `.deb` 主程序包即可，无需再费心寻找任何单独的依赖包。

希望这篇从实战中总结出的经验，能帮你节省那几个小时毫无意义的等待和搜索。如果你也遇到了同样的问题，不妨试试这个"曲线救国"的方法，或许能豁然开朗。