import { throttle } from './throttle.js';

export class InfiniteCarousel {
    constructor(containerElement, options = {}) {
        this.carousel = containerElement;
        this.slider = containerElement.querySelector('div');
        this.items = this.getItems();
        this.current = options.startIndex || 0;
        this.type = this.carousel.dataset.type;

        this.strategy = this.createStrategy(this.type);

        this.init();

        this.handleResize = throttle(this.handleResize.bind(this), 250);
        window.addEventListener('resize', this.handleResize);
    }

    getItems() {
        return Array.from(this.slider?.children || []);
    }

    init() {
        this.slider.append(this.items[0].cloneNode(true));
        this.items = this.getItems();;
        this.measureAndSetExactHeights();

        // на подумать а можно ли так
        this.updateVisibility();

        this.assigningClasses();

        this.slider.style.transition = 'none';
        this.updateTransform();
    }

    assigningClasses() {
        this.items.forEach((item, index) => {
            item.classList.add('carousel__item');
            item.classList.toggle('active', index === this.current);
        })
    }

    createStrategy(type) {
        const strategies = {
            'fixHeight': FixHeightStrategy,
            'freeHeight': FreeHeightStrategy
        };

        return strategies[type] || FreeHeightStrategy;
    }

    updateVisibility() {
        if (this.strategy.updateVisibility) {
            this.strategy.updateVisibility.call(this);
        }
    }
    measureAndSetExactHeights() {
        // класс вычисляет высоту элементов
        // но есть но, онг ее округляет
        // чтоб это округление не приводило к уезжанию - фиксируем высоту без дробных чисел
        this.strategy.measureAndSetExactHeights.call(this);
    }
    updateTransform() {
        this.strategy.updateTransform.call(this);
    }

    handleResize() {
        this.measureAndSetExactHeights();
        this.updateTransform();
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
    }

    slide(direction) {
        this.slider.style.transition = '';
        this.old = this.current;
        this.current += direction;

        // Проверка границ
        if (this.current === -1 || this.current === this.items.length) {
            this.slider.style.transition = 'none';
            this.current = this.current === -1 ? this.items.length - 1 : 0;
            this.updateTransform();
            this.current = this.current === 0 ? 1 : this.items.length - 2;

            // Принудительный reflow
            void this.slider.offsetWidth;
            this.slider.style.transition = '';
        }

        this.updateActiveItem();
        this.updateTransform();
    }

    updateActiveItem() {
        this.items[this.old].classList.remove('active');
        this.items[this.current].classList.add('active');
    }
}

export const FixHeightStrategy = {
    measureAndSetExactHeights() {
        this.itemHeight = this.carousel.offsetHeight;
        this.carousel.style.height = `${this.itemHeight}px`;

        this.items.forEach(item => {
            item.style.height = `${this.itemHeight}px`;
        });
    },

    updateTransform() {
        this.slider.style.transform = `translateY(${-this.current * this.itemHeight}px)`;
    }
}

export const FreeHeightStrategy = {
    // чтоб не забыл для чего усложнил
    // теоретически, чтоб отрисовка шла по группам а не по шагам
    measureAndSetExactHeights() {
        // Сначала собираем все READ операции
        const heightData = this.items.map(item => ({
            element: item,
            height: item.offsetHeight
        }));

        // Потом все WRITE операции
        heightData.forEach(data => {
            data.element.style.height = `${data.height}px`;
        });

        // Возвращаем массив высот
        this.itemsHeight = heightData.map(data => data.height);
    },

    updateVisibility() {
        this.carousel.style.height = `${this.itemsHeight[this.current]}px`;
    },

    updateTransform() {
        let newHeight = 0;
        for (let i = 0; i < this.current; i++) {
            newHeight += this.itemsHeight[i];
        }

        this.slider.style.transform = `translateY(${-this.itemsHeight.slice(0, this.current).reduce((total, num) => total + num, 0)}px)`;
        this.updateVisibility();
    }
}