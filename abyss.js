import { Ceres } from 'https://cdn.jsdelivr.net/gh/amemiyadm/ceres@main/ceres.js';

export class Abyss {
    static el(tag, className = '', text = '') {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        return element;
    }

    static kataToHira(str) {
        return str.replace(/[\u30A1-\u30F6]/g, (match) => {
            return String.fromCharCode(match.charCodeAt(0) - 0x60);
        });
    }

    static resizeMonitor() {
        window.addEventListener('resize', () => {
            if (!Abyss.activeInstance) return;

            requestAnimationFrame(() => Abyss.activeInstance.updatePosition());
        });
    }

    static initialize() {
        this.resizeMonitor();
    }

    static dataCache = new WeakMap();
    static activeInstance;

    isOpen = false;
    previousFirstItem = '';
    previousCount = 0;
    currentFocus = 0;
    container = Abyss.el('ul', 'abyss-container');

    constructor(inputEl, data, limit = 4) {
        this.inputEl = inputEl;
        this.limit = limit;
        this.root = Abyss.dataCache.get(data);

        if (!this.root) {
            this.root = new Ceres();
            Ceres.build(data);
            Abyss.dataCache.set(data, this.root);
        }

        this.inputEl.addEventListener('input', this);
        this.container.addEventListener('click', this);
        this.container.addEventListener('mouseover', this);
        document.body.appendChild(this.container);
    }

    handleEvent(e) {
        const isInputEl = (e.target === this.inputEl);
        const isContainer = this.container.contains(e.target);
        const isOutside = (e.target === document && !isInputEl && !isContainer);

        if (!isInputEl && !isContainer && !isOutside) return;

        if (isInputEl && (e.type === 'input')) return this.handleInputElInput(e);
        if (isInputEl && (e.type === 'keydown')) return this.handleInputElKeyDown(e);
        if (isContainer && (e.type === 'click')) return this.handleSuggestionClick(e);
        if (isContainer && (e.type === 'mouseover')) return this.handleSuggestionMouseover(e);
        if (isOutside && (e.type === 'click')) return this.handleClickOutside();
    }

    open() {
        this.inputEl.addEventListener('keydown', this);
        this.container.dataset.abyssIsOpen = 'true';
        this.isOpen = true;
        Abyss.activeInstance = this;
        document.addEventListener('click', this);
        this.updatePosition();
    }

    close() {
        this.inputEl.removeEventListener('keydown', this);
        this.container.removeAttribute('data-abyss-is-open');
        this.isOpen = false;
        if (Abyss.activeInstance === this) {
            Abyss.activeInstance = null;
        }
        document.removeEventListener('click', this);
    }

    destroy() {
        this.close();
        this.inputEl.removeEventListener('input', this);
        this.container.removeEventListener('click', this);
        this.container.removeEventListener('mouseover', this);
        this.container.remove();
    }

    updatePosition() {
        const inputPosition = this.inputEl.getBoundingClientRect();
        this.container.style.top = `${inputPosition.bottom + window.scrollY}px`;
        this.container.style.left = `${inputPosition.left + window.scrollX}px`;
        this.container.style.width = `${inputPosition.width}px`;
    }

    updateActiveItem() {
        const active = this.container.querySelector('[data-abyss-is-active="true"]');
        const nextActive = this.container.children[this.currentFocus];

        if (active) {
            active.removeAttribute('data-abyss-is-active');
        }

        if (nextActive) {
            nextActive.dataset.abyssIsActive = 'true';
        }
    }

    handleInputElInput() {
        const query = Abyss.kataToHira(this.inputEl.value);

        if (query === '') {
            this.previousCount = 0;
            this.previousFirstItem = '';
            this.close();
            return;
        }

        const fragment = document.createDocumentFragment();
        const items = Ceres.search(query, this.limit);
        const firstItem = items[0] ?? '';

        if ((items.length === this.previousCount) && (firstItem === this.previousFirstItem)) return;

        for (const item of items) {
            const label = item.label;
            const suggestion = Abyss.el('li', 'abyss-suggestion', label);
            suggestion.dataset.value = label;
            fragment.appendChild(suggestion);
        }

        this.previousCount = items.length;
        this.previousFirstItem = firstItem;
        this.currentFocus = 0;

        this.container.replaceChildren();

        if (items.length > 0) {
            if (!this.isOpen) {
                this.open();
            }

            this.container.appendChild(fragment);
            this.container.children[this.currentFocus].dataset.abyssIsActive = 'true';
        } else {
            this.close();
        }
    }

    handleSuggestionClick(e) {
        const target = e.target.closest('.abyss-suggestion');

        if (!target) return;

        this.inputEl.value = target.dataset.value;
        this.close();
    }

    handleSuggestionMouseover(e) {
        const target = e.target.closest('.abyss-suggestion');

        if (!target) return;

        const hoverIndex = [...this.container.children].indexOf(target);
        this.currentFocus = hoverIndex;
        this.updateActiveItem();
    }

    handleInputElKeyDown(e) {
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();

            const activeSuggestion = this.container.querySelector('[data-abyss-is-active="true"]');

            if (activeSuggestion) {
                this.inputEl.value = activeSuggestion.textContent;
                this.close();
            }
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            this.close();
            return;
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();

            const lastIndex = this.previousCount - 1;
            this.currentFocus = (e.key === 'ArrowUp')
                ? (this.currentFocus <= 0) ? lastIndex : (this.currentFocus - 1)
                : ((this.currentFocus === -1) || (this.currentFocus >= lastIndex)) ? 0 : (this.currentFocus + 1);

            this.updateActiveItem();
        }
    }

    handleClickOutside() {
        this.close();
    }
}
