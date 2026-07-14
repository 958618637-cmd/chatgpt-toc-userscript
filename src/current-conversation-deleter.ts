import { APP_ID } from './constants';

/**
 * 当前会话删除执行器。
 *
 * 不直接调用 ChatGPT 内部接口，而是模拟用户操作：
 *
 * 1. 找到当前会话；
 * 2. 打开会话操作菜单；
 * 3. 点击"删除"；
 * 4. 点击确认弹窗中的"删除"。
 */
export class CurrentConversationDeleter {
    /**
     * 删除当前会话。
     */
    public async deleteCurrentConversation(): Promise<void> {
        const originalPath = this.normalizePath(window.location.pathname);

        if (!this.isConversationPath(originalPath)) {
            throw new Error('当前页面不是可删除的会话页面');
        }

        const menuButton = await this.findConversationMenuButton();

        if (!menuButton) {
            throw new Error('未找到当前会话的操作菜单按钮');
        }

        this.clickElement(menuButton);

        const deleteMenuItem = await this.waitForElement(
            () => this.findDeleteMenuItem(),
            4000,
            '未找到会话菜单中的"删除"按钮'
        );

        this.clickElement(deleteMenuItem);

        const confirmButton = await this.waitForElement(
            () => this.findDeleteConfirmButton(),
            4000,
            '未找到删除确认弹窗中的"删除"按钮'
        );

        this.clickElement(confirmButton);

        /*
         * 等待确认弹窗消失或者页面路由发生变化。
         *
         * 此处不因为超时而判定失败：
         * ChatGPT 页面可能先关闭弹窗，再异步更新左侧会话列表。
         */
        await this.waitForCondition(
            () => {
                return (
                    this.normalizePath(window.location.pathname) !== originalPath ||
                    !confirmButton.isConnected
                );
            },
            5000
        ).catch(() => {
            // 原生页面会自行显示删除失败信息，这里不重复报错。
        });
    }

    /**
     * 是否是会话页面。
     *
     * 支持：
     * /c/会话ID
     * /g/GPT-ID/c/会话ID
     */
    private isConversationPath(pathname: string): boolean {
        return /\/c\/[^/]+/.test(pathname);
    }

    /**
     * 查找当前会话的菜单按钮。
     */
    private async findConversationMenuButton(): Promise<HTMLElement | null> {
        /*
         * 优先查找页面顶部的当前会话操作按钮。
         *
         * data-testid 相对稳定，aria-label 用于兼容不同语言。
         */
        const headerButton = this.findFirstVisible([
            'button[data-testid="conversation-options-button"]',
            'button[data-testid="chat-options-button"]',
            'button[aria-label="Open conversation options"]',
            'button[aria-label="Conversation options"]',
            'button[aria-label="打开会话选项"]',
            'button[aria-label="会话选项"]',
            'button[aria-label="聊天选项"]'
        ]);

        if (headerButton) {
            return headerButton;
        }

        /*
         * 页面顶部没有菜单按钮时，尝试在左侧会话列表中定位当前会话。
         */
        let currentLink = this.findCurrentConversationLink();

        /*
         * 左侧栏可能处于关闭状态。
         */
        if (!currentLink) {
            const openSidebarButton = this.findFirstVisible([
                'button[data-testid="open-sidebar-button"]',
                'button[aria-label="Open sidebar"]',
                'button[aria-label="打开边栏"]',
                'button[aria-label="打开侧边栏"]'
            ]);

            if (openSidebarButton) {
                this.clickElement(openSidebarButton);
                await this.sleep(300);
                currentLink = this.findCurrentConversationLink();
            }
        }

        if (!currentLink) {
            return null;
        }

        const ancestors = this.getAncestors(currentLink, 8);

        /*
         * ChatGPT 的会话操作按钮通常只有 hover 当前会话后才显示。
         */
        ancestors.forEach((element) => {
            this.hoverElement(element);
        });

        await this.sleep(250);

        for (const container of ancestors) {
            const button = this.findFirstVisible(
                [
                    'button[data-testid*="options"]',
                    'button[data-testid*="menu"]',
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
     * 根据当前 URL 找到左侧会话链接。
     */
    private findCurrentConversationLink(): HTMLAnchorElement | null {
        const currentPath = this.normalizePath(window.location.pathname);

        const links = Array.from(
            document.querySelectorAll<HTMLAnchorElement>('a[href]')
        );

        return links.find((link) => {
            if (link.closest(`#${APP_ID}-panel`)) {
                return false;
            }

            try {
                const url = new URL(link.href, window.location.origin);

                return (
                    url.origin === window.location.origin &&
                    this.normalizePath(url.pathname) === currentPath
                );
            } catch (error) {
                return false;
            }
        }) || null;
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
        ).filter((element) => this.isElementVisible(element));

        for (const menu of menuContainers) {
            const candidate = this.findDeleteActionInside(menu);

            if (candidate) {
                return candidate;
            }
        }

        /*
         * 某些版本的菜单没有 role="menu"，
         * 这里使用 menuitem 作为兜底。
         */
        const menuItems = Array.from(
            document.querySelectorAll<HTMLElement>(
                '[role="menuitem"], [data-radix-collection-item]'
            )
        );

        return menuItems.find((element) => {
            return (
                this.isElementVisible(element) &&
                this.isDeleteActionText(this.getElementText(element))
            );
        }) || null;
    }

    /**
     * 查找确认弹窗中的删除按钮。
     */
    private findDeleteConfirmButton(): HTMLElement | null {
        /*
         * 优先使用明确的测试标识。
         */
        const testIdButton = this.findFirstVisible([
            'button[data-testid="confirm-delete-conversation"]',
            'button[data-testid="confirm-delete-chat"]',
            'button[data-testid*="confirm-delete"]'
        ]);

        if (testIdButton) {
            return testIdButton;
        }

        const dialogs = Array.from(
            document.querySelectorAll<HTMLElement>(
                [
                    '[role="dialog"]',
                    '[data-testid*="dialog"]',
                    '[data-testid*="modal"]'
                ].join(',')
            )
        ).filter((dialog) => {
            return (
                this.isElementVisible(dialog) &&
                !dialog.closest(`#${APP_ID}-panel`)
            );
        });

        /*
         * 从最后出现的弹窗开始查找。
         */
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
    private findDeleteActionInside(container: ParentNode): HTMLElement | null {
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
            if (!this.isElementVisible(element)) {
                return false;
            }

            return this.isDeleteActionText(
                this.getElementText(element)
            );
        }) || null;
    }

    /**
     * 判断文字是否表示单个会话删除。
     *
     * 明确排除"删除全部会话"。
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
     *
     * @param selectors CSS 选择器列表
     * @param root 查找根节点
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
                    !item.closest(`#${APP_ID}-panel`) &&
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
     * 模拟 hover。
     *
     * 使用 element 所属页面的 MouseEvent 构造器，
     * 避免油猴沙箱 window 代理导致的类型转换错误。
     */
    private hoverElement(element: HTMLElement): void {
        if (!element || !element.isConnected) {
            return;
        }

        const ownerWindow = element.ownerDocument.defaultView;
        const MouseEventConstructor =
            ownerWindow && typeof ownerWindow.MouseEvent === 'function'
                ? ownerWindow.MouseEvent
                : MouseEvent;

        [
            'pointerover',
            'mouseover',
            'mouseenter'
        ].forEach((eventName) => {
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
     *
     * 直接调用 DOM 原生 click()，不手工构造 MouseEvent，
     * 避免油猴沙箱 window 代理导致的类型转换错误。
     * React / Radix UI / 普通按钮都能收到原生 click。
     */
    private clickElement(element: HTMLElement): void {
        if (!element || !element.isConnected) {
            throw new Error('目标元素不存在或已从页面移除');
        }

        element.scrollIntoView({
            block: 'center',
            inline: 'nearest'
        });

        if (typeof element.focus === 'function') {
            try {
                element.focus({
                    preventScroll: true
                });
            } catch (error) {
                element.focus();
            }
        }

        element.click();
    }

    /**
     * 获取指定数量的父节点。
     *
     * @param element 起始元素
     * @param maxLevel 最多往上查找层级
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
     *
     * @param finder 查找函数
     * @param timeout 超时时间（毫秒）
     * @param errorMessage 超时错误信息
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
     *
     * @param condition 条件函数
     * @param timeout 超时时间（毫秒）
     */
    private waitForCondition(
        condition: () => boolean,
        timeout: number
    ): Promise<void> {
        return new Promise((resolve, reject) => {
            const startedAt = Date.now();

            const check = (): void => {
                if (condition()) {
                    resolve();
                    return;
                }

                if (Date.now() - startedAt >= timeout) {
                    reject(new Error('等待删除完成超时'));
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
