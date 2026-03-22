/**
 * KINGEST Market Data Client
 *
 * Fetches ALL market data from the backend proxy.
 * The app NEVER calls external APIs directly.
 */

import { API_BASE } from "../config.js";

async function fetchAllMarkets() {
    // Debug logging removed for production

    const res = await fetch(`${API_BASE}/api/market/snapshot`, {
        method: "GET",
        headers: { "Accept": "application/json" },
    });

    if (!res.ok) throw new Error("Backend HTTP " + res.status);
    const data = await res.json();

    if (!data.ok) throw new Error("Backend error: " + (data.error || "unknown"));

    // Debug logging removed for production

    // Transform backend format → app format
    return {
        crypto: (data.crypto || []).map(c => ({
            sym: c.symbol,
            name: c.name,
            price: c.price,
            chg: c.changePct24h,
            logo: c.logo,
            color: getCryptoColor(c.symbol),
            cap: formatCap(c.cap),
            rank: c.extra?.rank,
            high24: c.extra?.high24,
            low24: c.extra?.low24,
            vol24h: formatCap(c.extra?.volume),
            _real: true,
        })),
        forex: (data.forex || []).map(f => ({
            sym: f.symbol,
            name: f.name,
            price: f.price,
            chg: f.changePct24h,
            f1: f.extra?.f1,
            f2: f.extra?.f2,
            logo1: null,
            logo2: null,
            _real: true,
        })),
        stocks: (data.stocks || []).map(s => ({
            sym: s.symbol,
            name: s.name,
            price: s.price,
            chg: s.changePct24h,
            logo: s.logo,
            color: "#6BA5FF",
            cap: formatCap(s.cap),
            exchange: s.extra?.exchange,
            _real: true,
        })),
        commodities: (data.commodities || []).map(c => ({
            sym: c.symbol,
            name: c.name,
            price: c.price,
            chg: c.changePct24h,
            emoji: c.extra?.emoji,
            color: "#F5B731",
            _real: true,
        })),
        sources: data.sources,
        timestamp: Date.now(),
    };
}

// ─── Helpers ───
function formatCap(n) {
    if (!n) return "—";
    if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
    if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
    return String(n);
}

function getCryptoColor(sym) {
    const colors = {
        BTC: "#F7931A", ETH: "#627EEA", BNB: "#F3BA2F", XRP: "#23292F",
        SOL: "#00FFA3", ADA: "#0033AD", DOGE: "#C3A634", DOT: "#E6007A",
        MATIC: "#8247E5", AVAX: "#E84142", LINK: "#2A5ADA", UNI: "#FF007A",
    };
    return colors[sym] || "#6BA5FF";
}

export { fetchAllMarkets };
