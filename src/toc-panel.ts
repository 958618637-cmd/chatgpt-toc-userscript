import {
    ACTIVE_CLASS,
    APP_ID,
    BATCH_DELETE_ID,
    COLLAPSED_ID,
    DEFAULT_TOC_VISIBLE_LEVEL,
    DELETE_CURRENT_ID,
    FOOTER_ID,
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
    private deleteCurrentButtonEl: HTMLButtonElement | null = null;
    private batchDeleteButtonEl: HTMLButtonElement | null = null;
    private collapsed = false;
    private items: TocItem[] = [];
    private activeId: string | null = null;
    private activeParentId: string | null = null;
    private maxVisibleLevel: 2 | 3 = DEFAULT_TOC_VISIBLE_LEVEL;

    /**
     * 创建面板。
     */
    public mount(
        onItemClick: (item: TocItem) => void,
        onItemCopy: (item: TocItem) => Promise<boolean>,
        onItemCopyForModification: (item: TocItem) => Promise<boolean>,
        onDeleteCurrentConversation?: () => Promise<void>,
        onBatchDeleteConversations?: () => Promise<void>
    ): void {
        if (document.getElementById(PANEL_ID)) {
            this.panelEl = document.getElementById(PANEL_ID);
            this.listEl = document.getElementById(LIST_ID);
            this.searchEl = document.getElementById(SEARCH_ID) as HTMLInputElement | null;
            this.levelSelectEl = document.getElementById(LEVEL_SELECT_ID) as HTMLSelectElement | null;

            this.deleteCurrentButtonEl = document.getElementById(
                DELETE_CURRENT_ID
            ) as HTMLButtonElement | null;

            this.batchDeleteButtonEl = document.getElementById(
                BATCH_DELETE_ID
            ) as HTMLButtonElement | null;

            this.bindDeleteCurrentButton(onDeleteCurrentConversation);
            this.bindBatchDeleteButton(onBatchDeleteConversations);
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
                            <option value="3"${DEFAULT_TOC_VISIBLE_LEVEL === (3 as 2 | 3) ? ' selected' : ''}>3级</option>
                        </select>
                    </label>
                    <button id="${TOGGLE_ID}" title="折叠">◀</button>
                </div>
            </div>
            <input id="${SEARCH_ID}" type="text" placeholder="搜索目录..." />

            <div id="${LIST_ID}"></div>

            <div id="${FOOTER_ID}">
                <button
                    id="${BATCH_DELETE_ID}"
                    type="button"
                    title="从左侧聊天列表选择多个会话进行删除"
                >
                    批量删除会话
                </button>

                <button
                    id="${DELETE_CURRENT_ID}"
                    type="button"
                    title="直接删除当前会话，不再进行插件确认"
                >
                    删除当前会话（无确认）
                </button>
            </div>
        `;

        document.body.appendChild(panel);

        this.panelEl = panel;
        this.listEl = panel.querySelector(`#${LIST_ID}`);
        this.searchEl = panel.querySelector(`#${SEARCH_ID}`) as HTMLInputElement;
        this.levelSelectEl = panel.querySelector(`#${LEVEL_SELECT_ID}`) as HTMLSelectElement;

        this.deleteCurrentButtonEl = panel.querySelector(
            `#${DELETE_CURRENT_ID}`
        ) as HTMLButtonElement;

        this.batchDeleteButtonEl = panel.querySelector(
            `#${BATCH_DELETE_ID}`
        ) as HTMLButtonElement;

        this.bindDeleteCurrentButton(onDeleteCurrentConversation);
        this.bindBatchDeleteButton(onBatchDeleteConversations);

        const toggleButton = panel.querySelector(`#${TOGGLE_ID}`) as HTMLButtonElement;
        toggleButton.addEventListener('click', () => {
            this.toggleCollapse();
        });

        this.searchEl.addEventListener('input', () => {
            this.renderList(
                this.getFilteredItems(),
                onItemClick,
                onItemCopy,
                onItemCopyForModification
            );
        });

        this.levelSelectEl.addEventListener('change', () => {
            const value = Number(this.levelSelectEl?.value || DEFAULT_TOC_VISIBLE_LEVEL);
            this.maxVisibleLevel = value === 3 ? 3 : 2;

            this.renderList(
                this.getFilteredItems(),
                onItemClick,
                onItemCopy,
                onItemCopyForModification
            );

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
     * @param onItemCopy 普通复制事件
     * @param onItemCopyForModification 复制并修改事件
     */
    public update(
        items: TocItem[],
        onItemClick: (item: TocItem) => void,
        onItemCopy: (item: TocItem) => Promise<boolean>,
        onItemCopyForModification: (item: TocItem) => Promise<boolean>
    ): void {
        this.items = items;
        this.renderList(
            this.getFilteredItems(),
            onItemClick,
            onItemCopy,
            onItemCopyForModification
        );

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
     * 绑定删除当前会话按钮。
     *
     * @param onDeleteCurrentConversation 删除回调
     */
    private bindDeleteCurrentButton(
        onDeleteCurrentConversation?: () => Promise<void>
    ): void {
        const button = this.deleteCurrentButtonEl;

        if (!button || !onDeleteCurrentConversation) {
            return;
        }

        /*
         * 使用 onclick 覆盖旧监听器，
         * 防止脚本热更新或者重复 mount 后多次执行删除。
         */
        button.onclick = async () => {
            if (button.disabled) {
                return;
            }

            const normalText = '删除当前会话（无确认）';

            button.disabled = true;
            button.textContent = '正在删除...';
            button.removeAttribute('title');

            try {
                await onDeleteCurrentConversation();

                button.textContent = '已执行删除';

                window.setTimeout(() => {
                    if (!button.isConnected) {
                        return;
                    }

                    button.textContent = normalText;
                    button.disabled = false;
                    button.title = '直接删除当前会话，不再进行插件确认';
                }, 1200);
            } catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : String(error || '删除失败');

                console.error('[ChatGPT TOC] 删除当前会话失败：', error);

                button.textContent = '删除失败，点击重试';
                button.title = message;
                button.disabled = false;

                window.setTimeout(() => {
                    if (!button.isConnected || button.disabled) {
                        return;
                    }

                    button.textContent = normalText;
                }, 2500);
            }
        };
    }

    /**
     * 绑定批量删除会话按钮。
     *
     * @param onBatchDeleteConversations 打开批量删除窗口回调
     */
    private bindBatchDeleteButton(
        onBatchDeleteConversations?: () => Promise<void>
    ): void {
        const button = this.batchDeleteButtonEl;

        if (!button || !onBatchDeleteConversations) {
            return;
        }

        button.onclick = async () => {
            if (button.disabled) {
                return;
            }

            button.disabled = true;

            try {
                await onBatchDeleteConversations();
            } catch (error) {
                const message = error instanceof Error
                    ? error.message
                    : String(error || '打开批量删除窗口失败');

                console.error('[ChatGPT TOC] 打开批量删除窗口失败：', error);
                window.alert(message);
            } finally {
                button.disabled = false;
            }
        };
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
     * @param onItemClick 点击目录项
     * @param onItemCopy 复制 GPT 回复
     * @param onItemCopyForModification 复制 GPT 回复并追加修改指令
     */
    private renderList(
        items: TocItem[],
        onItemClick: (item: TocItem) => void,
        onItemCopy: (item: TocItem) => Promise<boolean>,
        onItemCopyForModification: (item: TocItem) => Promise<boolean>
    ): void {
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
                itemEl.style.paddingLeft = `${10 + (level * 18)}px`;

                const textEl = document.createElement('span');

                textEl.className = `${APP_ID}-item-text`;
                textEl.textContent =
                    `${buildItemPrefix(item, level)}${item.title}`;
                textEl.title = item.title;

                itemEl.appendChild(textEl);

                if (item.kind === 'assistant') {
                    const actionEl = document.createElement('span');

                    actionEl.className = `${APP_ID}-copy-actions`;

                    const copyButton = this.createCopyButton(
                        item,
                        onItemCopy,
                        'original'
                    );

                    const modifyCopyButton = this.createCopyButton(
                        item,
                        onItemCopyForModification,
                        'modify'
                    );

                    actionEl.appendChild(copyButton);
                    actionEl.appendChild(modifyCopyButton);

                    itemEl.appendChild(actionEl);
                }

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

    /**
     * 创建 GPT 回复复制按钮。
     *
     * @param item GPT 回复目录项
     * @param onItemCopy 复制回调
     * @param mode 复制模式
     */
    private createCopyButton(
        item: TocItem,
        onItemCopy: (item: TocItem) => Promise<boolean>,
        mode: 'original' | 'modify'
    ): HTMLButtonElement {
        const button = document.createElement('button');
        const isModifyMode = mode === 'modify';

        button.type = 'button';
        button.className = `${APP_ID}-copy-button`;

        if (isModifyMode) {
            button.classList.add(`${APP_ID}-copy-modify-button`);
        }

        button.textContent = isModifyMode ? '改' : '⧉';

        button.title = isModifyMode
            ? '复制回复，并追加"请按上述内容进行修改。"'
            : '复制该次 GPT 回复的全部内容';

        button.setAttribute(
            'aria-label',
            isModifyMode
                ? '复制 GPT 回复并追加修改指令'
                : '复制 GPT 回复'
        );

        button.addEventListener('click', async (event) => {
            event.preventDefault();
            event.stopPropagation();

            if (button.disabled) {
                return;
            }

            button.disabled = true;

            try {
                const success = await onItemCopy(item);

                this.showCopyResult(
                    button,
                    success,
                    isModifyMode
                        ? '已复制并追加修改指令'
                        : '已复制完整回复'
                );
            } catch (error) {
                console.error(
                    isModifyMode
                        ? '[ChatGPT TOC] 复制并追加修改指令失败。'
                        : '[ChatGPT TOC] 复制回复失败。',
                    error
                );

                this.showCopyResult(button, false);
            }
        });

        return button;
    }

    /**
     * 显示复制结果。
     *
     * @param button 复制按钮
     * @param success 是否成功
     * @param successTitle 成功提示
     */
    private showCopyResult(
        button: HTMLButtonElement,
        success: boolean,
        successTitle = '已复制完整回复'
    ): void {
        const oldText = button.textContent || '⧉';
        const oldTitle = button.title;

        button.textContent = success ? '✓' : '!';
        button.title = success ? successTitle : '复制失败';
        button.classList.toggle(
            `${APP_ID}-copy-success`,
            success
        );
        button.classList.toggle(
            `${APP_ID}-copy-failed`,
            !success
        );

        window.setTimeout(() => {
            button.textContent = oldText;
            button.title = oldTitle;
            button.disabled = false;

            button.classList.remove(
                `${APP_ID}-copy-success`,
                `${APP_ID}-copy-failed`
            );
        }, 1500);
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
