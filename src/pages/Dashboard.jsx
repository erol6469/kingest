import { useMemo } from "react";
import { C } from "../data/constants";
import { fUSD, fmt } from "../utils";
import { AssetLogo } from "../components/AssetLogo";
import { KingestLogo } from "../components/branding/KingestLogo";

// Real SVG market icons
const MarketIcon = ({ type, size = 24 }) => {
    const s = { width: size, height: size, display: "block" };
    if (type === "index") return (
        <svg viewBox="0 0 32 32" style={s}>
            <rect width="32" height="32" rx="8" fill="#1a1a2e"/>
            {/* Candlestick chart - green and red candles */}
            {/* Candle 1 - red (bearish) */}
            <line x1="6" y1="6" x2="6" y2="26" stroke="#EF5350" strokeWidth="1"/>
            <rect x="4" y="10" width="4" height="10" rx="0.5" fill="#EF5350"/>
            {/* Candle 2 - green (bullish) */}
            <line x1="12" y1="8" x2="12" y2="24" stroke="#26A69A" strokeWidth="1"/>
            <rect x="10" y="10" width="4" height="8" rx="0.5" fill="#26A69A"/>
            {/* Candle 3 - red */}
            <line x1="18" y1="5" x2="18" y2="25" stroke="#EF5350" strokeWidth="1"/>
            <rect x="16" y="8" width="4" height="12" rx="0.5" fill="#EF5350"/>
            {/* Candle 4 - green (tall bullish) */}
            <line x1="24" y1="4" x2="24" y2="22" stroke="#26A69A" strokeWidth="1"/>
            <rect x="22" y="6" width="4" height="12" rx="0.5" fill="#26A69A"/>
            {/* Candle 5 - green */}
            <line x1="29" y1="7" x2="29" y2="20" stroke="#26A69A" strokeWidth="1"/>
            <rect x="27.5" y="9" width="3" height="7" rx="0.5" fill="#26A69A"/>
        </svg>
    );
    if (type === "crypto") return (
        <svg viewBox="0 0 32 32" style={s}>
            {/* Solid orange Bitcoin circle like the real BTC logo */}
            <circle cx="16" cy="16" r="16" fill="#F7931A"/>
            {/* White ₿ symbol */}
            <path d="M20.2,14.2c0.3-1.7-1-2.6-2.8-3.2l0.6-2.3L16.5,8.3l-0.6,2.3c-0.4-0.1-0.8-0.2-1.2-0.3l0.6-2.3L13.8,7.6l-0.6,2.3c-0.3-0.1-0.7-0.2-1-0.2l0-0.01L10.3,9.1l-0.4,1.6c0,0,1.1,0.3,1.1,0.3c0.6,0.2,0.7,0.6,0.7,0.9l-0.7,2.8c0,0,0.1,0,0.1,0l-0.1,0l-1,3.9c-0.1,0.2-0.3,0.5-0.7,0.4c0,0-1.1-0.3-1.1-0.3L7.5,20.4l1.8,0.5c0.3,0.1,0.7,0.2,1,0.3l-0.6,2.3l1.5,0.4l0.6-2.3c0.4,0.1,0.8,0.2,1.2,0.3l-0.6,2.3l1.5,0.4l0.6-2.3c2.5,0.5,4.3,0.3,5.1-2c0.6-1.8,0-2.8-1.4-3.5C19.7,16.4,20.5,15.5,20.2,14.2z M17.6,18.8c-0.4,1.8-3.5,0.8-4.5,0.6l0.8-3.2c1,0.2,4.2,0.7,3.7,2.6z M18,14.1c-0.4,1.6-3,0.8-3.8,0.6l0.7-2.9c0.8,0.2,3.5,0.6,3.1,2.3z" fill="white"/>
        </svg>
    );
    if (type === "forex") return (
        <svg viewBox="0 0 32 32" style={s}>
            <rect width="32" height="32" rx="8" fill="#26A69A" opacity="0.15"/>
            {/* Currency symbols only - bigger and centered */}
            <text x="4" y="15" fontSize="10" fontWeight="800" fill="#26A69A" fontFamily="-apple-system,sans-serif">$</text>
            <text x="13" y="13" fontSize="10" fontWeight="800" fill="#6BA5FF" fontFamily="-apple-system,sans-serif">€</text>
            <text x="22" y="15" fontSize="10" fontWeight="800" fill="#FFB300" fontFamily="-apple-system,sans-serif">£</text>
            <text x="6" y="26" fontSize="9" fontWeight="800" fill="#FF6B9D" fontFamily="-apple-system,sans-serif">¥</text>
            <text x="17" y="26" fontSize="9" fontWeight="800" fill="#8247E5" fontFamily="-apple-system,sans-serif">₩</text>
        </svg>
    );
    if (type === "commodity") return (
        <svg viewBox="0 0 32 32" style={s}>
            <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FFE082"/>
                    <stop offset="50%" stopColor="#FFD700"/>
                    <stop offset="100%" stopColor="#F9A825"/>
                </linearGradient>
                <linearGradient id="oilGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5C6BC0"/>
                    <stop offset="100%" stopColor="#283593"/>
                </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="#1B1B2F"/>
            {/* Gold bar - 3D perspective */}
            <path d="M3,22 L7,15 L19,15 L23,22 Z" fill="url(#goldGrad)"/>
            <path d="M7,15 L9,13 L21,13 L19,15 Z" fill="#FFE082"/>
            <path d="M19,15 L21,13 L25,20 L23,22 Z" fill="#F9A825"/>
            {/* Gold shine */}
            <path d="M8,16 L10,16 L9,18 Z" fill="#FFF8E1" opacity="0.5"/>
            {/* Oil barrel */}
            <ellipse cx="27" cy="11" rx="4" ry="2" fill="url(#oilGrad)"/>
            <rect x="23" y="11" width="8" height="12" fill="url(#oilGrad)"/>
            <ellipse cx="27" cy="23" rx="4" ry="2" fill="#283593"/>
            <ellipse cx="27" cy="11" rx="3" ry="1.2" fill="#7986CB" opacity="0.4"/>
            {/* Barrel bands */}
            <line x1="23" y1="15" x2="31" y2="15" stroke="#9FA8DA" strokeWidth="0.5" opacity="0.5"/>
            <line x1="23" y1="19" x2="31" y2="19" stroke="#9FA8DA" strokeWidth="0.5" opacity="0.5"/>
        </svg>
    );
    return null;
};

const TABS = {
    index:     { label: "Indices",       icon: "index" },
    crypto:    { label: "Crypto",        icon: "crypto" },
    forex:     { label: "Forex",         icon: "forex" },
    commodity: { label: "Matières", icon: "commodity" },
};

// Country flag emojis for exchange explorer
const FLAGS = {
    us: "🇺🇸", fr: "🇫🇷", gb: "🇬🇧", jp: "🇯🇵", de: "🇩🇪",
    hk: "🇭🇰", sg: "🇸🇬", ch: "🇨🇭", in: "🇮🇳", it: "🇮🇹",
};

/* ═══════════════════════════════════════
   3D Premium Design System
   ═══════════════════════════════════════ */

const S = {
    // Layered backgrounds
    bgDeep: "#020817",
    bgMid: "#06142f",
    bgSurface: "#0a1f44",

    // Card styles
    cardBg: "linear-gradient(145deg, rgba(12,28,56,0.85), rgba(8,18,38,0.95))",
    cardBorder: "rgba(107,165,255,0.08)",
    cardShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
    cardInner: "inset 0 1px 0 rgba(255,255,255,0.04)",

    // Hero card
    heroBg: "linear-gradient(145deg, rgba(15,35,70,0.9), rgba(8,20,45,0.95))",
    heroBorder: "1px solid rgba(107,165,255,0.12)",
    heroShadow: "0 12px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(107,165,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
    heroGlow: "0 0 60px rgba(107,165,255,0.04)",

    // Accent glows
    cyanGlow: "rgba(107,165,255,0.08)",
    indigoGlow: "rgba(99,102,241,0.06)",

    // Premium borders
    borderShine: "rgba(255,255,255,0.06)",
    borderGlass: "rgba(255,255,255,0.03)",
};

// ── Premium Stat Card ──
function StatCard({ label, value, color, icon }) {
    return (
        <div style={{
            flex: 1, minWidth: "45%", padding: "14px 16px",
            background: S.cardBg,
            border: `1px solid ${S.cardBorder}`,
            borderRadius: "16px",
            boxShadow: `${S.cardShadow}, ${S.cardInner}`,
            position: "relative",
            overflow: "hidden",
        }}>
            {/* Top shine line */}
            <div style={{
                position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                background: "linear-gradient(90deg, transparent, rgba(107,165,255,0.15), transparent)"
            }} />
            <div style={{
                fontSize: "9px", color: C.textDim, fontWeight: 600,
                textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px"
            }}>{label}</div>
            <div style={{
                fontSize: "17px", fontWeight: 800,
                color: color || C.text,
                textShadow: color ? `0 0 20px ${color}33` : "none"
            }}>{value}</div>
        </div>
    );
}

// ── Premium Asset Row ──
function AssetRow({ asset, type, onTap }) {
    const isUp = asset.chg >= 0;
    return (
        <div onClick={onTap} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", marginBottom: "6px",
            background: "rgba(12,28,56,0.4)",
            borderRadius: "14px",
            border: `1px solid ${S.borderGlass}`,
            cursor: "pointer",
            transition: "all 0.2s ease",
        }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {/* Logo with 3D capsule */}
                <div style={{
                    borderRadius: "50%",
                    boxShadow: `0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)`,
                }}>
                    {type === "index" && asset.flag ? (
                        <div style={{
                            width: 40, height: 40, borderRadius: "50%",
                            background: "rgba(107,165,255,0.1)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "22px",
                        }}>{FLAGS[asset.flag] || "🌐"}</div>
                    ) : (
                        <AssetLogo asset={asset} type={type} size={40} />
                    )}
                </div>
                <div>
                    <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
                        {(type === "index" || type === "commodity") ? asset.name : asset.sym}
                    </div>
                    <div style={{
                        fontSize: "11px", color: C.textDim, maxWidth: "140px",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                    }}>{(type === "index" || type === "commodity") ? asset.sym : asset.name}</div>
                </div>
            </div>
            <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
                    {type === "forex" ? asset.price.toFixed(4) : type === "index" ? fmt(asset.price) : "$" + fmt(asset.price)}
                </div>
                <div style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: "8px", marginTop: "2px",
                    fontSize: "11px", fontWeight: 700,
                    color: isUp ? C.green : C.red,
                    background: isUp ? "rgba(38,166,154,0.1)" : "rgba(239,83,80,0.1)",
                }}>
                    {isUp ? "+" : ""}{asset.chg}%
                </div>
            </div>
        </div>
    );
}

// ── Position Row ──
function PositionRow({ pos, pnl, onTap }) {
    const isUp = pnl >= 0;
    return (
        <div onClick={onTap} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", marginBottom: "6px",
            background: "rgba(12,28,56,0.4)",
            borderRadius: "14px",
            border: `1px solid ${S.borderGlass}`,
            cursor: "pointer",
        }}>
            <div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>{pos.sym}</div>
                <div style={{ fontSize: "11px", color: C.textDim }}>
                    {pos.mode === "spot" ? "Spot" : pos.side === "long" ? `Long ×${pos.leverage}` : `Short ×${pos.leverage}`} · {fUSD(pos.amount)}
                </div>
            </div>
            <div style={{ textAlign: "right" }}>
                <div style={{
                    fontSize: "14px", fontWeight: 700,
                    color: isUp ? C.green : C.red,
                    textShadow: `0 0 12px ${isUp ? "rgba(38,166,154,0.3)" : "rgba(239,83,80,0.3)"}`
                }}>
                    {isUp ? "+" : ""}{fUSD(pnl)}
                </div>
                <div style={{ fontSize: "10px", color: C.textDim }}>{((pnl / pos.amount) * 100).toFixed(2)}%</div>
            </div>
        </div>
    );
}

// ── Section Header ──
function SectionHeader({ title, action, onAction }) {
    return (
        <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            marginBottom: "14px", paddingLeft: "4px"
        }}>
            <span style={{
                fontSize: "11px", fontWeight: 700, color: "rgba(107,165,255,0.7)",
                textTransform: "uppercase", letterSpacing: "0.12em"
            }}>{title}</span>
            {action && (
                <button onClick={onAction} style={{
                    background: "none", color: C.primary, fontSize: "11px", fontWeight: 600,
                    opacity: 0.7
                }}>{action}</button>
            )}
        </div>
    );
}

// ══════════════════════════════════════
// ── DASHBOARD
// ══════════════════════════════════════
function Dashboard({
    stocks, cryptos, forex, comms, indices, exchanges, metrics, positions, getPnl,
    onOpenAsset, onOpenOrder, onNav, onOpenExchange,
    isLive, lastUpdate, marketDebug,
    marketView, tab, setTab, filtered, search, setSearch, visibleCount, setVisibleCount
}) {
    const m = metrics;
    const pnlColor = m.totalPnl >= 0 ? C.green : C.red;

    const topPositions = useMemo(() => {
        return positions.slice().sort((a, b) => Math.abs(getPnl(b)) - Math.abs(getPnl(a))).slice(0, 5);
    }, [positions, getPnl]);

    const topMovers = useMemo(() => {
        return [...stocks.slice(0, 20), ...cryptos.slice(0, 10)]
            .sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg))
            .slice(0, 8);
    }, [stocks, cryptos]);

    // ── MARKET VIEW ──
    if (marketView) {
        const currentTab = tab || "stock";
        const list = filtered || [];
        const shown = list.slice(0, visibleCount || 50);
        const hasMore = shown.length < list.length;

        return (
            <div style={{ padding: "20px 16px", animation: "fadeIn 0.2s ease" }}>
                {/* Search - premium glass style */}
                <div style={{ position: "relative", marginBottom: "16px" }}>
                    <span style={{
                        position: "absolute", left: "16px", top: "50%",
                        transform: "translateY(-50%)", fontSize: "14px", opacity: 0.3
                    }}>🔍</span>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Rechercher un actif..."
                        style={{
                            width: "100%", padding: "14px 16px 14px 44px",
                            background: "rgba(12,28,56,0.6)",
                            border: `1px solid ${S.cardBorder}`,
                            borderRadius: "16px", color: C.text, fontSize: "14px",
                            outline: "none",
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                        }} />
                </div>

                {/* Tabs - 3D capsules */}
                <div style={{
                    display: "flex", gap: "8px", marginBottom: "20px",
                    overflowX: "auto", WebkitOverflowScrolling: "touch", paddingBottom: "4px"
                }}>
                    {Object.entries(TABS).map(([k, v]) => {
                        const active = currentTab === k;
                        return (
                            <button key={k}
                                onClick={() => { setTab(k); if (setVisibleCount) setVisibleCount(50); }}
                                style={{
                                    padding: "10px 18px", borderRadius: "14px",
                                    fontSize: "12px", fontWeight: 700, flexShrink: 0,
                                    display: "flex", alignItems: "center", gap: "6px",
                                    background: active
                                        ? "linear-gradient(145deg, rgba(107,165,255,0.15), rgba(107,165,255,0.05))"
                                        : "rgba(12,28,56,0.5)",
                                    color: active ? "#fff" : C.textDim,
                                    border: `1px solid ${active ? "rgba(107,165,255,0.25)" : S.borderGlass}`,
                                    boxShadow: active
                                        ? "0 4px 16px rgba(107,165,255,0.1), inset 0 1px 0 rgba(255,255,255,0.06)"
                                        : "none",
                                }}>
                                <MarketIcon type={v.icon} size={18} /> {v.label}
                                <span style={{
                                    fontSize: "10px", opacity: 0.5,
                                    background: active ? "rgba(255,255,255,0.1)" : "transparent",
                                    padding: "1px 6px", borderRadius: "6px"
                                }}>
                                    {active ? list.length : "—"}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Asset List */}
                {shown.map((a, i) => (
                    <AssetRow key={a.sym + i} asset={a} type={currentTab}
                        onTap={() => {
                            if (currentTab === "index" && a.exchangeCode && onOpenExchange) {
                                onOpenExchange(a.exchangeCode);
                            } else {
                                onOpenAsset(a.sym, currentTab);
                            }
                        }} />
                ))}

                {hasMore && (
                    <button onClick={() => setVisibleCount(v => v + 50)} style={{
                        width: "100%", padding: "14px", marginTop: "10px", borderRadius: "14px",
                        background: "linear-gradient(145deg, rgba(107,165,255,0.08), rgba(107,165,255,0.03))",
                        border: `1px solid rgba(107,165,255,0.12)`,
                        color: C.primary, fontSize: "13px", fontWeight: 700,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                    }}>
                        Voir plus ({list.length - shown.length} restants)
                    </button>
                )}
            </div>
        );
    }

    // ══════════════════════════════════════
    // ── HOME VIEW - Ultra Premium 3D
    // ══════════════════════════════════════
    return (
        <div style={{
            padding: "24px 16px", animation: "fadeIn 0.3s ease",
            /* Multi-layer background */
            background: `
                radial-gradient(ellipse at 50% 0%, rgba(107,165,255,0.04) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 100%, rgba(99,102,241,0.03) 0%, transparent 50%),
                linear-gradient(180deg, #040c1a 0%, #020817 100%)
            `,
            minHeight: "100%",
        }}>

            {/* ═══ HERO — Logo + Balance + Actions ═══ */}
            <div style={{
                position: "relative",
                padding: "24px 20px 20px",
                marginBottom: "20px",
                borderRadius: "24px",
                background: S.heroBg,
                border: S.heroBorder,
                boxShadow: S.heroShadow,
                overflow: "hidden",
            }}>
                {/* Top edge glow */}
                <div style={{
                    position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                    background: "linear-gradient(90deg, transparent, rgba(107,165,255,0.3), rgba(99,102,241,0.2), transparent)",
                }} />
                {/* Ambient glow */}
                <div style={{
                    position: "absolute", top: "-40%", left: "15%", right: "15%",
                    height: "80%", borderRadius: "50%",
                    background: "radial-gradient(ellipse, rgba(107,165,255,0.06) 0%, transparent 70%)",
                    pointerEvents: "none",
                }} />
                {/* Bottom shine */}
                <div style={{
                    position: "absolute", bottom: 0, left: "10%", right: "10%", height: "1px",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
                }} />

                {/* Logo centered */}
                <div style={{
                    display: "flex", justifyContent: "center", marginBottom: "10px",
                    position: "relative",
                }}>
                    <KingestLogo size={32} variant="full" glow />
                </div>

                {/* Live market indicator */}
                <div style={{
                    display: "flex", alignItems: "center", justifyContent: "center",
                    gap: "6px", marginBottom: "12px",
                }}>
                    <div style={{
                        width: "6px", height: "6px", borderRadius: "50%",
                        background: isLive ? "#26A69A" : "#EF5350",
                        boxShadow: isLive ? "0 0 8px rgba(38,166,154,0.6)" : "0 0 8px rgba(239,83,80,0.4)",
                        animation: "pulse 2s infinite",
                    }} />
                    <span style={{
                        fontSize: "9px", fontWeight: 700, letterSpacing: "0.08em",
                        color: isLive ? "rgba(38,166,154,0.8)" : "rgba(239,83,80,0.7)",
                        textTransform: "uppercase",
                    }}>
                        {isLive ? "Live Market" : "Simulated"}
                    </span>
                    {lastUpdate && (
                        <span style={{ fontSize: "9px", color: "rgba(136,153,170,0.4)" }}>
                            {lastUpdate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                    )}
                </div>
                {/* Balance */}
                <div style={{ textAlign: "center", position: "relative", marginBottom: "6px" }}>
                    <div style={{
                        fontSize: "34px", fontWeight: 900, color: "#fff",
                        letterSpacing: "-0.02em",
                        textShadow: "0 2px 24px rgba(107,165,255,0.15)",
                    }}>{fUSD(m.totalEquity)}</div>
                </div>

                {/* P&L capsule */}
                <div style={{ textAlign: "center", marginBottom: "20px", position: "relative" }}>
                    <div style={{
                        display: "inline-flex", alignItems: "center", gap: "6px",
                        padding: "5px 14px", borderRadius: "20px",
                        background: m.totalPnl >= 0 ? "rgba(38,166,154,0.1)" : "rgba(239,83,80,0.1)",
                        border: `1px solid ${m.totalPnl >= 0 ? "rgba(38,166,154,0.2)" : "rgba(239,83,80,0.2)"}`,
                    }}>
                        <span style={{
                            fontSize: "12px", fontWeight: 700, color: pnlColor,
                            textShadow: `0 0 12px ${pnlColor}44`
                        }}>
                            {m.totalPnl >= 0 ? "▲" : "▼"} {m.totalPnl >= 0 ? "+" : ""}{fUSD(m.totalPnl)}
                        </span>
                        <span style={{ fontSize: "10px", color: pnlColor, opacity: 0.7 }}>
                            ({m.totalReturn >= 0 ? "+" : ""}{m.totalReturn.toFixed(2)}%)
                        </span>
                    </div>
                </div>

                {/* ── Action Buttons: Dépôt / Collect / Wallet ── */}
                <div style={{
                    display: "flex", justifyContent: "space-around", gap: "10px",
                    position: "relative",
                }}>
                    {[
                        { icon: "↓", label: "Dépôt", color: "#26A69A", bg: "rgba(38,166,154,0.1)", border: "rgba(38,166,154,0.2)", page: "deposit" },
                        { icon: "↑", label: "Collect", color: "#6BA5FF", bg: "rgba(107,165,255,0.1)", border: "rgba(107,165,255,0.2)", page: "collect" },
                        { icon: "◈", label: "Wallet", color: "#C8A24A", bg: "rgba(200,162,74,0.08)", border: "rgba(200,162,74,0.18)", page: "wallet" },
                    ].map(btn => (
                        <button key={btn.label} onClick={() => onNav(btn.page)} style={{
                            flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                            gap: "6px", padding: "14px 8px",
                            background: `linear-gradient(145deg, ${btn.bg}, transparent)`,
                            border: `1px solid ${btn.border}`,
                            borderRadius: "16px",
                            boxShadow: `0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.04)`,
                            position: "relative", overflow: "hidden",
                        }}>
                            {/* Top shine */}
                            <div style={{
                                position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
                                background: `linear-gradient(90deg, transparent, ${btn.color}22, transparent)`,
                            }} />
                            <div style={{
                                width: "36px", height: "36px", borderRadius: "12px",
                                background: btn.bg,
                                border: `1px solid ${btn.border}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "18px", color: btn.color, fontWeight: 800,
                                boxShadow: `0 2px 8px rgba(0,0,0,0.2), 0 0 12px ${btn.color}15`,
                            }}>{btn.icon}</div>
                            <span style={{
                                fontSize: "11px", fontWeight: 700, color: btn.color,
                                letterSpacing: "0.02em",
                            }}>{btn.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ KPI CARDS ═══ */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "28px" }}>
                <StatCard label="Daily P&L" value={(m.dailyPnl >= 0 ? "+" : "") + fUSD(m.dailyPnl)} color={m.dailyPnl >= 0 ? C.green : C.red} />
                <StatCard label="Free Margin" value={fUSD(m.freeMargin)} color={C.green} />
                <StatCard label="Spot" value={fUSD(m.spotExposure)} />
                <StatCard label="Leveraged" value={fUSD(m.levExposure)} color={m.levExposure > 0 ? "#F5A623" : C.textDim} />
            </div>

            {/* ═══ MARKETS Quick Access ═══ */}
            <div style={{ marginBottom: "28px" }}>
                <SectionHeader title="Markets" action="Voir tout →" onAction={() => onNav("markets")} />
                <div style={{
                    display: "flex", gap: "10px", overflowX: "auto",
                    WebkitOverflowScrolling: "touch", paddingBottom: "4px"
                }}>
                    {Object.entries(TABS).map(([k, v]) => (
                        <button key={k} onClick={() => { onNav("markets"); if (setTab) setTab(k); }}
                            style={{
                                minWidth: "88px", padding: "16px 12px",
                                borderRadius: "18px", flexShrink: 0,
                                background: S.cardBg,
                                border: `1px solid ${S.cardBorder}`,
                                boxShadow: `${S.cardShadow}, ${S.cardInner}`,
                                display: "flex", flexDirection: "column", alignItems: "center", gap: "8px",
                                position: "relative", overflow: "hidden",
                            }}>
                            {/* Top shine */}
                            <div style={{
                                position: "absolute", top: 0, left: "20%", right: "20%", height: "1px",
                                background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
                            }} />
                            <div style={{
                                width: "36px", height: "36px", borderRadius: "12px",
                                background: "rgba(107,165,255,0.06)",
                                border: "1px solid rgba(107,165,255,0.1)",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                boxShadow: "0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)",
                            }}><MarketIcon type={v.icon} size={26} /></div>
                            <span style={{
                                fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.8)",
                                letterSpacing: "0.02em"
                            }}>{v.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* ═══ WORLD INDICES ═══ */}
            {indices && indices.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                    <SectionHeader title="Indices mondiaux" />
                    <div style={{
                        display: "flex", gap: "10px", overflowX: "auto",
                        WebkitOverflowScrolling: "touch", paddingBottom: "6px"
                    }}>
                        {indices.slice(0, 8).map(idx => {
                            const isUp = idx.chg >= 0;
                            return (
                                <div key={idx.sym} onClick={() => onOpenExchange && onOpenExchange(idx.exchangeCode)}
                                    style={{
                                        minWidth: "140px", padding: "14px", borderRadius: "18px", flexShrink: 0,
                                        background: S.cardBg,
                                        border: `1px solid ${S.cardBorder}`,
                                        boxShadow: `${S.cardShadow}, ${S.cardInner}`,
                                        cursor: "pointer",
                                        position: "relative", overflow: "hidden",
                                    }}>
                                    <div style={{
                                        position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                                    }} />
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px"
                                    }}>
                                        <span style={{ fontSize: "20px" }}>{FLAGS[idx.flag] || "🌐"}</span>
                                        <span style={{
                                            fontSize: "11px", fontWeight: 700, color: "#fff",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            maxWidth: "90px",
                                        }}>{idx.name}</span>
                                    </div>
                                    <div style={{
                                        fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "4px",
                                    }}>{fmt(idx.price)}</div>
                                    <div style={{
                                        display: "inline-block", padding: "2px 8px", borderRadius: "8px",
                                        fontSize: "11px", fontWeight: 700,
                                        color: isUp ? C.green : C.red,
                                        background: isUp ? "rgba(38,166,154,0.1)" : "rgba(239,83,80,0.1)",
                                    }}>
                                        {isUp ? "▲ +" : "▼ "}{idx.chg}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══ MATIÈRES PREMIÈRES ═══ */}
            {comms && comms.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                    <SectionHeader title="Matières premières" action="Voir tout →" onAction={() => { onNav("markets"); if (setTab) setTab("commodity"); }} />
                    <div style={{
                        display: "flex", gap: "10px", overflowX: "auto",
                        WebkitOverflowScrolling: "touch", paddingBottom: "6px"
                    }}>
                        {comms.slice(0, 8).map(c => {
                            const cUp = c.chg >= 0;
                            return (
                                <div key={c.sym} onClick={() => onOpenAsset(c.sym, "commodity")}
                                    style={{
                                        minWidth: "130px", padding: "14px", borderRadius: "18px", flexShrink: 0,
                                        background: S.cardBg,
                                        border: `1px solid ${S.cardBorder}`,
                                        boxShadow: `${S.cardShadow}, ${S.cardInner}`,
                                        cursor: "pointer",
                                        position: "relative", overflow: "hidden",
                                    }}>
                                    <div style={{
                                        position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                                    }} />
                                    <div style={{
                                        display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px"
                                    }}>
                                        <span style={{
                                            fontSize: "22px",
                                        }}>{c.icon || "🏆"}</span>
                                        <span style={{
                                            fontSize: "11px", fontWeight: 700, color: "#fff",
                                            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                                            maxWidth: "80px",
                                        }}>{c.name}</span>
                                    </div>
                                    <div style={{
                                        fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "4px",
                                    }}>${fmt(c.price)}</div>
                                    <div style={{
                                        display: "inline-block", padding: "2px 8px", borderRadius: "8px",
                                        fontSize: "11px", fontWeight: 700,
                                        color: cUp ? C.green : C.red,
                                        background: cUp ? "rgba(38,166,154,0.1)" : "rgba(239,83,80,0.1)",
                                    }}>
                                        {cUp ? "▲ +" : "▼ "}{c.chg}%
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ═══ TOP MOVERS ═══ */}
            <div style={{ marginBottom: "28px" }}>
                <SectionHeader title="Top Movers" />
                <div style={{
                    display: "flex", gap: "10px", overflowX: "auto",
                    WebkitOverflowScrolling: "touch", paddingBottom: "6px"
                }}>
                    {topMovers.map(a => {
                        const isUp = a.chg >= 0;
                        const type = cryptos.includes(a) ? "crypto" : "stock";
                        return (
                            <div key={a.sym} onClick={() => onOpenAsset(a.sym, type)}
                                style={{
                                    minWidth: "130px", padding: "14px", borderRadius: "18px", flexShrink: 0,
                                    background: S.cardBg,
                                    border: `1px solid ${S.cardBorder}`,
                                    boxShadow: `${S.cardShadow}, ${S.cardInner}`,
                                    cursor: "pointer",
                                    position: "relative", overflow: "hidden",
                                }}>
                                {/* Top shine */}
                                <div style={{
                                    position: "absolute", top: 0, left: "15%", right: "15%", height: "1px",
                                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                                }} />
                                <div style={{
                                    display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px"
                                }}>
                                    <div style={{
                                        borderRadius: "50%",
                                        boxShadow: "0 3px 10px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                                    }}>
                                        <AssetLogo asset={a} type={type} size={28} />
                                    </div>
                                    <span style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>{a.sym}</span>
                                </div>
                                <div style={{
                                    fontSize: "15px", fontWeight: 800, color: "#fff", marginBottom: "4px",
                                }}>${fmt(a.price)}</div>
                                <div style={{
                                    display: "inline-block", padding: "2px 8px", borderRadius: "8px",
                                    fontSize: "11px", fontWeight: 700,
                                    color: isUp ? C.green : C.red,
                                    background: isUp ? "rgba(38,166,154,0.1)" : "rgba(239,83,80,0.1)",
                                    textShadow: `0 0 8px ${isUp ? "rgba(38,166,154,0.3)" : "rgba(239,83,80,0.3)"}`
                                }}>
                                    {isUp ? "▲ +" : "▼ "}{a.chg}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* ═══ POSITIONS ═══ */}
            {topPositions.length > 0 && (
                <div style={{ marginBottom: "28px" }}>
                    <SectionHeader title="Positions ouvertes" />
                    {topPositions.map(pos => (
                        <PositionRow key={pos.id} pos={pos} pnl={getPnl(pos)}
                            onTap={() => onOpenAsset(pos.sym, pos.type)} />
                    ))}
                </div>
            )}

            {/* ═══ POPULAR STOCKS ═══ */}
            <div style={{ marginBottom: "28px" }}>
                <SectionHeader title="Actions populaires" />
                {stocks.slice(0, 8).map(a => (
                    <AssetRow key={a.sym} asset={a} type="stock"
                        onTap={() => onOpenAsset(a.sym, "stock")} />
                ))}
            </div>

            {/* ═══ POPULAR CRYPTO ═══ */}
            <div style={{ marginBottom: "100px" }}>
                <SectionHeader title="Cryptomonnaies" />
                {cryptos.slice(0, 6).map(a => (
                    <AssetRow key={a.sym} asset={a} type="crypto"
                        onTap={() => onOpenAsset(a.sym, "crypto")} />
                ))}
            </div>
        </div>
    );
}

export { Dashboard };
