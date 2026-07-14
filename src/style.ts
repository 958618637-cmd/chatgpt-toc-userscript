import { APP_ID } from './constants';

/**
 * 注入样式。
 */
export function injectStyles(): void {
    const styleId = `${APP_ID}-style`;

    if (document.getElementById(styleId)) {
        return;
    }

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
#${APP_ID}-panel {
    position: fixed;
    top: 80px;
    right: 16px;
    width: 300px;
    max-height: calc(100vh - 120px);
    z-index: 999999;
    background: rgba(255, 255, 255, 0.96);
    border: 1px solid #dcdfe6;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: Arial, sans-serif;
}

html.dark #${APP_ID}-panel,
body.dark #${APP_ID}-panel {
    background: rgba(32, 33, 35, 0.96);
    color: #f5f5f5;
    border-color: #4b5563;
}

#${APP_ID}-header {
    padding: 12px;
    border-bottom: 1px solid #e5e7eb;
    font-weight: bold;
    display: flex;
    align-items: center;
    justify-content: space-between;
}

html.dark #${APP_ID}-header,
body.dark #${APP_ID}-header {
    border-bottom-color: #4b5563;
}

.${APP_ID}-header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
}

.${APP_ID}-level-label {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: normal;
    color: #606266;
}

html.dark .${APP_ID}-level-label,
body.dark .${APP_ID}-level-label {
    color: #d1d5db;
}

#${APP_ID}-level-select {
    height: 24px;
    padding: 0 4px;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    background: #fff;
    font-size: 12px;
    outline: none;
}

html.dark #${APP_ID}-level-select,
body.dark #${APP_ID}-level-select {
    background: #2f3033;
    color: #f5f5f5;
    border-color: #4b5563;
}

#${APP_ID}-search {
    margin: 8px 12px;
    padding: 8px 10px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    outline: none;
    font-size: 13px;
}

#${APP_ID}-list {
    overflow: auto;
    padding: 8px 8px 12px 8px;
    flex: 1;
}

#${APP_ID}-footer {
    flex: 0 0 auto;
    display: grid;
    gap: 8px;
    padding: 10px 12px 12px 12px;
    border-top: 1px solid #e5e7eb;
    background: rgba(255, 255, 255, 0.92);
}

html.dark #${APP_ID}-footer,
body.dark #${APP_ID}-footer {
    background: rgba(32, 33, 35, 0.92);
    border-top-color: #4b5563;
}

#${APP_ID}-delete-current {
    width: 100%;
    min-height: 36px;
    padding: 7px 12px;
    border: 1px solid #ef4444;
    border-radius: 8px;
    background: #ffffff;
    color: #dc2626;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition:
        background-color 0.18s ease,
        color 0.18s ease,
        border-color 0.18s ease,
        opacity 0.18s ease;
}

#${APP_ID}-delete-current:hover:not(:disabled) {
    color: #ffffff;
    background: #ef4444;
    border-color: #ef4444;
}

#${APP_ID}-delete-current:active:not(:disabled) {
    background: #dc2626;
    border-color: #dc2626;
}

#${APP_ID}-delete-current:disabled {
    cursor: wait;
    opacity: 0.65;
}

html.dark #${APP_ID}-delete-current,
body.dark #${APP_ID}-delete-current {
    background: transparent;
    color: #f87171;
    border-color: #ef4444;
}

html.dark #${APP_ID}-delete-current:hover:not(:disabled),
body.dark #${APP_ID}-delete-current:hover:not(:disabled) {
    color: #ffffff;
    background: #dc2626;
}

.${APP_ID}-item {
    padding: 8px 10px;
    margin: 4px 0;
    border-radius: 8px;
    cursor: pointer;
    line-height: 1.5;
    font-size: 13px;
    word-break: break-word;
    transition: background 0.2s ease;

    display: flex;
    align-items: flex-start;
    gap: 6px;
}

.${APP_ID}-item:hover {
    background: rgba(59, 130, 246, 0.08);
}

.${APP_ID}-item.${APP_ID}-active {
    background: rgba(59, 130, 246, 0.16);
    font-weight: bold;
}

.${APP_ID}-item.${APP_ID}-parent-active {
    background: rgba(59, 130, 246, 0.10);
    font-weight: 600;
}

.${APP_ID}-item-text {
    flex: 1;
    min-width: 0;
}

.${APP_ID}-copy-button {
    flex: none;
    width: 24px;
    height: 24px;
    margin-top: -2px;
    padding: 0;
    border: none;
    border-radius: 5px;
    background: transparent;
    color: #606266;
    cursor: pointer;
    font-size: 15px;
    line-height: 24px;
    text-align: center;
    opacity: 0.35;
    transition:
        opacity 0.2s ease,
        background 0.2s ease,
        color 0.2s ease;
}

.${APP_ID}-item:hover .${APP_ID}-copy-button,
.${APP_ID}-copy-button:hover,
.${APP_ID}-copy-button:focus {
    opacity: 1;
}

.${APP_ID}-copy-button:hover {
    background: rgba(59, 130, 246, 0.12);
    color: #2563eb;
}

.${APP_ID}-copy-button:disabled {
    cursor: default;
}

.${APP_ID}-copy-button.${APP_ID}-copy-success {
    opacity: 1;
    color: #16a34a;
    background: rgba(22, 163, 74, 0.12);
}

.${APP_ID}-copy-button.${APP_ID}-copy-failed {
    opacity: 1;
    color: #dc2626;
    background: rgba(220, 38, 38, 0.12);
}

html.dark .${APP_ID}-copy-button,
body.dark .${APP_ID}-copy-button {
    color: #d1d5db;
}

html.dark .${APP_ID}-copy-button:hover,
body.dark .${APP_ID}-copy-button:hover {
    color: #93c5fd;
    background: rgba(96, 165, 250, 0.16);
}

.${APP_ID}-copy-actions {
    flex: none;
    display: flex;
    align-items: center;
    gap: 3px;
    margin-top: -2px;
}

.${APP_ID}-copy-actions .${APP_ID}-copy-button {
    margin-top: 0;
}

/*
 * "复制并修改"是常用功能，默认显示得更明显。
 */
.${APP_ID}-copy-modify-button {
    opacity: 0.8;
    color: #7c3aed;
    background: rgba(124, 58, 237, 0.08);
    font-size: 12px;
    font-weight: 700;
}

.${APP_ID}-copy-modify-button:hover {
    opacity: 1;
    color: #6d28d9;
    background: rgba(124, 58, 237, 0.16);
}

html.dark .${APP_ID}-copy-modify-button,
body.dark .${APP_ID}-copy-modify-button {
    color: #c4b5fd;
    background: rgba(167, 139, 250, 0.12);
}

html.dark .${APP_ID}-copy-modify-button:hover,
body.dark .${APP_ID}-copy-modify-button:hover {
    color: #ddd6fe;
    background: rgba(167, 139, 250, 0.22);
}


#${APP_ID}-delete-batch {
    width: 100%;
    min-height: 36px;
    padding: 7px 12px;
    border: 1px solid #d97706;
    border-radius: 8px;
    background: #ffffff;
    color: #b45309;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition:
        background-color 0.18s ease,
        color 0.18s ease,
        border-color 0.18s ease,
        opacity 0.18s ease;
}

#${APP_ID}-delete-batch:hover:not(:disabled) {
    color: #ffffff;
    background: #d97706;
    border-color: #d97706;
}

#${APP_ID}-delete-batch:disabled {
    cursor: wait;
    opacity: 0.65;
}

html.dark #${APP_ID}-delete-batch,
body.dark #${APP_ID}-delete-batch {
    background: transparent;
    color: #fbbf24;
    border-color: #d97706;
}

html.dark #${APP_ID}-delete-batch:hover:not(:disabled),
body.dark #${APP_ID}-delete-batch:hover:not(:disabled) {
    color: #111827;
    background: #fbbf24;
    border-color: #fbbf24;
}

/* 批量删除窗口 */
.${APP_ID}-batch-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000001;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(15, 23, 42, 0.16);
}

.${APP_ID}-batch-dialog {
    width: min(680px, calc(100vw - 48px));
    max-height: min(760px, calc(100vh - 48px));
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #d1d5db;
    border-radius: 14px;
    background: #ffffff;
    color: #111827;
    box-shadow: 0 24px 64px rgba(0, 0, 0, 0.24);
    font-family: Arial, sans-serif;
}

.${APP_ID}-batch-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #e5e7eb;
}

.${APP_ID}-batch-title {
    font-size: 17px;
    font-weight: 700;
    line-height: 1.4;
}

.${APP_ID}-batch-subtitle {
    margin-top: 4px;
    color: #6b7280;
    font-size: 12px;
}

.${APP_ID}-batch-close {
    width: 32px;
    height: 32px;
    padding: 0;
    border: none;
    border-radius: 8px;
    background: transparent;
    color: #6b7280;
    cursor: pointer;
    font-size: 24px;
    line-height: 30px;
}

.${APP_ID}-batch-close:hover:not(:disabled) {
    background: #f3f4f6;
    color: #111827;
}

.${APP_ID}-batch-toolbar {
    display: flex;
    gap: 10px;
    padding: 14px 20px 10px;
}

.${APP_ID}-batch-search {
    flex: 1;
    min-width: 0;
    height: 38px;
    padding: 0 12px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    background: #ffffff;
    color: #111827;
    outline: none;
    font-size: 13px;
}

.${APP_ID}-batch-search:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.${APP_ID}-batch-select-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 20px 10px;
    color: #4b5563;
    font-size: 13px;
}

.${APP_ID}-batch-select-all {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
}

.${APP_ID}-batch-selected-count {
    color: #b45309;
    font-weight: 600;
}

.${APP_ID}-batch-list {
    min-height: 220px;
    max-height: 440px;
    overflow: auto;
    margin: 0 20px;
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #f9fafb;
}

.${APP_ID}-batch-row {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 11px 12px;
    border-bottom: 1px solid #e5e7eb;
    cursor: pointer;
    transition: background-color 0.16s ease;
}

.${APP_ID}-batch-row:last-child {
    border-bottom: none;
}

.${APP_ID}-batch-row:hover {
    background: #ffffff;
}

.${APP_ID}-batch-row > input {
    flex: none;
    margin-top: 3px;
}

.${APP_ID}-batch-row-content {
    min-width: 0;
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 3px;
}

.${APP_ID}-batch-row-title {
    overflow: hidden;
    color: #111827;
    font-size: 13px;
    font-weight: 600;
    line-height: 1.45;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.${APP_ID}-batch-row-path {
    overflow: hidden;
    color: #9ca3af;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.${APP_ID}-batch-empty {
    padding: 48px 16px;
    color: #9ca3af;
    text-align: center;
    font-size: 13px;
}

.${APP_ID}-batch-status {
    min-height: 20px;
    padding: 10px 20px 0;
    color: #6b7280;
    font-size: 12px;
    line-height: 1.5;
}

.${APP_ID}-batch-status-error {
    color: #dc2626;
}

.${APP_ID}-batch-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding: 16px 20px 20px;
}

.${APP_ID}-batch-secondary-button,
.${APP_ID}-batch-danger-button {
    min-width: 92px;
    height: 38px;
    padding: 0 14px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
}

.${APP_ID}-batch-secondary-button {
    border: 1px solid #d1d5db;
    background: #ffffff;
    color: #374151;
}

.${APP_ID}-batch-secondary-button:hover:not(:disabled) {
    background: #f3f4f6;
}

.${APP_ID}-batch-danger-button {
    border: 1px solid #dc2626;
    background: #dc2626;
    color: #ffffff;
}

.${APP_ID}-batch-danger-button:hover:not(:disabled) {
    background: #b91c1c;
    border-color: #b91c1c;
}

.${APP_ID}-batch-secondary-button:disabled,
.${APP_ID}-batch-danger-button:disabled,
.${APP_ID}-batch-close:disabled {
    cursor: wait;
    opacity: 0.58;
}

html.dark .${APP_ID}-batch-dialog,
body.dark .${APP_ID}-batch-dialog {
    border-color: #4b5563;
    background: #202123;
    color: #f9fafb;
}

html.dark .${APP_ID}-batch-header,
body.dark .${APP_ID}-batch-header {
    border-bottom-color: #4b5563;
}

html.dark .${APP_ID}-batch-subtitle,
body.dark .${APP_ID}-batch-subtitle,
html.dark .${APP_ID}-batch-select-bar,
body.dark .${APP_ID}-batch-select-bar,
html.dark .${APP_ID}-batch-status,
body.dark .${APP_ID}-batch-status {
    color: #d1d5db;
}

html.dark .${APP_ID}-batch-search,
body.dark .${APP_ID}-batch-search,
html.dark .${APP_ID}-batch-secondary-button,
body.dark .${APP_ID}-batch-secondary-button {
    border-color: #4b5563;
    background: #2f3033;
    color: #f9fafb;
}

html.dark .${APP_ID}-batch-list,
body.dark .${APP_ID}-batch-list {
    border-color: #4b5563;
    background: #292a2d;
}

html.dark .${APP_ID}-batch-row,
body.dark .${APP_ID}-batch-row {
    border-bottom-color: #3f4146;
}

html.dark .${APP_ID}-batch-row:hover,
body.dark .${APP_ID}-batch-row:hover {
    background: #34363a;
}

html.dark .${APP_ID}-batch-row-title,
body.dark .${APP_ID}-batch-row-title {
    color: #f9fafb;
}

html.dark .${APP_ID}-batch-close,
body.dark .${APP_ID}-batch-close {
    color: #d1d5db;
}

html.dark .${APP_ID}-batch-close:hover:not(:disabled),
body.dark .${APP_ID}-batch-close:hover:not(:disabled) {
    background: #34363a;
    color: #ffffff;
}

#${APP_ID}-toggle {
    cursor: pointer;
    border: none;
    background: transparent;
    font-size: 14px;
}

#${APP_ID}-collapsed {
    position: fixed;
    top: 80px;
    right: 16px;
    z-index: 999999;
    padding: 10px 12px;
    border-radius: 10px;
    border: 1px solid #dcdfe6;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    cursor: pointer;
    user-select: none;
}

html.dark #${APP_ID}-collapsed,
body.dark #${APP_ID}-collapsed {
    background: rgba(32, 33, 35, 0.96);
    color: #f5f5f5;
    border-color: #4b5563;
}
`;
    document.head.appendChild(style);
}
