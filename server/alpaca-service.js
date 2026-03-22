// ══════════════════════════════════════
// ALPACA TRADING SERVICE
// Handles real trades via Alpaca API
// ══════════════════════════════════════

const fetch = require("node-fetch");

const ALPACA_API_KEY = process.env.ALPACA_API_KEY || "";
const ALPACA_API_SECRET = process.env.ALPACA_API_SECRET || "";
const ALPACA_BASE_URL = process.env.ALPACA_BASE_URL || "https://paper-api.alpaca.markets";
const ALPACA_DATA_URL = "https://data.alpaca.markets";

// Kingest spread: 0.2% on each trade (buy slightly higher, sell slightly lower)
const KINGEST_SPREAD = 0.002;

const headers = {
    "APCA-API-KEY-ID": ALPACA_API_KEY,
    "APCA-API-SECRET-KEY": ALPACA_API_SECRET,
    "Content-Type": "application/json",
};

// ── Check if Alpaca is configured ──
function isConfigured() {
    return ALPACA_API_KEY && ALPACA_API_SECRET && !ALPACA_API_KEY.includes("REPLACE");
}

// ── Get account info ──
async function getAccount() {
    const r = await fetch(`${ALPACA_BASE_URL}/v2/account`, { headers });
    if (!r.ok) throw new Error(`Alpaca account error: ${r.status}`);
    return r.json();
}

// ── Get current price of an asset ──
async function getQuote(symbol) {
    // Try stock quote first
    let r = await fetch(`${ALPACA_DATA_URL}/v2/stocks/${symbol}/quotes/latest`, { headers });
    if (r.ok) {
        const data = await r.json();
        const midPrice = (data.quote.ap + data.quote.bp) / 2;
        return {
            symbol,
            type: "stock",
            bid: data.quote.bp,
            ask: data.quote.ap,
            mid: midPrice,
            // Kingest prices with spread
            kingestBuy: midPrice * (1 + KINGEST_SPREAD),  // Client pays more
            kingestSell: midPrice * (1 - KINGEST_SPREAD), // Client receives less
            spread: KINGEST_SPREAD,
            timestamp: data.quote.t,
        };
    }

    // Try crypto
    const cryptoSymbol = symbol.includes("/") ? symbol : `${symbol}/USD`;
    r = await fetch(`${ALPACA_DATA_URL}/v1beta3/crypto/us/latest/quotes?symbols=${cryptoSymbol}`, { headers });
    if (r.ok) {
        const data = await r.json();
        const quote = data.quotes[cryptoSymbol];
        if (quote) {
            const midPrice = (quote.ap + quote.bp) / 2;
            return {
                symbol: cryptoSymbol,
                type: "crypto",
                bid: quote.bp,
                ask: quote.ap,
                mid: midPrice,
                kingestBuy: midPrice * (1 + KINGEST_SPREAD),
                kingestSell: midPrice * (1 - KINGEST_SPREAD),
                spread: KINGEST_SPREAD,
                timestamp: quote.t,
            };
        }
    }

    throw new Error(`Quote not found for ${symbol}`);
}

// ── Place a buy order ──
async function buyOrder(symbol, qty, notional, type = "stock") {
    const body = {
        symbol: type === "crypto" && !symbol.includes("/") ? `${symbol}/USD` : symbol,
        side: "buy",
        type: "market",
        time_in_force: type === "crypto" ? "gtc" : "day",
    };

    // Either buy by quantity or by dollar amount
    if (notional) {
        body.notional = String(notional); // Buy $X worth
    } else {
        body.qty = String(qty);
    }

    const r = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.message || `Order failed: ${r.status}`);

    return {
        orderId: data.id,
        symbol: data.symbol,
        side: data.side,
        qty: data.qty,
        notional: data.notional,
        status: data.status,
        type: data.order_type,
        createdAt: data.created_at,
    };
}

// ── Place a sell order ──
async function sellOrder(symbol, qty, type = "stock") {
    const body = {
        symbol: type === "crypto" && !symbol.includes("/") ? `${symbol}/USD` : symbol,
        side: "sell",
        type: "market",
        time_in_force: type === "crypto" ? "gtc" : "day",
        qty: String(qty),
    };

    const r = await fetch(`${ALPACA_BASE_URL}/v2/orders`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });

    const data = await r.json();
    if (!r.ok) throw new Error(data.message || `Sell order failed: ${r.status}`);

    return {
        orderId: data.id,
        symbol: data.symbol,
        side: data.side,
        qty: data.qty,
        status: data.status,
        type: data.order_type,
        createdAt: data.created_at,
    };
}

// ── Get all positions (portfolio) ──
async function getPositions() {
    const r = await fetch(`${ALPACA_BASE_URL}/v2/positions`, { headers });
    if (!r.ok) throw new Error(`Positions error: ${r.status}`);
    const data = await r.json();
    return data.map(p => ({
        symbol: p.symbol,
        qty: parseFloat(p.qty),
        avgEntry: parseFloat(p.avg_entry_price),
        currentPrice: parseFloat(p.current_price),
        marketValue: parseFloat(p.market_value),
        unrealizedPL: parseFloat(p.unrealized_pl),
        unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100,
        side: p.side,
        assetClass: p.asset_class,
    }));
}

// ── Get position for a specific symbol ──
async function getPosition(symbol) {
    const r = await fetch(`${ALPACA_BASE_URL}/v2/positions/${symbol}`, { headers });
    if (!r.ok) {
        if (r.status === 404) return null;
        throw new Error(`Position error: ${r.status}`);
    }
    const p = await r.json();
    return {
        symbol: p.symbol,
        qty: parseFloat(p.qty),
        avgEntry: parseFloat(p.avg_entry_price),
        currentPrice: parseFloat(p.current_price),
        marketValue: parseFloat(p.market_value),
        unrealizedPL: parseFloat(p.unrealized_pl),
        unrealizedPLPercent: parseFloat(p.unrealized_plpc) * 100,
    };
}

// ── Get order history ──
async function getOrders(status = "all", limit = 50) {
    const r = await fetch(`${ALPACA_BASE_URL}/v2/orders?status=${status}&limit=${limit}&direction=desc`, { headers });
    if (!r.ok) throw new Error(`Orders error: ${r.status}`);
    const data = await r.json();
    return data.map(o => ({
        orderId: o.id,
        symbol: o.symbol,
        side: o.side,
        qty: o.qty,
        filledQty: o.filled_qty,
        filledAvgPrice: o.filled_avg_price,
        status: o.status,
        type: o.order_type,
        notional: o.notional,
        createdAt: o.created_at,
        filledAt: o.filled_at,
    }));
}

// ── Get available assets (searchable) ──
async function searchAssets(query) {
    const r = await fetch(`${ALPACA_BASE_URL}/v2/assets?status=active`, { headers });
    if (!r.ok) throw new Error(`Assets error: ${r.status}`);
    const data = await r.json();
    const q = query.toUpperCase();
    return data
        .filter(a => a.tradable && (a.symbol.includes(q) || a.name.toUpperCase().includes(q)))
        .slice(0, 20)
        .map(a => ({
            symbol: a.symbol,
            name: a.name,
            type: a.class === "crypto" ? "crypto" : "stock",
            exchange: a.exchange,
            tradable: a.tradable,
        }));
}

// ── Calculate Kingest revenue from a trade ──
function calculateKingestRevenue(tradeAmount) {
    return tradeAmount * KINGEST_SPREAD;
}

module.exports = {
    isConfigured,
    getAccount,
    getQuote,
    buyOrder,
    sellOrder,
    getPositions,
    getPosition,
    getOrders,
    searchAssets,
    calculateKingestRevenue,
    KINGEST_SPREAD,
};
