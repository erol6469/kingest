import { useState, useMemo } from "react";
import { C } from "../data/constants";
import { fUSD, fmt } from "../utils";
import { AssetLogo } from "../components/AssetLogo";

const FLAGS = {
    us: "🇺🇸", fr: "🇫🇷", gb: "🇬🇧", jp: "🇯🇵", de: "🇩🇪",
    hk: "🇭🇰", sg: "🇸🇬", ch: "🇨🇭", in: "🇮🇳", it: "🇮🇹",
};

const S = {
    cardBg: "linear-gradient(145deg, rgba(12,28,56,0.85), rgba(8,18,38,0.95))",
    cardBorder: "rgba(107,165,255,0.08)",
    cardShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
    cardInner: "inset 0 1px 0 rgba(255,255,255,0.04)",
    borderGlass: "rgba(255,255,255,0.03)",
    heroBg: "linear-gradient(145deg, rgba(15,35,70,0.9), rgba(8,20,45,0.95))",
    heroBorder: "1px solid rgba(107,165,255,0.12)",
    heroShadow: "0 12px 48px rgba(0,0,0,0.5), 0 4px 16px rgba(107,165,255,0.06), inset 0 1px 0 rgba(255,255,255,0.06)",
};

function ExchangePage({ index, stocks, exchangeInfo, onBack, onOpenAsset, onOpenOrder }) {
    const [search, setSearch] = useState("");
    const [visibleCount, setVisibleCount] = useState(50);

    const isUp = index ? index.chg >= 0 : true;
    const flag = index?.flag || exchangeInfo?.flag || "us";

    // Filter stocks belonging to this exchange
    const exchangeStocks = useMemo(() => {
        let list = stocks.filter(s => s.exchangeCode === index?.exchangeCode);
        if (search) {
            const q = search.toLowerCase();
            list = list.filter(a => a.sym.toLowerCase().includes(q) || a.name.toLowerCase().includes(q));
        }
        return list;
    }, [stocks, index, search]);

    const shown = exchangeStocks.slice(0, visibleCount);
    const hasMore = shown.length < exchangeStocks.length;

    return (
        <div style={{
            padding: "0 0 100px 0", animation: "fadeIn 0.3s ease",
            background: `
                radial-gradient(ellipse at 50% 0%, rgba(107,165,255,0.04) 0%, transparent 60%),
                linear-gradient(180deg, #040c1a 0%, #020817 100%)
            `,
            minHeight: "100%",
        }}>
            {/* ═══ BACK BUTTON ═══ */}
            <div style={{ padding: "16px 16px 0" }}>
                <button onClick={onBack} style={{
                    background: "rgba(107,165,255,0.08)",
                    border: "1px solid rgba(107,165,255,0.15)",
                    borderRadius: "12px",
                    padding: "8px 16px",
                    color: C.primary, fontSize: "13px", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: "6px",
                }}>
                    ← Retour
                </button>
            </div>

            {/* ═══ INDEX HERO CARD ═══ */}
            {index && (
                <div style={{
                    margin: "16px",
                    padding: "24px 20px",
                    borderRadius: "24px",
                    background: S.heroBg,
                    border: S.heroBorder,
                    boxShadow: S.heroShadow,
                    position: "relative",
                    overflow: "hidden",
                }}>
                    {/* Top glow */}
                    <div style={{
                        position: "absolute", top: 0, left: "10%", right: "10%", height: "1px",
                        background: "linear-gradient(90deg, transparent, rgba(107,165,255,0.3), transparent)",
                    }} />

                    {/* Flag + Index name */}
                    <div style={{
                        display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px",
                    }}>
                        <div style={{
                            width: 56, height: 56, borderRadius: "18px",
                            background: "rgba(107,165,255,0.1)",
                            border: "1px solid rgba(107,165,255,0.15)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontSize: "30px",
                            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                        }}>{FLAGS[flag] || "🌐"}</div>
                        <div>
                            <div style={{
                                fontSize: "22px", fontWeight: 900, color: "#fff",
                                letterSpacing: "-0.01em",
                            }}>{index.name}</div>
                            <div style={{
                                fontSize: "12px", color: C.textDim, marginTop: "2px",
                            }}>
                                {exchangeInfo?.name || index.exchangeCode} · {exchangeInfo?.currency || ""}
                            </div>
                        </div>
                    </div>

                    {/* Price + Change */}
                    <div style={{
                        display: "flex", alignItems: "baseline", gap: "14px",
                    }}>
                        <div style={{
                            fontSize: "32px", fontWeight: 900, color: "#fff",
                            textShadow: "0 2px 20px rgba(107,165,255,0.15)",
                        }}>{fmt(index.price)}</div>
                        <div style={{
                            display: "inline-flex", alignItems: "center", gap: "4px",
                            padding: "5px 14px", borderRadius: "20px",
                            background: isUp ? "rgba(38,166,154,0.1)" : "rgba(239,83,80,0.1)",
                            border: `1px solid ${isUp ? "rgba(38,166,154,0.2)" : "rgba(239,83,80,0.2)"}`,
                        }}>
                            <span style={{
                                fontSize: "14px", fontWeight: 700,
                                color: isUp ? C.green : C.red,
                                textShadow: `0 0 12px ${isUp ? "rgba(38,166,154,0.4)" : "rgba(239,83,80,0.4)"}`,
                            }}>
                                {isUp ? "▲ +" : "▼ "}{index.chg}%
                            </span>
                        </div>
                    </div>
                    {/* ═══ TRADE INDEX BUTTONS ═══ */}
                    <div style={{
                        display: "flex", gap: "10px", marginTop: "20px",
                    }}>
                        <button onClick={() => onOpenOrder && onOpenOrder(index, "spot", "index")} style={{
                            flex: 1, padding: "14px", borderRadius: "14px",
                            background: "linear-gradient(145deg, rgba(38,166,154,0.2), rgba(38,166,154,0.08))",
                            border: "1px solid rgba(38,166,154,0.3)",
                            color: C.green, fontSize: "14px", fontWeight: 800,
                            boxShadow: "0 4px 16px rgba(38,166,154,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}>
                            <span style={{ fontSize: "16px" }}>📈</span>
                            Acheter {index.name}
                        </button>
                        <button onClick={() => onOpenOrder && onOpenOrder(index, "short", "index")} style={{
                            flex: 1, padding: "14px", borderRadius: "14px",
                            background: "linear-gradient(145deg, rgba(239,83,80,0.2), rgba(239,83,80,0.08))",
                            border: "1px solid rgba(239,83,80,0.3)",
                            color: C.red, fontSize: "14px", fontWeight: 800,
                            boxShadow: "0 4px 16px rgba(239,83,80,0.15), inset 0 1px 0 rgba(255,255,255,0.05)",
                            display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                        }}>
                            <span style={{ fontSize: "16px" }}>📉</span>
                            Short {index.name}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══ STOCKS COUNT ═══ */}
            <div style={{
                padding: "0 20px", marginBottom: "12px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
                <span style={{
                    fontSize: "11px", fontWeight: 700, color: "rgba(107,165,255,0.7)",
                    textTransform: "uppercase", letterSpacing: "0.12em",
                }}>
                    Actions {index?.name || ""} ({exchangeStocks.length})
                </span>
            </div>

            {/* ═══ SEARCH ═══ */}
            <div style={{ padding: "0 16px", marginBottom: "14px" }}>
                <div style={{ position: "relative" }}>
                    <span style={{
                        position: "absolute", left: "16px", top: "50%",
                        transform: "translateY(-50%)", fontSize: "14px", opacity: 0.3
                    }}>🔍</span>
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder={`Rechercher dans ${index?.name || ""}...`}
                        style={{
                            width: "100%", padding: "14px 16px 14px 44px",
                            background: "rgba(12,28,56,0.6)",
                            border: `1px solid ${S.cardBorder}`,
                            borderRadius: "16px", color: C.text, fontSize: "14px",
                            outline: "none",
                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.2)",
                        }} />
                </div>
            </div>

            {/* ═══ STOCKS LIST ═══ */}
            <div style={{ padding: "0 16px" }}>
                {shown.map((a, i) => {
                    const stockUp = a.chg >= 0;
                    return (
                        <div key={a.sym + i} onClick={() => onOpenAsset(a.sym, "stock")}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "14px 16px", marginBottom: "6px",
                                background: "rgba(12,28,56,0.4)",
                                borderRadius: "14px",
                                border: `1px solid ${S.borderGlass}`,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                            }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{
                                    borderRadius: "50%",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
                                }}>
                                    <AssetLogo asset={a} type="stock" size={40} />
                                </div>
                                <div>
                                    <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>{a.name}</div>
                                    <div style={{
                                        fontSize: "11px", color: C.textDim, maxWidth: "140px",
                                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                                    }}>{a.sym}</div>
                                </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "14px", fontWeight: 700, color: C.text }}>
                                    {"$" + fmt(a.price)}
                                </div>
                                <div style={{
                                    display: "inline-block", padding: "2px 8px", borderRadius: "8px", marginTop: "2px",
                                    fontSize: "11px", fontWeight: 700,
                                    color: stockUp ? C.green : C.red,
                                    background: stockUp ? "rgba(38,166,154,0.1)" : "rgba(239,83,80,0.1)",
                                }}>
                                    {stockUp ? "+" : ""}{a.chg}%
                                </div>
                            </div>
                        </div>
                    );
                })}

                {hasMore && (
                    <button onClick={() => setVisibleCount(v => v + 50)} style={{
                        width: "100%", padding: "14px", marginTop: "10px", borderRadius: "14px",
                        background: "linear-gradient(145deg, rgba(107,165,255,0.08), rgba(107,165,255,0.03))",
                        border: "1px solid rgba(107,165,255,0.12)",
                        color: C.primary, fontSize: "13px", fontWeight: 700,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                    }}>
                        Voir plus ({exchangeStocks.length - shown.length} restants)
                    </button>
                )}

                {exchangeStocks.length === 0 && (
                    <div style={{
                        textAlign: "center", padding: "40px 20px",
                        color: C.textDim, fontSize: "14px",
                    }}>
                        Aucune action trouvée
                    </div>
                )}
            </div>
        </div>
    );
}

export { ExchangePage };
