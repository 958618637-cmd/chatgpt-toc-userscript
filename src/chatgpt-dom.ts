/**
 * 获取用户消息候选节点。
 *
 * 说明：
 * 1. ChatGPT 页面 DOM 结构可能变化，这里尽量采用多策略。
 * 2. 当前优先按常见的 data-message-author-role="user" 识别。
 *
 * @returns 用户消息节点列表
 */
export function getUserMessageElements(): HTMLElement[] {
    const result = new Set<HTMLElement>();

    const selectors = [
        '[data-message-author-role="user"]',
        'article [data-message-author-role="user"]',
        'main [data-message-author-role="user"]'
    ];

    selectors.forEach((selector) => {
        document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
            result.add(el);
        });
    });

    return Array.from(result).filter((el) => {
        return !!el.textContent && el.textContent.trim().length > 0;
    });
}