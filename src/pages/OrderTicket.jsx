import { useState, useMemo } from "react";
import { C } from "../data/constants";
import { fUSD, fmt } from "../utils";

const LEVERAGES = [1, 2, 3];
const MODES = ["spot", "long", "short"];

function RiskMeter({ level }) {
    // level: 0-10
    const color = level <= 3 ? C.green : level <= 6 ? "#F5A623" : C.red;
    const label = level <= 3 ? "Low" : level <= 6 ? "Medium" : "High";
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ flex: 1, height: "6px", borderRadius: "3px", background: "rgba(255,255,255,0.06)" }}>
                <div style={{ width: `${level * 10}%`, height: "100%", borderRadius: "3px", background: color, transition: "width 0.3s" }} />
            </div>
            <span style={{ fontSize: "11px", fontWeight: 700, color, minWidth: "50px", textAlign: "right" }}>{label} ({level}/10)</span>
        </div>
    );
}

function MetricRow({ label, value, color, bold }) {
    return (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0" }}>
            <span style={{ fontSize: "12px", color: C.textDim }}>{label}</span>
            <span style={{ fontSize: "12px", fontWeight: bold ? 700 : 600, color: color || C.text }}>{value}</span>
        </div>
    );
}

function OrderTicket({ asset, mode: initialMode, balance, usedMargin, onExecute, onBack }) {
    const [mode, setMode] = useState(initialMode);
    const [amount, setAmount] = useState("");
    const [leverage, setLeverage] = useState(mode === "spot" ? 1 : 2);
    const [stopLoss, setStopLoss] = useState("");
    const [takeProfit, setTakeProfit] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const amt = parseFloat(amount) || 0;
    const sl = parseFloat(stopLoss) || 0;
    const tp = parseFloat(takeProfit) || 0;

    const calc = useMemo(() => {
        const posSize = amt * leverage;
        const marginReq = amt;
        const totalUsedMargin = usedMargin + marginReq;
        const freeMargin = balance - marginReq;
        const fees = posSize * 0.002; // 0.2% Kingest spread
        const liqPrice = leverage > 1
            ? (mode === "short"
                ? asset.price * (1 + 0.9 / leverage)
                : asset.price * (1 - 0.9 / leverage))
            : null;
        const maxLoss = leverage > 1 ? amt * 0.9 : amt; // 90% of margin at liquidation
        const riskLevel = leverage === 1 ? 2 : leverage === 2 ? 5 : 8;
        return { posSize, marginReq, totalUsedMargin, freeMargin, fees, liqPrice, maxLoss, riskLevel };
    }, [amt, leverage, mode, asset.price, balance, usedMargin]);

    const canSubmit = amt > 0 && amt <= balance;
    const isSpot = mode === "spot";

    const handleModeChange = (m) => {
        setMode(m);
        if (m === "spot") setLeverage(1);
        else if (leverage === 1) setLeverage(2);
    };

    const submit = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await onExecute({
                asset, mode, side: mode === "short" ? "short" : "long",
                amount: amt, leverage, price: asset.price,
                stopLoss: sl || null, takeProfit: tp || null,
            });
        } catch (e) {
            // Error handled by parent
        } finally {
            setSubmitting(false);
        }
    };

    const isUp = asset.chg >= 0;

    return (
        <div style={{ padding: "16px", animation: "fadeIn 0.3s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <button onClick={onBack} style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMid, fontSize: "18px" }}>←</button>
                <div>
                    <div style={{ fontSize: "16px", fontWeight: 800 }}>Order — {asset.sym}</div>
                    <div style={{ fontSize: "12px", color: C.textDim }}>${fmt(asset.price)} <span style={{ color: isUp ? C.green : C.red }}>{isUp ? "+" : ""}{asset.chg}%</span></div>
                </div>
            </div>

            {/* Mode Selector */}
            <div style={{ display: "flex", gap: "6px", marginBottom: "20px", padding: "3px", background: "rgba(255,255,255,0.03)", borderRadius: "10px", border: `1px solid ${C.border}` }}>
                {MODES.map(m => (
                    <button key={m} onClick={() => handleModeChange(m)} style={{
                        flex: 1, padding: "10px", borderRadius: "8px", fontSize: "13px", fontWeight: 700,
                        background: mode === m ? (m === "short" ? "rgba(239,83,80,0.12)" : m === "long" ? "rgba(38,166,154,0.12)" : "rgba(107,165,255,0.12)") : "transparent",
                        color: mode === m ? (m === "short" ? C.red : m === "long" ? C.green : C.primary) : C.textDim,
                        border: mode === m ? `1px solid ${m === "short" ? C.red + "30" : m === "long" ? C.green + "30" : C.primary + "30"}` : "1px solid transparent",
                        textTransform: "capitalize"
                    }}>{m === "spot" ? "Buy Spot" : m === "long" ? "Long" : "Short"}</button>
                ))}
            </div>

            {/* Amount */}
            <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", color: C.textDim, fontWeight: 600, marginBottom: "6px" }}>Amount (USD)</div>
                <div style={{ position: "relative" }}>
                    <input value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" type="number"
                        style={{ width: "100%", padding: "14px 16px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: "10px", color: C.text, fontSize: "18px", fontWeight: 700, outline: "none" }} />
                    <div style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", display: "flex", gap: "6px" }}>
                        {[25, 50, 100].map(pct => (
                            <button key={pct} onClick={() => setAmount(Math.floor(balance * pct / 100).toString())}
                                style={{ padding: "4px 8px", borderRadius: "6px", background: "rgba(107,165,255,0.08)", color: C.primary, fontSize: "10px", fontWeight: 700 }}>
                                {pct}%
                            </button>
                        ))}
                    </div>
                </div>
                <div style={{ fontSize: "10px", color: C.textDim, marginTop: "4px" }}>Available: {fUSD(balance)}</div>
            </div>

            {/* Leverage */}
            {!isSpot && (
                <div style={{ marginBottom: "16px" }}>
                    <div style={{ fontSize: "11px", color: C.textDim, fontWeight: 600, marginBottom: "6px" }}>Leverage</div>
                    <div style={{ display: "flex", gap: "8px" }}>
                        {LEVERAGES.filter(l => isSpot ? l === 1 : l > 1).map(l => (
                            <button key={l} onClick={() => setLeverage(l)} style={{
                                flex: 1, padding: "12px", borderRadius: "10px", fontSize: "15px", fontWeight: 800,
                                background: leverage === l ? "rgba(107,165,255,0.12)" : "rgba(255,255,255,0.03)",
                                border: `1px solid ${leverage === l ? C.primary + "40" : C.border}`,
                                color: leverage === l ? C.primary : C.textDim
                            }}>×{l}</button>
                        ))}
                    </div>
                </div>
            )}

            {/* Stop Loss / Take Profit */}
            {!isSpot && (
                <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", color: C.textDim, fontWeight: 600, marginBottom: "6px" }}>Stop Loss</div>
                        <input value={stopLoss} onChange={e => setStopLoss(e.target.value)} placeholder={fmt(asset.price * 0.95)} type="number"
                            style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: "10px", color: C.text, fontSize: "14px", outline: "none" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", color: C.textDim, fontWeight: 600, marginBottom: "6px" }}>Take Profit</div>
                        <input value={takeProfit} onChange={e => setTakeProfit(e.target.value)} placeholder={fmt(asset.price * 1.10)} type="number"
                            style={{ width: "100%", padding: "12px", background: "rgba(255,255,255,0.03)", border: `1px solid ${C.border}`, borderRadius: "10px", color: C.text, fontSize: "14px", outline: "none" }} />
                    </div>
                </div>
            )}

            {/* ── Order Summary ── */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: "12px", padding: "14px 16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.textMid, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Order Summary</div>
                <MetricRow label="Position Size" value={fUSD(calc.posSize)} bold />
                <MetricRow label="Margin Required" value={fUSD(calc.marginReq)} />
                <MetricRow label="Used Margin (total)" value={fUSD(calc.totalUsedMargin)} />
                <MetricRow label="Free Margin (after)" value={fUSD(Math.max(0, calc.freeMargin))} color={calc.freeMargin < 0 ? C.red : C.green} />
                <MetricRow label="Est. Fees (0.2%)" value={fUSD(calc.fees)} />
                {calc.liqPrice && <MetricRow label="Est. Liquidation" value={"$" + fmt(calc.liqPrice)} color={C.red} bold />}
                <MetricRow label="Est. Max Loss" value={fUSD(calc.maxLoss)} color={C.red} />
                <div style={{ marginTop: "8px" }}>
                    <div style={{ fontSize: "11px", color: C.textDim, marginBottom: "6px" }}>Risk Level</div>
                    <RiskMeter level={calc.riskLevel} />
                </div>
            </div>

            {/* Real Trade Indicator */}
            {isSpot && amt > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", padding: "10px 14px", background: "rgba(38,166,154,0.06)", borderRadius: "10px", border: "1px solid rgba(38,166,154,0.15)" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: C.green, animation: "pulse 2s infinite" }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, color: C.green }}>Ordre réel — Alpaca Paper Trading</span>
                </div>
            )}
            {!isSpot && amt > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px", padding: "10px 14px", background: "rgba(255,165,0,0.06)", borderRadius: "10px", border: "1px solid rgba(255,165,0,0.15)" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#F5A623" }}>Simulation — Levier non supporté par broker</span>
                </div>
            )}

            {/* Submit */}
            <button onClick={submit} disabled={!canSubmit || submitting} style={{
                width: "100%", padding: "16px", borderRadius: "12px", fontSize: "16px", fontWeight: 800,
                background: (!canSubmit || submitting) ? "rgba(255,255,255,0.05)"
                    : mode === "short" ? "linear-gradient(135deg, #EF5350, #E53935)"
                    : "linear-gradient(135deg, #26A69A, #2BBD8E)",
                color: (!canSubmit || submitting) ? C.textDim : "#fff",
                opacity: (canSubmit && !submitting) ? 1 : 0.5,
                letterSpacing: "0.02em"
            }}>
                {submitting ? "Exécution en cours..." :
                    mode === "spot" ? `Buy ${asset.sym}` : mode === "long" ? `Open Long ×${leverage}` : `Open Short ×${leverage}`}
                {!submitting && amt > 0 ? ` — ${fUSD(amt)}` : ""}
            </button>
        </div>
    );
}

export { OrderTicket };
