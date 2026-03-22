import React from "react";

const W = (children, glow = "#1fd6ff") => (
  <svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id={`bg_${glow.slice(1)}`} cx="50%" cy="40%" r="70%">
        <stop offset="0%" stopColor="#102347" />
        <stop offset="100%" stopColor="#071326" />
      </radialGradient>
      <filter id={`gl_${glow.slice(1)}`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <circle cx="48" cy="48" r="42" fill={`url(#bg_${glow.slice(1)})`} stroke="rgba(255,255,255,0.10)" />
    <circle cx="48" cy="48" r="41" stroke={glow} strokeOpacity="0.18" filter={`url(#gl_${glow.slice(1)})`} />
    {children}
  </svg>
);

const ICONS = {
  gold: () => W(
    <>
      {/* Gold bar 3D — front face */}
      <rect x="24" y="44" width="48" height="16" rx="3" fill="#E8A817" stroke="#F4C44E" strokeWidth="0.5" />
      {/* Top face — lighter */}
      <path d="M28 44L36 34H64L56 44Z" fill="#FFD76A" stroke="#F4C44E" strokeWidth="0.5" />
      {/* Right face — shadow */}
      <path d="M56 44L64 34V50L56 60V44Z" fill="#C18A0E" />
      {/* Stamp mark */}
      <rect x="34" y="47" width="18" height="9" rx="1.5" fill="none" stroke="#C9921E" strokeWidth="1" />
      <text x="43" y="54.5" textAnchor="middle" fill="#C9921E" fontSize="7" fontWeight="900" fontFamily="sans-serif">999.9</text>
      {/* Shine */}
      <path d="M30 40L36 34L50 34" stroke="#FFF5CC" strokeWidth="1.5" opacity="0.6" fill="none" strokeLinecap="round" />
    </>,
    "#ffcf5a"
  ),

  silver: () => W(
    <>
      {/* Silver coin with edge detail */}
      <circle cx="48" cy="48" r="22" fill="#D0D8E8" stroke="#E8EDF5" strokeWidth="2" />
      <circle cx="48" cy="48" r="18" fill="none" stroke="#B8C4D8" strokeWidth="1" strokeDasharray="3 2" />
      <circle cx="48" cy="48" r="13" fill="#E4EAF4" stroke="#C8D2E2" />
      {/* AG symbol */}
      <text x="48" y="53" textAnchor="middle" fill="#6B7A94" fontSize="14" fontWeight="900" fontFamily="sans-serif">AG</text>
      {/* Shine */}
      <ellipse cx="40" cy="40" rx="6" ry="4" fill="#FFFFFF" opacity="0.35" transform="rotate(-25 40 40)" />
    </>,
    "#cfe6ff"
  ),

  brent: () => W(
    <>
      {/* Brent — dark barrel with metal bands + North Sea blue wave */}
      <rect x="30" y="26" width="36" height="44" rx="7" fill="#1A1F2E" stroke="#4A5568" strokeWidth="1.5" />
      {/* Metal bands */}
      <rect x="29" y="32" width="38" height="4" rx="1" fill="#5A6577" />
      <rect x="29" y="60" width="38" height="4" rx="1" fill="#5A6577" />
      {/* Cap */}
      <rect x="42" y="22" width="12" height="6" rx="2" fill="#4A5568" stroke="#6B7A90" />
      {/* Brent label */}
      <rect x="35" y="41" width="26" height="12" rx="2" fill="none" stroke="#3B82F6" strokeWidth="1" />
      <text x="48" y="50.5" textAnchor="middle" fill="#60A5FA" fontSize="8" fontWeight="900" fontFamily="sans-serif">BRENT</text>
      {/* Blue wave — North Sea */}
      <path d="M32 54C36 52 40 56 44 54C48 52 52 56 56 54C60 52 64 56 64 54" stroke="#3B82F6" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round" />
    </>,
    "#3b82f6"
  ),

  wti: () => W(
    <>
      {/* WTI — Texas pumpjack silhouette */}
      {/* Ground line */}
      <line x1="24" y1="68" x2="72" y2="68" stroke="#8B6914" strokeWidth="2" />
      {/* Base/motor */}
      <rect x="28" y="58" width="16" height="10" rx="2" fill="#4A3810" stroke="#8B6914" />
      {/* Pump arm — angled beam */}
      <line x1="36" y1="58" x2="62" y2="34" stroke="#C4960C" strokeWidth="3.5" strokeLinecap="round" />
      {/* Horse head at top */}
      <path d="M58 34L66 30L68 36L62 38Z" fill="#E8B817" stroke="#C4960C" strokeWidth="1" />
      {/* Cable down */}
      <line x1="66" y1="36" x2="66" y2="58" stroke="#8B6914" strokeWidth="1.5" strokeDasharray="3 2" />
      {/* Pivot point circle */}
      <circle cx="36" cy="58" r="3" fill="#C4960C" stroke="#E8B817" strokeWidth="1" />
      {/* WTI label */}
      <text x="48" y="78" textAnchor="middle" fill="#C4960C" fontSize="9" fontWeight="900" fontFamily="sans-serif">WTI</text>
    </>,
    "#c4960c"
  ),

  gas: () => W(
    <>
      <path d="M48 24C39 35 33 42 33 53C33 63 39.9 71 48 71C56.1 71 63 63 63 53C63 42 57 35 48 24Z" fill="#FF8C42" stroke="#FFC08F" />
      <path d="M48 37C44 43 42 46 42 52C42 57 44.6 61 48 61C51.4 61 54 57 54 52C54 46 52 43 48 37Z" fill="#FFD2A8" opacity="0.8" />
    </>,
    "#ff9248"
  ),

  wheat: () => W(
    <>
      <path d="M48 24V72" stroke="#E7C26B" strokeWidth="3" strokeLinecap="round" />
      <path d="M48 31C42 31 39 36 39 40C45 40 48 35 48 31Z" fill="#F0D487" />
      <path d="M48 39C42 39 39 44 39 48C45 48 48 43 48 39Z" fill="#EBCF7A" />
      <path d="M48 47C42 47 39 52 39 56C45 56 48 51 48 47Z" fill="#E6C96D" />
      <path d="M48 31C54 31 57 36 57 40C51 40 48 35 48 31Z" fill="#F0D487" />
      <path d="M48 39C54 39 57 44 57 48C51 48 48 43 48 39Z" fill="#EBCF7A" />
      <path d="M48 47C54 47 57 52 57 56C51 56 48 51 48 47Z" fill="#E6C96D" />
    </>,
    "#f0cf7b"
  ),

  corn: () => W(
    <>
      <path d="M48 20V76" stroke="#7A9B45" strokeWidth="3" strokeLinecap="round" />
      <ellipse cx="48" cy="48" rx="14" ry="22" fill="#F5D547" stroke="#E8C83A" />
      <path d="M38 38H58M38 44H58M38 50H58M38 56H58" stroke="#DBBB30" strokeWidth="1.5" opacity="0.6" />
    </>,
    "#f5d547"
  ),

  soy: () => W(
    <>
      <ellipse cx="40" cy="46" rx="10" ry="13" fill="#8FBC8F" stroke="#A8D5A8" />
      <ellipse cx="56" cy="46" rx="10" ry="13" fill="#7DAF7D" stroke="#A0CCA0" />
      <ellipse cx="48" cy="54" rx="10" ry="11" fill="#6B9E6B" stroke="#8FC08F" />
    </>,
    "#8fbc8f"
  ),

  coffee: () => W(
    <>
      <path d="M48 26C38 26 31 37 31 48C31 59 38 70 48 70C58 70 65 59 65 48C65 37 58 26 48 26Z" fill="#7A4A2A" stroke="#B97A52" />
      <path d="M48 32C43 38 44 45 48 50C52 55 53 62 48 66" stroke="#D9B090" strokeWidth="3" strokeLinecap="round" />
    </>,
    "#b67646"
  ),

  sugar: () => W(
    <>
      <rect x="32" y="32" width="32" height="32" rx="5" fill="#F2EEE7" stroke="#FFFDF9" />
      <path d="M32 42L48 32L64 42L48 52L32 42Z" fill="#FFFFFF" opacity="0.65" />
    </>,
    "#f8f1d9"
  ),

  cotton: () => W(
    <>
      <path d="M48 66V48" stroke="#7A8B62" strokeWidth="3" strokeLinecap="round" />
      <path d="M37 52C31 52 27 47 27 42C27 36 32 32 38 32C41 27 45 25 48 25C52 25 55 28 57 32C63 32 68 36 68 42C68 47 64 52 58 52H37Z" fill="#FAFAFA" stroke="#DDE2E6" />
    </>,
    "#e8f2ff"
  ),

  copper: () => W(
    <>
      {/* Copper pipe cross-section */}
      <circle cx="48" cy="48" r="22" fill="#C77B45" stroke="#E09A62" strokeWidth="2" />
      <circle cx="48" cy="48" r="15" fill="#0E1B30" stroke="#A0653A" strokeWidth="2" />
      {/* Shine arc */}
      <path d="M32 38C36 30 44 27 52 28" stroke="#E8B888" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.6" />
      {/* CU text */}
      <text x="48" y="53" textAnchor="middle" fill="#E09A62" fontSize="11" fontWeight="800" fontFamily="sans-serif">CU</text>
    </>,
    "#d58a4e"
  ),

  platinum: () => W(
    <>
      {/* Platinum hexagonal bar — premium cut */}
      <polygon points="48,26 66,37 66,59 48,70 30,59 30,37" fill="#C8D0DC" stroke="#E8EEF6" strokeWidth="1.5" />
      <polygon points="48,26 66,37 48,48 30,37" fill="#DFE6F0" />
      <polygon points="66,37 66,59 48,70 48,48" fill="#9AA4B4" />
      <polygon points="30,37 48,48 48,70 30,59" fill="#B0BAC8" />
      {/* PT symbol */}
      <text x="48" y="53" textAnchor="middle" fill="#4A5568" fontSize="13" fontWeight="900" fontFamily="sans-serif">PT</text>
      {/* Highlight */}
      <path d="M36 33L48 27L58 32" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.4" fill="none" strokeLinecap="round" />
    </>,
    "#d8e3f0"
  ),

  palladium: () => W(
    <>
      {/* Catalytic converter honeycomb grid — palladium's main use */}
      <rect x="28" y="28" width="40" height="40" rx="8" fill="#2A3444" stroke="#6B7A90" strokeWidth="1.5" />
      {/* Honeycomb pattern */}
      <circle cx="38" cy="38" r="4" fill="none" stroke="#8896AA" strokeWidth="1.2" />
      <circle cx="48" cy="38" r="4" fill="none" stroke="#8896AA" strokeWidth="1.2" />
      <circle cx="58" cy="38" r="4" fill="none" stroke="#8896AA" strokeWidth="1.2" />
      <circle cx="33" cy="48" r="4" fill="none" stroke="#7A8A9E" strokeWidth="1.2" />
      <circle cx="43" cy="48" r="4" fill="none" stroke="#7A8A9E" strokeWidth="1.2" />
      <circle cx="53" cy="48" r="4" fill="none" stroke="#7A8A9E" strokeWidth="1.2" />
      <circle cx="63" cy="48" r="4" fill="none" stroke="#7A8A9E" strokeWidth="1.2" />
      <circle cx="38" cy="58" r="4" fill="none" stroke="#6D7E92" strokeWidth="1.2" />
      <circle cx="48" cy="58" r="4" fill="none" stroke="#6D7E92" strokeWidth="1.2" />
      <circle cx="58" cy="58" r="4" fill="none" stroke="#6D7E92" strokeWidth="1.2" />
      {/* Glow center dot */}
      <circle cx="48" cy="48" r="3" fill="#A0B4CC" opacity="0.5" />
      {/* PD label */}
      <text x="48" y="75" textAnchor="middle" fill="#8896AA" fontSize="9" fontWeight="800" fontFamily="sans-serif">PD</text>
    </>,
    "#8ea6c4"
  ),

  cocoa: () => W(
    <>
      <path d="M48 26C38 26 30 35 30 48C30 61 38 70 48 70C58 70 66 61 66 48C66 35 58 26 48 26Z" fill="#5C3310" stroke="#8B5E34" />
      <path d="M48 30C44 36 43 42 48 48C53 54 52 60 48 66" stroke="#A67C52" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M42 34C40 40 41 46 44 50" stroke="#A67C52" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </>,
    "#8b5e34"
  ),
};

// Map commodity symbols to icon types
const SYM_MAP = {
  "XAU/USD": "gold", "XAG/USD": "silver",
  "BRENT": "brent", "WTI": "wti",
  "NG": "gas", "COPPER": "copper",
  "PLATINUM": "platinum", "PALLADIUM": "palladium",
  "WHEAT": "wheat", "CORN": "corn",
  "SOYBEAN": "soy", "COFFEE": "coffee",
  "SUGAR": "sugar", "COTTON": "cotton",
  "COCOA": "cocoa",
};

export default function CommodityIcon({ symbol, size = 48 }) {
  const type = SYM_MAP[symbol] || "gold";
  const renderIcon = ICONS[type] || ICONS.gold;
  return <div style={{ width: size, height: size, flexShrink: 0 }}>{renderIcon()}</div>;
}

export { SYM_MAP };
