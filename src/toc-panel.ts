import {
    ACTIVE_CLASS,
    APP_ID,
    COLLAPSED_ID,
    DEFAULT_TOC_VISIBLE_LEVEL,
    HEADER_ID,
    ITEM_CLASS,
    LEVEL_SELECT_ID,
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
    private levelSelectEl: HTMLSelectElement | null = null;
    private collapsed = false;
    private items: TocItem[] = [];
    private activeId: string | null = null;
    private activeParentId: string | null = null;
    private maxVisibleLevel: 2 | 3 = DEFAULT_TOC_VISIBLE_LEVEL;

    /**
     * 创建面板。
     */
    public mount(onItemClick: (item: TocItem) => void): void {
        if (document.getElementById(PANEL_ID)) {
            this.panelEl = document.getElementById(PANEL_ID);
            this.listEl = document.getElementById(LIST_ID);
            this.searchEl = document.getElementById(SEARCH_ID) as HTMLInputElement | null;
            this.levelSelectEl = document.getElementById(LEVEL_SELECT_ID) as HTMLSelectElement | null;
            return;
        }

        const panel = document.createElement('div');
        panel.id = PANEL_ID;

        panel.innerHTML = `
            <div id="${HEADER_ID}">
                <span>会话目录</span>
                <div class="${APP_ID}-header-actions">
                    <label class="${APP_ID}-level-label" title="控制目录显示层级">
                        层级
                        <select id="${LEVEL_SELECT_ID}">
                            <option value="2"${DEFAULT_TOC_VISIBLE_LEVEL === 2 ? ' selected' : ''}>2级</option>
                            <option value="3"${DEFAULT_TOC_VISIBLE_LEVEL === 3 ? ' selected' : ''}>3级</option>
                        </select>
                    </label>
                    <button id="${TOGGLE_ID}" title="折叠">◀</button>
                </div>
            </div>
            <input id="${SEARCH_ID}" type="text" placeholder="搜索目录..." />
            <div id="${LIST_ID}"></div>
        `;

        document.body.appendChild(panel);

        this.panelEl = panel;
        this.listEl = panel.querySelector(`#${LIST_ID}`);
        this.searchEl = panel.querySelector(`#${SEARCH_ID}`) as HTMLInputElement;
        this.levelSelectEl = panel.querySelector(`#${LEVEL_SELECT_ID}`) as HTMLSelectElement;

        const toggleButton = panel.querySelector(`#${TOGGLE_ID}`) as HTMLButtonElement;
        toggleButton.addEventListener('click', () => {
            this.toggleCollapse();
        });

        this.searchEl.addEventListener('input', () => {
            this.renderList(this.getFilteredItems(), onItemClick);
        });

        this.levelSelectEl.addEventListener('change', () => {
            const value = Number(this.levelSelectEl?.value || DEFAULT_TOC_VISIBLE_LEVEL);
            this.maxVisibleLevel = value === 3 ? 3 : 2;

            this.renderList(this.getFilteredItems(), onItemClick);

            if (this.activeId) {
                this.setActive(this.activeId, this.activeParentId);
            }
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
        const visibleItems = this.limitItemsByDepth(this.items, this.maxVisibleLevel);

        if (!keyword) {
            return visibleItems;
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

        return visibleItems
            .map((item) => filterRecursively(item))
            .filter((item): item is TocItem => !!item);
    }

    /**
     * 按最大层级裁剪目录树。
     *
     * 说明：
     * 1. 不修改原始目录数据。
     * 2. 只控制面板显示层级。
     * 3. 1级：用户问题
     * 4. 2级：GPT 回复
     * 5. 3级：GPT 标题
     *
     * @param items 原始目录项
     * @param maxLevel 最大显示层级
     * @param currentLevel 当前层级
     * @returns 裁剪后的目录项
     */
    private limitItemsByDepth(
        items: TocItem[],
        maxLevel: number,
        currentLevel = 1
    ): TocItem[] {
        return items.map((item) => {
            const canShowChildren = currentLevel < maxLevel && item.children?.length;

            return {
                ...item,
                children: canShowChildren
                    ? this.limitItemsByDepth(item.children!, maxLevel, currentLevel + 1)
                    : []
            };
        });
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