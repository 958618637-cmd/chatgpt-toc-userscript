/**
 * 获取用户消息候选节点。
 *
 * 说明：
 * 1. ChatGPT 页面 DOM 结构可能变化，这里尽量采用多策略。
 * 2. 优先识别 data-message-author-role="user"。
 * 3. 尽量向上寻找更稳定的消息容器，避免滚动锚点漂移。
 *
 * @returns 用户消息节点列表
 */
export function getUserMessageElements(): HTMLElement[] {
    const result = new Set<HTMLElement>();

    const candidates = document.querySelectorAll<HTMLElement>('[data-message-author-role="user"]');

    candidates.forEach((el) => {
        const anchor =
            (el.closest('article') as HTMLElement | null) ||
            el;

        if (anchor.textContent && anchor.textContent.trim().length > 0) {
            result.add(anchor);
        }
    });

    return Array.from(result);
}