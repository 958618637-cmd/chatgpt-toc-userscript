import {
    ACTIVE_CLASS,
    APP_ID,
    COLLAPSED_ID,
    HEADER_ID,
    ITEM_CLASS,
    LIST_ID,
    PANEL_ID,
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
            this.setActive(this.activeId);
        }
    }

    /**
     * 设置激活项。
     *
     * @param activeId 当前激活ID
     */
    public setActive(activeId: string): void {
        this.activeId = activeId;

        if (!this.listEl) {
            return;
        }

        const itemElements = this.listEl.querySelectorAll<HTMLElement>(`.${ITEM_CLASS}`);
        itemElements.forEach((el) => {
            if (el.dataset.id === activeId) {
                el.classList.add(ACTIVE_CLASS);
            } else {
                el.classList.remove(ACTIVE_CLASS);
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
     * @returns 过滤后的目录项
     */
    private getFilteredItems(): TocItem[] {
        const keyword = (this.searchEl?.value || '').trim().toLowerCase();

        if (!keyword) {
            return this.items;
        }

        return this.items.filter((item) => {
            return item.title.toLowerCase().includes(keyword);
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

        items.forEach((item) => {
            const itemEl = document.createElement('div');
            itemEl.className = ITEM_CLASS;
            itemEl.dataset.id = item.id;
            itemEl.textContent = `${item.index}. ${item.title}`;
            itemEl.title = item.title;

            if (this.activeId && this.activeId === item.id) {
                itemEl.classList.add(ACTIVE_CLASS);
            }

            itemEl.addEventListener('click', () => {
                onItemClick(item);
            });

            this.listEl!.appendChild(itemEl);
        });
    }
}