import { defineConfig } from 'vite';

const userscriptHeader = `// ==UserScript==
// @name         ChatGPT TOC Navigator
// @namespace    https://chatgpt.com/
// @version      0.1.0
// @description  为 ChatGPT 会话生成目录导航，支持点击跳转与当前轮次高亮
// @author       PengGe
// @match        https://chatgpt.com/*
// @match        https://chat.openai.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

`;

export default defineConfig({
    build: {
        target: 'es2020',
        minify: false,
        lib: {
            entry: 'src/main.ts',
            formats: ['iife'],
            name: 'ChatGptTocNavigator',
            fileName: () => 'chatgpt-toc.user.js'
        },
        rollupOptions: {
            output: {
                extend: true,
                intro: userscriptHeader
            }
        }
    }
});