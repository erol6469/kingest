import { useState, useCallback, useRef } from "react";
import api from "../httpClient";

/**
 * useTrading — Hook pour les opérations de trading réel via Alpaca
 *
 * Utilise l'API backend /api/v1/trading/* qui communique avec Alpaca.
 * Toutes les trades passent par le serveur qui applique le spread Kingest (0.2%).
 */
export function useTrading() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [alpacaPortfolio, setAlpacaPortfolio] = useState(null);
    const [alpacaOrders, setAlpacaOrders] = useState([]);
    const lastFetch = useRef(0);

    // ── Fetch Alpaca account info ──
    const getAccount = useCallback(async () => {
        try {
            const data = await api.get("/api/v1/trading/account");
            if (data.ok) return data.account;
            throw new Error(data.error || "Account fetch failed");
        } catch (e) {
            console.warn("[Trading] getAccount error:", e.message);
            return null;
        }
    }, []);

    // ── Get real-time quote with Kingest spread ──
    const getQuote = useCallback(async (symbol) => {
        try {
            const data = await api.get(`/api/v1/trading/quote/${encodeURIComponent(symbol)}`);
            if (data.ok) return data.quote;
            throw new Error(data.error || "Quote failed");
        } catch (e) {
            console.warn("[Trading] getQuote error:", e.message);
            return null;
        }
    }, []);

    // ── Buy an asset (real order via Alpaca) ──
    const buy = useCallback(async ({ symbol, qty, amount, type }) => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.post("/api/v1/trading/buy", {
                symbol,
                qty: qty || undefined,
                amount: amount || undefined,
                type: type || "stock",
            });
            if (!data.ok) throw new Error(data.error || "Buy order failed");
            setLoading(false);
            return data; // { ok, order, kingestFee, message }
        } catch (e) {
            setError(e.message);
            setLoading(false);
            throw e;
        }
    }, []);

    // ── Sell an asset (real order via Alpaca) ──
    const sell = useCallback(async ({ symbol, qty, type }) => {
        setLoading(true);
        setError(null);
        try {
            const data = await api.post("/api/v1/trading/sell", {
                symbol,
                qty,
                type: type || "stock",
            });
            if (!data.ok) throw new Error(data.error || "Sell order failed");
            setLoading(false);
            return data; // { ok, order, kingestFee, message }
        } catch (e) {
            setError(e.message);
            setLoading(false);
            throw e;
        }
    }, []);

    // ── Fetch real portfolio from Alpaca ──
    const fetchPortfolio = useCallback(async (force = false) => {
        // Throttle: max 1 call per 10 seconds
        const now = Date.now();
        if (!force && now - lastFetch.current < 10000 && alpacaPortfolio) {
            return alpacaPortfolio;
        }
        try {
            const data = await api.get("/api/v1/trading/portfolio");
            if (data.ok) {
                setAlpacaPortfolio(data.portfolio);
                lastFetch.current = now;
                return data.portfolio;
            }
            throw new Error(data.error || "Portfolio fetch failed");
        } catch (e) {
            console.warn("[Trading] fetchPortfolio error:", e.message);
            return alpacaPortfolio; // Return cached if available
        }
    }, [alpacaPortfolio]);

    // ── Fetch order history ──
    const fetchOrders = useCallback(async (status = "all", limit = 20) => {
        try {
            const data = await api.get(`/api/v1/trading/orders?status=${status}&limit=${limit}`);
            if (data.ok) {
                setAlpacaOrders(data.orders);
                return data.orders;
            }
            return [];
        } catch (e) {
            console.warn("[Trading] fetchOrders error:", e.message);
            return alpacaOrders;
        }
    }, [alpacaOrders]);

    // ── Search tradable assets ──
    const searchAssets = useCallback(async (query) => {
        try {
            const data = await api.get(`/api/v1/trading/search/${encodeURIComponent(query)}`);
            if (data.ok) return data.results;
            return [];
        } catch (e) {
            console.warn("[Trading] search error:", e.message);
            return [];
        }
    }, []);

    return {
        // State
        loading,
        error,
        alpacaPortfolio,
        alpacaOrders,
        // Actions
        getAccount,
        getQuote,
        buy,
        sell,
        fetchPortfolio,
        fetchOrders,
        searchAssets,
    };
}

export default useTrading;
