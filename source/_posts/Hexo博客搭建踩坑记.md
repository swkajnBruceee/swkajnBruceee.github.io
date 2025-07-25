---
title: Hexo博客搭建踩坑记
date: 2025-06-26 13:42:00
tags: 
  - Hexo
  - GitHub Pages
  - 博客搭建
categories: 技术笔记
cover: https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-1.2.1&auto=format&fit=crop&w=1920&q=80
---

# 🚀 Hexo博客搭建踩坑记

## 🧩 问题一：YAML 配置的"变形记"
**问题**  
配置 `_config.yml` 时，发现实际语法与文档不一致，特别是缩进规则。

**解决方案**  
1. 确认 YAML 语法规则：
   - 使用 **空格缩进** 而非制表符
   - 键值对格式 `key: value`


## 🦋 问题二：Butterfly 主题的"华丽转身"
**问题**  
主题仓库结构变更，导致配置失效。

**解决步骤**：
1. 发现配置文件迁移到 `_config.butterfly.yml`
2. 使用 AI 生成兼容模板：
   ```yaml
   theme: butterfly
   butterfly:
     menu:
       Home: / || fas fa-home
   ```

## 🔌 问题三：4000 端口的"神秘占用"
**问题**  
启动时报错：
```bash
FATAL Port 4000 has been used.
```

**解决方案**：
1. 查找占用进程：
   ```bash
   lsof -i :4000
   ```
2. 指定新端口启动：
   ```bash
   hexo server -p 4001
   ```
3. 永久修改配置：
   ```yaml
   server:
     port: 4001
   ```

## 💡 实用技巧
1. **分支管理**：
    >由于我之前已经搭建过一个博客，而且部署在master分支里，恰巧GitHub在调用.io域名时，自动调用master分支的内容，而我新搭建的博客是在main分支，所以我需要更改github的配置要求，才能让我的新博客正常显示
    >1. 登录GitHub仓库，点击"Settings"。
    >2. 在左侧导航栏，选择"Pages"。
    >3. 在"Build and deployment"部分，将"Branch"改为"main"。
   

