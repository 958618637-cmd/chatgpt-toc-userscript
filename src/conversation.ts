import { MESSAGE_ATTR, TITLE_MAX_LENGTH } from './constants';
import type { TocItem } from './types';
import { createStableId, normalizeText, truncateText } from './utils';

/**
 * 从页面中提取目录项。
 *
 * @param userMessageElements 用户消息节点
 * @returns 目录项列表
 */
export function extractTocItems(userMessageElements: HTMLElement[]): TocItem[] {
    return userMessageElements.map((element, index) => {
        const rawText = normalizeText(element.textContent || '');
        let id = element.getAttribute(MESSAGE_ATTR);

        if (!id) {
            id = createStableId('msg', index + 1, rawText);
            element.setAttribute(MESSAGE_ATTR, id);
        }

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