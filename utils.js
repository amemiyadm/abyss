export const el = (tag, className = '', textContent = '') => {
    const element = document.createElement(tag);
    Object.assign(element, { className, textContent });
    return element;
}

export const kataToHira = (str) => {
    return str.replace(/[\u30A1-\u30F6]/g, (match) => {
        return String.fromCharCode(match.charCodeAt(0) - 0x60);
    });
}

export const setFloatingPosition = (anchor, target) => {
    const rect = anchor.getBoundingClientRect();

    target.style.top = (rect.bottom + window.scrollY) + 'px';
    target.style.left = (rect.left + window.scrollX) + 'px';
    target.style.width = rect.width + 'px';
}
