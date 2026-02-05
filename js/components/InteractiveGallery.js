import { ToggleSwitcher } from './ToggleSwitcher.js';
import { InfiniteCarousel } from './InfiniteCarousel.js';
import { ThreeItemSwitcher } from './ThreeItemSwitcher.js';
import { AutoplayManager } from './AutoplayManager.js';

import { eventBus } from './EventBus.js';

export class InteractiveGallery {
    constructor() {
        this.SWAP_COOLDOWN = 300;

        this.groups = new Map();
        // groupName -> { switchers: [], carousels: [], threeItemSwitchers: [], lastActionTime }

        this.init();
    }

    init() {
        this.setupComponents();
        this.bindEvents();
        this.setupAutoplay();
        this.bindButtons();
    }

    setupComponents() {
        this.initToggleSwitchers();
        this.initCarousels();
        this.initThreeItemSwitchers();
    }

    setupAutoplay() {
        this.autoplay = new AutoplayManager({
            delay: 10000,
            onTick: (groupName) => {
                eventBus.emit(`${groupName}:next`);
            }
        })
    }

    _initGroupedComponents(selector, ComponentClass, propertyName) {
        document.querySelectorAll(selector).forEach(el => {
            const group = el.dataset.group;
            const component = new ComponentClass(el);

            this.verifyingExistenceGroup(group);
            this.groups.get(group)[propertyName].push(component);
        });
    }

    initToggleSwitchers() {
        this._initGroupedComponents(
            '.js-toggle-switcher[data-group]',
            ToggleSwitcher,
            'switchers'
        );
    }

    initCarousels() {
        this._initGroupedComponents(
            '.js-infinite-carousel[data-group]',
            InfiniteCarousel,
            'carousels'
        );
    }

    initThreeItemSwitchers() {
        this._initGroupedComponents(
            '.js-three-item-switcher[data-group]',
            ThreeItemSwitcher,
            'threeItemSwitchers'
        );
    }

    verifyingExistenceGroup(group) {
        if (!this.groups.has(group)) {
            this.groups.set(group, { switchers: [], carousels: [], threeItemSwitchers: [], lastActionTime: 0 });
        }
    }

    bindEvents() {
        for (const [groupName, components] of this.groups) {
            eventBus.on(`${groupName}:next`, () => {
                components.switchers.forEach(s => s.next());
                components.threeItemSwitchers.forEach(t => t.next());
                components.carousels.forEach(c => c.slide(1));
            });

            eventBus.on(`${groupName}:prev`, () => {
                components.switchers.forEach(s => s.prev());
                components.threeItemSwitchers.forEach(t => t.prev());
                components.carousels.forEach(c => c.slide(-1));
            });
        }
    }

    bindButtons() {
        document.addEventListener('click', (e) => {
            const button = e.target.closest('[data-group][data-action]');
            if (!button) return;

            const group = button.dataset.group;
            if (!this.shouldSwap(group, button)) return;

            const action = button.dataset.action || 'next';
            const event = `${group}:${action}`;
            eventBus.emit(event);
        });
    }

    shouldSwap(group, button) {
        const lastTime = this.groups.get(group).lastActionTime;
        const cooldown = parseInt(button.dataset.cooldown) || this.SWAP_COOLDOWN;
        const now = Date.now();
        if (now - lastTime < cooldown) return false;
        this.groups.get(group).lastActionTime = now;

        if (this.autoplay) {
            this.autoplay.enableShouldSwap(group);
        }

        return true;
    }
}