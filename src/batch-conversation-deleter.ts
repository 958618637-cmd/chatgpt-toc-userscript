import {
    APP_ID,
    BATCH_DELETE_DIALOG_ID
} from './constants';

/**
 * 左侧会话列表项。
 */
interface SidebarConversation {
    /** 会话地址路径。 */
    path: string;

    /** 会话标题。 */
    title: string;
}

/**
 * 单条会话删除失败信息。
 */
interface DeleteFailure {
    conversation: SidebarConversation;
    message: string;
}

/**
 * 批量删除结果。
 */
interface BatchDeleteResult {
    success: SidebarConversation[];
    failed: DeleteFailure[];
}

/**
 * 批量会话删除器。
 *
 * 工作方式：
 * 1. 从 ChatGPT 左侧栏读取当前已加载的会话；
 * 2. 在插件弹窗中勾选多个会话；
 * 3. 逐条点击左侧列表项的“更多”；
 * 4. 点击 ChatGPT 原生“删除”；
 * 5. 点击 ChatGPT 原生确认按钮。
 *
 * 注意：
 * - 不调用 ChatGPT 内部接口；
 * - 只处理左侧栏当前已经加载到 DOM 中的会话；
 * - 为避免当前页面跳转影响后续删除，当前会话会排到最后删除。
 */
export class BatchConversationDeleter {
    private deleting = false;

    /**
     * 打开批量删除窗口。
     */
    public async open(): Promise<void> {
        if (this.deleting) {
            return;
        }

        const oldDialog = document.getElementById(BATCH_DELETE_DIALOG_ID);

        if (oldDialog) {
            oldDialog.remove();
        }

        await this.ensureSidebarOpen();

        const conversations = this.collectSidebarConversations();

        if (!conversations.length) {
            window.alert(
                '没有从左侧聊天列表中获取到可删除的会话。\n' +
                '请先展开左侧栏，并确认会话列表已经加载。'
            );
            return;
        }

        this.createDialog(conversations);
    }

    /**
     * 创建批量删除窗口。
     */
    private createDialog(initialConversations: SidebarConversation[]): void {
        let conversations = initialConversations.slice();
        const selectedPaths = new Set<string>();

        const overlay = document.createElement('div');
        overlay.id = BATCH_DELETE_DIALOG_ID;
        overlay.className = `${APP_ID}-batch-overlay`;

        const dialog = document.createElement('div');
        dialog.className = `${APP_ID}-batch-dialog`;
        dialog.setAttribute('role', 'dialog');
        dialog.setAttribute('aria-modal', 'true');
        dialog.setAttribute('aria-label', '批量删除会话');

        const header = document.createElement('div');
        header.className = `${APP_ID}-batch-header`;

        const titleWrap = document.createElement('div');

        const title = document.createElement('div');
        title.className = `${APP_ID}-batch-title`;
        title.textContent = '批量删除会话';

        const subtitle = document.createElement('div');
        subtitle.className = `${APP_ID}-batch-subtitle`;
        subtitle.textContent = `已读取左侧栏 ${conversations.length} 个会话`;

        titleWrap.appendChild(title);
        titleWrap.appendChild(subtitle);

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.className = `${APP_ID}-batch-close`;
        closeButton.textContent = '×';
        closeButton.title = '关闭';
        closeButton.setAttribute('aria-label', '关闭批量删除窗口');

        header.appendChild(titleWrap);
        header.appendChild(closeButton);

        const toolbar = document.createElement('div');
        toolbar.className = `${APP_ID}-batch-toolbar`;

        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = `${APP_ID}-batch-search`;
        searchInput.placeholder = '搜索会话标题...';

        const refreshButton = document.createElement('button');
        refreshButton.type = 'button';
        refreshButton.className = `${APP_ID}-batch-secondary-button`;
        refreshButton.textContent = '重新读取';

        toolbar.appendChild(searchInput);
        toolbar.appendChild(refreshButton);

        const selectBar = document.createElement('div');
        selectBar.className = `${APP_ID}-batch-select-bar`;

        const selectAllLabel = document.createElement('label');
        selectAllLabel.className = `${APP_ID}-batch-select-all`;

        const selectAllCheckbox = document.createElement('input');
        selectAllCheckbox.type = 'checkbox';

        const selectAllText = document.createElement('span');
        selectAllText.textContent = '全选当前结果';

        selectAllLabel.appendChild(selectAllCheckbox);
        selectAllLabel.appendChild(selectAllText);

        const selectedCount = document.createElement('span');
        selectedCount.className = `${APP_ID}-batch-selected-count`;
        selectedCount.textContent = '已选择 0 个';

        selectBar.appendChild(selectAllLabel);
        selectBar.appendChild(selectedCount);

        const list = document.createElement('div');
        list.className = `${APP_ID}-batch-list`;

        const status = document.createElement('div');
        status.className = `${APP_ID}-batch-status`;
        status.textContent = '只会删除勾选的会话，删除后无法恢复。';

        const footer = document.createElement('div');
        footer.className = `${APP_ID}-batch-footer`;

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.className = `${APP_ID}-batch-secondary-button`;
        cancelButton.textContent = '取消';

        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = `${APP_ID}-batch-danger-button`;
        deleteButton.textContent = '删除选中会话';
        deleteButton.disabled = true;

        footer.appendChild(cancelButton);
        footer.appendChild(deleteButton);

        dialog.appendChild(header);
        dialog.appendChild(toolbar);
        dialog.appendChild(selectBar);
        dialog.appendChild(list);
        dialog.appendChild(status);
        dialog.appendChild(footer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        const getFilteredConversations = (): SidebarConversation[] => {
            const keyword = this.normalizeText(searchInput.value).toLowerCase();

            if (!keyword) {
                return conversations;
            }

            return conversations.filter((conversation) => {
                return (
                    conversation.title.toLowerCase().includes(keyword) ||
                    conversation.path.toLowerCase().includes(keyword)
                );
            });
        };

        const updateSelectionState = (): void => {
            const filtered = getFilteredConversations();
            const selectedInFiltered = filtered.filter((conversation) => {
                return selectedPaths.has(conversation.path);
            }).length;

            selectAllCheckbox.checked = (
                filtered.length > 0 &&
                selectedInFiltered === filtered.length
            );
            selectAllCheckbox.indeterminate = (
                selectedInFiltered > 0 &&
                selectedInFiltered < filtered.length
            );

            selectedCount.textContent = `已选择 ${selectedPaths.size} 个`;
            deleteButton.disabled = this.deleting || selectedPaths.size === 0;
        };

        const renderList = (): void => {
            list.innerHTML = '';

            const filtered = getFilteredConversations();

            if (!filtered.length) {
                const empty = document.createElement('div');
                empty.className = `${APP_ID}-batch-empty`;
                empty.textContent = '没有匹配的会话';
                list.appendChild(empty);
                updateSelectionState();
                return;
            }

            filtered.forEach((conversation) => {
                const row = document.createElement('label');
                row.className = `${APP_ID}-batch-row`;
                row.dataset.path = conversation.path;

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.checked = selectedPaths.has(conversation.path);

                const content = document.createElement('span');
                content.className = `${APP_ID}-batch-row-content`;

                const rowTitle = document.createElement('span');
                rowTitle.className = `${APP_ID}-batch-row-title`;
                rowTitle.textContent = conversation.title;
                rowTitle.title = conversation.title;

                const rowPath = document.createElement('span');
                rowPath.className = `${APP_ID}-batch-row-path`;
                rowPath.textContent = conversation.path;

                content.appendChild(rowTitle);
                content.appendChild(rowPath);

                row.appendChild(checkbox);
                row.appendChild(content);

                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        selectedPaths.add(conversation.path);
                    } else {
                        selectedPaths.delete(conversation.path);
                    }

                    updateSelectionState();
                });

                list.appendChild(row);
            });

            updateSelectionState();
        };

        const setDeletingState = (deleting: boolean): void => {
            this.deleting = deleting;

            /*
             * 删除期间只禁止会影响批次内容的操作。
             * 关闭按钮和取消按钮始终可用。
             */
            refreshButton.disabled = deleting;
            searchInput.disabled = deleting;
            selectAllCheckbox.disabled = deleting;

            list.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach((checkbox) => {
                checkbox.disabled = deleting;
            });

            updateSelectionState();
        };

        let onKeyDown: ((event: KeyboardEvent) => void) | null = null;

        const close = (): void => {
            if (onKeyDown) {
                document.removeEventListener('keydown', onKeyDown);
                onKeyDown = null;
            }

            overlay.remove();
        };

        closeButton.onclick = close;
        cancelButton.onclick = close;

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                close();
            }
        });

        onKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape' && overlay.isConnected) {
                close();
            }
        };

        document.addEventListener('keydown', onKeyDown);

        searchInput.addEventListener('input', renderList);

        selectAllCheckbox.addEventListener('change', () => {
            const filtered = getFilteredConversations();

            filtered.forEach((conversation) => {
                if (selectAllCheckbox.checked) {
                    selectedPaths.add(conversation.path);
                } else {
                    selectedPaths.delete(conversation.path);
                }
            });

            renderList();
        });

        refreshButton.onclick = async () => {
            refreshButton.disabled = true;
            refreshButton.textContent = '读取中...';

            try {
                await this.ensureSidebarOpen();
                conversations = this.collectSidebarConversations();

                const availablePaths = new Set(
                    conversations.map((conversation) => conversation.path)
                );

                Array.from(selectedPaths).forEach((path) => {
                    if (!availablePaths.has(path)) {
                        selectedPaths.delete(path);
                    }
                });

                subtitle.textContent = `已读取左侧栏 ${conversations.length} 个会话`;
                status.textContent = conversations.length
                    ? '左侧会话列表已重新读取。'
                    : '没有读取到会话，请确认左侧栏已经展开。';

                renderList();
            } finally {
                refreshButton.disabled = false;
                refreshButton.textContent = '重新读取';
            }
        };

        deleteButton.onclick = async () => {
            if (this.deleting || !selectedPaths.size) {
                return;
            }

            const selected = conversations.filter((conversation) => {
                return selectedPaths.has(conversation.path);
            });

            const confirmed = window.confirm(
                `确定要删除选中的 ${selected.length} 个会话吗？\n\n` +
                '删除后无法恢复。'
            );

            if (!confirmed) {
                return;
            }

            /*
             * 点击确定后立即关闭批量删除窗口。
             * 删除任务继续执行，不再显示进度和成功状态。
             */
            this.deleting = true;
            close();

            try {
                const result = await this.deleteConversations(selected);

                /*
                 * 不显示成功状态。
                 * 只有确实找不到菜单或确认按钮时，才在控制台输出错误。
                 */
                result.failed.forEach((failure) => {
                    console.error(
                        `[ChatGPT TOC] 删除会话失败：${failure.conversation.title}`,
                        failure.message
                    );
                });
            } finally {
                this.deleting = false;
            }
        };

        renderList();
        searchInput.focus();
    }

    /**
     * 顺序删除多个会话。
     *
     * 当前会话放在最后，避免删除当前会话后发生路由跳转，
     * 干扰其他左侧列表项的操作。
     */
    private async deleteConversations(
        conversations: SidebarConversation[]
    ): Promise<BatchDeleteResult> {
        const currentPath = this.normalizePath(window.location.pathname);
        const ordered = conversations.slice().sort((left, right) => {
            const leftIsCurrent = left.path === currentPath ? 1 : 0;
            const rightIsCurrent = right.path === currentPath ? 1 : 0;

            return leftIsCurrent - rightIsCurrent;
        });

        const result: BatchDeleteResult = {
            success: [],
            failed: []
        };

        for (const conversation of ordered) {
            try {
                await this.deleteConversation(conversation);
                result.success.push(conversation);
            } catch (error) {
                result.failed.push({
                    conversation,
                    message: error instanceof Error
                        ? error.message
                        : String(error || '删除失败')
                });

                this.closeOpenMenuOrDialog();
            }

            /*
             * 不再增加固定的批次间隔。
             * 当前删除方法内部等待菜单和确认弹窗出现即可。
             */
        }

        return result;
    }

    /**
     * 删除指定的左侧会话。
     */
    private async deleteConversation(
        conversation: SidebarConversation
    ): Promise<void> {
        const link = this.findConversationLinkByPath(conversation.path);

        if (!link) {
            throw new Error('左侧列表中已找不到该会话');
        }

        const menuButton = await this.findConversationMenuButton(link);

        if (!menuButton) {
            throw new Error('未找到该会话的操作菜单按钮');
        }

        this.clickElement(menuButton);

        const deleteMenuItem = await this.waitForElement(
            () => this.findDeleteMenuItem(),
            3500,
            '未找到会话菜单中的“删除”按钮'
        );

        this.clickElement(deleteMenuItem);

        const confirmButton = await this.waitForElement(
            () => this.findDeleteConfirmButton(),
            3500,
            '未找到删除确认弹窗中的“删除”按钮'
        );

        this.clickElement(confirmButton);

        /*
         * 点击确认按钮即认为本条操作完成。
         * 不等待左侧列表刷新，也不验证服务端删除结果。
         */
    }

    /**
     * 确保左侧栏处于展开状态。
     */
    private async ensureSidebarOpen(): Promise<void> {
        if (this.collectSidebarConversations().length > 0) {
            return;
        }

        const openSidebarButton = this.findFirstVisible([
            'button[data-testid="open-sidebar-button"]',
            'button[aria-label="Open sidebar"]',
            'button[aria-label="打开边栏"]',
            'button[aria-label="打开侧边栏"]'
        ]);

        if (!openSidebarButton) {
            return;
        }

        this.clickElement(openSidebarButton);
        await this.sleep(450);
    }

    /**
     * 获取左侧栏当前已经加载的会话。
     */
    private collectSidebarConversations(): SidebarConversation[] {
        const result = new Map<string, SidebarConversation>();
        const links = Array.from(
            document.querySelectorAll<HTMLAnchorElement>('a[href]')
        );

        links.forEach((link) => {
            if (link.closest(`[id^="${APP_ID}-"]`)) {
                return;
            }

            if (!this.isLikelySidebarConversationLink(link)) {
                return;
            }

            const path = this.getConversationPath(link);

            if (!path || result.has(path)) {
                return;
            }

            result.set(path, {
                path,
                title: this.getConversationTitle(link, path)
            });
        });

        return Array.from(result.values());
    }

    /**
     * 判断链接是否看起来属于左侧会话列表。
     */
    private isLikelySidebarConversationLink(
        link: HTMLAnchorElement
    ): boolean {
        const path = this.getConversationPath(link);

        if (!path) {
            return false;
        }

        return !!link.closest(
            [
                'nav',
                'aside',
                '[data-testid*="sidebar" i]',
                '[data-testid*="history" i]',
                '[class*="sidebar" i]'
            ].join(',')
        );
    }

    /**
     * 获取会话路径。
     */
    private getConversationPath(
        link: HTMLAnchorElement
    ): string | null {
        try {
            const url = new URL(link.href, window.location.origin);

            if (url.origin !== window.location.origin) {
                return null;
            }

            const path = this.normalizePath(url.pathname);

            return this.isConversationPath(path) ? path : null;
        } catch (error) {
            return null;
        }
    }

    /**
     * 获取会话标题。
     */
    private getConversationTitle(
        link: HTMLAnchorElement,
        path: string
    ): string {
        const preferredTitle = this.normalizeText(
            link.getAttribute('aria-label') ||
            link.getAttribute('title') ||
            ''
        );

        if (preferredTitle && !this.isMenuText(preferredTitle)) {
            return preferredTitle;
        }

        const text = this.normalizeText(
            link.innerText || link.textContent || ''
        )
            .replace(/Open conversation options/gi, '')
            .replace(/Conversation options/gi, '')
            .replace(/打开会话选项/g, '')
            .replace(/会话选项/g, '')
            .replace(/更多/g, '')
            .trim();

        return text || `会话 ${path.split('/').pop() || path}`;
    }

    /**
     * 根据路径重新查找左侧会话链接。
     *
     * 每删除一条后 ChatGPT 可能重绘左侧栏，
     * 因此不能长期持有原 DOM 引用。
     */
    private findConversationLinkByPath(
        path: string
    ): HTMLAnchorElement | null {
        const normalizedPath = this.normalizePath(path);
        const links = Array.from(
            document.querySelectorAll<HTMLAnchorElement>('a[href]')
        );

        return links.find((link) => {
            if (link.closest(`[id^="${APP_ID}-"]`)) {
                return false;
            }

            return (
                this.isLikelySidebarConversationLink(link) &&
                this.getConversationPath(link) === normalizedPath
            );
        }) || null;
    }

    /**
     * 查找指定会话行中的操作菜单按钮。
     */
    private async findConversationMenuButton(
        link: HTMLAnchorElement
    ): Promise<HTMLElement | null> {
        const ancestors = this.getAncestors(link, 9);

        ancestors.forEach((element) => {
            this.hoverElement(element);
        });

        await this.sleep(100);

        for (const container of ancestors) {
            /*
             * 到达过大的上层容器后，可能包含很多其他会话的菜单按钮，
             * 这时停止向上搜索，避免点错行。
             */
            const conversationLinkCount = Array.from(
                container.querySelectorAll<HTMLAnchorElement>('a[href]')
            ).filter((item) => !!this.getConversationPath(item)).length;

            if (conversationLinkCount > 2) {
                continue;
            }

            const button = this.findFirstVisible(
                [
                    'button[data-testid*="options" i]',
                    'button[data-testid*="menu" i]',
                    'button[aria-haspopup="menu"]',
                    'button[aria-label*="conversation options" i]',
                    'button[aria-label*="chat options" i]',
                    'button[aria-label*="更多"]',
                    'button[aria-label*="选项"]',
                    'button[aria-label*="菜单"]'
                ],
                container
            );

            if (button) {
                return button;
            }
        }

        return null;
    }

    /**
     * 查找会话菜单中的删除项。
     */
    private findDeleteMenuItem(): HTMLElement | null {
        const menuContainers = Array.from(
            document.querySelectorAll<HTMLElement>(
                [
                    '[role="menu"]',
                    '[data-radix-menu-content]',
                    '[data-state="open"][role="presentation"]'
                ].join(',')
            )
        ).filter((element) => {
            return (
                this.isElementVisible(element) &&
                !element.closest(`[id^="${APP_ID}-"]`)
            );
        });

        for (const menu of menuContainers) {
            const candidate = this.findDeleteActionInside(menu);

            if (candidate) {
                return candidate;
            }
        }

        const menuItems = Array.from(
            document.querySelectorAll<HTMLElement>(
                '[role="menuitem"], [data-radix-collection-item]'
            )
        );

        return menuItems.find((element) => {
            return (
                !element.closest(`[id^="${APP_ID}-"]`) &&
                this.isElementVisible(element) &&
                this.isDeleteActionText(this.getElementText(element))
            );
        }) || null;
    }

    /**
     * 查找确认弹窗中的删除按钮。
     */
    private findDeleteConfirmButton(): HTMLElement | null {
        const testIdButton = this.findFirstVisible([
            'button[data-testid="confirm-delete-conversation"]',
            'button[data-testid="confirm-delete-chat"]',
            'button[data-testid*="confirm-delete" i]'
        ]);

        if (testIdButton) {
            return testIdButton;
        }

        const dialogs = Array.from(
            document.querySelectorAll<HTMLElement>(
                [
                    '[role="dialog"]',
                    '[data-testid*="dialog" i]',
                    '[data-testid*="modal" i]'
                ].join(',')
            )
        ).filter((dialog) => {
            return (
                this.isElementVisible(dialog) &&
                !dialog.closest(`[id^="${APP_ID}-"]`)
            );
        });

        for (let index = dialogs.length - 1; index >= 0; index--) {
            const button = this.findDeleteActionInside(dialogs[index]);

            if (button) {
                return button;
            }
        }

        return null;
    }

    /**
     * 在指定容器中查找删除操作。
     */
    private findDeleteActionInside(
        container: ParentNode
    ): HTMLElement | null {
        const elements = Array.from(
            container.querySelectorAll<HTMLElement>(
                [
                    'button',
                    '[role="button"]',
                    '[role="menuitem"]',
                    '[data-radix-collection-item]'
                ].join(',')
            )
        );

        return elements.find((element) => {
            return (
                !element.closest(`[id^="${APP_ID}-"]`) &&
                this.isElementVisible(element) &&
                this.isDeleteActionText(this.getElementText(element))
            );
        }) || null;
    }

    /**
     * 判断文字是否表示单个会话删除。
     */
    private isDeleteActionText(text: string): boolean {
        const normalized = this.normalizeText(text);

        if (!normalized) {
            return false;
        }

        return [
            /^删除$/,
            /^删除会话$/,
            /^删除聊天$/,
            /^delete$/i,
            /^delete chat$/i,
            /^delete conversation$/i
        ].some((pattern) => pattern.test(normalized));
    }

    /**
     * 判断是否是菜单类文字。
     */
    private isMenuText(text: string): boolean {
        return /^(更多|选项|菜单|conversation options|chat options)$/i.test(
            this.normalizeText(text)
        );
    }

    /**
     * 尝试关闭残留的原生菜单或确认弹窗。
     */
    private closeOpenMenuOrDialog(): void {
        const ownerWindow = document.defaultView;
        const KeyboardEventConstructor =
            ownerWindow && typeof ownerWindow.KeyboardEvent === 'function'
                ? ownerWindow.KeyboardEvent
                : KeyboardEvent;

        document.dispatchEvent(
            new KeyboardEventConstructor('keydown', {
                key: 'Escape',
                code: 'Escape',
                bubbles: true,
                cancelable: true
            })
        );
    }

    /**
     * 获取元素显示文字。
     */
    private getElementText(element: HTMLElement): string {
        const text = element.textContent || '';

        if (text.trim()) {
            return text;
        }

        return (
            element.getAttribute('aria-label') ||
            element.getAttribute('title') ||
            ''
        );
    }

    /**
     * 查找第一个可见元素。
     */
    private findFirstVisible(
        selectors: string[],
        root: ParentNode = document
    ): HTMLElement | null {
        for (const selector of selectors) {
            const elements = Array.from(
                root.querySelectorAll<HTMLElement>(selector)
            );

            const element = elements.find((item) => {
                return (
                    !item.closest(`[id^="${APP_ID}-"]`) &&
                    this.isElementVisible(item)
                );
            });

            if (element) {
                return element;
            }
        }

        return null;
    }

    /**
     * 判断元素当前是否可操作。
     */
    private isElementVisible(element: HTMLElement): boolean {
        if (!element.isConnected) {
            return false;
        }

        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();

        if (
            style.display === 'none' ||
            style.visibility === 'hidden' ||
            style.pointerEvents === 'none'
        ) {
            return false;
        }

        return rect.width > 0 && rect.height > 0;
    }

    /**
     * 模拟 hover，使会话行的更多按钮显示出来。
     */
    private hoverElement(element: HTMLElement): void {
        if (!element.isConnected) {
            return;
        }

        const ownerWindow = element.ownerDocument.defaultView;
        const MouseEventConstructor =
            ownerWindow && typeof ownerWindow.MouseEvent === 'function'
                ? ownerWindow.MouseEvent
                : MouseEvent;

        ['pointerover', 'mouseover', 'mouseenter'].forEach((eventName) => {
            element.dispatchEvent(
                new MouseEventConstructor(eventName, {
                    bubbles: true,
                    cancelable: true,
                    composed: true
                })
            );
        });
    }

    /**
     * 点击元素。
     */
    private clickElement(element: HTMLElement): void {
        if (!element.isConnected) {
            throw new Error('目标元素不存在或已从页面移除');
        }

        element.scrollIntoView({
            block: 'center',
            inline: 'nearest'
        });

        try {
            element.focus({ preventScroll: true });
        } catch (error) {
            element.focus();
        }

        element.click();
    }

    /**
     * 获取指定数量的父节点。
     */
    private getAncestors(
        element: HTMLElement,
        maxLevel: number
    ): HTMLElement[] {
        const result: HTMLElement[] = [];
        let current: HTMLElement | null = element;

        for (let level = 0; current && level < maxLevel; level++) {
            result.push(current);
            current = current.parentElement;
        }

        return result;
    }

    /**
     * 等待元素出现。
     */
    private waitForElement<T extends HTMLElement>(
        finder: () => T | null,
        timeout: number,
        errorMessage: string
    ): Promise<T> {
        return new Promise((resolve, reject) => {
            const startedAt = Date.now();

            const check = (): void => {
                const element = finder();

                if (element) {
                    resolve(element);
                    return;
                }

                if (Date.now() - startedAt >= timeout) {
                    reject(new Error(errorMessage));
                    return;
                }

                window.setTimeout(check, 80);
            };

            check();
        });
    }

    /**
     * 等待条件成立。
     */
    private waitForCondition(
        condition: () => boolean,
        timeout: number,
        errorMessage: string
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const startedAt = Date.now();

            const check = (): void => {
                if (condition()) {
                    resolve();
                    return;
                }

                if (Date.now() - startedAt >= timeout) {
                    reject(new Error(errorMessage));
                    return;
                }

                window.setTimeout(check, 100);
            };

            check();
        });
    }

    private sleep(delay: number): Promise<void> {
        return new Promise((resolve) => {
            window.setTimeout(resolve, delay);
        });
    }

    /**
     * 是否是会话页面路径。
     *
     * 支持：
     * /c/会话ID
     * /g/GPT-ID/c/会话ID
     */
    private isConversationPath(pathname: string): boolean {
        return /\/c\/[^/]+/.test(pathname);
    }

    private normalizePath(pathname: string): string {
        const result = String(pathname || '').replace(/\/+$/, '');

        return result || '/';
    }

    private normalizeText(text: string): string {
        return String(text || '')
            .replace(/\s+/g, ' ')
            .trim();
    }
}
