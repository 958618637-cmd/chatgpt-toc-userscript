import type { TocItem } from './types';

/**
 * 滚动管理器。
 */
export class ScrollManager {
    /**
     * 滚动到指定目录项。
     *
     * @param item 目录项
     */
    public scrollToItem(item: TocItem): void {
        item.element.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }

    /**
     * 根据滚动位置获取当前激活目录项。
     *
     * @param items 目录项列表
     * @returns 当前激活项
     */
    public getActiveItem(items: TocItem[]): TocItem | null {
        if (!items.length) {
            return null;
        }

        const offset = 140;
        let active: TocItem | null = null;
        let minDistance = Number.MAX_SAFE_INTEGER;

        for (const item of items) {
            const rect = item.element.getBoundingClientRect();
            const distance = offset - rect.top;

            if (distance >= 0 && distance < minDistance) {
                minDistance = distance;
                active = item;
            }
        }

        if (active) {
            return active;
        }

        return items[0] || null;
    }
}