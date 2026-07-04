import { APP_ID, COLLAPSED_ID, PANEL_ID, REBUILD_DELAY } from './constants';
import { debounce } from './utils';

/**
 * 页面变化监听器。
 */
export class PageObserver {
    private observer: MutationObserver | null = null;

    /**
     * 启动监听。
     *
     * @param callback 页面变化后执行
     */
    public start(callback: () => void): void {
        this.stop();

        const debouncedCallback = debounce(callback, REBUILD_DELAY);

        this.observer = new MutationObserver((mutations) => {
            const hasExternalChange = mutations.some((mutation) => {
                return this.isExternalMutation(mutation);
            });

            if (hasExternalChange) {
                debouncedCallback();
            }
        });

        this.observer.observe(document.body, {
            childList: true,
            characterData: true,
            subtree: true
        });
    }

    /**
     * 停止监听。
     */
    public stop(): void {
        if (this.observer) {
            this.observer.disconnect();
            this.observer = null;
        }
    }

    /**
     * 判断是否是外部 DOM 变化。
     *
     * 目录面板自己的 DOM 改动不应触发 rebuild。
     *
     * @param mutation 变更记录
     * @returns 是否需要触发回调
     */
    private isExternalMutation(mutation: MutationRecord): boolean {
        if (this.isOwnNode(mutation.target)) {
            return false;
        }

        for (const node of Array.from(mutation.addedNodes)) {
            if (!this.isOwnNode(node)) {
                return true;
            }
        }

        for (const node of Array.from(mutation.removedNodes)) {
            if (!this.isOwnNode(node)) {
                return true;
            }
        }

        return false;
    }

    /**
     * 判断节点是否属于插件自身。
     *
     * @param node DOM 节点
     * @returns 是否是插件节点
     */
    private isOwnNode(node: Node | null): boolean {
        if (!(node instanceof HTMLElement)) {
            return false;
        }

        if (node.id === PANEL_ID || node.id === COLLAPSED_ID) {
            return true;
        }

        return !!node.closest(`#${PANEL_ID}, #${COLLAPSED_ID}, [id^="${APP_ID}-"]`);
    }
}