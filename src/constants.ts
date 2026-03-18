/**
 * 插件常量定义。
 */
export const APP_ID = 'dm-chatgpt-toc';

export const PANEL_ID = `${APP_ID}-panel`;
export const LIST_ID = `${APP_ID}-list`;
export const SEARCH_ID = `${APP_ID}-search`;
export const TOGGLE_ID = `${APP_ID}-toggle`;
export const COLLAPSED_ID = `${APP_ID}-collapsed`;
export const HEADER_ID = `${APP_ID}-header`;

export const ACTIVE_CLASS = `${APP_ID}-active`;
export const PARENT_ACTIVE_CLASS = `${APP_ID}-parent-active`;
export const ITEM_CLASS = `${APP_ID}-item`;

export const MESSAGE_ATTR = 'data-chatgpt-toc-id';

export const TITLE_MAX_LENGTH = 32;
export const ASSISTANT_TITLE_MAX_LENGTH = 40;

/**
 * MutationObserver 的刷新延迟。
 */
export const REBUILD_DELAY = 300;

/**
 * 点击目录后的滚动同步锁时间。
 * 避免 smooth scroll 过程中 active 来回闪动。
 */
export const SCROLL_SYNC_LOCK_MS = 800;