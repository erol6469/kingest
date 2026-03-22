import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook: receives real market data from native iOS bridge.
 * Swift calls window.__KINGEST_DATA(jsonString) every 30s.
 * NO fetch() from JS — all networking is done natively.
 */

// Transform backend format → app format
function transformData(raw) {
    const formatCap = (n) => {
        if (!n) return "—";
        if (n >= 1e12) return (n / 1e12).toFixed(2) + "T";
        if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
        if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
        if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
        return String(n);
    };
    const cryptoColors = {
        BTC:"#F7931A",ETH:"#627EEA",BNB:"#F3BA2F",XRP:"#23292F",
        SOL:"#00FFA3",ADA:"#0033AD",DOGE:"#C3A634",DOT:"#E6007A",
        MATIC:"#8247E5",AVAX:"#E84142",LINK:"#2A5ADA",UNI:"#FF007A",
    };

    return {
        crypto: (raw.crypto || []).map(c => ({
            sym: c.symbol, name: c.name, price: c.price,
            chg: c.changePct24h, logo: c.logo,
            color: cryptoColors[c.symbol] || "#6BA5FF",
            cap: formatCap(c.cap), rank: c.extra?.rank,
            high24: c.extra?.high24, low24: c.extra?.low24,
            vol24h: formatCap(c.extra?.volume), _real: true,
        })),
        forex: (raw.forex || []).map(f => ({
            sym: f.symbol, name: f.name, price: f.price,
            chg: f.changePct24h,
            f1: f.extra?.f1, f2: f.extra?.f2,
            logo1: null, logo2: null, _real: true,
        })),
        stocks: (raw.stocks || []).map(s => ({
            sym: s.symbol, name: s.name, price: s.price,
            chg: s.changePct24h, logo: s.logo,
            color: "#6BA5FF", cap: formatCap(s.cap),
            exchange: s.extra?.exchange,
            exchangeCode: s.extra?.exchangeCode || "US",
            flag: s.extra?.flag || "us",
            exchangeFullName: s.extra?.exchangeFullName || "",
            _real: true,
        })),
        commodities: (raw.commodities || []).map(c => ({
            sym: c.symbol, name: c.name, price: c.price,
            chg: c.changePct24h,
            icon: c.extra?.icon, iconColor: c.extra?.iconColor,
            color: c.extra?.iconColor || "#F5B731", _real: true,
        })),
        indices: (raw.indices || []).map(i => ({
            sym: i.symbol, name: i.name, price: i.price,
            chg: i.changePct24h, logo: i.logo,
            flag: i.extra?.flag, country: i.extra?.country,
            exchangeCode: i.extra?.exchange,
            color: "#6BA5FF", _real: true,
        })),
        exchanges: raw.exchanges || {},
        sources: raw.sources,
    };
}

function useRealMarket() {
    const [stocks, setStocks] = useState([]);
    const [cryptos, setCryptos] = useState([]);
    const [forex, setForex] = useState([]);
    const [comms, setComms] = useState([]);
    const [indices, setIndices] = useState([]);
    const [exchanges, setExchanges] = useState({});
    const [isLive, setIsLive] = useState(false);
    const [loading, setLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [error, setError] = useState(null);
    const [debug, setDebug] = useState("Waiting for native bridge...");

    useEffect(() => {
        // Process raw JSON from backend
        const processData = (jsonString) => {
            try {
                const raw = JSON.parse(jsonString);
                if (!raw.ok) {
                    setError("Backend error");
                    setDebug("Backend: " + (raw.error || "unknown"));
                    return;
                }

                const d = transformData(raw);
                let dbg = [];

                if (d.crypto.length > 0) {
                    setCryptos(d.crypto);
                    dbg.push("C:" + d.crypto.length);
                }
                if (d.forex.length > 0) {
                    setForex(d.forex);
                    dbg.push("F:" + d.forex.length);
                }
                if (d.stocks.length > 0) {
                    setStocks(d.stocks);
                    dbg.push("S:" + d.stocks.length);
                }
                if (d.commodities.length > 0) {
                    setComms(d.commodities);
                    dbg.push("M:" + d.commodities.length);
                }
                if (d.indices && d.indices.length > 0) {
                    setIndices(d.indices);
                    dbg.push("I:" + d.indices.length);
                }
                if (d.exchanges && Object.keys(d.exchanges).length > 0) {
                    setExchanges(d.exchanges);
                }

                setIsLive(d.crypto.length > 0 || d.stocks.length > 0);
                setLastUpdate(new Date());
                setLoading(false);
                setError(null);
                setDebug(dbg.join(" | ") + " | src:" + JSON.stringify(d.sources || {}));

                // [KINGEST] Native bridge data received:", dbg.join(" | "));
            } catch (e) {
                // console.error("[KINGEST] Parse error:", e);
                setError(e.message);
                setDebug("Parse error: " + e.message);
            }
        };

        // Called by Swift with raw JSON string
        window.__KINGEST_DATA = (jsonString) => processData(jsonString);

        // Called by Swift with Base64-encoded JSON (avoids escaping issues)
        window.__KINGEST_DATA_B64 = (b64) => {
            try {
                const binary = atob(b64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                const jsonString = new TextDecoder("utf-8").decode(bytes);
                processData(jsonString);
            } catch (e) {
                // console.error("[KINGEST] Base64 decode error:", e);
                setError("Decode error: " + e.message);
                setDebug("B64 decode error");
            }
        };

        window.__KINGEST_ERROR = (msg) => {
            setError(msg);
            setDebug("Native error: " + msg);
            // console.warn("[KINGEST] Native error:", msg);
        };

        // [KINGEST] Native bridge registered (B64 + JSON), waiting for data...");

        return () => {
            window.__KINGEST_DATA = null;
            window.__KINGEST_DATA_B64 = null;
            window.__KINGEST_ERROR = null;
        };
    }, []);

    return { stocks, cryptos, forex, comms, indices, exchanges, isLive, lastUpdate, error, debug, loading };
}

export { useRealMarket };
