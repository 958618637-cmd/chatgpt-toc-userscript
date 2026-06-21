import { defineConfig, type Plugin } from 'vite';

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

function userscriptHeaderPlugin(): Plugin {
    return {
        name: 'vite-plugin-userscript-header',
        apply: 'build',
        enforce: 'post',

        generateBundle(_, bundle) {
            Object.values(bundle).forEach((file) => {
                if (file.type !== 'chunk') {
                    return;
                }

                if (!file.fileName.endsWith('.user.js')) {
                    return;
                }

                if (file.code.startsWith('// ==UserScript==')) {
                    return;
                }

                file.code = userscriptHeader + file.code;
            });
        }
    };
}

export default defineConfig({
    plugins: [
        userscriptHeaderPlugin()
    ],

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
                extend: true
            }
        }
    }
});