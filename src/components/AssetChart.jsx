import React, { useState, useEffect, useRef, useMemo } from "react";
import { C } from "../data/constants";
import TimeframeSelector from "./TimeframeSelector";

import { API_BASE } from "../config.js";

// Format price
const fmtPrice = (v) => {
    if (v >= 10000) return v.toFixed(0);
    if (v >= 100) return v.toFixed(2);
    if (v >= 1) return v.toFixed(2);
    return v.toFixed(4);
};

// Format time label based on timeframe
const fmtTime = (ts, tf) => {
    const d = new Date(ts);
    if (["1m", "5m", "15m", "1h"].includes(tf)) {
        return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    }
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

export default function AssetChart({ symbol, type, color }) {
    const [tf, setTf] = useState("1D");
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [touch, setTouch] = useState(null); // { x, idx }
    const svgRef = useRef(null);

    // Fetch via native bridge (Swift URLSession) — register callback, Swift calls it
    useEffect(() => {
        setLoading(true);
        setError(null);
        setPoints([]);
        setTouch(null);

        const callbackName = `__KINGEST_HISTORY_${Date.now()}`;

        // Register callback for native bridge
        window[callbackName] = (b64) => {
            try {
                const json = atob(b64);
                const data = JSON.parse(json);
                if (data.ok && data.points && data.points.length > 0) {
                    setPoints(data.points);
                    setError(null);
                } else {
                    setError(data.error || "Donnee indisponible");
                    setPoints([]);
                }
            } catch (e) {
                setError("Erreur decodage");
            }
            setLoading(false);
            delete window[callbackName];
        };

        // Tell Swift to fetch this URL and call our callback
        const url = `${API_BASE}/api/market/history?symbol=${encodeURIComponent(symbol)}&type=${encodeURIComponent(type)}&tf=${tf}`;

        // If native bridge exists, use it
        if (window.__KINGEST_FETCH) {
            window.__KINGEST_FETCH(url, callbackName);
        } else {
            // Fallback: try direct fetch (works in browser dev, not in WKWebView)
            fetch(url)
                .then(r => r.json())
                .then(data => {
                    if (data.ok && data.points?.length > 0) {
                        setPoints(data.points);
                    } else {
                        setError(data.error || "Donnee indisponible");
                    }
                })
                .catch(() => setError("Connexion impossible"))
                .finally(() => {
                    setLoading(false);
                    delete window[callbackName];
                });
        }

        return () => { delete window[callbackName]; };
    }, [symbol, type, tf]);

    // Chart dimensions
    const W = 340, H = 180, PX = 0, PY = 10;
    const chartW = W - PX * 2, chartH = H - PY * 2;

    // Compute chart data
    const chartData = useMemo(() => {
        if (points.length < 2) return null;
        const vals = points.map(p => p.value);
        const min = Math.min(...vals);
        const max = Math.max(...vals);
        const range = max - min || 1;

        const pathPoints = points.map((p, i) => {
            const x = PX + (i / (points.length - 1)) * chartW;
            const y = PY + chartH - ((p.value - min) / range) * chartH;
            return { x, y, value: p.value, time: p.time };
        });

        // SVG path
        const linePath = pathPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
        // Area fill path
        const areaPath = linePath + ` L${pathPoints[pathPoints.length - 1].x.toFixed(1)},${H} L${pathPoints[0].x.toFixed(1)},${H} Z`;

        const first = vals[0], last = vals[vals.length - 1];
        const chg = ((last - first) / first * 100).toFixed(2);
        const isUp = last >= first;

        return { pathPoints, linePath, areaPath, min, max, first, last, chg, isUp };
    }, [points]);

    const lineColor = chartData
        ? (chartData.isUp ? C.green : C.red)
        : (color || C.primary);

    // Touch/drag handler
    const handleTouch = (e) => {
        if (!svgRef.current || !chartData) return;
        const rect = svgRef.current.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const x = clientX - rect.left;
        const ratio = Math.max(0, Math.min(1, x / rect.width));
        const idx = Math.round(ratio * (chartData.pathPoints.length - 1));
        setTouch({ idx });
    };

    const touchPoint = touch && chartData ? chartData.pathPoints[touch.idx] : null;

    return (
        <div>
            {/* Chart container */}
            <div style={{
                background: "rgba(255,255,255,0.02)",
                borderRadius: "16px",
                border: `1px solid ${C.border}`,
                padding: "14px 10px 10px",
                marginBottom: "10px",
                position: "relative",
            }}>
                {/* Touch price overlay */}
                {touchPoint && (
                    <div style={{
                        position: "absolute", top: "8px", left: "14px", right: "14px",
                        display: "flex", justifyContent: "space-between", zIndex: 5,
                    }}>
                        <span style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>
                            ${fmtPrice(touchPoint.value)}
                        </span>
                        <span style={{ fontSize: "11px", color: "rgba(136,153,170,0.6)" }}>
                            {fmtTime(touchPoint.time, tf)}
                        </span>
                    </div>
                )}

                {loading && (
                    <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ color: "rgba(136,153,170,0.4)", fontSize: "12px", fontWeight: 600 }}>
                            Chargement...
                        </div>
                    </div>
                )}

                {error && !loading && (
                    <div style={{ height: H, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div style={{ color: "rgba(255,107,125,0.6)", fontSize: "12px", fontWeight: 600 }}>
                            {error}
                        </div>
                    </div>
                )}

                {chartData && !loading && (
                    <svg
                        ref={svgRef}
                        viewBox={`0 0 ${W} ${H}`}
                        width="100%"
                        height={H}
                        style={{ display: "block", touchAction: "none" }}
                        onTouchStart={handleTouch}
                        onTouchMove={handleTouch}
                        onTouchEnd={() => setTouch(null)}
                        onMouseMove={handleTouch}
                        onMouseLeave={() => setTouch(null)}
                    >
                        <defs>
                            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={lineColor} stopOpacity="0.25" />
                                <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
                            </linearGradient>
                        </defs>

                        {/* Area fill */}
                        <path d={chartData.areaPath} fill="url(#chartGrad)" />

                        {/* Line */}
                        <path d={chartData.linePath} fill="none" stroke={lineColor} strokeWidth="2" strokeLinejoin="round" />

                        {/* Touch crosshair */}
                        {touchPoint && (
                            <>
                                <line x1={touchPoint.x} y1={PY} x2={touchPoint.x} y2={H - PY} stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                                <circle cx={touchPoint.x} cy={touchPoint.y} r="5" fill={lineColor} stroke="#fff" strokeWidth="2" />
                            </>
                        )}

                        {/* Price labels */}
                        <text x={W - 2} y={PY + 10} textAnchor="end" fill="rgba(136,153,170,0.3)" fontSize="9" fontFamily="sans-serif">
                            {fmtPrice(chartData.max)}
                        </text>
                        <text x={W - 2} y={H - PY} textAnchor="end" fill="rgba(136,153,170,0.3)" fontSize="9" fontFamily="sans-serif">
                            {fmtPrice(chartData.min)}
                        </text>
                    </svg>
                )}
            </div>

            {/* Timeframe selector */}
            <TimeframeSelector active={tf} onChange={setTf} />
        </div>
    );
}
