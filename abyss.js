import { Ceres } from 'https://cdn.jsdelivr.net/gh/amemiyadm/ceres@main/ceres.js';
import { el, kataToHira, setFloatingPosition } from './utils.js';

export class Abyss {
    static dataCache = new WeakMap();
    static activeInstance;

    previousFirstItem = '';
    previousCount = 0;
    currentFocus = 0;
    container = el('ul', 'abyss-container');

    constructor(inputEl, data, limit = 4) {
        this.inputEl = inputEl;
        this.limit = limit;
        this.root = Abyss.dataCache.get(data);

        if (!this.root) {
            this.root = new Ceres(data);
            Abyss.dataCache.set(data, this.root);
        }

        this.mount(true);
    }

    static resizeMonitor() {
        window.addEventListener('resize', () => {
            if (!Abyss.activeInstance) return;

            requestAnimationFrame(() => Abyss.activeInstance.setFloatingPosition());
        });
    }

    static initialize() {
        this.resizeMonitor();
    }

    mount(isMount) {
        const action = isMount ? 'addEventListener' : 'removeEventListener';

        this.inputEl[action]('input', this);
        this.container[action]('click', this);
        this.container[action]('mouseover', this);

        if (isMount) {
            document.body.appendChild(this.container);
        } else {
            this.container.remove();
        }
    }

    toggle(toOpen) {
        const action = toOpen ? 'addEventListener' : 'removeEventListener';

        this.inputEl[action]('keydown', this);
        document[action]('click', this);
        this.container.dataset.abyssIsOpen = String(toOpen);
        Abyss.activeInstance = toOpen ? this : null;

        if (toOpen) {
            setFloatingPosition(this.inputEl, this.container);
        }
    }

    destroy() {
        this.toggle(false);
        this.mount(false);
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

    handleEvent(e) {
        const isInputEl = (e.target === this.inputEl);
        const isContainer = this.container.contains(e.target);
        const isOutside = (!isInputEl && !isContainer);

        if (isInputEl && (e.type === 'input')) return this.handleInputElInput(e);
        if (isInputEl && (e.type === 'keydown')) return this.handleInputElKeyDown(e);
        if (isContainer && (e.type === 'click')) return this.handleSuggestionClick(e);
        if (isContainer && (e.type === 'mouseover')) return this.handleSuggestionMouseover(e);
        if (isOutside && (e.type === 'click')) return this.handleClickOutside();
    }

    handleInputElInput() {
        const query = this.inputEl.value;

        if (query === '') {
            this.previousCount = 0;
            this.previousFirstItem = '';
            this.toggle(false);
            return;
        }
        console.log(query)

        const fragment = document.createDocumentFragment();
        const items = Ceres.search(query, this.limit);
        const firstItem = items[0] ?? '';

        if ((items.length === this.previousCount) && (firstItem === this.previousFirstItem)) return;

        for (const item of items) {
            const label = item.label;
            const suggestion = el('li', 'abyss-suggestion', label);
            suggestion.dataset.value = label;
            fragment.appendChild(suggestion);
        }

        this.previousCount = items.length;
        this.previousFirstItem = firstItem;
        this.currentFocus = 0;

        this.container.replaceChildren();

        if (items.length > 0) {
            if (!this.dataset.abyssIsOpen === 'true') {
                this.toggle(true);
            }

            this.container.appendChild(fragment);
            this.container.children[this.currentFocus].dataset.abyssIsActive = 'true';
        } else {
            this.toggle(false);
        }
    }

    handleSuggestionClick(e) {
        const target = e.target.closest('.abyss-suggestion');

        if (!target) return;

        this.inputEl.value = target.dataset.value;
        this.toggle(false);
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
                this.toggle(false);
            }

            return;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            this.toggle(false);

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
        this.toggle(false);
    }
}

new Abyss(document.getElementById('hoge'), [{ label: 'あいうえお', keywords: ['あいうえお', 'アイウエオ'] }]);
Abyss.initialize();
