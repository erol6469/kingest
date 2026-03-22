import React from "react";
import { C } from "../data/constants";

const TIMEFRAMES = [
    { key: "1m", label: "1m" },
    { key: "5m", label: "5m" },
    { key: "15m", label: "15m" },
    { key: "1h", label: "1H" },
    { key: "1D", label: "1J" },
    { key: "1W", label: "1S" },
    { key: "1M", label: "1M" },
    { key: "1Y", label: "1A" },
    { key: "5Y", label: "5A" },
];

export default function TimeframeSelector({ active, onChange }) {
    return (
        <div style={{
            display: "flex", gap: "4px", justifyContent: "center",
            padding: "6px", borderRadius: "14px",
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${C.border}`,
        }}>
            {TIMEFRAMES.map(tf => {
                const isActive = active === tf.key;
                return (
                    <button
                        key={tf.key}
                        onClick={() => onChange(tf.key)}
                        style={{
                            padding: "7px 10px",
                            borderRadius: "10px",
                            border: "none",
                            fontSize: "11px",
                            fontWeight: 700,
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            background: isActive
                                ? "rgba(107,165,255,0.15)"
                                : "transparent",
                            color: isActive ? "#6BA5FF" : "rgba(136,153,170,0.5)",
                            boxShadow: isActive
                                ? "0 0 12px rgba(107,165,255,0.1)"
                                : "none",
                        }}
                    >
                        {tf.label}
                    </button>
                );
            })}
        </div>
    );
}
