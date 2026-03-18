import { REBUILD_DELAY } from './constants';
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

        this.observer = new MutationObserver(() => {
            debouncedCallback();
        });

        this.observer.observe(document.body, {
            childList: true,
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
}