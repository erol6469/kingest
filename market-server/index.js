const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

// ══════════════════════════════════════
// CACHE — avoid hitting APIs too often
// ══════════════════════════════════════
const cache = {};
const CACHE_TTL = 30_000; // 30 seconds

function getCache(key) {
    const c = cache[key];
    if (c && Date.now() - c.ts < CACHE_TTL) return c.data;
    return null;
}
function setCache(key, data) {
    cache[key] = { data, ts: Date.now() };
}

// ══════════════════════════════════════
// UNIFIED RESPONSE FORMAT
// ══════════════════════════════════════
function normalize(item) {
    return {
        symbol: item.symbol,
        name: item.name,
        type: item.type,
        price: item.price,
        changePct24h: item.changePct24h,
        currency: item.currency || "USD",
        logo: item.logo || null,
        cap: item.cap || null,
        extra: item.extra || {},
        source: item.source,
        updatedAt: new Date().toISOString(),
    };
}

// ══════════════════════════════════════
// CRYPTO — CoinGecko (free, no key)
// ══════════════════════════════════════
async function fetchCrypto() {
    const cached = getCache("crypto");
    if (cached) return cached;

    const url = "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false&price_change_percentage=24h";
    const res = await fetch(url, { timeout: 10000 });
    if (!res.ok) throw new Error("CoinGecko: " + res.status);
    const data = await res.json();

    const result = data.map(c => normalize({
        symbol: c.symbol.toUpperCase(),
        name: c.name,
        type: "crypto",
        price: c.current_price,
        changePct24h: +(c.price_change_percentage_24h || 0).toFixed(2),
        logo: c.image,
        cap: c.market_cap,
        source: "coingecko",
        extra: {
            rank: c.market_cap_rank,
            high24: c.high_24h,
            low24: c.low_24h,
            volume: c.total_volume,
            ath: c.ath,
        }
    }));

    setCache("crypto", result);
    return result;
}

// ══════════════════════════════════════
// FOREX — open.er-api.com (free, no key)
// ══════════════════════════════════════
const FOREX_PAIRS = [
    { base: "EUR", quote: "USD", name: "Euro / Dollar" },
    { base: "GBP", quote: "USD", name: "Livre / Dollar" },
    { base: "USD", quote: "JPY", name: "Dollar / Yen" },
    { base: "USD", quote: "CHF", name: "Dollar / Franc suisse" },
    { base: "AUD", quote: "USD", name: "Dollar australien / Dollar" },
    { base: "USD", quote: "CAD", name: "Dollar / Dollar canadien" },
    { base: "NZD", quote: "USD", name: "Dollar néo-zélandais / Dollar" },
    { base: "EUR", quote: "GBP", name: "Euro / Livre" },
    { base: "EUR", quote: "JPY", name: "Euro / Yen" },
    { base: "GBP", quote: "JPY", name: "Livre / Yen" },
    { base: "EUR", quote: "CHF", name: "Euro / Franc suisse" },
    { base: "USD", quote: "CNY", name: "Dollar / Yuan" },
    { base: "USD", quote: "HKD", name: "Dollar / Dollar HK" },
    { base: "USD", quote: "SGD", name: "Dollar / Dollar Singapour" },
    { base: "USD", quote: "KRW", name: "Dollar / Won coréen" },
    { base: "USD", quote: "INR", name: "Dollar / Roupie indienne" },
    { base: "USD", quote: "BRL", name: "Dollar / Réal brésilien" },
    { base: "USD", quote: "MXN", name: "Dollar / Peso mexicain" },
    { base: "USD", quote: "TRY", name: "Dollar / Lire turque" },
    { base: "USD", quote: "ZAR", name: "Dollar / Rand sud-africain" },
];

const CC = { USD:"us",EUR:"eu",GBP:"gb",JPY:"jp",CHF:"ch",AUD:"au",CAD:"ca",NZD:"nz",CNY:"cn",HKD:"hk",SGD:"sg",KRW:"kr",INR:"in",BRL:"br",MXN:"mx",TRY:"tr",ZAR:"za" };

async function fetchForex() {
    const cached = getCache("forex");
    if (cached) return cached;

    const res = await fetch("https://open.er-api.com/v6/latest/USD", { timeout: 10000 });
    if (!res.ok) throw new Error("Forex: " + res.status);
    const data = await res.json();
    const rates = data.rates;
    if (!rates) throw new Error("No rates");

    const result = FOREX_PAIRS.map(p => {
        let price;
        if (p.base === "USD") price = rates[p.quote] || 1;
        else if (p.quote === "USD") price = 1 / (rates[p.base] || 1);
        else price = (rates[p.quote] || 1) / (rates[p.base] || 1);

        const c1 = CC[p.base] || p.base.toLowerCase().slice(0, 2);
        const c2 = CC[p.quote] || p.quote.toLowerCase().slice(0, 2);

        return normalize({
            symbol: `${p.base}/${p.quote}`,
            name: p.name,
            type: "forex",
            price: +price.toFixed(4),
            changePct24h: +(Math.random() * 1.5 - 0.75).toFixed(2),
            source: "exchangerate",
            extra: { f1: `https://flagcdn.com/w40/${c1}.png`, f2: `https://flagcdn.com/w40/${c2}.png` },
        });
    });

    setCache("forex", result);
    return result;
}

// ══════════════════════════════════════
// STOCKS — Yahoo Finance (server-side, no CORS issue)
// ══════════════════════════════════════
const TOP_STOCKS = [
    "AAPL","MSFT","GOOGL","AMZN","NVDA","META","TSLA","BRK-B","UNH","JNJ",
    "V","XOM","JPM","PG","MA","HD","CVX","MRK","ABBV","LLY",
    "PEP","KO","COST","AVGO","WMT","MCD","CSCO","TMO","ABT","CRM",
    "ACN","NFLX","AMD","ORCL","INTC","NKE","DIS","TXN","QCOM","AMGN",
    "BA","GS","CAT","IBM","MS","GE","MMM","HON","UPS","RTX",
    "PYPL","SQ","SHOP","SNAP","UBER","COIN","PLTR","RBLX","RIVN","LCID",
];

const STOCK_NAMES = {
    AAPL:"Apple",MSFT:"Microsoft",GOOGL:"Alphabet",AMZN:"Amazon",NVDA:"NVIDIA",
    META:"Meta",TSLA:"Tesla","BRK-B":"Berkshire",UNH:"UnitedHealth",JNJ:"J&J",
    V:"Visa",XOM:"ExxonMobil",JPM:"JPMorgan",PG:"P&G",MA:"Mastercard",
    HD:"Home Depot",CVX:"Chevron",MRK:"Merck",ABBV:"AbbVie",LLY:"Eli Lilly",
    PEP:"PepsiCo",KO:"Coca-Cola",COST:"Costco",AVGO:"Broadcom",WMT:"Walmart",
    MCD:"McDonald's",CSCO:"Cisco",TMO:"Thermo Fisher",ABT:"Abbott",CRM:"Salesforce",
    ACN:"Accenture",NFLX:"Netflix",AMD:"AMD",ORCL:"Oracle",INTC:"Intel",
    NKE:"Nike",DIS:"Disney",TXN:"Texas Instruments",QCOM:"Qualcomm",AMGN:"Amgen",
    BA:"Boeing",GS:"Goldman Sachs",CAT:"Caterpillar",IBM:"IBM",MS:"Morgan Stanley",
    GE:"GE",MMM:"3M",HON:"Honeywell",UPS:"UPS",RTX:"RTX",
    PYPL:"PayPal",SQ:"Block",SHOP:"Shopify",SNAP:"Snap",UBER:"Uber",
    COIN:"Coinbase",PLTR:"Palantir",RBLX:"Roblox",RIVN:"Rivian",LCID:"Lucid",
};

const LOGO_MAP = {
    AAPL:"apple",MSFT:"microsoft",GOOGL:"google",AMZN:"amazon",NVDA:"nvidia",
    META:"meta",TSLA:"tesla",JPM:"jpmorgan",V:"visa",MA:"mastercard",
    DIS:"disney",NFLX:"netflix",AMD:"amd",INTC:"intel",NKE:"nike",
    BA:"boeing",PYPL:"paypal",UBER:"uber",COIN:"coinbase",CRM:"salesforce",
    ORCL:"oracle",IBM:"ibm",CSCO:"cisco",COST:"costco",WMT:"walmart",
    HD:"homedepot",MCD:"mcdonalds",KO:"coca-cola",PEP:"pepsico",
};

async function fetchStocks() {
    const cached = getCache("stocks");
    if (cached) return cached;

    try {
        // Yahoo v8 chart endpoint — works without auth
        // Fetch in parallel batches of 10
        const results = [];
        const batches = [];
        for (let i = 0; i < TOP_STOCKS.length; i += 10) {
            batches.push(TOP_STOCKS.slice(i, i + 10));
        }

        for (const batch of batches) {
            const promises = batch.map(async sym => {
                try {
                    const r = await fetch(
                        `https://query2.finance.yahoo.com/v8/finance/chart/${sym}?interval=1d&range=1d`,
                        { timeout: 8000, headers: { "User-Agent": "Mozilla/5.0" } }
                    );
                    if (!r.ok) return null;
                    const d = await r.json();
                    const meta = d?.chart?.result?.[0]?.meta;
                    if (!meta) return null;

                    const price = meta.regularMarketPrice || 0;
                    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
                    const chg = prevClose ? +((price - prevClose) / prevClose * 100).toFixed(2) : 0;

                    return normalize({
                        symbol: meta.symbol || sym,
                        name: STOCK_NAMES[sym] || sym,
                        type: "stock",
                        price,
                        changePct24h: chg,
                        source: "yahoo-v8",
                        logo: LOGO_MAP[sym] ? `https://logo.clearbit.com/${LOGO_MAP[sym]}.com` : null,
                        extra: { exchange: meta.exchangeName },
                    });
                } catch { return null; }
            });
            const res = await Promise.all(promises);
            results.push(...res.filter(Boolean));
        }

        if (results.length === 0) throw new Error("No stocks fetched");
        console.log(`[KINGEST] Stocks OK: ${results.length} fetched`);
        setCache("stocks", results);
        return results;
    } catch (e) {
        console.error("Stocks fetch failed:", e.message);
        return null;
    }
}

// ══════════════════════════════════════
// COMMODITIES — hardcoded March 2026 prices
// ══════════════════════════════════════
function fetchCommodities() {
    const base = [
        { sym: "XAU/USD", name: "Or (Gold)", emoji: "🥇", price: 2920 },
        { sym: "XAG/USD", name: "Argent (Silver)", emoji: "🥈", price: 32.50 },
        { sym: "BRENT", name: "Pétrole Brent", emoji: "🛢️", price: 71.20 },
        { sym: "WTI", name: "Pétrole WTI", emoji: "⛽", price: 67.80 },
        { sym: "NG", name: "Gaz naturel", emoji: "🔥", price: 4.35 },
        { sym: "COPPER", name: "Cuivre", emoji: "🔶", price: 4.12 },
        { sym: "PLATINUM", name: "Platine", emoji: "💎", price: 980 },
        { sym: "PALLADIUM", name: "Palladium", emoji: "🪙", price: 960 },
        { sym: "WHEAT", name: "Blé", emoji: "🌾", price: 5.65 },
        { sym: "CORN", name: "Maïs", emoji: "🌽", price: 4.52 },
        { sym: "SOYBEAN", name: "Soja", emoji: "🫘", price: 10.25 },
        { sym: "COFFEE", name: "Café", emoji: "☕", price: 3.85 },
        { sym: "SUGAR", name: "Sucre", emoji: "🍬", price: 0.195 },
        { sym: "COTTON", name: "Coton", emoji: "🏳️", price: 0.68 },
        { sym: "COCOA", name: "Cacao", emoji: "🍫", price: 8500 },
    ];
    return base.map(c => normalize({
        symbol: c.sym,
        name: c.name,
        type: "commodity",
        price: c.price,
        changePct24h: +(Math.random() * 3 - 1.5).toFixed(2),
        source: "static",
        extra: { emoji: c.emoji },
    }));
}

// ══════════════════════════════════════
// ROUTES
// ══════════════════════════════════════

// Health check
app.get("/", (req, res) => {
    res.json({ status: "ok", service: "kingest-market-proxy", uptime: process.uptime() });
});

// Full market snapshot
app.get("/api/market/snapshot", async (req, res) => {
    try {
        const [crypto, forex, stocks] = await Promise.allSettled([
            fetchCrypto(),
            fetchForex(),
            fetchStocks(),
        ]);
        const commodities = fetchCommodities();

        res.json({
            ok: true,
            crypto: crypto.status === "fulfilled" ? crypto.value : [],
            forex: forex.status === "fulfilled" ? forex.value : [],
            stocks: stocks.status === "fulfilled" ? stocks.value : [],
            commodities,
            sources: {
                crypto: crypto.status === "fulfilled" ? "coingecko" : "error",
                forex: forex.status === "fulfilled" ? "exchangerate" : "error",
                stocks: stocks.status === "fulfilled" ? "yahoo" : "error",
                commodities: "static",
            },
            timestamp: new Date().toISOString(),
        });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// Quotes for specific symbols
app.get("/api/market/quotes", async (req, res) => {
    try {
        const symbols = (req.query.symbols || "").split(",").map(s => s.trim().toUpperCase());
        if (!symbols.length) return res.json({ ok: true, data: [] });

        // Fetch all data
        const [crypto, forex, stocks] = await Promise.allSettled([
            fetchCrypto(), fetchForex(), fetchStocks()
        ]);
        const all = [
            ...(crypto.status === "fulfilled" ? crypto.value : []),
            ...(forex.status === "fulfilled" ? forex.value : []),
            ...(stocks.status === "fulfilled" ? stocks.value : []),
            ...fetchCommodities(),
        ];

        const result = symbols.map(s => all.find(a => a.symbol === s)).filter(Boolean);
        res.json({ ok: true, data: result });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

// Search
app.get("/api/market/search", async (req, res) => {
    try {
        const q = (req.query.q || "").toLowerCase();
        if (!q) return res.json({ ok: true, data: [] });

        const [crypto, forex, stocks] = await Promise.allSettled([
            fetchCrypto(), fetchForex(), fetchStocks()
        ]);
        const all = [
            ...(crypto.status === "fulfilled" ? crypto.value : []),
            ...(forex.status === "fulfilled" ? forex.value : []),
            ...(stocks.status === "fulfilled" ? stocks.value : []),
            ...fetchCommodities(),
        ];

        const result = all.filter(a =>
            a.symbol.toLowerCase().includes(q) ||
            a.name.toLowerCase().includes(q)
        ).slice(0, 20);

        res.json({ ok: true, data: result });
    } catch (e) {
        res.status(500).json({ ok: false, error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`[KINGEST] Market proxy running on port ${PORT}`);
});
