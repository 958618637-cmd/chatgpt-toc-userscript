import {
    ASSISTANT_TITLE_MAX_LENGTH,
    MESSAGE_ATTR,
    TITLE_MAX_LENGTH
} from './constants';
import type { ChatMessageNode, TocItem } from './types';
import { createStableId, normalizeText, truncateText } from './utils';

/**
 * 从页面消息流中提取树形目录项。
 *
 * @param messageNodes 页面消息节点
 * @returns 目录项列表
 */
export function extractTocItems(messageNodes: ChatMessageNode[]): TocItem[] {
    const result: TocItem[] = [];
    let currentUserItem: TocItem | null = null;
    let userIndex = 0;
    let assistantIndex = 0;

    messageNodes.forEach((message, index) => {
        const rawText = normalizeText(message.text || '');
        let id = message.element.getAttribute(MESSAGE_ATTR);

        if (!id) {
            id = createStableId(
                message.role === 'user' ? 'user' : 'assistant',
                index + 1,
                rawText
            );
            message.element.setAttribute(MESSAGE_ATTR, id);
        }

        if (message.role === 'user') {
            userIndex += 1;
            assistantIndex = 0;

            const userItem: TocItem = {
                id,
                index: userIndex,
                title: rawText
                    ? truncateText(rawText, TITLE_MAX_LENGTH)
                    : `第 ${userIndex} 轮对话`,
                element: message.element,
                role: 'user',
                children: []
            };

            result.push(userItem);
            currentUserItem = userItem;
            return;
        }

        if (!currentUserItem) {
            return;
        }

        assistantIndex += 1;

        const assistantItem: TocItem = {
            id,
            index: assistantIndex,
            title: buildAssistantTitle(rawText, currentUserItem.index, assistantIndex),
            element: message.element,
            role: 'assistant',
            parentId: currentUserItem.id
        };

        currentUserItem.children!.push(assistantItem);
    });

    return result;
}

/**
 * 构建 GPT 回复目录标题。
 *
 * @param rawText 原始文本
 * @param userIndex 用户轮次
 * @param assistantIndex 回复序号
 * @returns 回复标题
 */
function buildAssistantTitle(rawText: string, userIndex: number, assistantIndex: number): string {
    const prefix = `回复 ${userIndex}.${assistantIndex}：`;

    if (!rawText) {
        return `${prefix}（无内容）`;
    }

    const content = truncateText(rawText, ASSISTANT_TITLE_MAX_LENGTH);
    return `${prefix}${content}`;
}