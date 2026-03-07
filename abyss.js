import { Ceres } from 'https://cdn.jsdelivr.net/gh/amemiyadm/ceres@main/ceres.js';
import { el, setFloatingPosition, resizeMonitor, clickOutside } from './utils.js';

const cache = new WeakMap();
const active = { obj: null }

export class Abyss {
    static activeInstance = null;

    constructor(inputEl, data, limit = 4) {
        this.inputEl = inputEl;
        this.limit = limit;
        this.root = cache.get(data) || (cache.set(data, this.root = new Ceres(data)), this.root);
        this.container = el('ul', 'abyss-container');
        this.previousQuery = '';
        this.currentFocus = 0;
        this.mount(true);
    }

    static initialize() {
        resizeMonitor(active);
        clickOutside(active);
    }

    mount(isMount) {
        const action = isMount ? 'addEventListener' : 'removeEventListener';

        this.inputEl[action]('input', this);
        this.inputEl[action]('keydown', this);
        this.container[action]('click', this);
        this.container[action]('mouseover', this);
        isMount ? document.body.appendChild(this.container) : this.container.remove();
    }

    handleEvent(e) {
        const { type, target } = e;
        let suggestion;

        if (target === this.inputEl) {
            return type === 'input' ? this.handleInputElInput(e) :
                type === 'keydown' ? this.handleInputElKeyDown(e) : undefined;
        }

        if (suggestion = target.closest('.abyss-suggestion')) {
            return type === 'click' ? this.handleSuggestionClick(suggestion) :
                type === 'mouseover' ? this.handleSuggestionMouseover(suggestion) : undefined;
        }
    }

    handleInputElInput() {
        const query = this.inputEl.value;

        if (query === this.previousQuery) return;

        this.previousQuery = query;
        this.currentFocus = 0;
        const items = query ? Ceres.search(query, this.limit) : [];

        if (items.length === 0) {
            this.toggle(false);

            return;
        }

        this.container.replaceChildren(...items.map(({ label }, i) => el('li', 'abyss-suggestion', label, { value: label, index: i })));
        this.updateActiveItem();

        if (this.container.dataset.abyssIsOpen !== 'true') {
            this.toggle(true);
        }
    }

    handleSuggestionClick(target) {
        this.inputEl.value = target.dataset.value;
        this.toggle(false);
    }

    handleSuggestionMouseover(target) {
        this.currentFocus = Number(target.dataset.index);
        this.updateActiveItem();
    }

    handleInputElKeyDown(e) {
        if (this.container.dataset.abyssIsOpen !== 'true') return;

        const { key, isComposing } = e;

        if (key === 'Enter' && !isComposing) {
            const activeSuggestion = this.container.children[this.currentFocus];

            e.preventDefault();

            if (activeSuggestion) {
                this.inputEl.value = activeSuggestion.dataset.value;
                this.toggle(false);
            }

            return;
        }

        if (key === 'Escape') {
            e.preventDefault();
            this.toggle(false);

            return;
        }

        if (key === 'ArrowUp' || key === 'ArrowDown') {
            const len = this.container.children.length;

            e.preventDefault();
            this.currentFocus = (this.currentFocus + (key === 'ArrowDown' ? 1 : len - 1)) % len;
            this.updateActiveItem();
        }
    }

    toggle(toOpen) {
        this.container.dataset.abyssIsOpen = String(toOpen);
        active.obj = toOpen ? this : null;
        toOpen ? setFloatingPosition(this.inputEl, this.container) : null;
    }

    destroy() {
        this.toggle(false);
        this.mount(false);
    }

    updateActiveItem() {
        this.container.querySelector('[data-abyss-is-active="true"]')?.removeAttribute('data-abyss-is-active');
        this.container.children[this.currentFocus].dataset.abyssIsActive = 'true';
    }
}

new Abyss(document.getElementById('hoge'), { label: 'あいうえお', keywords: ['あいうえお', 'かきくけこ'] });
