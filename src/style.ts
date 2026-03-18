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

.${APP_ID}-item {
    padding: 8px 10px;
    margin: 4px 0;
    border-radius: 8px;
    cursor: pointer;
    line-height: 1.5;
    font-size: 13px;
    word-break: break-word;
    transition: background 0.2s ease;
}

.${APP_ID}-item:hover {
    background: rgba(59, 130, 246, 0.08);
}

.${APP_ID}-item.${APP_ID}-active {
    background: rgba(59, 130, 246, 0.16);
    font-weight: bold;
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
}
`;
    document.head.appendChild(style);
}