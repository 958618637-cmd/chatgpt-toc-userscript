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
export const LEVEL_SELECT_ID = `${APP_ID}-level-select`;

/**
 * 目录底部操作区域。
 */
export const FOOTER_ID = `${APP_ID}-footer`;

/**
 * 删除当前会话按钮。
 */
export const DELETE_CURRENT_ID = `${APP_ID}-delete-current`;

/**
 * 默认显示目录层级。
 *
 * 2：只显示 用户问题 + GPT回复
 * 3：显示 用户问题 + GPT回复 + 标题
 */
export const DEFAULT_TOC_VISIBLE_LEVEL = 2;

export const ACTIVE_CLASS = `${APP_ID}-active`;
export const PARENT_ACTIVE_CLASS = `${APP_ID}-parent-active`;
export const ITEM_CLASS = `${APP_ID}-item`;

export const MESSAGE_ATTR = 'data-chatgpt-toc-id';

export const TITLE_MAX_LENGTH = 32;
export const ASSISTANT_TITLE_MAX_LENGTH = 40;
export const HEADING_TITLE_MAX_LENGTH = 60;

/**
 * GPT 回复正文中用于提取目录的标题选择器。
 */
export const ASSISTANT_HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

/**
 * MutationObserver 的刷新延迟。
 */
export const REBUILD_DELAY = 300;

/**
 * 点击目录后的滚动同步锁时间。
 * 避免 smooth scroll 过程中 active 来回闪动。
 */
export const SCROLL_SYNC_LOCK_MS = 800;

/**
 * GPT 回复完成检测：内容稳定多久后认为完成。
 */
export const REPLY_NOTIFY_QUIET_MS = 1500;

/**
 * GPT 回复完成检测轮询间隔。
 */
export const REPLY_NOTIFY_CHECK_DELAY = 800;

/**
 * GPT 回复完成通知标题。
 */
export const REPLY_NOTIFY_TITLE = 'GPT 回复完成';

/**
 * "复制并修改"功能追加的默认指令。
 *
 * 用户复制 GPT 回复时，自动在末尾追加此指令，
 * 便于直接粘贴到对话框中要求修改。
 */
export const COPY_MODIFY_SUFFIX = '请按上述内容进行修改。';