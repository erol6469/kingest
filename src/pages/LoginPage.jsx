import { useState, useEffect, useRef } from "react";
import { API_BASE } from "../config";

// ═══════════════════════════════════════════════════════════════
//  KINGEST — Login Page (style Gestia)
//  Gradient + Social login + Email/PIN
//  Wakes up Render server in background
// ═══════════════════════════════════════════════════════════════

export function LoginPage({ onAuth }) {
  const [mode, setMode] = useState("social"); // social | email
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const serverPinged = useRef(false);

  // ── Wake up the Render server immediately ──
  useEffect(() => {
    if (serverPinged.current) return;
    serverPinged.current = true;
    const wakeUp = async () => {
      try {
        const r = await fetch(API_BASE + "/health", { signal: AbortSignal.timeout(60000) });
        if (r.ok) setServerReady(true);
      } catch {
        setTimeout(async () => {
          try {
            const r2 = await fetch(API_BASE + "/health", { signal: AbortSignal.timeout(60000) });
            if (r2.ok) setServerReady(true);
          } catch {}
        }, 5000);
      }
    };
    wakeUp();
  }, []);

  // Also via native bridge
  useEffect(() => {
    if (window.__KINGEST_FETCH) {
      const cb = "__wake_" + Date.now();
      window[cb] = () => { setServerReady(true); delete window[cb]; };
      window.__KINGEST_FETCH(API_BASE + "/health", cb);
    }
  }, []);

  const doAuth = async (endpoint, body) => {
    let data;
    try {
      const r = await fetch(API_BASE + endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      data = await r.json();
    } catch (e) {
      throw new Error(!serverReady ? "Serveur en démarrage... Réessayez" : "Erreur réseau");
    }
    if (!data?.ok) throw new Error(data?.error || "Échec");
    return data;
  };

  // ── Email/PIN login ──
  const handleEmailAuth = async () => {
    setError("");
    if (!email || !email.includes("@")) { setError("Email invalide"); return; }
    if (!pin || pin.length < 4) { setError("PIN: 4 chiffres minimum"); return; }
    if (isRegister && pin !== confirmPin) { setError("Les PINs ne correspondent pas"); return; }

    setLoading(true);
    try {
      const endpoint = isRegister ? "/api/v1/auth/register" : "/api/v1/auth/login";
      const data = await doAuth(endpoint, { email, pin });
      if (data.token) {
        try {
          localStorage.setItem("kingest_auth_token", data.token);
          localStorage.setItem("kingest_user_email", email.toLowerCase());
          localStorage.setItem("kingest_user_id", data.userId);
        } catch {}
        onAuth(data.token, email.toLowerCase());
      }
    } catch (e) {
      if (e.message?.includes("Invalid")) setError("Email ou PIN incorrect");
      else if (e.message?.includes("exists")) { setError("Compte existant — connectez-vous"); setIsRegister(false); }
      else setError(e.message);
    }
    setLoading(false);
  };

  // ── Google Sign-In (opens OAuth popup) ──
  const handleGoogleSignIn = () => {
    setError("");
    // For WKWebView: open Google OAuth in Safari
    // For now, switch to email mode as fallback
    setMode("email");
    setError("Google Sign-In bientôt disponible. Utilisez Email + PIN.");
  };

  // ── Apple Sign-In (native bridge) ──
  const handleAppleSignIn = () => {
    setError("");
    if (window.__KINGEST_APPLE_AUTH) {
      setLoading(true);
      window.__KINGEST_APPLE_AUTH((result) => {
        if (result?.token) {
          onAuth(result.token, result.email || "");
        } else {
          setError("Connexion Apple annulée");
        }
        setLoading(false);
      });
    } else {
      setMode("email");
      setError("Apple Sign-In bientôt disponible. Utilisez Email + PIN.");
    }
  };

  // ── Social buttons view ──
  if (mode === "social") {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          {/* Logo + Title */}
          <div style={styles.header}>
            <div style={styles.logoCircle}>
              <svg width="72" height="72" viewBox="0 0 72 72">
                <defs>
                  <linearGradient id="kLogo" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
                  </linearGradient>
                </defs>
                <circle cx="36" cy="36" r="34" fill="url(#kLogo)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                <text x="36" y="46" textAnchor="middle" fill="#fff" fontSize="32" fontWeight="800" fontFamily="system-ui">K</text>
              </svg>
            </div>
            <h1 style={styles.title}>Kingest</h1>
            <p style={styles.subtitle}>Investissement intelligent par IA</p>
          </div>

          {/* Buttons */}
          <div style={styles.buttonContainer}>
            {/* Apple */}
            <button style={styles.appleBtn} onClick={handleAppleSignIn} disabled={loading}>
              {loading ? <span style={styles.spinnerWhite}>⏳</span> : (
                <>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                    <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                  </svg>
                  <span>Continuer avec Apple</span>
                </>
              )}
            </button>

            {/* Google */}
            <button style={styles.googleBtn} onClick={handleGoogleSignIn} disabled={loading}>
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>Continuer avec Google</span>
            </button>

            {/* Divider */}
            <div style={styles.divider}>
              <div style={styles.dividerLine} />
              <span style={styles.dividerText}>ou</span>
              <div style={styles.dividerLine} />
            </div>

            {/* Email button */}
            <button style={styles.emailBtn} onClick={() => setMode("email")}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
              </svg>
              <span>Continuer avec Email</span>
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          {/* Footer */}
          <p style={styles.footer}>
            En continuant, vous acceptez nos conditions d'utilisation
          </p>

          {/* Server status */}
          <div style={styles.serverStatus}>
            <div style={{ ...styles.statusDot, background: serverReady ? "#4CAF50" : "#FF9500" }} />
            <span style={styles.statusLabel}>{serverReady ? "Connecté" : "Connexion..."}</span>
          </div>
        </div>
      </div>
    );
  }

  // ── Email/PIN form view ──
  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Back button */}
        <button style={styles.backBtn} onClick={() => { setMode("social"); setError(""); }}>
          ← Retour
        </button>

        <div style={styles.header}>
          <h1 style={{ ...styles.title, fontSize: 28 }}>
            {isRegister ? "Créer un compte" : "Se connecter"}
          </h1>
          <p style={styles.subtitle}>Avec votre email et code PIN</p>
        </div>

        <div style={styles.formCard}>
          {/* Email */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              autoCapitalize="none"
              autoComplete="email"
            />
          </div>

          {/* PIN */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Code PIN (4-6 chiffres)</label>
            <input
              type="password"
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              style={styles.input}
              inputMode="numeric"
              maxLength={6}
            />
          </div>

          {/* Confirm PIN */}
          {isRegister && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirmer le PIN</label>
              <input
                type="password"
                placeholder="••••"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                style={styles.input}
                inputMode="numeric"
                maxLength={6}
              />
            </div>
          )}

          {error && <div style={styles.error}>{error}</div>}

          <button
            style={{ ...styles.submitBtn, opacity: loading ? 0.6 : 1 }}
            onClick={handleEmailAuth}
            disabled={loading}
          >
            {loading ? "Connexion..." : isRegister ? "Créer mon compte" : "Se connecter"}
          </button>

          <button
            style={styles.switchBtn}
            onClick={() => { setIsRegister(!isRegister); setError(""); }}
          >
            {isRegister ? "Déjà un compte ? Se connecter" : "Pas de compte ? Créer un compte"}
          </button>
        </div>

        <div style={styles.serverStatus}>
          <div style={{ ...styles.statusDot, background: serverReady ? "#4CAF50" : "#FF9500" }} />
          <span style={styles.statusLabel}>{serverReady ? "Connecté" : "Connexion..."}</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
//  Styles — Gradient Gestia style
// ═══════════════════════════════════════════════════════════════
const styles = {
  container: {
    position: "fixed", inset: 0,
    background: "linear-gradient(165deg, #667eea 0%, #764ba2 100%)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
    overflow: "auto",
  },
  content: {
    width: "100%", maxWidth: 380,
    padding: "60px 32px 40px",
    display: "flex", flexDirection: "column", alignItems: "center",
  },
  header: {
    textAlign: "center", marginBottom: 48,
  },
  logoCircle: {
    marginBottom: 16,
  },
  title: {
    fontSize: 42, fontWeight: "800", color: "#fff",
    margin: 0, letterSpacing: "-1px",
  },
  subtitle: {
    fontSize: 17, color: "rgba(255,255,255,0.85)",
    margin: "6px 0 0", fontWeight: 500,
  },
  buttonContainer: {
    width: "100%",
    display: "flex", flexDirection: "column", gap: 14,
  },
  appleBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
    width: "100%", padding: "16px 24px",
    background: "#000", border: "none", borderRadius: 14,
    color: "#fff", fontSize: 16, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  googleBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
    width: "100%", padding: "16px 24px",
    background: "#DB4437", border: "none", borderRadius: 14,
    color: "#fff", fontSize: 16, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  emailBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
    width: "100%", padding: "16px 24px",
    background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
    backdropFilter: "blur(10px)",
  },
  divider: {
    display: "flex", alignItems: "center", gap: 16,
    margin: "4px 0",
  },
  dividerLine: {
    flex: 1, height: 1,
    background: "rgba(255,255,255,0.2)",
  },
  dividerText: {
    color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 500,
  },
  backBtn: {
    alignSelf: "flex-start",
    background: "none", border: "none",
    color: "rgba(255,255,255,0.8)", fontSize: 16,
    cursor: "pointer", fontFamily: "inherit",
    marginBottom: 16, padding: 0, fontWeight: 500,
  },
  formCard: {
    width: "100%",
    background: "rgba(255,255,255,0.1)",
    borderRadius: 20, padding: "24px 20px",
    border: "1px solid rgba(255,255,255,0.15)",
    backdropFilter: "blur(20px)",
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    display: "block", fontSize: 13, fontWeight: 600,
    color: "rgba(255,255,255,0.7)", marginBottom: 6,
  },
  input: {
    width: "100%", padding: "14px 16px",
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 12, fontSize: 16, color: "#fff",
    outline: "none", boxSizing: "border-box",
    fontFamily: "inherit",
  },
  error: {
    background: "rgba(255,80,80,0.2)",
    border: "1px solid rgba(255,80,80,0.3)",
    borderRadius: 10, padding: "10px 14px",
    color: "#fff", fontSize: 13, fontWeight: 500,
    marginBottom: 16, textAlign: "center",
  },
  submitBtn: {
    width: "100%", padding: "16px 0",
    background: "rgba(255,255,255,0.2)",
    border: "1px solid rgba(255,255,255,0.3)",
    borderRadius: 14, color: "#fff", fontSize: 17, fontWeight: 700,
    cursor: "pointer", fontFamily: "inherit",
    transition: "opacity 0.2s",
  },
  switchBtn: {
    width: "100%", padding: "12px 0",
    background: "none", border: "none",
    color: "rgba(255,255,255,0.7)", fontSize: 14,
    cursor: "pointer", fontFamily: "inherit",
    marginTop: 8,
  },
  spinnerWhite: {
    display: "inline-block",
  },
  footer: {
    marginTop: 32, fontSize: 12,
    color: "rgba(255,255,255,0.5)", textAlign: "center",
  },
  serverStatus: {
    display: "flex", alignItems: "center", justifyContent: "center",
    gap: 6, marginTop: 20,
  },
  statusDot: {
    width: 6, height: 6, borderRadius: "50%",
    transition: "background 0.3s",
  },
  statusLabel: {
    fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 500,
  },
};
