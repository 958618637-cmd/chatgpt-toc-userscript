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
}