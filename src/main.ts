import { extractTocItems } from './conversation';
import { getUserMessageElements } from './chatgpt-dom';
import { ScrollManager } from './scroll-manager';
import { injectStyles } from './style';
import { TocPanel } from './toc-panel';
import { PageObserver } from './observer';
import type { TocItem } from './types';
import { debounce } from './utils';

/**
 * ChatGPT 目录应用。
 */
class ChatGptTocApp {
    private tocPanel = new TocPanel();
    private scrollManager = new ScrollManager();
    private pageObserver = new PageObserver();
    private items: TocItem[] = [];

    /**
     * 启动应用。
     */
    public start(): void {
        injectStyles();
        this.tocPanel.mount((item) => this.handleItemClick(item));

        this.rebuild();

        this.pageObserver.start(() => {
            this.rebuild();
        });

        window.addEventListener(
            'scroll',
            debounce(() => {
                this.syncActiveItem();
            }, 100),
            true
        );
    }

    /**
     * 重建目录。
     */
    private rebuild(): void {
        const userMessageElements = getUserMessageElements();
        this.items = extractTocItems(userMessageElements);
        this.tocPanel.update(this.items, (item) => this.handleItemClick(item));
        this.syncActiveItem();
    }

    /**
     * 处理目录点击。
     *
     * @param item 目录项
     */
    private handleItemClick(item: TocItem): void {
        this.scrollManager.scrollToItem(item);
        this.tocPanel.setActive(item.id);
    }

    /**
     * 同步激活项。
     */
    private syncActiveItem(): void {
        const activeItem = this.scrollManager.getActiveItem(this.items);
        if (activeItem) {
            this.tocPanel.setActive(activeItem.id);
        }
    }
}

/**
 * 页面准备完成后启动。
 */
function bootstrap(): void {
    const app = new ChatGptTocApp();
    app.start();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}