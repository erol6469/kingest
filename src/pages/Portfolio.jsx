import { useMemo, useEffect, useState } from "react";
import { C } from "../data/constants";
import { fUSD, fmt } from "../utils";

function SectionHeader({ title }) {
    return <div style={{ fontSize: "12px", fontWeight: 700, color: C.textMid, marginBottom: "10px", marginTop: "20px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>;
}

function PositionCard({ pos, pnl, currentPrice, onClose, onTap }) {
    const isUp = pnl >= 0;
    const pnlPct = ((pnl / pos.amount) * 100).toFixed(2);
    return (
        <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: "12px", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                <div onClick={onTap} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: pos.color + "18", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: pos.color }}>{pos.sym.charAt(0)}</span>
                    </div>
                    <div>
                        <div style={{ fontSize: "14px", fontWeight: 700 }}>{pos.sym}</div>
                        <div style={{ fontSize: "10px", color: C.textDim }}>
                            {pos.mode === "spot" ? "Spot" : pos.mode === "long" ? "Long" : "Short"}
                            {pos.leverage > 1 ? ` ×${pos.leverage}` : ""}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "15px", fontWeight: 800, color: isUp ? C.green : C.red }}>
                        {isUp ? "+" : ""}{fUSD(pnl)}
                    </div>
                    <div style={{ fontSize: "10px", color: isUp ? C.green : C.red }}>{isUp ? "+" : ""}{pnlPct}%</div>
                </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "10px" }}>
                <MiniMetric label="Entry" value={"$" + fmt(pos.entryPrice)} />
                <MiniMetric label="Current" value={"$" + fmt(currentPrice)} />
                <MiniMetric label="Amount" value={fUSD(pos.amount)} />
                {pos.leverage > 1 && <MiniMetric label="Leverage" value={"×" + pos.leverage} />}
                {pos.liquidation && <MiniMetric label="Liquidation" value={"$" + fmt(pos.liquidation)} color={C.red} />}
            </div>
            <button onClick={() => onClose(pos.id)} style={{
                width: "100%", padding: "10px", borderRadius: "8px", fontSize: "12px", fontWeight: 700,
                background: "rgba(239,83,80,0.08)", border: "1px solid rgba(239,83,80,0.2)", color: C.red
            }}>Close Position</button>
        </div>
    );
}

function MiniMetric({ label, value, color }) {
    return (
        <div style={{ padding: "4px 8px", background: "rgba(255,255,255,0.03)", borderRadius: "6px" }}>
            <span style={{ fontSize: "9px", color: C.textDim }}>{label} </span>
            <span style={{ fontSize: "10px", fontWeight: 700, color: color || C.text }}>{value}</span>
        </div>
    );
}

function RiskSummary({ metrics }) {
    const m = metrics;
    return (
        <div style={{ padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: "12px" }}>
            <Row label="Total Equity" value={fUSD(m.totalEquity)} bold />
            <Row label="Total P&L" value={(m.totalPnl >= 0 ? "+" : "") + fUSD(m.totalPnl)} color={m.totalPnl >= 0 ? C.green : C.red} />
            <Row label="Spot Exposure" value={fUSD(m.spotExposure)} />
            <Row label="Leveraged Exposure" value={fUSD(m.levExposure)} color={m.levExposure > 0 ? "#F5A623" : C.textDim} />
            <Row label="Used Margin" value={fUSD(m.usedMargin)} />
            <Row label="Free Margin" value={fUSD(m.freeMargin)} color={m.freeMargin > 0 ? C.green : C.red} />
        </div>
    );
}

function Row({ label, value, color, bold }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: `1px solid ${C.border}22` }}>
            <span style={{ fontSize: "12px", color: C.textDim }}>{label}</span>
            <span style={{ fontSize: "12px", fontWeight: bold ? 800 : 600, color: color || C.text }}>{value}</span>
        </div>
    );
}

function AlpacaAccountCard({ trading }) {
    const [account, setAccount] = useState(null);

    useEffect(() => {
        if (trading?.fetchPortfolio) {
            trading.fetchPortfolio().then(p => setAccount(p));
        }
    }, []);

    if (!account) return null;

    return (
        <div style={{ padding: "14px 16px", background: "linear-gradient(135deg, rgba(107,165,255,0.08), rgba(38,166,154,0.06))", border: `1px solid ${C.primary}25`, borderRadius: "12px", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.06em" }}>Alpaca Trading Account</span>
            </div>
            <Row label="Portfolio Value" value={fUSD(account.totalValue)} bold />
            <Row label="Cash" value={fUSD(account.cash)} />
            <Row label="Buying Power" value={fUSD(account.buyingPower)} color={C.green} />
            {account.positions && account.positions.length > 0 && (
                <>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: C.textMid, marginTop: "10px", marginBottom: "6px", textTransform: "uppercase" }}>
                        Real Positions ({account.positions.length})
                    </div>
                    {account.positions.map((p, i) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${C.border}15` }}>
                            <div>
                                <span style={{ fontSize: "13px", fontWeight: 700 }}>{p.symbol}</span>
                                <span style={{ fontSize: "10px", color: C.textDim, marginLeft: "6px" }}>{p.qty} units</span>
                            </div>
                            <div style={{ textAlign: "right" }}>
                                <div style={{ fontSize: "12px", fontWeight: 700 }}>{fUSD(p.marketValue)}</div>
                                <div style={{ fontSize: "10px", color: p.unrealizedPL >= 0 ? C.green : C.red, fontWeight: 600 }}>
                                    {p.unrealizedPL >= 0 ? "+" : ""}{fUSD(p.unrealizedPL)} ({p.unrealizedPLPercent.toFixed(2)}%)
                                </div>
                            </div>
                        </div>
                    ))}
                </>
            )}
        </div>
    );
}

function Portfolio({ positions, allAssets, balance, metrics, getPnl, onClose, onOpenAsset, trading }) {
    const spotPositions = useMemo(() => positions.filter(p => p.mode === "spot"), [positions]);
    const levPositions = useMemo(() => positions.filter(p => p.mode !== "spot"), [positions]);

    const getPrice = (sym) => {
        const s = (allAssets || []).find(x => x.sym === sym);
        return s ? s.price : 0;
    };

    return (
        <div style={{ padding: "16px", animation: "fadeIn 0.3s ease" }}>
            <div style={{ fontSize: "18px", fontWeight: 800, marginBottom: "4px" }}>Portfolio</div>
            <div style={{ fontSize: "12px", color: C.textDim, marginBottom: "16px" }}>{positions.length} position{positions.length !== 1 ? "s" : ""} active</div>

            {/* Alpaca Real Account */}
            {trading && <AlpacaAccountCard trading={trading} />}

            {/* Risk Summary */}
            <SectionHeader title="Risk Summary" />
            <RiskSummary metrics={metrics} />

            {/* Spot Holdings */}
            <SectionHeader title={"Spot Holdings (" + spotPositions.length + ")"} />
            {spotPositions.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: C.textDim, fontSize: "12px" }}>No spot positions</div>
            ) : (
                spotPositions.map(pos => (
                    <PositionCard key={pos.id} pos={pos} pnl={getPnl(pos)} currentPrice={getPrice(pos.sym)} onClose={onClose} onTap={() => onOpenAsset(pos.sym)} />
                ))
            )}

            {/* Leveraged Positions */}
            <SectionHeader title={"Leveraged Positions (" + levPositions.length + ")"} />
            {levPositions.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: C.textDim, fontSize: "12px" }}>No leveraged positions</div>
            ) : (
                levPositions.map(pos => (
                    <PositionCard key={pos.id} pos={pos} pnl={getPnl(pos)} currentPrice={getPrice(pos.sym)} onClose={onClose} onTap={() => onOpenAsset(pos.sym)} />
                ))
            )}
        </div>
    );
}

export { Portfolio };
