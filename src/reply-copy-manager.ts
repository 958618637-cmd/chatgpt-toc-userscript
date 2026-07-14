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
