import { ToggleSwitcher } from './ToggleSwitcher.js';
import { InfiniteCarousel } from './InfiniteCarousel.js';
import { ThreeItemSwitcher } from './ThreeItemSwitcher.js';
import { AutoplayManager } from './AutoplayManager.js';

import { eventBus } from './EventBus.js';

export class InteractiveGallery {
    constructor() {
        this.SWAP_COOLDOWN = 300;

        this.groups = new Map();
        // groupName -> {
        //     switchers: [],
        //     carousels: [],
        //     threeItemSwitchers: [],
        //     buttons: [],
        //     lastActionTime,  время с последнего жмяка, нужно для ограничения срабатываний
        //     autoplay: true 
        // }

        this.init();
    }

    init() {
        this.setupComponents();
        this.bindEvents();
        this.initAutoplay();
        this.bindVisibilityHandler();
        this.bindButtons();
    }

    setupComponents() {
        this.initToggleSwitchers();
        this.initCarousels();
        this.initThreeItemSwitchers();
        this.initButtons();
    }

    initAutoplay() {
        this.autoplay = new AutoplayManager({
            delay: 10000,
            onTick: (groupName) => {
                eventBus.emit(`${groupName}:next`);
            }
        });

        this.groups.forEach((groupData, groupName) => {
            if (!groupData.autoplay) return;
            
            this.autoplay.register(groupName);
            this.bindAutoplayHoverForGroup(groupName, groupData);
        });
    }

    bindAutoplayHoverForGroup(groupName, groupData) {
        const elements = [
            ...groupData.switchers.map(i => i.container),
            ...groupData.carousels.map(i => i.carousel),
            ...groupData.threeItemSwitchers.map(i => i.container),
            ...groupData.buttons
        ];

        elements.forEach(element => {
            element.addEventListener('pointerenter', () => {
                this.autoplay.stop(groupName);
            });

            element.addEventListener('pointerleave', () => {
                this.autoplay.start(groupName);
            });
        });
    }

    bindVisibilityHandler() {
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.autoplay.pauseAll();
            } else {
                this.autoplay.resumeAll();
            }
        });
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

    initButtons() {
        document.querySelectorAll('[data-group][data-action]').forEach(el => {
            const group = el.dataset.group;

            this.verifyingExistenceGroup(group);

            if (el.hasAttribute('data-autoplay')) {
                this.groups.get(group).autoplay = true;
            }

            this.groups.get(group).buttons.push(el);
        });
    }

    verifyingExistenceGroup(group) {
        if (!this.groups.has(group)) {
            this.groups.set(group, { switchers: [], carousels: [], threeItemSwitchers: [], buttons: [], lastActionTime: 0, autoplay: false });
        }
    }

    bindEvents() {
        for (const [groupName, groupData] of this.groups) {
            eventBus.on(`${groupName}:next`, () => {
                groupData.switchers.forEach(s => s.next());
                groupData.threeItemSwitchers.forEach(t => t.next());
                groupData.carousels.forEach(c => c.slide(1));
            });

            eventBus.on(`${groupName}:prev`, () => {
                groupData.switchers.forEach(s => s.prev());
                groupData.threeItemSwitchers.forEach(t => t.prev());
                groupData.carousels.forEach(c => c.slide(-1));
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

        if (this.groups.get(group).autoplay) {
            this.autoplay.reset(group);
        }

        return true;
    }
}