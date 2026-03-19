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

export const resizeMonitor = (active) => {
    window.addEventListener('resize', () => {
        const target = active.obj;

        if (!target) return;

        setFloatingPosition(target.inputEl, target.container);
    });
}

export const clickOutside = (active) => {
    document.addEventListener('click', (e) => {
        const activeObj = active.obj;

        if (!activeObj || (e.target === activeObj.inputEl) || activeObj.container.contains(e.target)) return;

        activeObj.toggle(false);
    });
}
