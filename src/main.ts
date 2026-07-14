import { extractTocItems } from './conversation';
import { getConversationMessageElements } from './chatgpt-dom';
import { CurrentConversationDeleter } from './current-conversation-deleter';
import { PageObserver } from './observer';
import { ReplyCopyManager } from './reply-copy-manager';
import { ReplyNotifier } from './reply-notifier';
import { ScrollManager } from './scroll-manager';
import { injectStyles } from './style';
import { TocPanel } from './toc-panel';
import type { TocItem } from './types';
import { SCROLL_SYNC_LOCK_MS } from './constants';
import { buildItemsSignature, debounce, flattenTocItems } from './utils';

/**
 * ChatGPT 目录应用。
 */
class ChatGptTocApp {
    private tocPanel = new TocPanel();
    private scrollManager = new ScrollManager();
    private pageObserver = new PageObserver();
    private replyNotifier = new ReplyNotifier();
    private replyCopyManager = new ReplyCopyManager();
    private conversationDeleter = new CurrentConversationDeleter();
    private items: TocItem[] = [];
    private lastItemsSignature = '';
    private ignoreScrollSyncUntil = 0;

    /**
     * 启动应用。
     */
    public start(): void {
        injectStyles();
        this.tocPanel.mount(
            (item) => this.handleItemClick(item),
            (item) => this.handleItemCopy(item),
            (item) => this.handleItemCopyForModification(item),
            () => this.conversationDeleter.deleteCurrentConversation()
        );

        this.rebuild();

        // 初始化通知器：把当前历史消息作为基线，避免历史回复误通知。
        this.replyNotifier.start();

        this.pageObserver.start(() => {
            this.rebuild();

            // 每次页面 DOM 变化后，检测 GPT 回复是否完成。
            this.replyNotifier.scan();
        });

        window.addEventListener(
            'scroll',
            debounce(() => {
                if (Date.now() < this.ignoreScrollSyncUntil) {
                    return;
                }

                this.syncActiveItem();
            }, 100),
            true
        );
    }

    /**
     * 重建目录。
     */
    private rebuild(): void {
        const messageNodes = getConversationMessageElements();
        const nextItems = extractTocItems(messageNodes);
        const nextSignature = buildItemsSignature(nextItems);

        this.items = nextItems;

        if (nextSignature !== this.lastItemsSignature) {
            this.lastItemsSignature = nextSignature;
            this.tocPanel.update(
                this.items,
                (item) => this.handleItemClick(item),
                (item) => this.handleItemCopy(item),
                (item) => this.handleItemCopyForModification(item)
            );
        }

        if (Date.now() >= this.ignoreScrollSyncUntil) {
            this.syncActiveItem();
        }
    }

    /**
     * 处理目录点击。
     *
     * @param item 目录项
     */
    private handleItemClick(item: TocItem): void {
        this.ignoreScrollSyncUntil = Date.now() + SCROLL_SYNC_LOCK_MS;
        this.tocPanel.setActive(item.id, item.parentId || null);
        this.scrollManager.scrollToItem(item);
    }

    /**
     * 复制目录项对应的 GPT 回复。
     *
     * @param item 目录项
     * @returns 是否复制成功
     */
    private async handleItemCopy(item: TocItem): Promise<boolean> {
        return this.replyCopyManager.copy(item);
    }

    /**
     * 复制目录项对应的 GPT 回复，并追加修改指令。
     *
     * @param item 目录项
     * @returns 是否复制成功
     */
    private async handleItemCopyForModification(
        item: TocItem
    ): Promise<boolean> {
        return this.replyCopyManager.copyForModification(item);
    }

    /**
     * 同步激活项。
     */
    private syncActiveItem(): void {
        const flatItems = flattenTocItems(this.items);
        const activeItem = this.scrollManager.getActiveItem(flatItems);

        if (activeItem) {
            this.tocPanel.setActive(activeItem.id, activeItem.parentId || null);
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