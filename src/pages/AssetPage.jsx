import { useMemo } from "react";
import { C } from "../data/constants";
import { fUSD, fmt } from "../utils";
import { AssetLogo } from "../components/AssetLogo";
import AssetChart from "../components/AssetChart";

function AssetPage({ asset, type, onBack, onOrder }) {
    const isUp = asset.chg >= 0;
    const stats = useMemo(() => [
        { label: "Market Cap", value: asset.mcap || "—" },
        { label: "Sector", value: asset.sector || "—" },
        { label: "24h Change", value: (isUp ? "+" : "") + asset.chg + "%", color: isUp ? C.green : C.red },
        { label: "Price", value: "$" + fmt(asset.price) },
    ], [asset, isUp]);

    return (
        <div style={{ padding: "16px", animation: "fadeIn 0.3s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <button onClick={onBack} style={{ width: "36px", height: "36px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "center", color: C.textMid, fontSize: "18px" }}>←</button>
                <AssetLogo asset={asset} type={type} size={44} />
                <div>
                    <div style={{ fontSize: "18px", fontWeight: 800 }}>{asset.sym}</div>
                    <div style={{ fontSize: "12px", color: C.textDim }}>{asset.name}</div>
                </div>
            </div>

            {/* Price + Chart */}
            <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={{ fontSize: "32px", fontWeight: 900 }}>${fmt(asset.price)}</div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: isUp ? C.green : C.red, marginTop: "2px" }}>
                    {isUp ? "▲" : "▼"} {isUp ? "+" : ""}{asset.chg}%
                </div>
            </div>

            <div style={{ marginBottom: "20px" }}>
                <AssetChart symbol={asset.sym} type={type} color={asset.color} />
            </div>

            {/* Key Stats */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "28px" }}>
                {stats.map((s, i) => (
                    <div key={i} style={{ flex: "1 1 45%", padding: "12px 14px", background: "rgba(255,255,255,0.02)", border: `1px solid ${C.border}`, borderRadius: "10px" }}>
                        <div style={{ fontSize: "10px", color: C.textDim, fontWeight: 600, marginBottom: "4px" }}>{s.label}</div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: s.color || C.text }}>{s.value}</div>
                    </div>
                ))}
            </div>

            {/* ── Action Zone ── */}
            <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Investment</div>
                <button onClick={() => onOrder(asset, "spot")} style={{
                    width: "100%", padding: "16px", borderRadius: "12px", fontSize: "15px", fontWeight: 700,
                    background: "linear-gradient(135deg, #26A69A, #2BBD8E)", color: "#fff",
                    marginBottom: "10px", letterSpacing: "0.02em"
                }}>
                    Buy Spot — {asset.sym}
                </button>
            </div>

            <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: C.textDim, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px" }}>Leveraged Trading</div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => onOrder(asset, "long")} style={{
                        flex: 1, padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 700,
                        background: "rgba(38,166,154,0.1)", border: "1px solid rgba(38,166,154,0.25)", color: C.green
                    }}>
                        ↑ Long
                    </button>
                    <button onClick={() => onOrder(asset, "short")} style={{
                        flex: 1, padding: "14px", borderRadius: "12px", fontSize: "14px", fontWeight: 700,
                        background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.25)", color: C.red
                    }}>
                        ↓ Short
                    </button>
                </div>
            </div>
        </div>
    );
}

export { AssetPage };
