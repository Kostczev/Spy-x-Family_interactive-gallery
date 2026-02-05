export class ThreeItemSwitcher {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.items = Array.from(this.container.children);
        this.current = options.startIndex || 0;

        if (this.items.length < 3) {
            console.warn('ThreeItemSwitcher requires at least 3 items');
            return;
        }

        this.init();
    }

    init() {
        this.activatingItems();
    }

    getPreviousIndex() {
        return this.current - 1 >= 0 ? this.current - 1 : this.items.length - 1;
    }
    getNextIndex() {
        return this.current + 1 <= this.items.length - 1 ? this.current + 1 : 0;
    }

    activatingItems() {
        this.items[this.getPreviousIndex()].classList.add('active', 'prev');
        this.items[this.current].classList.add('active', 'current');
        this.items[this.getNextIndex()].classList.add('active', 'next');
    }

    deactivatingItems() {
        this.items[this.getPreviousIndex()].classList.remove('active', 'prev');
        this.items[this.current].classList.remove('active', 'current');
        this.items[this.getNextIndex()].classList.remove('active', 'next');
    }



    next() {
        this.move(1);
    }

    prev() {
        this.move(-1);
    }

    move(direction) {
        this.deactivatingItems();

        this.current += direction;

        if (this.current === -1 || this.current === this.items.length) {
            this.current = this.current === -1 ? this.items.length - 1 : 0;
        }

        this.activatingItems();
    }
}