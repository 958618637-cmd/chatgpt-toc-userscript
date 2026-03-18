/**
 * 生成简单唯一ID。
 *
 * @param prefix 前缀
 * @param index 序号
 * @returns 唯一ID
 */
export function createId(prefix: string, index: number): string {
    return `${prefix}-${index}-${Date.now()}`;
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
 * 节流函数。
 *
 * @param fn 执行函数
 * @param delay 延迟毫秒
 * @returns 节流后的函数
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