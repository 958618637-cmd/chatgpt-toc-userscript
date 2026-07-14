import { COPY_MODIFY_SUFFIX } from './constants';
import type { TocItem } from './types';

/**
 * GPT 回复复制管理器。
 *
 * 复制顺序：
 * 1. 优先点击 ChatGPT 自带的"复制回答"按钮，尽量保留 Markdown。
 * 2. 找不到原生按钮时，复制回复正文纯文本。
 */
export class ReplyCopyManager {

    /**
     * 复制目录项对应的 GPT 回复。
     *
     * @param item 目录项
     * @returns 是否复制成功
     */
    public async copy(item: TocItem): Promise<boolean> {
        if (item.kind !== 'assistant') {
            return false;
        }

        const nativeCopyButton = this.findNativeCopyButton(item.element);

        if (nativeCopyButton) {
            nativeCopyButton.click();
            return true;
        }

        const contentElement = this.findReplyContentElement(item.element);
        const content = this.getReplyText(contentElement);

        if (!content) {
            return false;
        }

        return this.writeText(content);
    }

    /**
     * 复制 GPT 回复，并追加修改指令。
     *
     * 处理流程：
     * 1. 点击 ChatGPT 原生复制按钮；
     * 2. 从剪贴板读取原生复制出来的 Markdown；
     * 3. 在 Markdown 外增加包装内容；
     * 4. 重新写入剪贴板。
     *
     * @param item 目录项
     * @returns 是否复制成功
     */
    public async copyForModification(item: TocItem): Promise<boolean> {
        if (item.kind !== 'assistant') {
            return false;
        }

        const nativeCopyButton = this.findNativeCopyButton(item.element);

        /*
         * 优先使用 ChatGPT 原生复制。
         *
         * 原生复制出来的是 Markdown 源文本，
         * 不能直接使用 innerText，否则 Markdown 格式会丢失。
         */
        if (nativeCopyButton) {
            const markdown = await this.getNativeCopiedMarkdown(
                nativeCopyButton
            );

            if (!markdown) {
                return false;
            }

            return this.writeText(
                this.buildModificationContent(markdown)
            );
        }

        /*
         * 找不到原生复制按钮时才降级为正文纯文本。
         */
        const contentElement = this.findReplyContentElement(item.element);
        const content = this.getReplyText(contentElement);

        if (!content) {
            return false;
        }

        return this.writeText(
            this.buildModificationContent(content)
        );
    }

    /**
     * 通过 ChatGPT 原生复制按钮获取 Markdown 内容。
     *
     * @param nativeCopyButton ChatGPT 原生复制按钮
     * @returns Markdown 内容
     */
    private async getNativeCopiedMarkdown(
        nativeCopyButton: HTMLButtonElement
    ): Promise<string | null> {
        if (!navigator.clipboard?.readText) {
            console.warn(
                '[ChatGPT TOC] 当前浏览器不支持读取剪贴板，无法获取原生 Markdown。'
            );

            return null;
        }

        let previousClipboardText: string | null = null;

        /*
         * 先记录原剪贴板内容。
         *
         * 读取失败不影响后续操作，
         * 可能只是浏览器尚未授予 clipboard-read 权限。
         */
        try {
            previousClipboardText = await navigator.clipboard.readText();
        } catch (error) {
            console.debug(
                '[ChatGPT TOC] 读取原剪贴板内容失败，将直接等待原生复制结果。',
                error
            );
        }

        nativeCopyButton.click();

        return this.waitForClipboardText(previousClipboardText);
    }

    /**
     * 等待 ChatGPT 原生复制完成。
     *
     * ChatGPT 原生复制可能是异步写入剪贴板，
     * 因此不能在 click() 后立即读取。
     *
     * @param previousText 复制前的剪贴板内容
     * @returns 新的剪贴板内容
     */
    private async waitForClipboardText(
        previousText: string | null
    ): Promise<string | null> {
        const timeout = 1500;
        const interval = 80;
        const startedAt = Date.now();

        while (Date.now() - startedAt < timeout) {
            await this.sleep(interval);

            try {
                const currentText = await navigator.clipboard.readText();
                const elapsed = Date.now() - startedAt;

                if (!currentText.trim()) {
                    continue;
                }

                /*
                 * 满足任意条件即可认为原生复制完成：
                 *
                 * 1. 当前内容和原剪贴板内容不同；
                 * 2. 无法读取原剪贴板内容；
                 * 3. 已等待一定时间。
                 *
                 * 第 3 条用于处理连续复制相同回复的情况。
                 */
                if (
                    previousText === null ||
                    currentText !== previousText ||
                    elapsed >= 320
                ) {
                    return currentText;
                }
            } catch (error) {
                console.warn(
                    '[ChatGPT TOC] 无法读取 ChatGPT 原生复制内容。',
                    error
                );

                return null;
            }
        }

        console.warn(
            '[ChatGPT TOC] 等待 ChatGPT 原生复制内容超时。'
        );

        return null;
    }

    /**
     * 构建"复制并修改"的最终内容。
     *
     * 将方括号单独放在一行，
     * 避免破坏 Markdown 标题、列表和代码块格式。
     *
     * @param content ChatGPT 原生复制内容
     * @returns 最终复制内容
     */
    private buildModificationContent(content: string): string {
        const normalizedContent = content.trim();

        return [
            '【',
            normalizedContent,
            '】',
            '',
            COPY_MODIFY_SUFFIX
        ].join('\n');
    }

    /**
     * 延迟执行。
     *
     * @param delay 延迟毫秒
     */
    private sleep(delay: number): Promise<void> {
        return new Promise((resolve) => {
            window.setTimeout(resolve, delay);
        });
    }

    /**
     * 查找 ChatGPT 原生的"复制回答"按钮。
     *
     * 注意：
     * 回复正文中的代码块也可能存在复制按钮，
     * 所以优先使用 data-testid，并排除 pre/code 内部按钮。
     *
     * @param element GPT 回复锚点元素
     */
    private findNativeCopyButton(element: HTMLElement): HTMLButtonElement | null {
        const scope =
            element.closest<HTMLElement>('[data-testid^="conversation-turn-"]') ||
            element.closest<HTMLElement>('article') ||
            element;

        const testIdButton = scope.querySelector<HTMLButtonElement>(
            'button[data-testid="copy-turn-action-button"]'
        );

        if (testIdButton) {
            return testIdButton;
        }

        const buttons = Array.from(
            scope.querySelectorAll<HTMLButtonElement>('button')
        );

        return buttons.find((button) => {
            // 排除代码块自己的复制按钮。
            if (button.closest('pre, code')) {
                return false;
            }

            const label = [
                button.getAttribute('aria-label'),
                button.getAttribute('title'),
                button.textContent
            ]
                .filter(Boolean)
                .join(' ')
                .trim();

            if (!label) {
                return false;
            }

            return /^(复制|复制回答|复制回复|copy|copy response|copy answer)$/i.test(label);
        }) || null;
    }

    /**
     * 获取 GPT 回复正文元素。
     *
     * @param element GPT 回复锚点元素
     */
    private findReplyContentElement(element: HTMLElement): HTMLElement {
        const assistantElement =
            element.matches('[data-message-author-role="assistant"]')
                ? element
                : element.querySelector<HTMLElement>(
                    '[data-message-author-role="assistant"]'
                );

        const root = assistantElement || element;

        // ChatGPT 当前常见正文容器。
        return (
            root.querySelector<HTMLElement>('.markdown') ||
            root.querySelector<HTMLElement>('[class*="markdown"]') ||
            root
        );
    }

    /**
     * 获取回复纯文本。
     *
     * innerText 相比 textContent 能更好地保留段落、列表和代码换行。
     *
     * @param element 回复正文元素
     */
    private getReplyText(element: HTMLElement): string {
        return (element.innerText || element.textContent || '').trim();
    }

    /**
     * 写入剪贴板。
     *
     * @param text 文本内容
     */
    private async writeText(text: string): Promise<boolean> {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }

            return this.copyByTextarea(text);
        } catch (error) {
            console.warn('[ChatGPT TOC] Clipboard API 复制失败，尝试降级复制。', error);

            return this.copyByTextarea(text);
        }
    }

    /**
     * 通过隐藏 textarea 降级复制。
     *
     * @param text 文本内容
     */
    private copyByTextarea(text: string): boolean {
        const textarea = document.createElement('textarea');

        textarea.value = text;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.left = '-99999px';
        textarea.style.top = '-99999px';
        textarea.style.opacity = '0';

        document.body.appendChild(textarea);

        textarea.focus();
        textarea.select();

        let success = false;

        try {
            success = document.execCommand('copy');
        } catch (error) {
            console.error('[ChatGPT TOC] 降级复制失败。', error);
        } finally {
            textarea.remove();
        }

        return success;
    }
}

