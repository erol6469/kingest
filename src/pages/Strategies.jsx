import { useState, useMemo } from "react";
import { C } from "../data/constants";
import { fUSD } from "../utils";

const TRADERS = [
    { id: "t1", name: "Marcus Chen", tag: "Macro Quant", avatar: "MC", color: "#6BA5FF", market: "Actions", roi30: 8.4, roi90: 22.1, maxDD: -6.2, sharpe: 2.31, riskScore: 3, winRate: 72, copiers: 1847, aum: 4200000, trades30: 47 },
    { id: "t2", name: "Sofia Ramirez", tag: "Momentum", avatar: "SR", color: "#FF6B9D", market: "Actions", roi30: 12.6, roi90: 28.5, maxDD: -11.8, sharpe: 1.87, riskScore: 6, winRate: 65, copiers: 2341, aum: 6100000, trades30: 82 },
    { id: "t3", name: "James Park", tag: "Value Investor", avatar: "JP", color: "#26A69A", market: "Actions", roi30: 3.2, roi90: 14.8, maxDD: -3.1, sharpe: 2.85, riskScore: 2, winRate: 78, copiers: 3120, aum: 12400000, trades30: 12 },
    { id: "t4", name: "Lena Ostrova", tag: "Swing Trader", avatar: "LO", color: "#F5A623", market: "Multi", roi30: 15.8, roi90: 31.2, maxDD: -14.5, sharpe: 1.52, riskScore: 7, winRate: 61, copiers: 890, aum: 1800000, trades30: 125 },
    { id: "t5", name: "Ali Mansour", tag: "Conservative", avatar: "AM", color: "#9B59B6", market: "Actions", roi30: 2.1, roi90: 9.8, maxDD: -2.4, sharpe: 3.12, riskScore: 1, winRate: 81, copiers: 4580, aum: 18900000, trades30: 8 },
    { id: "t6", name: "Nina Volkov", tag: "Contrarian", avatar: "NV", color: "#E74C3C", market: "Actions", roi30: -1.8, roi90: 18.4, maxDD: -15.2, sharpe: 1.24, riskScore: 8, winRate: 54, copiers: 620, aum: 950000, trades30: 67 },
];

function RiskBadge({ score }) {
    const color = score <= 3 ? C.green : score <= 6 ? "#F5A623" : C.red;
    const label = score <= 3 ? "Low" : score <= 6 ? "Med" : "High";
    return (
        <span style={{ padding: "3px 8px", borderRadius: "6px", background: color + "15", color, fontSize: "10px", fontWeight: 700 }}>{label} {score}/10</span>
    );
}

function TraderCard({ trader, onProfile, onCopy }) {
    const isPositive = trader.roi30 >= 0;
    return (
        <div style={{ padding: "16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: "14px", marginBottom: "10px" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "12px", background: trader.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: trader.color }}>{trader.avatar}</span>
                    </div>
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 700 }}>{trader.name}</div>
                        <div style={{ fontSize: "10px", color: C.textDim }}>{trader.tag} · {trader.market}</div>
                    </div>
                </div>
                <RiskBadge score={trader.riskScore} />
            </div>

            {/* Metrics Grid */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
                <Metric label="ROI 30d" value={(trader.roi30 >= 0 ? "+" : "") + trader.roi30 + "%"} color={trader.roi30 >= 0 ? C.green : C.red} />
                <Metric label="ROI 90d" value={(trader.roi90 >= 0 ? "+" : "") + trader.roi90 + "%"} color={trader.roi90 >= 0 ? C.green : C.red} />
                <Metric label="Max DD" value={trader.maxDD + "%"} color={C.red} />
                <Metric label="Sharpe" value={trader.sharpe.toFixed(2)} color={trader.sharpe >= 2 ? C.green : C.textMid} />
                <Metric label="Win Rate" value={trader.winRate + "%"} />
                <Metric label="Copiers" value={trader.copiers.toLocaleString()} />
                <Metric label="AUM" value={fUSD(trader.aum)} />
                <Metric label="Trades/30d" value={trader.trades30.toString()} />
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => onProfile(trader)} style={{
                    flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700,
                    background: "rgba(255,255,255,0.04)", border: `1px solid ${C.border}`, color: C.text
                }}>View Profile</button>
                <button onClick={() => onCopy(trader)} style={{
                    flex: 1, padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700,
                    background: "rgba(107,165,255,0.1)", border: "1px solid rgba(107,165,255,0.25)", color: C.primary
                }}>Copy Trader</button>
            </div>
        </div>
    );
}

function Metric({ label, value, color }) {
    return (
        <div style={{ flex: "1 1 22%", minWidth: "70px", padding: "6px 8px", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
            <div style={{ fontSize: "9px", color: C.textDim }}>{label}</div>
            <div style={{ fontSize: "11px", fontWeight: 700, color: color || C.text }}>{value}</div>
        </div>
    );
}

function Strategies({ onBack }) {
    const [filter, setFilter] = useState("all");
    const [sort, setSort] = useState("roi30");

    const filtered = useMemo(() => {
        let list = [...TRADERS];
        if (filter === "low") list = list.filter(t => t.riskScore <= 3);
        if (filter === "medium") list = list.filter(t => t.riskScore > 3 && t.riskScore <= 6);
        if (filter === "high") list = list.filter(t => t.riskScore > 6);
        list.sort((a, b) => {
            if (sort === "roi30") return b.roi30 - a.roi30;
            if (sort === "roi90") return b.roi90 - a.roi90;
            if (sort === "sharpe") return b.sharpe - a.sharpe;
            if (sort === "copiers") return b.copiers - a.copiers;
            return a.riskScore - b.riskScore;
        });
        return list;
    }, [filter, sort]);

    return (
        <div style={{ padding: "16px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>Strategies</div>
            <div style={{ fontSize: "12px", color: C.textDim, marginBottom: "16px" }}>Copy top traders on tokenized stocks</div>

            {/* Filters */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "10px", overflowX: "auto" }}>
                {[["all", "All"], ["low", "Low Risk"], ["medium", "Medium"], ["high", "High Risk"]].map(([k, l]) => (
                    <button key={k} onClick={() => setFilter(k)} style={{
                        padding: "7px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: 600, flexShrink: 0,
                        background: filter === k ? "rgba(107,165,255,0.1)" : "rgba(255,255,255,0.03)",
                        color: filter === k ? C.primary : C.textDim,
                        border: `1px solid ${filter === k ? C.primary + "30" : C.border}`
                    }}>{l}</button>
                ))}
            </div>
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px", overflowX: "auto" }}>
                {[["roi30", "ROI 30d"], ["roi90", "ROI 90d"], ["sharpe", "Sharpe"], ["copiers", "Copiers"], ["risk", "Risk"]].map(([k, l]) => (
                    <button key={k} onClick={() => setSort(k)} style={{
                        padding: "6px 12px", borderRadius: "6px", fontSize: "10px", fontWeight: 600, flexShrink: 0,
                        background: sort === k ? "rgba(107,165,255,0.08)" : "transparent",
                        color: sort === k ? C.primary : C.textDim, border: "none"
                    }}>Sort: {l}</button>
                ))}
            </div>

            {/* Trader List */}
            {filtered.map(t => (
                <TraderCard key={t.id} trader={t} onProfile={() => {}} onCopy={() => {}} />
            ))}
        </div>
    );
}

export { Strategies };
