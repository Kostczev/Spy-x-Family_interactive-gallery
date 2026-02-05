export class ToggleSwitcher {
    constructor(containerElement, options = {}) {
        this.container = containerElement;
        this.items = Array.from(this.container.children);
        this.current = options.startIndex || 0;
        this.effect = options.effect || 'fade';

        this.init();
    }

    init() {
        this.items[this.current]?.classList.add('active');
    }

    next() {
        this.move(1);
    }

    prev() {
        this.move(-1);
    }

    move(direction) {
        const old = this.current;
        const length = this.items.length;
        this.current = (this.current + direction + length) % length;

        this.switch(old, this.current);
    }

    switch(old, current) {
        this.items[old]?.classList.remove('active');
        this.items[this.current]?.classList.add('active');
    }
}