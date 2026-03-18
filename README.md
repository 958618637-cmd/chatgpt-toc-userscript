
# ChatGPT TOC 插件

一个用于 **ChatGPT 页面自动生成目录（Table of Contents）** 的浏览器增强脚本/插件。

支持：
- 自动识别用户 / GPT 对话
- 构建三层目录结构
- 提取 GPT 回复中的标题（h1 ~ h6）
- 实时监听页面变化自动更新
- 滚动同步高亮
- 关键词搜索过滤
- 折叠/展开目录面板

---

## ✨ 功能特性

### 📌 1. 自动生成对话目录
目录结构如下：

```

用户问题（一级）
└─ GPT回复（二级）
└─ 标题（三级，h1~h6）

```

示例：

```

1. 如何设计缓存？
   └ 回复 1.1：缓存设计方案
   • H2：缓存结构
   • H2：更新策略

```

---

### 📌 2. 标题解析（核心能力）

自动解析 GPT 回复中的：

```

h1, h2, h3, h4, h5, h6

```

用于生成更细粒度导航。

---

### 📌 3. 滚动联动高亮

- 根据当前滚动位置自动定位目录
- 支持 smooth scroll
- 避免滚动抖动（锁机制）

---

### 📌 4. 实时更新（MutationObserver）

自动监听页面变化：

- 新对话
- GPT streaming 输出
- DOM 更新

并进行 **增量重建（防抖优化）**

---

### 📌 5. 搜索过滤（递归树过滤）

支持：

- 关键字匹配
- 父命中 → 保留全部子节点
- 子命中 → 自动保留祖先链

---

### 📌 6. 折叠面板

支持：

- 右侧悬浮面板
- 折叠为「目录」按钮
- 再次点击恢复

---

## 🧱 项目结构

```

src/
├── main.ts                # 应用入口
├── constants.ts          # 常量定义
├── types.ts              # 类型定义
├── utils.ts              # 工具函数
│
├── chatgpt-dom.ts        # DOM解析（提取消息节点）
├── conversation.ts       # 构建目录树（核心逻辑）
│
├── toc-panel.ts          # 目录UI面板
├── scroll-manager.ts     # 滚动控制
├── observer.ts           # DOM监听
├── style.ts              # 样式注入

```

---

## 🧠 核心设计说明

### 1️⃣ 目录构建流程

```

DOM → MessageNodes → TocItems（树）→ 渲染

````

核心方法：

```ts
extractTocItems(messageNodes)
````

---

### 2️⃣ 三层结构设计

| 层级 | 类型        | 说明       |
| -- | --------- | -------- |
| 一级 | user      | 用户问题     |
| 二级 | assistant | GPT 回复   |
| 三级 | heading   | GPT 内部标题 |

---

### 3️⃣ 稳定 ID 机制（防抖动）

```ts
createStableId(prefix, index, text)
```

特点：

* 基于文本 hash
* 保证滚动定位稳定
* 避免 DOM 重建导致锚点丢失

---

### 4️⃣ MutationObserver 优化

只监听**非插件 DOM 变化**：

```ts
isExternalMutation()
```

避免：

* 自己渲染触发死循环
* 频繁 rebuild

---

### 5️⃣ 渲染优化（签名机制）

```ts
buildItemsSignature()
```

用于：

* 判断目录是否真正变化
* 避免重复渲染

---

### 6️⃣ 滚动定位算法

```ts
getActiveItem()
```

策略：

* 找到最接近 viewport offset 的节点
* fallback：第一个可见 or 最后一个

---

## 🎯 使用方式

### 方式一：浏览器插件（推荐）

* 作为 Chrome 插件注入
* 或 Tampermonkey 脚本

---

### 方式二：直接注入

```js
import './main';
```

---

## ⚙️ 配置说明

### 常量配置（constants.ts）

| 常量                         | 说明        |
| -------------------------- | --------- |
| TITLE_MAX_LENGTH           | 用户标题长度    |
| ASSISTANT_TITLE_MAX_LENGTH | GPT标题长度   |
| HEADING_TITLE_MAX_LENGTH   | heading长度 |
| REBUILD_DELAY              | 重建延迟      |
| SCROLL_SYNC_LOCK_MS        | 滚动锁时间     |

---

## 🚀 可扩展方向（重点）

你这个项目其实已经是**可产品化级别**，下面是可以继续进化的方向：

### 🔥 1. 折叠树结构（重要）

* 支持展开/收起节点
* 类似 IDE Outline

---

### 🔥 2. 虚拟滚动（长对话优化）

* 解决 100+ 对话性能问题

---

### 🔥 3. 快速跳转（键盘导航）

* ↑ ↓ 切换目录
* Enter 跳转

---

### 🔥 4. 高级过滤

* 仅显示用户问题
* 仅显示标题
* 按轮次过滤

---

### 🔥 5. 状态持久化

* 记住折叠状态
* 记住滚动位置

---

### 🔥 6. 多模型兼容

适配：

* ChatGPT 新 UI
* Claude
* Gemini

---

## 🧩 技术亮点总结

✔ DOM 结构容错（article fallback）
✔ 稳定 ID + hash
✔ MutationObserver 精细过滤
✔ 三层目录设计（非常关键）
✔ 滚动同步 + 锁机制
✔ 递归过滤树（优秀设计点）

---

## ⚠️ 注意事项

1. ChatGPT DOM 可能变化，需要适配：

   ```
   data-message-author-role
   ```

2. 标题提取依赖：

   ```
   h1 ~ h6
   ```

3. 大对话性能需关注（建议后续优化虚拟滚动）

---

## 📄 License

MIT

---

## 👨‍💻 作者说明

该项目定位：

👉 ChatGPT 增强工具（开发者效率工具）
👉 可扩展为浏览器插件 / AI IDE 辅助工具

