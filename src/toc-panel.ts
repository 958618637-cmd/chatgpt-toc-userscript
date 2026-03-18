import {
    ACTIVE_CLASS,
    COLLAPSED_ID,
    HEADER_ID,
    ITEM_CLASS,
    LIST_ID,
    PANEL_ID,
    PARENT_ACTIVE_CLASS,
    SEARCH_ID,
    TOGGLE_ID
} from './constants';
import type { TocItem } from './types';

/**
 * 目录面板管理器。
 */
export class TocPanel {
    private panelEl: HTMLElement | null = null;
    private listEl: HTMLElement | null = null;
    private searchEl: HTMLInputElement | null = null;
    private collapsed = false;
    private items: TocItem[] = [];
    private activeId: string | null = null;
    private activeParentId: string | null = null;

    /**
     * 创建面板。
     */
    public mount(onItemClick: (item: TocItem) => void): void {
        if (document.getElementById(PANEL_ID)) {
            this.panelEl = document.getElementById(PANEL_ID);
            this.listEl = document.getElementById(LIST_ID);
            this.searchEl = document.getElementById(SEARCH_ID) as HTMLInputElement | null;
            return;
        }

        const panel = document.createElement('div');
        panel.id = PANEL_ID;

        panel.innerHTML = `
            <div id="${HEADER_ID}">
                <span>会话目录</span>
                <button id="${TOGGLE_ID}" title="折叠">◀</button>
            </div>
            <input id="${SEARCH_ID}" type="text" placeholder="搜索目录..." />
            <div id="${LIST_ID}"></div>
        `;

        document.body.appendChild(panel);

        this.panelEl = panel;
        this.listEl = panel.querySelector(`#${LIST_ID}`);
        this.searchEl = panel.querySelector(`#${SEARCH_ID}`) as HTMLInputElement;

        const toggleButton = panel.querySelector(`#${TOGGLE_ID}`) as HTMLButtonElement;
        toggleButton.addEventListener('click', () => {
            this.toggleCollapse();
        });

        this.searchEl.addEventListener('input', () => {
            this.renderList(this.getFilteredItems(), onItemClick);
        });
    }

    /**
     * 更新目录数据。
     *
     * @param items 目录项
     * @param onItemClick 点击事件
     */
    public update(items: TocItem[], onItemClick: (item: TocItem) => void): void {
        this.items = items;
        this.renderList(this.getFilteredItems(), onItemClick);

        if (this.activeId) {
            this.setActive(this.activeId, this.activeParentId);
        }
    }

    /**
     * 设置激活项。
     *
     * @param activeId 当前激活ID
     * @param activeParentId 当前激活项所属父ID
     */
    public setActive(activeId: string, activeParentId: string | null = null): void {
        this.activeId = activeId;
        this.activeParentId = activeParentId;

        if (!this.listEl) {
            return;
        }

        const itemElements = this.listEl.querySelectorAll<HTMLElement>(`.${ITEM_CLASS}`);

        itemElements.forEach((el) => {
            const itemId = el.dataset.id;

            if (itemId === activeId) {
                el.classList.add(ACTIVE_CLASS);
            } else {
                el.classList.remove(ACTIVE_CLASS);
            }

            if (activeParentId && itemId === activeParentId) {
                el.classList.add(PARENT_ACTIVE_CLASS);
            } else {
                el.classList.remove(PARENT_ACTIVE_CLASS);
            }
        });
    }

    /**
     * 折叠/展开。
     */
    private toggleCollapse(): void {
        if (!this.panelEl) {
            return;
        }

        this.collapsed = !this.collapsed;

        if (this.collapsed) {
            this.panelEl.style.display = 'none';

            let collapsedBtn = document.getElementById(COLLAPSED_ID);
            if (!collapsedBtn) {
                collapsedBtn = document.createElement('div');
                collapsedBtn.id = COLLAPSED_ID;
                collapsedBtn.textContent = '目录';
                collapsedBtn.addEventListener('click', () => {
                    this.collapsed = false;
                    this.panelEl!.style.display = 'flex';
                    collapsedBtn!.remove();
                });

                document.body.appendChild(collapsedBtn);
            }
        }
    }

    /**
     * 过滤目录项。
     *
     * 说明：
     * 1. 改成递归过滤，支持三级及更深层级目录。
     * 2. 父节点命中时保留全部子节点。
     * 3. 子节点命中时保留命中的祖先链。
     *
     * @returns 过滤后的目录项
     */
    private getFilteredItems(): TocItem[] {
        const keyword = (this.searchEl?.value || '').trim().toLowerCase();

        if (!keyword) {
            return this.items;
        }

        const filterRecursively = (item: TocItem): TocItem | null => {
            const selfMatched = item.title.toLowerCase().includes(keyword);
            const children = item.children || [];
            const matchedChildren = children
                .map((child) => filterRecursively(child))
                .filter((child): child is TocItem => !!child);

            if (selfMatched) {
                return {
                    ...item,
                    children
                };
            }

            if (matchedChildren.length > 0) {
                return {
                    ...item,
                    children: matchedChildren
                };
            }

            return null;
        };

        return this.items
            .map((item) => filterRecursively(item))
            .filter((item): item is TocItem => !!item);
    }

    /**
     * 渲染目录列表。
     *
     * @param items 目录项
     * @param onItemClick 点击事件
     */
    private renderList(items: TocItem[], onItemClick: (item: TocItem) => void): void {
        if (!this.listEl) {
            return;
        }

        this.listEl.innerHTML = '';

        const renderItems = (itemList: TocItem[], level: number): void => {
            itemList.forEach((item) => {
                const itemEl = document.createElement('div');
                itemEl.className = ITEM_CLASS;
                itemEl.dataset.id = item.id;
                itemEl.dataset.role = item.role;
                itemEl.dataset.level = String(level);
                itemEl.dataset.parentId = item.parentId || '';
                itemEl.dataset.kind = item.kind;

                itemEl.textContent = `${buildItemPrefix(item, level)}${item.title}`;
                itemEl.title = item.title;
                itemEl.style.paddingLeft = `${10 + (level * 18)}px`;

                if (this.activeId && this.activeId === item.id) {
                    itemEl.classList.add(ACTIVE_CLASS);
                }

                if (this.activeParentId && this.activeParentId === item.id) {
                    itemEl.classList.add(PARENT_ACTIVE_CLASS);
                }

                itemEl.addEventListener('click', () => {
                    onItemClick(item);
                });

                this.listEl!.appendChild(itemEl);

                if (item.children?.length) {
                    renderItems(item.children, level + 1);
                }
            });
        };

        renderItems(items, 0);
    }
}

/**
 * 构建不同层级目录项前缀。
 *
 * @param item 目录项
 * @param level 当前层级
 * @returns 前缀文本
 */
function buildItemPrefix(item: TocItem, level: number): string {
    if (item.kind === 'user') {
        return `${item.index}. `;
    }

    if (item.kind === 'assistant') {
        return '└ ';
    }

    return level >= 2 ? '   • ' : '• ';
}