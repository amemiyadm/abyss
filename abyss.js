import { Ceres } from 'https://cdn.jsdelivr.net/gh/amemiyadm/ceres@main/ceres.js';

export class Abyss {
    static el(tag, className = '', text = '') {
        const element = document.createElement(tag);
        element.className = className;
        element.textContent = text;
        return element;
    }

    static kataToHira(str) {
        const katakana = /(?!\u30FC)[\u30A0-\u30FF]/g;
        return str.replace(katakana, (match) => {
            const chr = match.charCodeAt(0) - 0x60;
            return String.fromCharCode(chr);
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
    suggestionsContainer = Abyss.el('ul', 'abyss-suggestions-container');

    constructor(inputEl, data, limit = 4) {
        this.inputEl = inputEl;
        this.limit = limit;
        this.root = Abyss.dataCache.get(data);

        if (!this.root) {
            this.root = new Ceres();
            Ceres.buildTrie(this.root, data)
            Abyss.dataCache.set(data, this.root);
        }

        this.inputEl.addEventListener('input', this);
        this.suggestionsContainer.addEventListener('click', this);
        this.suggestionsContainer.addEventListener('mouseover', this);
        document.body.appendChild(this.suggestionsContainer);
    }

    handleEvent(e) {
        const isInputEl = (e.target === this.inputEl);
        const isSuggestionsContainer = this.suggestionsContainer.contains(e.target);
        const isOutside = (e.target === document && !isInputEl && !isSuggestionsContainer);

        if (!isInputEl && !isSuggestionsContainer && !isOutside) return;

        if (isInputEl && (e.type === 'input')) return this.handleInputElInput(e);
        if (isInputEl && (e.type === 'keydown')) return this.handleInputElKeyDown(e);
        if (isSuggestionsContainer && (e.type === 'click')) return this.handleSuggestionClick(e);
        if (isSuggestionsContainer && (e.type === 'mouseover')) return this.handleSuggestionMouseover(e);
        if (isOutside && (e.type === 'click')) return this.handleClickOutside();
    }

    open() {
        this.inputEl.addEventListener('keydown', this);
        this.suggestionsContainer.dataset.abyssIsOpen = 'true';
        this.isOpen = true;
        Abyss.activeInstance = this;
        document.addEventListener('click', this);
        this.updatePosition();
    }

    close() {
        this.inputEl.removeEventListener('keydown', this);
        this.suggestionsContainer.removeAttribute('data-abyss-is-open');
        this.isOpen = false;
        if (Abyss.activeInstance === this) {
            Abyss.activeInstance = null;
        }
        document.removeEventListener('click', this);
    }

    destroy() {
        this.close();
        this.inputEl.removeEventListener('input', this);
        this.suggestionsContainer.removeEventListener('click', this);
        this.suggestionsContainer.removeEventListener('mouseover', this);
        this.suggestionsContainer.remove();
    }

    updatePosition() {
        const inputPosition = this.inputEl.getBoundingClientRect();
        this.suggestionsContainer.style.top = `${inputPosition.bottom + window.scrollY}px`;
        this.suggestionsContainer.style.left = `${inputPosition.left + window.scrollX}px`;
        this.suggestionsContainer.style.width = `${inputPosition.width}px`;
    }

    updateActiveItem() {
        const active = this.suggestionsContainer.querySelector('[data-abyss-is-active="true"]');
        const nextActive = this.suggestionsContainer.children[this.currentFocus];

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
        const items = Ceres.search(this.root, query, this.limit);
        const firstItem = items[0] ?? '';

        for (const item of items) {
            const label = item.label;
            const suggestionItem = Abyss.el('li', 'abyss-suggestion-item', label);
            suggestionItem.dataset.value = label;

            fragment.appendChild(suggestionItem);
        }

        if ((items.length === querythis.previousCount) && (firstItem === this.previousFirstItem)) return;

        this.previousCount = items.length;
        this.previousFirstItem = firstItem;
        this.currentFocus = 0;

        this.suggestionsContainer.replaceChildren();

        if (items.length > 0) {
            if (!this.isOpen) {
                this.open();
            }

            this.suggestionsContainer.appendChild(fragment);
            this.suggestionsContainer.children[this.currentFocus].dataset.abyssIsActive = 'true';
        } else {
            this.close();
        }
    }

    handleSuggestionClick(e) {
        const target = e.target.closest('.abyss-suggestion-item');

        if (!target) return;

        this.inputEl.value = target.dataset.value;
        this.close();
    }

    handleSuggestionMouseover(e) {
        const target = e.target.closest('.abyss-suggestion-item');

        if (!target) return;

        const hoverIndex = [...this.suggestionsContainer.children].indexOf(target);
        this.currentFocus = hoverIndex;
        this.updateActiveItem();
    }

    handleInputElKeyDown(e) {
        if (e.key === 'Enter' && !e.isComposing) {
            e.preventDefault();

            const activeSuggestion = this.suggestionsContainer.querySelector('[data-abyss-is-active="true"]');

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
