import { useState, useEffect } from "react";

function useLive(initial) {
    const [d, setD] = useState(initial);
    useEffect(() => {
        const iv = setInterval(() => {
            setD(p => {
                const next = [...p];
                const batchSize = Math.min(50, next.length);
                for (let b = 0; b < batchSize; b++) {
                    const i = Math.floor(Math.random() * next.length);
                    const a = next[i];
                    const v = a.price > 1000 ? 0.003 : a.price > 100 ? 0.005 : a.price > 1 ? 0.008 : 0.012;
                    const delta = a.price * v * (Math.random() - 0.48);
                    next[i] = { ...a, price: +Math.max(a.price * 0.9, a.price + delta).toFixed(a.price < 1 ? 4 : a.price < 10 ? 3 : 2), chg: +((delta / a.price) * 100).toFixed(2) };
                }
                return next;
            });
        }, 2500);
        return () => clearInterval(iv);
    }, []);
    return d;
}

export { useLive };
