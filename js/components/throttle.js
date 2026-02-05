export function throttle(func, delay) {
    let timer = null;
    let lastCall = 0;
    
    return function(...args) {
        const now = Date.now();
        const remaining = delay - (now - lastCall);
        
        if (remaining <= 0) {
            // Можно выполнять сразу
            lastCall = now;
            func.apply(this, args);
        } else if (!timer) {
            // Ставим на паузу
            timer = setTimeout(() => {
                lastCall = Date.now();
                timer = null;
                func.apply(this, args);
            }, remaining);
        }
    };
}