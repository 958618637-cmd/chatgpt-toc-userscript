# ChatGPT TOC Userscript

为 ChatGPT 长会话生成目录导航，方便快速跳转到某一轮用户提问。

## 功能
- 自动扫描用户提问
- 生成右侧目录
- 点击目录跳转
- 当前轮次高亮
- 搜索目录
- DOM 动态更新自动刷新

## 开发
```bash
npm install
npm run build

构建后输出：

dist/chatgpt-toc.user.js
使用

安装 Tampermonkey

新建脚本

将 dist/chatgpt-toc.user.js 内容复制进去

打开 ChatGPT 页面测试


---

# 十七、怎么初始化这个项目

你本地这样执行就行：

```bash
mkdir chatgpt-toc-userscript
cd chatgpt-toc-userscript
npm init -y
npm install -D typescript vite

然后把上面的文件建好。

最后执行：

npm run build

打包后会生成：

dist/chatgpt-toc.user.js

把这个文件内容复制到 Tampermonkey 即可。