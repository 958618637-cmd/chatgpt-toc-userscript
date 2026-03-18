import { MESSAGE_ATTR, TITLE_MAX_LENGTH } from './constants';
import type { TocItem } from './types';
import { createId, normalizeText, truncateText } from './utils';

/**
 * 从页面中提取目录项。
 *
 * @param userMessageElements 用户消息节点
 * @returns 目录项列表
 */
export function extractTocItems(userMessageElements: HTMLElement[]): TocItem[] {
    return userMessageElements.map((element, index) => {
        let id = element.getAttribute(MESSAGE_ATTR);

        if (!id) {
            id = createId('msg', index + 1);
            element.setAttribute(MESSAGE_ATTR, id);
        }

        const rawText = normalizeText(element.textContent || '');
        const title = rawText
            ? truncateText(rawText, TITLE_MAX_LENGTH)
            : `第 ${index + 1} 轮对话`;

        return {
            id,
            index: index + 1,
            title,
            element
        };
    });
}