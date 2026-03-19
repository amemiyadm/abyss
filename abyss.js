import { Ceres } from 'https://cdn.jsdelivr.net/gh/amemiyadm/ceres@v1.0.0/ceres.js';
import { el } from 'https://cdn.jsdelivr.net/gh/amemiyadm/novella@v1.0.0/novella.js';
import { setFloatingPosition, resizeMonitor, clickOutside } from './utils.js';

const cache = new WeakMap();
const active = { obj: null };

resizeMonitor(active);
clickOutside(active);

export class Abyss {
    constructor(inputEl, data, limit = Infinity, imgs = {}) {
        this.inputEl = inputEl;
        this.limit = limit;
        this.imgs = imgs;
        this.root = cache.get(data) || (cache.set(data, this.root = new Ceres(data)), this.root);
        this.container = el('ul', 'abyss-container');
        this.currentFocus = 0;
        this.mount(true);
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
            return (type === 'input') ? this.handleInputElInput(e) :
                (type === 'keydown') ? this.handleInputElKeyDown(e) :
                    undefined;
        }

        if (suggestion = target.closest('.abyss-suggestion')) {
            return (type === 'click') ? this.handleSuggestionClick(suggestion) :
                (type === 'mouseover') ? this.handleSuggestionMouseover(suggestion) :
                    undefined;
        }
    }

    handleInputElInput() {
        const query = this.inputEl.value;
        const items = query ? this.root.search(query, this.limit) : [];

        if (items.length === 0) {
            this.toggle(false);

            return;
        }

        this.toggle(true);
        this.currentFocus = 0;

        const suggestions = this.container.children;

        if (suggestions.length === items.length && items.every((item, i) => suggestions[i].dataset.value === item.label)) return;

        this.container.replaceChildren(...items.map(({ label }, i) => {
            const suggestion = el('li', 'abyss-suggestion', label, { value: label, index: i });

            if (this.imgs[label]) {
                const img = this.imgs[label];
                const icon = new Image(...img.size);

                icon.src = img.url;
                icon.alt = label;
                Object.assign(icon.style, img.style);
                suggestion.prepend(icon);
            }

            return suggestion;
        }));
        this.updateActiveItem();
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
            e.preventDefault();

            const activeSuggestion = this.container.children[this.currentFocus];

            if (activeSuggestion) {
                this.handleSuggestionClick(activeSuggestion);
            }

            return;
        }

        if (key === 'Escape') {
            e.preventDefault();
            this.toggle(false);

            return;
        }

        if (key === 'ArrowUp' || key === 'ArrowDown') {
            e.preventDefault();

            const len = this.container.children.length;

            this.currentFocus = (this.currentFocus + (key === 'ArrowDown' ? 1 : len - 1)) % len;
            this.updateActiveItem();
        }
    }

    toggle(toOpen) {
        if (this.container.dataset.abyssIsOpen === String(toOpen)) return;

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
