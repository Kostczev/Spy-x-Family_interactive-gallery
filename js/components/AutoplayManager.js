export class AutoplayManager {
    constructor(options = {}) {
        this.delay = options.delay || 10000;
        this.onTick = options.onTick;

        this.timers = new Map();
        this.timeouts = new Map();
        this.init();
    }

    init() {
        if (!this.onTick) {
            console.warn(`AutoplayManager: onTick callback is required`);
            return;
        };

        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAll();
            } else {
                this.resumeAll();
            }
        });

        document.querySelectorAll(`[data-group][data-autoplay]`).forEach(el => {
            const group = el.dataset.group;
            this.start(group);
            this.enablePauseOnHover(group);
        });
    }

    start(group) {
        this.stop(group);

        const tick = () => {
            if (!document.hidden) {
                this.onTick(group);
            }

            // Рекурсивно вызываем себя через setTimeout
            // Если страница скрыта - таймаут будет "заморожен"
            const timeoutId = setTimeout(tick, this.delay);
            this.timeouts.set(group, timeoutId);
        };

        // Первый запуск
        const timeoutId = setTimeout(tick, this.delay);
        this.timeouts.set(group, timeoutId);

        console.log(`Autoplay started for group "${group}" (${this.delay}ms)`);
    }

    // start(group) {
    //     this.stop(group);

    //     const timer = setInterval(() => {
    //         this.onTick(group);
    //     }, this.delay);

    //     this.timers.set(group, timer);
    //     console.log(`Autoplay started for group "${group}" (${this.delay}ms)`);
    // }

    stop(group) {
        const timer = this.timers.get(group);
        if (timer) {
            clearInterval(timer);
            this.timers.delete(group);
            console.log(`Autoplay stopped for group "${group}"`);
        }
    }

    pauseAll() {
        this.timeouts.forEach((timeoutId, group) => {
            clearTimeout(timeoutId);
            this.timeouts.delete(group);
        });
        console.log('All autoplay paused (page hidden)');
    }

    resumeAll() {
        // Перезапускаем все остановленные таймеры
        this.timeouts.forEach((_, group) => {
            this.start(group);
        });
        console.log('All autoplay resumed (page visible)');
    }

    enableShouldSwap(group) {
        this.stop(group);
        setTimeout(() => {
            this.start(group);
        }, 10000);
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