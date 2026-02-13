export class AutoplayManager {
    constructor(options = {}) {
        this.delay = options.delay || 10000;
        this.onTick = options.onTick;

        this.groups = new Set();
        this.timeouts = new Map();
    }

    register(group) {
        this.groups.add(group);
        this.start(group);
    }

    start(group) {
        this.stop(group);

        const timeout = setTimeout(() => {
            this.onTick(group);
            this.start(group);
        }, this.delay);

        this.timeouts.set(group, timeout);

        console.log(`Autoplay started for group "${group}" (${this.delay}ms)`);
    }

    stop(group) {
        const timer = this.timeouts.get(group);
        if (timer) {
            clearTimeout(timer);
            this.timeouts.delete(group);
            console.log(`Autoplay stopped for group "${group}"`);
        }
    }

    pauseAll() {
        this.timeouts.forEach((_, group) => this.stop(group));
        console.log('All autoplay paused (page hidden)');
    }

    resumeAll() {
        this.groups.forEach((_, group) => this.start(group));
        console.log('All autoplay resumed (page visible)');
    }

    reset(group) {
        this.stop(group);

        const timeout = setTimeout(() => {
            this.start(group);
        }, 3000);

        this.timeouts.set(group, timeout);
    }

    enablePauseOnHover(group) {
        const elements = document.querySelectorAll(`[data-group="${group}"]`);
        elements.forEach(element => {
            if (!element) return;

            element.addEventListener('pointerleave', () => {
                this.start(group);
            });
            element.addEventListener('pointerenter', () => {
                this.stop(group);
            });
        });
    }
}