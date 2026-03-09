// ═══════════════════════════════════════════════════════════════
//  KINGEST v8 — 4 Live Data Agents (React Native Compatible)
//  Drop-in hooks for real-time market data
// ═══════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ── Config ──
export const LIVE_CONFIG = {
  FINNHUB_KEY: 'd6nk53pr01qodk605ra0d6nk53pr01qodk605rag',
  COINGECKO_KEY: '',
  OER_KEY: '',
};

// ── Status constants ──
export const AGENT_STATUS = {
  idle: 'idle',
  fetching: 'fetching',
  success: 'success',
  error: 'error',
};

// ── Safe fetch with timeout ──
async function safeFetch(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (res.status === 429) throw new Error('RATE_LIMIT');
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

// ── Fetch with multi-provider fallback ──
async function fetchWithFallback(providers, symbol, normalize) {
  const now = Date.now();
  for (const p of providers) {
    if (p._disabled && now < p._disabledUntil) continue;
    try {
      const data = await safeFetch(p.buildUrl(symbol));
      p._disabled = false;
      p._errorCount = 0;
      return normalize(p.name, data, symbol);
    } catch (e) {
      if (e.message === 'RATE_LIMIT') {
        p._disabled = true;
        p._disabledUntil = now + 60000;
      }
      p._errorCount = (p._errorCount || 0) + 1;
      if (p._errorCount > 5) {
        p._disabled = true;
        p._disabledUntil = now + 300000;
      }
      continue;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  AGENT 1 — STOCKS (Finnhub)
//  60 req/min, real-time US stocks, no CORS issue in React Native
// ═══════════════════════════════════════════════════════════════

const stockProviders = [
  {
    name: 'Finnhub',
    buildUrl: (sym) =>
      `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${LIVE_CONFIG.FINNHUB_KEY}`,
  },
];

function normalizeStock(provider, data, symbol) {
  if (provider === 'Finnhub') {
    return {
      sym: symbol,
      price: data.c || 0,
      chg: data.dp || 0,
      change: data.d || 0,
      high: data.h || 0,
      low: data.l || 0,
      open: data.o || 0,
      prevClose: data.pc || 0,
      timestamp: data.t ? data.t * 1000 : Date.now(),
    };
  }
  return null;
}

export function useStockAgent(symbols = [], intervalMs = 30000) {
  const [data, setData] = useState({});
  const [status, setStatus] = useState({
    status: AGENT_STATUS.idle,
    last: null,
    fetches: 0,
    errs: 0,
    lat: 0,
  });

  useEffect(() => {
    if (!LIVE_CONFIG.FINNHUB_KEY || symbols.length === 0) return;
    let active = true;

    const fetchAll = async () => {
      setStatus((s) => ({ ...s, status: AGENT_STATUS.fetching }));
      const t0 = Date.now();
      let success = 0;
      let errors = 0;

      for (const sym of symbols) {
        if (!active) break;
        const result = await fetchWithFallback(stockProviders, sym, normalizeStock);
        if (result) {
          setData((prev) => ({ ...prev, [sym]: result }));
          success++;
        } else {
          errors++;
        }
        // Rate limit: 1.1s between each Finnhub request (60/min)
        await new Promise((r) => setTimeout(r, 1100));
      }

      const latency = Date.now() - t0;
      setStatus((s) => ({
        ...s,
        status: errors === symbols.length ? AGENT_STATUS.error : AGENT_STATUS.success,
        last: new Date().toLocaleTimeString('fr-FR'),
        fetches: s.fetches + 1,
        errs: s.errs + errors,
        lat: Math.round((s.lat + latency) / 2),
      }));
    };

    fetchAll();
    const iv = setInterval(fetchAll, intervalMs);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [symbols.join(','), intervalMs]);

  return { data, status };
}

// ═══════════════════════════════════════════════════════════════
//  AGENT 2 — CRYPTO (CoinGecko REST + Binance WebSocket)
//  CoinGecko: 30 req/min | Binance WS: unlimited streaming
// ═══════════════════════════════════════════════════════════════

const COINGECKO_ID_MAP = {
  BTC: 'bitcoin', ETH: 'ethereum', SOL: 'solana', BNB: 'binancecoin',
  XRP: 'ripple', ADA: 'cardano', DOGE: 'dogecoin', AVAX: 'avalanche-2',
  DOT: 'polkadot', LINK: 'chainlink', MATIC: 'matic-network', UNI: 'uniswap',
  SHIB: 'shiba-inu', LTC: 'litecoin', ATOM: 'cosmos', FIL: 'filecoin',
  APT: 'aptos', NEAR: 'near', OP: 'optimism', ARB: 'arbitrum',
  SUI: 'sui', SEI: 'sei-network', TIA: 'celestia', INJ: 'injective-protocol',
  RENDER: 'render-token', FET: 'fetch-ai', STX: 'blockstack', RUNE: 'thorchain',
};

export function useBinanceWS(symbols = [], enabled = true) {
  const [prices, setPrices] = useState({});
  const wsRef = useRef(null);

  useEffect(() => {
    if (!enabled || symbols.length === 0) return;

    const streams = symbols.map((s) => `${s.toLowerCase()}usdt@miniTicker`).join('/');
    const url = `wss://stream.binance.com:9443/stream?streams=${streams}`;

    try {
      wsRef.current = new WebSocket(url);
      wsRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.data) {
          const d = msg.data;
          const sym = (d.s || '').replace('USDT', '');
          if (sym) {
            setPrices((prev) => ({
              ...prev,
              [sym]: {
                price: parseFloat(d.c) || 0,
                chg: parseFloat(d.P) || 0,
                high24h: parseFloat(d.h) || 0,
                low24h: parseFloat(d.l) || 0,
                volume: parseFloat(d.v) || 0,
              },
            }));
          }
        }
      };
      wsRef.current.onerror = () => {};
    } catch {}

    return () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.close();
    };
  }, [symbols.join(','), enabled]);

  return prices;
}

export function useCryptoAgent(symbols = [], intervalMs = 60000) {
  const [data, setData] = useState({});
  const [status, setStatus] = useState({
    status: AGENT_STATUS.idle,
    last: null,
    fetches: 0,
    errs: 0,
    lat: 0,
  });
  const binancePrices = useBinanceWS(symbols.slice(0, 20), true);

  useEffect(() => {
    if (symbols.length === 0) return;
    let active = true;

    const fetchAll = async () => {
      setStatus((s) => ({ ...s, status: AGENT_STATUS.fetching }));
      const t0 = Date.now();

      const ids = symbols.map((s) => COINGECKO_ID_MAP[s]).filter(Boolean).join(',');
      if (!ids) {
        setStatus((s) => ({ ...s, status: AGENT_STATUS.error }));
        return;
      }

      try {
        const raw = await safeFetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`
        );
        const map = {};
        for (const [id, info] of Object.entries(raw)) {
          const sym = Object.entries(COINGECKO_ID_MAP).find(([, v]) => v === id)?.[0];
          if (sym) {
            map[sym] = {
              sym,
              price: info.usd || 0,
              chg: +(info.usd_24h_change || 0).toFixed(2),
              mcap: info.usd_market_cap || 0,
            };
          }
        }
        if (active) setData((prev) => ({ ...prev, ...map }));
        setStatus((s) => ({
          ...s,
          status: AGENT_STATUS.success,
          last: new Date().toLocaleTimeString('fr-FR'),
          fetches: s.fetches + 1,
          lat: Math.round((s.lat + (Date.now() - t0)) / 2),
        }));
      } catch {
        setStatus((s) => ({ ...s, status: AGENT_STATUS.error, errs: s.errs + 1 }));
      }
    };

    fetchAll();
    const iv = setInterval(fetchAll, intervalMs);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [symbols.join(','), intervalMs]);

  // Merge Binance WS on top of CoinGecko REST
  const merged = useMemo(() => {
    const result = { ...data };
    for (const [sym, ws] of Object.entries(binancePrices)) {
      if (result[sym]) {
        result[sym] = { ...result[sym], price: ws.price, chg: ws.chg };
      } else {
        result[sym] = { sym, price: ws.price, chg: ws.chg };
      }
    }
    return result;
  }, [data, binancePrices]);

  return { data: merged, status };
}

// ═══════════════════════════════════════════════════════════════
//  AGENT 3 — FOREX (Frankfurter — unlimited, no key needed)
// ═══════════════════════════════════════════════════════════════

export function useForexAgent(intervalMs = 300000) {
  const [data, setData] = useState({});
  const [status, setStatus] = useState({
    status: AGENT_STATUS.idle,
    last: null,
    fetches: 0,
    errs: 0,
    lat: 0,
  });

  useEffect(() => {
    let active = true;

    const fetchAll = async () => {
      setStatus((s) => ({ ...s, status: AGENT_STATUS.fetching }));
      const t0 = Date.now();

      try {
        const [usd, eur] = await Promise.all([
          safeFetch('https://api.frankfurter.dev/v1/latest?base=USD'),
          safeFetch('https://api.frankfurter.dev/v1/latest?base=EUR'),
        ]);

        const map = {};
        if (usd?.rates) {
          Object.entries(usd.rates).forEach(([c, r]) => {
            map[`USD/${c}`] = { sym: `USD/${c}`, price: r };
          });
          if (usd.rates.EUR) map['EUR/USD'] = { sym: 'EUR/USD', price: +(1 / usd.rates.EUR).toFixed(4) };
          if (usd.rates.GBP) map['GBP/USD'] = { sym: 'GBP/USD', price: +(1 / usd.rates.GBP).toFixed(4) };
          if (usd.rates.JPY) map['USD/JPY'] = { sym: 'USD/JPY', price: usd.rates.JPY };
          if (usd.rates.CHF) map['USD/CHF'] = { sym: 'USD/CHF', price: usd.rates.CHF };
          if (usd.rates.CAD) map['USD/CAD'] = { sym: 'USD/CAD', price: usd.rates.CAD };
          if (usd.rates.AUD) map['AUD/USD'] = { sym: 'AUD/USD', price: +(1 / usd.rates.AUD).toFixed(4) };
        }
        if (eur?.rates) {
          Object.entries(eur.rates).forEach(([c, r]) => {
            map[`EUR/${c}`] = { sym: `EUR/${c}`, price: r };
          });
        }

        if (active) setData((prev) => ({ ...prev, ...map }));
        setStatus((s) => ({
          ...s,
          status: AGENT_STATUS.success,
          last: new Date().toLocaleTimeString('fr-FR'),
          fetches: s.fetches + 1,
          lat: Math.round((s.lat + (Date.now() - t0)) / 2),
        }));
      } catch {
        setStatus((s) => ({ ...s, status: AGENT_STATUS.error, errs: s.errs + 1 }));
      }
    };

    fetchAll();
    const iv = setInterval(fetchAll, intervalMs);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [intervalMs]);

  return { data, status };
}

// ═══════════════════════════════════════════════════════════════
//  AGENT 4 — COMMODITIES (gold-api.com + Finnhub ETFs)
// ═══════════════════════════════════════════════════════════════

export function useCommodityAgent(intervalMs = 60000) {
  const [data, setData] = useState({});
  const [status, setStatus] = useState({
    status: AGENT_STATUS.idle,
    last: null,
    fetches: 0,
    errs: 0,
    lat: 0,
  });

  useEffect(() => {
    let active = true;
    const metals = [
      ['XAU', 'Or (Gold)', '🥇'],
      ['XAG', 'Argent (Silver)', '🥈'],
      ['XPT', 'Platine', '⬜'],
      ['XPD', 'Palladium', '🔘'],
    ];

    const fetchAll = async () => {
      setStatus((s) => ({ ...s, status: AGENT_STATUS.fetching }));
      const t0 = Date.now();
      let success = 0;

      // 1) Metals via gold-api.com
      for (const [sym, name, emoji] of metals) {
        if (!active) break;
        try {
          const raw = await safeFetch(`https://api.gold-api.com/price/${sym}`);
          if (raw?.price) {
            setData((prev) => ({
              ...prev,
              [`${sym}/USD`]: {
                sym: `${sym}/USD`,
                price: raw.price,
                chg: raw.chp || 0,
                name,
                emoji,
              },
            }));
            success++;
          }
        } catch {}
        await new Promise((r) => setTimeout(r, 500));
      }

      // 2) ETFs via Finnhub
      if (LIVE_CONFIG.FINNHUB_KEY) {
        const etfs = [
          ['USO', 'CL', 'Pétrole WTI', '🛢️'],
          ['UNG', 'NG', 'Gaz Naturel', '🔥'],
          ['WEAT', 'WHEAT', 'Blé', '🌾'],
        ];
        for (const [etf, sym, name, emoji] of etfs) {
          if (!active) break;
          try {
            const raw = await safeFetch(
              `https://finnhub.io/api/v1/quote?symbol=${etf}&token=${LIVE_CONFIG.FINNHUB_KEY}`
            );
            if (raw?.c) {
              setData((prev) => ({
                ...prev,
                [sym]: { sym, price: raw.c, chg: raw.dp || 0, name, emoji },
              }));
              success++;
            }
          } catch {}
          await new Promise((r) => setTimeout(r, 1100));
        }
      }

      setStatus((s) => ({
        ...s,
        status: success > 0 ? AGENT_STATUS.success : AGENT_STATUS.error,
        last: new Date().toLocaleTimeString('fr-FR'),
        fetches: s.fetches + 1,
        lat: Math.round((s.lat + (Date.now() - t0)) / 2),
      }));
    };

    fetchAll();
    const iv = setInterval(fetchAll, intervalMs);
    return () => {
      active = false;
      clearInterval(iv);
    };
  }, [intervalMs]);

  return { data, status };
}

// ═══════════════════════════════════════════════════════════════
//  COMBINED HOOK — All 4 agents in one
// ═══════════════════════════════════════════════════════════════

export function useAllLiveAgents(options = {}) {
  const {
    stockSymbols = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN', 'META', 'JPM', 'V', 'JNJ'],
    cryptoSymbols = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK'],
    stockInterval = 30000,
    cryptoInterval = 60000,
    forexInterval = 300000,
    commodityInterval = 60000,
  } = options;

  const stockAgent = useStockAgent(stockSymbols, stockInterval);
  const cryptoAgent = useCryptoAgent(cryptoSymbols, cryptoInterval);
  const forexAgent = useForexAgent(forexInterval);
  const commodityAgent = useCommodityAgent(commodityInterval);

  const agents = useMemo(
    () => [
      { name: 'Agent Actions', icon: '📊', color: '#6BA5FF', ...stockAgent.status },
      { name: 'Agent Crypto', icon: '₿', color: '#F5B731', ...cryptoAgent.status },
      { name: 'Agent Forex', icon: '💱', color: '#26A69A', ...forexAgent.status },
      { name: 'Agent Commodités', icon: '🏆', color: '#EF5350', ...commodityAgent.status },
    ],
    [stockAgent.status, cryptoAgent.status, forexAgent.status, commodityAgent.status]
  );

  const activeCount = agents.filter((a) => a.status === 'success').length;

  return {
    stocks: stockAgent,
    crypto: cryptoAgent,
    forex: forexAgent,
    commodities: commodityAgent,
    agents,
    activeCount,
  };
}
