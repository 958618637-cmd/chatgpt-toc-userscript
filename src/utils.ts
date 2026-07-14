import type { TocItem } from './types';

/**
 * 生成简单 hash。
 *
 * @param text 文本
 * @returns hash 字符串
 */
export function simpleHash(text: string): string {
    let hash = 0;

    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) - hash) + text.charCodeAt(i);
        hash |= 0;
    }

    return Math.abs(hash).toString(36);
}

/**
 * 生成稳定 ID。
 *
 * @param prefix 前缀
 * @param index 序号
 * @param text 文本内容
 * @returns 稳定 ID
 */
export function createStableId(prefix: string, index: number, text: string): string {
    const normalized = normalizeText(text).slice(0, 80);
    const hash = simpleHash(normalized || `empty-${index}`);
    return `${prefix}-${index}-${hash}`;
}

/**
 * 文本标准化。
 *
 * @param text 原始文本
 * @returns 处理后的文本
 */
export function normalizeText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

/**
 * 截断文本。
 *
 * @param text 原始文本
 * @param maxLength 最大长度
 * @returns 截断后的文本
 */
export function truncateText(text: string, maxLength: number): string {
    if (!text) {
        return '';
    }

    if (text.length <= maxLength) {
        return text;
    }

    return `${text.slice(0, maxLength)}...`;
}

/**
 * 生成目录项签名。
 *
 * 用于判断目录是否真的发生变化，避免无意义重绘。
 *
 * @param items 目录项
 * @returns 签名字符串
 */
export function buildItemsSignature(items: TocItem[]): string {
    const parts: string[] = [];

    const visit = (itemList: TocItem[]): void => {
        itemList.forEach((item) => {
            parts.push(`${item.kind}:${item.role}:${item.index}:${item.id}:${item.title}`);

            if (item.children?.length) {
                visit(item.children);
            }
        });
    };

    visit(items);

    return parts.join('|');
}

/**
 * 将树形目录拍平成一维数组。
 *
 * 说明：
 * 这里改成递归拍平，支持三级及更深层目录。
 *
 * @param items 目录项
 * @returns 拍平后的目录项
 */
export function flattenTocItems(items: TocItem[]): TocItem[] {
    const result: TocItem[] = [];

    const visit = (itemList: TocItem[]): void => {
        itemList.forEach((item) => {
            result.push(item);

            if (item.children?.length) {
                visit(item.children);
            }
        });
    };

    visit(items);

    return result;
}

/**
 * 防抖函数。
 *
 * @param fn 执行函数
 * @param delay 延迟毫秒
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => void>(fn: T, delay: number): T {
    let timer: number | undefined;

    return function (this: unknown, ...args: Parameters<T>) {
        window.clearTimeout(timer);
        timer = window.setTimeout(() => {
            fn.apply(this, args);
        }, delay);
    } as T;
}
