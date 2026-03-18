import { normalizeText } from './utils';
import type { ChatMessageNode } from './types';

/**
 * 获取对话消息节点。
 *
 * 说明：
 * 1. 同时识别 user / assistant。
 * 2. 优先识别 data-message-author-role。
 * 3. 尽量向上寻找更稳定的 article 容器，避免滚动锚点漂移。
 *
 * @returns 消息节点列表
 */
export function getConversationMessageElements(): ChatMessageNode[] {
    const result: ChatMessageNode[] = [];
    const seen = new Set<HTMLElement>();

    const candidates = document.querySelectorAll<HTMLElement>(
        '[data-message-author-role="user"], [data-message-author-role="assistant"]'
    );

    candidates.forEach((el) => {
        const roleAttr = el.getAttribute('data-message-author-role');

        if (roleAttr !== 'user' && roleAttr !== 'assistant') {
            return;
        }

        const anchor =
            (el.closest('article') as HTMLElement | null) ||
            el;

        if (seen.has(anchor)) {
            return;
        }

        const text = normalizeText(anchor.textContent || '');

        if (!text) {
            return;
        }

        seen.add(anchor);

        result.push({
            role: roleAttr,
            element: anchor,
            text
        });
    });

    return result;
}