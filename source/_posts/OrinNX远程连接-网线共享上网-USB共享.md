---
title: Orin NX 远程连接与网线共享上网实战：网线供网 + 手机 USB 共享
date: 2026-01-27 02:42:00
location: 北京
categories:
  - 技术分享
tags:
  - Jetson
  - Orin NX
  - Linux
  - 网络共享
  - IP 转发
  - NAT
  - SSH
keywords:
  - Orin NX 网线共享上网
  - Jetson 远程连接
  - Linux IP 转发 NAT
  - 手机 USB 共享给 NX
  - 以太网供网
  - 远程开发
cover: /img/covers/orin-nx-network-share.svg
top_img: /img/covers/orin-nx-network-share.svg
description: 记录在远程连接场景下，通过电脑为 Jetson Orin NX 走网线上网的完整配置流程，涵盖 IP 转发、NAT、静态 IP、DNS、手机 USB 共享等细节与排错思路。
ai: false
comments: true
toc: true
toc_number: true
copyright: true
---

# Orin NX 远程连接与网线共享上网实战：网线供网 + 手机 USB 共享

在没有显示器的情况下，我经常用 **SSH 远程连接 Jetson Orin NX**。问题来了：NX 通过网线连到电脑时，如何让它也能上网？更复杂一点，如果电脑的网络来自 **手机 USB 共享**，还能不能把这条网络再“转发”给 NX？这篇就把完整流程、关键命令与常见坑一次讲清楚。

适用场景：
- NX 无显示器，通过网线直连电脑
- 电脑上网方式为 WiFi 或手机 USB 共享
- 希望 NX 能正常 `apt`、拉代码、访问外网

<!-- more -->

# 🧭 网络拓扑

我这里的典型拓扑如下（你也可以替换为自己的网卡名）：

```
手机(4G/5G)
   │ USB 共享
   ▼
电脑 (上网接口：usb0 / wlan0)
   │ 网线
   ▼
Jetson Orin NX (接口：eth0)
```

关键点：**电脑作为网关**，对外走 WiFi/USB，对内把网络共享给 NX。

# ✅ 一、确认网卡名称

不同系统网卡名可能不一样，先确认一下：

```bash
ip -br a
```

常见情况：
- 电脑上网接口：`wlan0`（WiFi）或 `usb0` / `enx...`（手机 USB 共享）
- 电脑连 NX 的口：`eth0` / `enp3s0` / `enx...`
- NX 侧接口：一般是 `eth0`

下文我用：
- 电脑上网接口：`wlan0`
- 电脑对 NX 的接口：`eth0`

你只需要把网卡名替换成自己的即可。

# ✅ 二、配置静态 IP（电脑与 NX）

为了稳定远程连接，建议给电脑和 NX 配置固定 IP。

**电脑（eth0）临时配置：**

```bash
sudo ip addr add 192.168.55.1/24 dev eth0
```

**NX（eth0）临时配置：**

```bash
sudo ip addr add 192.168.55.2/24 dev eth0
sudo ip route add default via 192.168.55.1
```

**DNS（NX 端）：**

```bash
sudo resolvectl dns eth0 8.8.8.8 1.1.1.1
```

如果你的系统没有 `resolvectl`，可以先用：

```bash
sudo bash -c 'echo "nameserver 8.8.8.8" > /etc/resolv.conf'
```

> 小贴士：临时 IP 重启会失效，长期使用建议用 NetworkManager 或 netplan 设为永久。

# ✅ 三、开启 IP 转发（电脑上）

这是让电脑“当路由”的关键开关：

```bash
sudo sysctl -w net.ipv4.ip_forward=1
```

**（可选，永久生效）**

```bash
echo "net.ipv4.ip_forward=1" | sudo tee -a /etc/sysctl.conf
```

# ✅ 四、配置 NAT（电脑上）

让 NX 的流量通过电脑的上网接口“伪装”出去：

```bash
sudo iptables -t nat -A POSTROUTING -o wlan0 -j MASQUERADE
sudo iptables -A FORWARD -i wlan0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT
sudo iptables -A FORWARD -i eth0 -o wlan0 -j ACCEPT
```

如果你的上网接口是手机 USB 共享，请把 `wlan0` 换成 `usb0` 或 `enxXXXX`。

# ✅ 五、手机 USB 共享的正确打开方式

1. 手机连接电脑 USB
2. 打开 **USB 共享网络**（不同手机菜单略有差异）
3. 电脑会出现一个新的网卡（通常叫 `usb0` 或 `enx...`）
4. 把这张网卡作为 **上网接口** 填到上面的 iptables 里

你可以用下面命令确认：

```bash
ip -br a | grep -E 'usb|enx'
```

# ✅ 六、测试连通性

在 NX 上依次测试：

```bash
ping -c 4 192.168.55.1   # 能否 ping 通电脑
ping -c 4 8.8.8.8        # 能否出公网
ping -c 4 github.com     # DNS 是否正常
```

如果三步全通，说明共享成功。

# 🧩 常见问题与排查思路

## 1. 能 ping 通电脑，不能上网
- 检查电脑是否开启 `ip_forward`
- 检查 NAT 规则是否生效（网卡名是否写错）
- 检查 NX 默认网关是否指向 `192.168.55.1`

## 2. 能 ping 通公网 IP，不能解析域名
- DNS 没配置好，重新设置 `resolvectl` 或 `/etc/resolv.conf`

## 3. 重启后规则失效
- `ip addr`、`iptables` 都是临时的
- 可考虑安装 `iptables-persistent` 保存规则

## 4. UFW/防火墙拦截
- 如果电脑启用了 UFW，可能会拦截转发
- 可临时关闭测试：

```bash
sudo ufw disable
```

# ✅ 一句话总结

**电脑作为网关 + NX 静态 IP + IP 转发 + NAT**，就能让 Orin NX 在网线直连的情况下稳定上网，即使电脑是靠手机 USB 共享也没问题。
