import { useState, useCallback, useMemo, useEffect } from "react";
import { C } from "./data/constants";
import { fUSD, fmt } from "./utils";
import { useRealMarket } from "./hooks/useRealMarket";
import { Dashboard } from "./pages/Dashboard";
import { AssetPage } from "./pages/AssetPage";
import { OrderTicket } from "./pages/OrderTicket";
import { Portfolio } from "./pages/Portfolio";
import { Strategies } from "./pages/Strategies";
import { WalletPage } from "./pages/WalletPage";
import { DepositPage } from "./pages/DepositPage";
import { CollectPage } from "./pages/CollectPage";
import { SendPage } from "./pages/SendPage";
import { ExchangePage } from "./pages/ExchangePage";
import { Settings } from "./pages/Settings";
import { LoginPage } from "./pages/LoginPage";
import { API_BASE } from "./config";

// ── Nav items ──
const NAV = [
    { id: "home", label: "Home", icon: "⌂" },
    { id: "markets", label: "Markets", icon: "◈" },
    { id: "portfolio", label: "Portfolio", icon: "◰" },
    { id: "strategies", label: "Strategies", icon: "◎" },
];

const TABS = {
    index:     { label: "Indices",      icon: "📈", data: "indices" },
    crypto:    { label: "Crypto",       icon: "₿",  data: "cryptos" },
    forex:     { label: "Forex",        icon: "💱", data: "forex" },
    commodity: { label: "Matières 1res", icon: "🏆", data: "comms" },
};

export default function App() {
    // ── Auth state ──
    const [authToken, setAuthToken] = useState(() => {
        try { return localStorage.getItem("kingest_auth_token") || null; } catch { return null; }
    });
    const [userEmail, setUserEmail] = useState(() => {
        try { return localStorage.getItem("kingest_user_email") || ""; } catch { return ""; }
    });

    const handleAuth = (token, email) => {
        setAuthToken(token);
        setUserEmail(email);
    };

    const handleLogout = () => {
        setAuthToken(null);
        setUserEmail("");
        try {
            localStorage.removeItem("kingest_auth_token");
            localStorage.removeItem("kingest_user_email");
            localStorage.removeItem("kingest_user_id");
        } catch {}
    };

    // ── Show login if not authenticated ──
    if (!authToken) {
        return <LoginPage onAuth={handleAuth} />;
    }

    // Real market data ONLY — no simulation
    const { stocks, cryptos, forex, comms, indices, exchanges, isLive, lastUpdate, error: marketError, debug: marketDebug, loading } = useRealMarket(30000);

    const DATA = { stocks, cryptos, forex, comms, indices };

    // ── Persistence helpers ──
    const loadState = (key, fallback) => {
        try { const v = localStorage.getItem("kingest_" + key); return v ? JSON.parse(v) : fallback; } catch { return fallback; }
    };
    const saveState = (key, val) => {
        try { localStorage.setItem("kingest_" + key, JSON.stringify(val)); } catch {}
    };

    const [page, setPage] = useState("home");
    const [tab, setTab] = useState("index");
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [selectedType, setSelectedType] = useState("stock");
    const [orderConfig, setOrderConfig] = useState(null);
    const [balance, setBalance] = useState(() => loadState("balance", 0));
    const [walletBalances, setWalletBalances] = useState(() => loadState("walletBalances", { USD: 0, EUR: 0, BTC: 0, ETH: 0, USDT: 0, USDC: 0 }));
    const [transactions, setTransactions] = useState(() => loadState("transactions", []));
    const [positions, setPositions] = useState(() => loadState("positions", []));
    const [toasts, setToasts] = useState([]);
    const [search, setSearch] = useState("");
    const [visibleCount, setVisibleCount] = useState(50);
    const [selectedExchange, setSelectedExchange] = useState(null);
    const [savedCard, setSavedCard] = useState(() => loadState("savedCard", null));

    // Keep balance synced with walletBalances.USD
    useEffect(() => { setBalance(walletBalances.USD); }, [walletBalances]);

    // ── Auto-save to localStorage ──
    useEffect(() => { saveState("walletBalances", walletBalances); }, [walletBalances]);
    useEffect(() => { saveState("balance", balance); }, [balance]);
    useEffect(() => { saveState("transactions", transactions); }, [transactions]);
    useEffect(() => { saveState("positions", positions); }, [positions]);
    useEffect(() => { saveState("savedCard", savedCard); }, [savedCard]);

    const addTransaction = useCallback((tx) => {
        setTransactions(prev => [{ id: Date.now(), date: new Date().toISOString(), status: "completed", ...tx }, ...prev]);
    }, []);

    const toast = useCallback((m, t = "success") => {
        const id = Date.now();
        setToasts(p => [...p, { id, m, t }]);
        setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 4000);
    }, []);

    // ── Trade execution ──
    const executeTrade = useCallback((trade) => {
        if (trade.amount > walletBalances.USD) { toast("Solde insuffisant", "error"); return; }
        setWalletBalances(wb => ({ ...wb, USD: wb.USD - trade.amount }));
        const liqPrice = trade.leverage > 1
            ? (trade.side === "long"
                ? trade.price * (1 - 0.9 / trade.leverage)
                : trade.price * (1 + 0.9 / trade.leverage))
            : null;
        setPositions(p => [...p, {
            id: Date.now(), sym: trade.asset.sym, name: trade.asset.name,
            color: trade.asset.color || C.primary, logo: trade.asset.logo,
            emoji: trade.asset.emoji,
            mode: trade.mode, side: trade.mode === "short" ? "short" : "long",
            amount: trade.amount, leverage: trade.leverage,
            entryPrice: trade.price, units: trade.amount * trade.leverage / trade.price,
            liquidation: liqPrice, type: trade.type || "stock",
            stopLoss: trade.stopLoss || null, takeProfit: trade.takeProfit || null,
            time: new Date().toISOString(),
        }]);
        const label = trade.mode === "spot" ? "BUY" : trade.mode === "long" ? "LONG" : "SHORT";
        toast(`${label} ${trade.asset.sym} — ${fUSD(trade.amount)} ×${trade.leverage}`);
        addTransaction({ type: "trade", amount: trade.amount, currency: "USD", method: label, desc: `${label} ${trade.asset.sym}` });
        setOrderConfig(null);
        setPage("portfolio");
    }, [walletBalances, toast, addTransaction]);

    // ── P&L calculation ──
    const allAssets = useMemo(() => [...stocks, ...cryptos, ...forex, ...comms, ...indices], [stocks, cryptos, forex, comms, indices]);

    const getPnl = useCallback((pos) => {
        const live = allAssets.find(a => a.sym === pos.sym);
        const cur = live ? live.price : pos.entryPrice;
        if (pos.side === "long") return ((cur - pos.entryPrice) / pos.entryPrice) * pos.amount * pos.leverage;
        return ((pos.entryPrice - cur) / pos.entryPrice) * pos.amount * pos.leverage;
    }, [allAssets]);

    // ── Close position ──
    const closePosition = useCallback((id) => {
        setPositions(p => {
            const pos = p.find(x => x.id === id);
            if (pos) {
                const pnl = getPnl(pos);
                setWalletBalances(wb => ({ ...wb, USD: wb.USD + pos.amount + pnl }));
                addTransaction({ type: "close", amount: pos.amount + pnl, currency: "USD", method: "Close", desc: `Close ${pos.sym}` });
                toast(`${pos.sym} fermé — P&L: ${pnl >= 0 ? "+" : ""}${fUSD(pnl)}`);
            }
            return p.filter(x => x.id !== id);
        });
    }, [getPnl, toast, addTransaction]);

    // ── Portfolio metrics ──
    const metrics = useMemo(() => {
        const totalPnl = positions.reduce((s, p) => s + getPnl(p), 0);
        const invested = positions.reduce((s, p) => s + p.amount, 0);
        const spotExposure = positions.filter(p => p.mode === "spot").reduce((s, p) => s + p.amount, 0);
        const levExposure = positions.filter(p => p.mode !== "spot").reduce((s, p) => s + p.amount * p.leverage, 0);
        const totalEquity = balance + invested + totalPnl;
        const totalReturn = invested > 0 ? (totalPnl / invested) * 100 : 0;
        return { totalEquity, totalPnl, dailyPnl: totalPnl * 0.12, totalReturn, spotExposure, levExposure, usedMargin: invested, freeMargin: balance };
    }, [positions, balance, getPnl]);

    // ── Filtered assets for market view ──
    const filtered = useMemo(() => {
        const dataKey = TABS[tab].data;
        let d = DATA[dataKey] || [];
        if (search) {
            const q = search.toLowerCase();
            d = d.filter(a => a.sym.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
        }
        return d;
    }, [tab, search, stocks, cryptos, forex, comms, indices]);

    // ── Navigation handlers ──
    const openAsset = (sym, type) => {
        setSelectedAsset(sym);
        setSelectedType(type || "stock");
        setPage("asset");
    };
    const openOrder = (asset, mode, type) => {
        setOrderConfig({ asset, mode, type: type || "stock" });
        setPage("trade");
    };
    const openExchange = (exchangeCode) => {
        setSelectedExchange(exchangeCode);
        setPage("exchange");
    };
    const navigate = (p) => {
        setPage(p);
        if (p !== "asset" && p !== "trade" && p !== "exchange") { setSelectedAsset(null); setOrderConfig(null); setSelectedExchange(null); }
    };

    // Find current asset across all data
    const findAsset = (sym) => allAssets.find(a => a.sym === sym);
    const currentAsset = selectedAsset ? findAsset(selectedAsset) : null;
    const orderAsset = orderConfig ? (findAsset(orderConfig.asset.sym) || orderConfig.asset) : null;

    return (
        <div style={{
            width: "100vw", height: "100vh",
            background: "linear-gradient(180deg, #040c1a 0%, #020817 50%, #010510 100%)",
            fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif",
            display: "flex", flexDirection: "column", overflow: "hidden", color: C.text
        }}>
            <style>{`
                @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
                @keyframes pulse { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
                @keyframes toastIn { from { transform:translateX(120%); } to { transform:translateX(0); } }
                @keyframes glowPulse { 0%,100% { box-shadow: 0 0 12px rgba(107,165,255,0.15); } 50% { box-shadow: 0 0 20px rgba(107,165,255,0.25); } }
                * { box-sizing:border-box; margin:0; padding:0; }
                ::-webkit-scrollbar { width:4px; }
                ::-webkit-scrollbar-track { background:transparent; }
                ::-webkit-scrollbar-thumb { background:rgba(107,165,255,0.15); border-radius:2px; }
                input::placeholder { color:rgba(136,153,170,0.4); }
                button { font-family:inherit; cursor:pointer; border:none; }
            `}</style>

            {/* ── MAIN CONTENT ── */}
            <div style={{ flex: 1, overflow: "auto", paddingBottom: "90px" }}>
                {page === "home" && (
                    <Dashboard
                        stocks={stocks} cryptos={cryptos} forex={forex} comms={comms}
                        indices={indices} exchanges={exchanges}
                        metrics={metrics} positions={positions} getPnl={getPnl}
                        onOpenAsset={openAsset} onOpenOrder={openOrder} onNav={navigate}
                        onOpenExchange={openExchange}
                        isLive={isLive} lastUpdate={lastUpdate} marketDebug={marketDebug}
                        setTab={setTab}
                    />
                )}
                {page === "markets" && (
                    <Dashboard
                        stocks={stocks} cryptos={cryptos} forex={forex} comms={comms}
                        indices={indices} exchanges={exchanges}
                        metrics={metrics} positions={positions} getPnl={getPnl}
                        onOpenAsset={openAsset} onOpenOrder={openOrder} onNav={navigate}
                        onOpenExchange={openExchange}
                        isLive={isLive} lastUpdate={lastUpdate} marketDebug={marketDebug}
                        marketView tab={tab} setTab={setTab}
                        filtered={filtered} search={search} setSearch={setSearch}
                        visibleCount={visibleCount} setVisibleCount={setVisibleCount}
                    />
                )}
                {page === "exchange" && selectedExchange && (
                    <ExchangePage
                        index={indices.find(i => i.exchangeCode === selectedExchange)}
                        stocks={stocks}
                        exchangeInfo={exchanges[selectedExchange]}
                        onBack={() => navigate("home")}
                        onOpenAsset={openAsset}
                        onOpenOrder={openOrder}
                    />
                )}
                {page === "asset" && currentAsset && (
                    <AssetPage asset={currentAsset} type={selectedType} onBack={() => navigate("home")} onOrder={(a, mode) => openOrder(a, mode, selectedType)} />
                )}
                {page === "trade" && orderAsset && (
                    <OrderTicket
                        asset={orderAsset} mode={orderConfig?.mode || "spot"} type={orderConfig?.type || "stock"}
                        balance={balance} usedMargin={metrics.usedMargin}
                        onExecute={executeTrade} onBack={() => navigate("home")}
                    />
                )}
                {page === "portfolio" && (
                    <Portfolio
                        positions={positions} allAssets={allAssets} balance={balance}
                        metrics={metrics} getPnl={getPnl} onClose={closePosition}
                        onOpenAsset={openAsset}
                    />
                )}
                {page === "strategies" && (
                    <Strategies onBack={() => navigate("home")} />
                )}
                {page === "wallet" && (
                    <WalletPage
                        walletBalances={walletBalances}
                        transactions={transactions}
                        onBack={() => navigate("home")}
                        onNav={navigate}
                    />
                )}
                {page === "deposit" && (
                    <DepositPage
                        walletBalances={walletBalances}
                        savedCard={savedCard}
                        onBack={() => navigate("wallet")}
                        onDeposit={(amount, currency = "USD", method = "") => {
                            setWalletBalances(wb => ({ ...wb, [currency]: (wb[currency] || 0) + amount }));
                            addTransaction({ type: "deposit", amount, currency, method, desc: `Dépôt ${method}` });
                            navigate("wallet");
                        }}
                    />
                )}
                {page === "settings" && (
                    <Settings
                        savedCard={savedCard}
                        setSavedCard={setSavedCard}
                        onBack={() => navigate("wallet")}
                    />
                )}
                {page === "collect" && (
                    <CollectPage
                        walletBalances={walletBalances}
                        onBack={() => navigate("wallet")}
                        onWithdraw={(amount, currency = "USD", method = "") => {
                            setWalletBalances(wb => ({ ...wb, [currency]: Math.max(0, (wb[currency] || 0) - amount) }));
                            addTransaction({ type: "withdraw", amount, currency, method, desc: `Retrait ${method}` });
                            navigate("wallet");
                        }}
                    />
                )}
                {page === "send" && (
                    <SendPage
                        walletBalances={walletBalances}
                        onBack={() => navigate("wallet")}
                        onSend={(amount, currency, to) => {
                            setWalletBalances(wb => ({ ...wb, [currency]: Math.max(0, (wb[currency] || 0) - amount) }));
                            addTransaction({ type: "send", amount, currency, method: "P2P", desc: `Envoi à ${to}` });
                            navigate("wallet");
                        }}
                    />
                )}
            </div>

            {/* ── FLOATING BOTTOM NAV ── */}
            <div style={{
                position: "fixed", bottom: "12px", left: "16px", right: "16px",
                height: "76px",
                background: "linear-gradient(145deg, rgba(12,24,48,0.85), rgba(6,14,32,0.92))",
                backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
                borderRadius: "22px",
                border: "1px solid rgba(107,165,255,0.1)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                display: "flex", alignItems: "center",
                justifyContent: "space-around",
                paddingBottom: "0px",
                zIndex: 100,
                overflow: "hidden",
            }}>
                {/* Top edge glow */}
                <div style={{
                    position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                    background: "linear-gradient(90deg, transparent, rgba(107,165,255,0.2), transparent)",
                }} />

                {/* Accueil (Home) - Green */}
                <button onClick={() => navigate("home")} style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: "6px",
                    background: ["home", "markets", "asset", "trade"].includes(page)
                        ? "linear-gradient(135deg, #26A69A 0%, #1a7d7a 100%)"
                        : "linear-gradient(135deg, rgba(38,166,154,0.3) 0%, rgba(26,125,122,0.2) 100%)",
                    border: "none",
                    borderRadius: "16px",
                    margin: "8px",
                    padding: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: ["home", "markets", "asset", "trade"].includes(page)
                        ? "0 4px 16px rgba(38,166,154,0.4)"
                        : "none",
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                        color: ["home", "markets", "asset", "trade"].includes(page) ? "#fff" : "rgba(136,153,170,0.6)",
                    }}>
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span style={{
                        fontSize: "11px", fontWeight: 700,
                        color: ["home", "markets", "asset", "trade"].includes(page) ? "#fff" : "rgba(136,153,170,0.6)",
                        letterSpacing: "0.04em",
                    }}>Accueil</span>
                </button>

                {/* Portefeuille (Wallet) - Blue */}
                <button onClick={() => navigate("wallet")} style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: "6px",
                    background: ["wallet", "deposit", "collect", "send", "portfolio"].includes(page)
                        ? "linear-gradient(135deg, #6BA5FF 0%, #4a7fd9 100%)"
                        : "linear-gradient(135deg, rgba(107,165,255,0.3) 0%, rgba(74,127,217,0.2) 100%)",
                    border: "none",
                    borderRadius: "16px",
                    margin: "8px",
                    padding: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: ["wallet", "deposit", "collect", "send", "portfolio"].includes(page)
                        ? "0 4px 16px rgba(107,165,255,0.4)"
                        : "none",
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                        color: ["wallet", "deposit", "collect", "send", "portfolio"].includes(page) ? "#fff" : "rgba(136,153,170,0.6)",
                    }}>
                        <path d="M20 7.5V4a1 1 0 0 0-1-1h-3.21a1 1 0 0 0-.6.175l-.1.075A1 1 0 0 0 14 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7.5M7 10h6" />
                        <rect x="5" y="8" width="8" height="8" rx="1" />
                    </svg>
                    <span style={{
                        fontSize: "11px", fontWeight: 700,
                        color: ["wallet", "deposit", "collect", "send", "portfolio"].includes(page) ? "#fff" : "rgba(136,153,170,0.6)",
                        letterSpacing: "0.04em",
                    }}>Portefeuille</span>
                </button>

                {/* Paramètres (Settings) - Yellow */}
                <button onClick={() => navigate("settings")} style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: "6px",
                    background: page === "settings"
                        ? "linear-gradient(135deg, #FFD600 0%, #FFC107 100%)"
                        : "linear-gradient(135deg, rgba(255,214,0,0.3) 0%, rgba(255,193,7,0.2) 100%)",
                    border: "none",
                    borderRadius: "16px",
                    margin: "8px",
                    padding: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: page === "settings"
                        ? "0 4px 16px rgba(255,214,0,0.4)"
                        : "none",
                }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{
                        color: page === "settings" ? "#fff" : "rgba(136,153,170,0.6)",
                    }}>
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6M4.22 4.22l4.24 4.24m3.08 3.08l4.24 4.24M1 12h6m6 0h6m-1.78-7.78l-4.24 4.24m-3.08 3.08l-4.24 4.24" />
                    </svg>
                    <span style={{
                        fontSize: "11px", fontWeight: 700,
                        color: page === "settings" ? "#fff" : "rgba(136,153,170,0.6)",
                        letterSpacing: "0.04em",
                    }}>Paramètres</span>
                </button>
            </div>

            {/* ── TOASTS ── */}
            <div style={{ position: "fixed", top: "env(safe-area-inset-top, 12px)", left: "16px", right: "16px", display: "flex", flexDirection: "column", gap: "8px", zIndex: 3000, paddingTop: "12px" }}>
                {toasts.map(t => (
                    <div key={t.id} style={{
                        padding: "14px 18px", borderRadius: "12px", animation: "toastIn 0.3s ease-out",
                        backdropFilter: "blur(16px)",
                        background: t.t === "error" ? "rgba(239,83,80,0.15)" : "rgba(38,166,154,0.15)",
                        border: `1px solid ${t.t === "error" ? "rgba(239,83,80,0.3)" : "rgba(38,166,154,0.3)"}`,
                        color: t.t === "error" ? C.red : C.green, fontSize: "13px", fontWeight: 600, textAlign: "center"
                    }}>{t.m}</div>
                ))}
            </div>
        </div>
    );
}
