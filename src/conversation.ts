import {
    ASSISTANT_HEADING_SELECTOR,
    ASSISTANT_TITLE_MAX_LENGTH,
    HEADING_TITLE_MAX_LENGTH,
    MESSAGE_ATTR,
    TITLE_MAX_LENGTH
} from './constants';
import type { ChatMessageNode, TocItem } from './types';
import { createStableId, normalizeText, truncateText } from './utils';

/**
 * 从页面消息流中提取树形目录项。
 *
 * 目录结构：
 * 1. 一级：用户问题
 * 2. 二级：GPT 本轮回复
 * 3. 三级：从 GPT 回复中提取的真实标题（h1 ~ h6）
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
                kind: 'user',
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
            kind: 'assistant',
            parentId: currentUserItem.id,
            children: []
        };

        const headingItems = extractAssistantHeadingItems(
            message.element,
            currentUserItem.index,
            assistantIndex,
            assistantItem.id
        );

        if (headingItems.length > 0) {
            assistantItem.children = headingItems;
        }

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
    const prefix = `回复 ${userIndex}.${assistantIndex}`;

    if (!rawText) {
        return `${prefix}（无内容）`;
    }

    const content = truncateText(rawText, ASSISTANT_TITLE_MAX_LENGTH);
    return `${prefix}：${content}`;
}

/**
 * 从 GPT 回复 DOM 中提取真实标题目录项。
 *
 * 说明：
 * 1. 只提取 assistant 区域中的 h1 ~ h6。
 * 2. 标题节点本身作为滚动锚点。
 * 3. 这里统一挂到当前 assistant 节点下，形成第三级目录。
 *
 * @param assistantElement GPT 回复容器
 * @param userIndex 用户轮次
 * @param assistantIndex 回复序号
 * @param assistantItemId assistant 目录项 ID
 * @returns 标题目录项列表
 */
function extractAssistantHeadingItems(
    assistantElement: HTMLElement,
    userIndex: number,
    assistantIndex: number,
    assistantItemId: string
): TocItem[] {
    const headingElements = Array.from(
        assistantElement.querySelectorAll<HTMLElement>(ASSISTANT_HEADING_SELECTOR)
    );

    const result: TocItem[] = [];
    let headingIndex = 0;

    headingElements.forEach((headingEl) => {
        const title = normalizeText(headingEl.textContent || '');

        if (!title) {
            return;
        }

        headingIndex += 1;

        let headingId = headingEl.getAttribute(MESSAGE_ATTR);

        if (!headingId) {
            headingId = createStableId(
                `heading-${userIndex}-${assistantIndex}`,
                headingIndex,
                `${headingEl.tagName.toLowerCase()}-${title}`
            );
            headingEl.setAttribute(MESSAGE_ATTR, headingId);
        }

        const item: TocItem = {
            id: headingId,
            index: headingIndex,
            title: buildHeadingTitle(headingEl, title),
            element: headingEl,
            role: 'assistant',
            kind: 'heading',
            parentId: assistantItemId
        };

        result.push(item);
    });

    return result;
}

/**
 * 构建标题目录显示文本。
 *
 * 这里保留标题层级信息，便于在目录面板中识别：
 * 例如：
 * - H1：概述
 * - H2：实现方式
 *
 * @param headingEl 标题元素
 * @param title 标题文本
 * @returns 目录显示文本
 */
function buildHeadingTitle(headingEl: HTMLElement, title: string): string {
    const tagName = headingEl.tagName.toLowerCase();
    const levelMatch = tagName.match(/^h([1-6])$/);
    const levelText = levelMatch ? `H${levelMatch[1]}` : 'H';

    return `${levelText}：${truncateText(title, HEADING_TITLE_MAX_LENGTH)}`;
}