import {
    MESSAGE_ATTR,
    REPLY_NOTIFY_CHECK_DELAY,
    REPLY_NOTIFY_QUIET_MS,
    REPLY_NOTIFY_TITLE
} from './constants';
import { getConversationMessageElements } from './chatgpt-dom';
import { createStableId, normalizeText, truncateText } from './utils';

interface GMNotificationOptions {
    title: string;
    text: string;
    timeout?: number;
    onclick?: () => void;
}

declare const GM_notification: undefined | ((
    options: GMNotificationOptions,
    ondone?: () => void
) => void);

interface ReplyCandidate {
    id: string;
    element: HTMLElement;
    text: string;
    lastChangedAt: number;
    timer?: number;
}

/**
 * GPT 回复完成通知器。
 *
 * 判断规则：
 * 1. 只有检测到 GPT 进入生成状态后，才会开始监听。
 * 2. GPT 生成状态结束后，再等内容稳定一段时间。
 * 3. 页面刷新加载历史消息不会触发通知。
 */
export class ReplyNotifier {
    private started = false;

    /**
     * 已经存在或已经通知过的 assistant 回复。
     */
    private seenAssistantIds = new Set<string>();

    /**
     * 当前正在监听的 GPT 回复。
     */
    private currentReply: ReplyCandidate | null = null;

    /**
     * 上一次扫描时，GPT 是否正在生成。
     */
    private wasGenerating = false;

    /**
     * 兜底轮询。
     *
     * 有些 ChatGPT 文本流式变化不一定每次都会稳定触发 childList。
     */
    private scanTimer?: number;

    /**
     * 启动通知器。
     */
    public start(): void {
        if (this.started) {
            return;
        }

        this.started = true;

        // 启动时把页面已有 assistant 回复全部标记为已见，避免刷新历史会话误通知。
        this.markExistingRepliesAsSeen();

        // 兜底轮询，避免遗漏生成状态变化。
        this.scanTimer = window.setInterval(() => {
            this.scan();
        }, REPLY_NOTIFY_CHECK_DELAY);
    }

    /**
     * 扫描 GPT 生成状态。
     *
     * 每次 DOM 变化后调用即可。
     */
    public scan(): void {
        if (!this.started) {
            return;
        }

        const isGenerating = this.isChatGptGenerating();
        const latestReply = this.getLatestAssistantReply();

        /**
         * 检测到 GPT 正在生成。
         *
         * 只有进入过这个分支，后续才允许触发完成通知。
         * 这样刷新历史页面时不会误通知。
         */
        if (isGenerating) {
            this.wasGenerating = true;

            if (latestReply) {
                this.updateCurrentReply(latestReply.id, latestReply.element);
            }

            return;
        }

        /**
         * 当前不在生成，并且之前也没有生成过。
         *
         * 说明只是页面加载、历史消息变化、目录重建等，不通知。
         */
        if (!this.wasGenerating) {
            return;
        }

        /**
         * 从"生成中"变成"未生成中"。
         *
         * 这里才认为有可能完成了。
         */
        this.wasGenerating = false;

        if (!this.currentReply && latestReply) {
            this.updateCurrentReply(latestReply.id, latestReply.element);
        }

        this.scheduleCompletionCheck();
    }

    /**
     * 标记页面已有 assistant 回复。
     */
    private markExistingRepliesAsSeen(): void {
        const messages = getConversationMessageElements();

        messages
            .filter((message) => message.role === 'assistant')
            .forEach((message, index) => {
                const id = this.getAssistantId(message.element, index);
                this.seenAssistantIds.add(id);
            });
    }

    /**
     * 获取最新的 assistant 回复。
     */
    private getLatestAssistantReply(): { id: string; element: HTMLElement } | null {
        const assistantMessages = getConversationMessageElements()
            .filter((message) => message.role === 'assistant');

        if (!assistantMessages.length) {
            return null;
        }

        const latest = assistantMessages[assistantMessages.length - 1];
        const id = this.getAssistantId(latest.element, assistantMessages.length);

        return {
            id,
            element: latest.element
        };
    }

    /**
     * 更新当前监听中的回复。
     *
     * @param id 回复 ID
     * @param element 回复元素
     */
    private updateCurrentReply(id: string, element: HTMLElement): void {
        if (this.seenAssistantIds.has(id)) {
            return;
        }

        const text = normalizeText(element.textContent || '');

        if (!this.currentReply || this.currentReply.id !== id) {
            this.currentReply = {
                id,
                element,
                text,
                lastChangedAt: Date.now()
            };
            return;
        }

        this.currentReply.element = element;

        if (this.currentReply.text !== text) {
            this.currentReply.text = text;
            this.currentReply.lastChangedAt = Date.now();
        }
    }

    /**
     * 安排完成检测。
     */
    private scheduleCompletionCheck(): void {
        const reply = this.currentReply;

        if (!reply || this.seenAssistantIds.has(reply.id)) {
            return;
        }

        window.clearTimeout(reply.timer);

        reply.timer = window.setTimeout(() => {
            this.checkCompleted();
        }, REPLY_NOTIFY_CHECK_DELAY);
    }

    /**
     * 检测是否真正完成。
     */
    private checkCompleted(): void {
        const reply = this.currentReply;

        if (!reply || this.seenAssistantIds.has(reply.id)) {
            return;
        }

        if (this.isChatGptGenerating()) {
            this.wasGenerating = true;
            this.scheduleCompletionCheck();
            return;
        }

        const currentText = normalizeText(reply.element.textContent || '');

        if (currentText !== reply.text) {
            reply.text = currentText;
            reply.lastChangedAt = Date.now();
            this.scheduleCompletionCheck();
            return;
        }

        if (Date.now() - reply.lastChangedAt < REPLY_NOTIFY_QUIET_MS) {
            this.scheduleCompletionCheck();
            return;
        }

        if (!currentText) {
            this.scheduleCompletionCheck();
            return;
        }

        this.seenAssistantIds.add(reply.id);
        this.currentReply = null;

        this.showSystemNotification(reply);
    }

    /**
     * 获取 assistant 回复 ID。
     *
     * @param element 回复元素
     * @param index 序号
     */
    private getAssistantId(element: HTMLElement, index: number): string {
        let id = element.getAttribute(MESSAGE_ATTR);

        if (!id) {
            id = createStableId(
                'reply-notify-assistant',
                index + 1,
                element.textContent || ''
            );
            element.setAttribute(MESSAGE_ATTR, id);
        }

        return id;
    }

    /**
     * 判断 GPT 是否正在生成。
     *
     * 这里尽量用多个选择器兜底，ChatGPT 页面 DOM 经常会变。
     */
    private isChatGptGenerating(): boolean {
        const selectors = [
            '[data-testid="stop-button"]',
            '[data-testid="composer-stop-button"]',
            'button[aria-label*="Stop"]',
            'button[aria-label*="stop"]',
            'button[aria-label*="停止"]',
            'button[aria-label*="停止生成"]',
            'button[aria-label*="停止回答"]',
            '.result-streaming'
        ];

        return !!document.querySelector(selectors.join(','));
    }

    /**
     * 展示系统通知。
     *
     * @param reply 回复信息
     */
    private showSystemNotification(reply: ReplyCandidate): void {
        const text = truncateText(reply.text, 100) || '回复已经生成完成。';

        const focusReply = (): void => {
            window.focus();

            reply.element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        };

        if (typeof GM_notification === 'function') {
            GM_notification({
                title: REPLY_NOTIFY_TITLE,
                text,
                timeout: 6000,
                onclick: focusReply
            });
            return;
        }

        if (!('Notification' in window)) {
            this.flashTitle();
            return;
        }

        if (Notification.permission === 'granted') {
            const notification = new Notification(REPLY_NOTIFY_TITLE, {
                body: text
            });

            notification.onclick = focusReply;

            window.setTimeout(() => {
                notification.close();
            }, 6000);

            return;
        }

        if (Notification.permission === 'default') {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    this.showSystemNotification(reply);
                    return;
                }

                this.flashTitle();
            });

            return;
        }

        this.flashTitle();
    }

    /**
     * 通知不可用时，闪一下标题兜底。
     */
    private flashTitle(): void {
        const oldTitle = document.title;
        document.title = `✅ ${REPLY_NOTIFY_TITLE}`;

        window.setTimeout(() => {
            document.title = oldTitle;
        }, 3000);
    }
}
