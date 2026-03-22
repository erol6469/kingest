import { useState } from "react";
import { C } from "../data/constants";
import CommodityIcon from "./CommodityIcon";

function AssetLogo({ asset, type, size = 48 }) {
    const brandColor = asset.color || C.primary;
    const [imgError, setImgError] = useState(false);

    if (type === "forex") {
        const s1 = asset.logo1, s2 = asset.logo2;
        const iconSz = size * 0.72;
        return (
            <div style={{ width: size, height: size, position: "relative", flexShrink: 0 }}>
                {s1 ? <img src={s1} width={iconSz} height={iconSz} style={{ position: "absolute", top: 0, left: 0, borderRadius: "50%", border: "2px solid rgba(15,28,50,0.9)" }} />
                    : <img src={asset.f1} width={iconSz} height={iconSz} style={{ position: "absolute", top: 0, left: 0, borderRadius: "50%", border: "2px solid rgba(15,28,50,0.9)", objectFit: "cover" }} onError={e => { e.target.style.display = "none" }} />}
                {s2 ? <img src={s2} width={iconSz} height={iconSz} style={{ position: "absolute", bottom: 0, right: 0, borderRadius: "50%", border: "2px solid rgba(15,28,50,0.9)" }} />
                    : <img src={asset.f2} width={iconSz} height={iconSz} style={{ position: "absolute", bottom: 0, right: 0, borderRadius: "50%", border: "2px solid rgba(15,28,50,0.9)", objectFit: "cover" }} onError={e => { e.target.style.display = "none" }} />}
            </div>
        );
    }
    if (type === "commodity") {
        return <CommodityIcon symbol={asset.sym} size={size} />;
    }

    if (asset.logo && !imgError) {
        return (
            <div style={{ width: size, height: size, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${brandColor}33`, flexShrink: 0, overflow: "hidden", boxShadow: `0 2px 8px ${brandColor}22` }}>
                <img src={asset.logo} width={size * 0.75} height={size * 0.75} style={{ borderRadius: "50%", objectFit: "contain" }} onError={() => setImgError(true)} />
            </div>
        );
    }
    return (
        <div style={{ width: size, height: size, borderRadius: "50%", background: `linear-gradient(135deg, ${brandColor}22, ${brandColor}08)`, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${brandColor}33`, flexShrink: 0 }}>
            <span style={{ fontWeight: 800, fontSize: size * 0.38, color: brandColor }}>{asset.sym.replace(/\..+$/, "").slice(0,2)}</span>
        </div>
    );
}

export { AssetLogo };
