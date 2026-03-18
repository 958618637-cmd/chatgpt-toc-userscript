/**
 * 页面消息节点定义。
 */
export interface ChatMessageNode {
    /**
     * 消息角色。
     */
    role: 'user' | 'assistant';

    /**
     * 锚点元素。
     */
    element: HTMLElement;

    /**
     * 文本内容。
     */
    text: string;
}

/**
 * 目录项类型。
 */
export type TocItemKind = 'user' | 'assistant' | 'heading';

/**
 * 目录项定义。
 */
export interface TocItem {
    /**
     * 唯一ID。
     */
    id: string;

    /**
     * 第几轮。
     * 一级是用户轮次，二级是回复序号，三级是标题序号。
     */
    index: number;

    /**
     * 目录标题。
     */
    title: string;

    /**
     * 对应的锚点元素。
     */
    element: HTMLElement;

    /**
     * 角色类型。
     */
    role: 'user' | 'assistant';

    /**
     * 目录项类型。
     */
    kind: TocItemKind;

    /**
     * 父级 ID。
     */
    parentId?: string;

    /**
     * 子级目录。
     */
    children?: TocItem[];
}