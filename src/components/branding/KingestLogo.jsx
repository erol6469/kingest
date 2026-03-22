/**
 * KINGEST Premium Logo - Ultra 3D Metallic Style
 */
function KingestLogo({ size = 40, variant = "mark", glow = false }) {
    if (variant === "full") {
        const w = size * 4.5;
        const glowStyle = glow ? { filter: "drop-shadow(0 0 12px rgba(107,165,255,0.2))" } : {};
        return (
            <svg width={w} height={size} viewBox="0 0 360 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={glowStyle}>
                <defs>
                    {/* Ring gradients */}
                    <linearGradient id="lr1" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#1a3a6e"/><stop offset="30%" stopColor="#5a8ad0"/><stop offset="50%" stopColor="#a0c4f0"/><stop offset="70%" stopColor="#5a8ad0"/><stop offset="100%" stopColor="#1a3a6e"/>
                    </linearGradient>
                    <linearGradient id="lr2" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#c8a24a" stopOpacity="0.5"/><stop offset="50%" stopColor="#e8d080" stopOpacity="0.3"/><stop offset="100%" stopColor="#c8a24a" stopOpacity="0.5"/>
                    </linearGradient>
                    {/* K body - metallic blue-silver */}
                    <linearGradient id="lk" x1="0.2" y1="0" x2="0.8" y2="1">
                        <stop offset="0%" stopColor="#e0ecf8"/><stop offset="20%" stopColor="#8ab4e8"/><stop offset="50%" stopColor="#3a6eb8"/><stop offset="80%" stopColor="#1a3a6e"/><stop offset="100%" stopColor="#0e2244"/>
                    </linearGradient>
                    {/* K face highlight */}
                    <linearGradient id="lkh" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4"/><stop offset="40%" stopColor="#ffffff" stopOpacity="0.1"/><stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                    </linearGradient>
                    {/* K side (3D depth) */}
                    <linearGradient id="lks" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#0a1e3e"/><stop offset="100%" stopColor="#162e5a"/>
                    </linearGradient>
                    {/* Word gradient - silver metallic */}
                    <linearGradient id="lw" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#7a9ec8"/><stop offset="25%" stopColor="#c8ddf0"/><stop offset="50%" stopColor="#e8f0f8"/><stop offset="75%" stopColor="#c8ddf0"/><stop offset="100%" stopColor="#7a9ec8"/>
                    </linearGradient>
                    {/* Tag gradient - gold subtle */}
                    <linearGradient id="lt" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8a7a50"/><stop offset="50%" stopColor="#c8b070"/><stop offset="100%" stopColor="#8a7a50"/>
                    </linearGradient>
                    {/* Glow */}
                    <radialGradient id="rg" cx="50%" cy="30%" r="60%">
                        <stop offset="0%" stopColor="#6ba5ff" stopOpacity="0.15"/><stop offset="100%" stopColor="#6ba5ff" stopOpacity="0"/>
                    </radialGradient>
                    {/* Top light flare */}
                    <radialGradient id="rf" cx="40%" cy="10%" r="30%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.12"/><stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                    </radialGradient>
                </defs>

                {/* Background glow */}
                <ellipse cx="40" cy="40" rx="44" ry="44" fill="url(#rg)"/>
                <ellipse cx="40" cy="25" rx="28" ry="20" fill="url(#rf)"/>

                {/* Outer ring - gold accent */}
                <circle cx="40" cy="40" r="35" stroke="url(#lr2)" strokeWidth="1.5" fill="none" opacity="0.6"/>
                {/* Main ring - metallic blue */}
                <circle cx="40" cy="40" r="33" stroke="url(#lr1)" strokeWidth="2.5" fill="none"/>
                {/* Inner ring */}
                <circle cx="40" cy="40" r="30" stroke="url(#lr1)" strokeWidth="0.5" fill="none" opacity="0.3"/>

                {/* Market bar lines (inside ring, left side) */}
                <rect x="18" y="36" width="2" height="16" rx="1" fill="#4a7ac0" opacity="0.15"/>
                <rect x="22" y="28" width="2" height="24" rx="1" fill="#4a7ac0" opacity="0.12"/>
                <rect x="26" y="40" width="2" height="12" rx="1" fill="#4a7ac0" opacity="0.1"/>

                {/* K monogram - 3D effect with side faces */}
                {/* K shadow/depth */}
                <path d="M35 20 L35 62" stroke="url(#lks)" strokeWidth="7" strokeLinecap="round" opacity="0.5" transform="translate(1.5,1.5)"/>
                <path d="M37 40 L55 20" stroke="url(#lks)" strokeWidth="6" strokeLinecap="round" opacity="0.5" transform="translate(1.5,1.5)"/>
                <path d="M37 40 L57 62" stroke="url(#lks)" strokeWidth="6" strokeLinecap="round" opacity="0.5" transform="translate(1.5,1.5)"/>

                {/* K main body */}
                <path d="M35 18 L35 62" stroke="url(#lk)" strokeWidth="6" strokeLinecap="round"/>
                <path d="M37 40 L55 18" stroke="url(#lk)" strokeWidth="5.5" strokeLinecap="round"/>
                <path d="M37 40 L57 62" stroke="url(#lk)" strokeWidth="5.5" strokeLinecap="round"/>

                {/* K highlight shine */}
                <path d="M35 18 L35 40" stroke="url(#lkh)" strokeWidth="3" strokeLinecap="round"/>
                <path d="M37 40 L51 22" stroke="url(#lkh)" strokeWidth="2" strokeLinecap="round"/>
                {/* K edge gleam */}
                <path d="M35 18 L35 24" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>

                {/* Small diamond accent */}
                <polygon points="40,73 42.5,76.5 40,80 37.5,76.5" fill="url(#lr1)" opacity="0.4"/>

                {/* ── KINGEST wordmark ── */}
                <text x="92" y="44" fontFamily="'SF Pro Display',-apple-system,'Helvetica Neue',Arial,sans-serif"
                    fontSize="30" fontWeight="800" letterSpacing="6" fill="url(#lw)">KINGEST</text>

                {/* Decorative lines flanking tagline */}
                <line x1="92" y1="52" x2="155" y2="52" stroke="url(#lt)" strokeWidth="0.5" opacity="0.35"/>
                <line x1="265" y1="52" x2="328" y2="52" stroke="url(#lt)" strokeWidth="0.5" opacity="0.35"/>

                {/* Tagline */}
                <text x="160" y="55" fontFamily="'SF Pro Display',-apple-system,'Helvetica Neue',Arial,sans-serif"
                    fontSize="7" fontWeight="600" letterSpacing="4" fill="url(#lt)" opacity="0.65">TOKENIZED STOCK TRADING</text>

                {/* Small decorative V below tagline */}
                <path d="M208 62 L210 66 L212 62" stroke="url(#lt)" strokeWidth="0.6" fill="none" opacity="0.35"/>
            </svg>
        );
    }

    // ── Mark only (K monogram) ──
    const glowStyle = glow ? { filter: "drop-shadow(0 0 10px rgba(107,165,255,0.3))" } : {};
    return (
        <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={glowStyle}>
            <defs>
                <linearGradient id="mr1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#1a3a6e"/><stop offset="30%" stopColor="#5a8ad0"/><stop offset="50%" stopColor="#a0c4f0"/><stop offset="70%" stopColor="#5a8ad0"/><stop offset="100%" stopColor="#1a3a6e"/>
                </linearGradient>
                <linearGradient id="mr2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#c8a24a" stopOpacity="0.5"/><stop offset="50%" stopColor="#e8d080" stopOpacity="0.3"/><stop offset="100%" stopColor="#c8a24a" stopOpacity="0.5"/>
                </linearGradient>
                <linearGradient id="mk" x1="0.2" y1="0" x2="0.8" y2="1">
                    <stop offset="0%" stopColor="#e0ecf8"/><stop offset="20%" stopColor="#8ab4e8"/><stop offset="50%" stopColor="#3a6eb8"/><stop offset="80%" stopColor="#1a3a6e"/><stop offset="100%" stopColor="#0e2244"/>
                </linearGradient>
                <linearGradient id="mkh" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4"/><stop offset="40%" stopColor="#ffffff" stopOpacity="0.1"/><stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
                </linearGradient>
                <linearGradient id="mks" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0a1e3e"/><stop offset="100%" stopColor="#162e5a"/>
                </linearGradient>
                <radialGradient id="mrg" cx="50%" cy="30%" r="60%">
                    <stop offset="0%" stopColor="#6ba5ff" stopOpacity="0.12"/><stop offset="100%" stopColor="#6ba5ff" stopOpacity="0"/>
                </radialGradient>
            </defs>
            <ellipse cx="40" cy="40" rx="40" ry="40" fill="url(#mrg)"/>
            <circle cx="40" cy="40" r="37" stroke="url(#mr2)" strokeWidth="1.5" fill="none" opacity="0.5"/>
            <circle cx="40" cy="40" r="35" stroke="url(#mr1)" strokeWidth="2.5" fill="none"/>
            <circle cx="40" cy="40" r="32" stroke="url(#mr1)" strokeWidth="0.5" fill="none" opacity="0.3"/>
            <rect x="17" y="36" width="2.5" height="18" rx="1" fill="#4a7ac0" opacity="0.15"/>
            <rect x="21.5" y="26" width="2.5" height="28" rx="1" fill="#4a7ac0" opacity="0.12"/>
            <rect x="26" y="42" width="2.5" height="12" rx="1" fill="#4a7ac0" opacity="0.1"/>
            {/* K shadow */}
            <path d="M35 16 L35 64" stroke="url(#mks)" strokeWidth="7" strokeLinecap="round" opacity="0.5" transform="translate(1.5,1.5)"/>
            <path d="M37 40 L57 16" stroke="url(#mks)" strokeWidth="6" strokeLinecap="round" opacity="0.5" transform="translate(1.5,1.5)"/>
            <path d="M37 40 L59 64" stroke="url(#mks)" strokeWidth="6" strokeLinecap="round" opacity="0.5" transform="translate(1.5,1.5)"/>
            {/* K body */}
            <path d="M35 16 L35 64" stroke="url(#mk)" strokeWidth="6" strokeLinecap="round"/>
            <path d="M37 40 L57 16" stroke="url(#mk)" strokeWidth="5.5" strokeLinecap="round"/>
            <path d="M37 40 L59 64" stroke="url(#mk)" strokeWidth="5.5" strokeLinecap="round"/>
            {/* K shine */}
            <path d="M35 16 L35 40" stroke="url(#mkh)" strokeWidth="3" strokeLinecap="round"/>
            <path d="M37 40 L53 20" stroke="url(#mkh)" strokeWidth="2" strokeLinecap="round"/>
            <path d="M35 16 L35 22" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.35"/>
            <polygon points="40,74 42.5,77.5 40,81 37.5,77.5" fill="url(#mr1)" opacity="0.4"/>
        </svg>
    );
}

export { KingestLogo };
