import { useState, useEffect, useRef, useCallback } from "react";
import { API_BASE } from "../config";

// ── Registration steps ──
const STEP_FORM = 0;
const STEP_SELFIE = 1;
const STEP_PROCESSING = 2;

export function LoginPage({ onAuth }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);
  const [step, setStep] = useState(STEP_FORM);
  const [selfieData, setSelfieData] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const pinged = useRef(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Wake up server in background
  useEffect(() => {
    if (pinged.current) return;
    pinged.current = true;
    fetch(API_BASE + "/health", { signal: AbortSignal.timeout(60000) })
      .then(r => { if (r.ok) setServerReady(true); })
      .catch(() => {
        setTimeout(() => {
          fetch(API_BASE + "/health", { signal: AbortSignal.timeout(60000) })
            .then(r => { if (r.ok) setServerReady(true); })
            .catch(() => {});
        }, 5000);
      });
  }, []);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 480 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err) {
      console.error("Camera error:", err);
      setError("Impossible d'accéder à la caméra");
      setStep(STEP_FORM);
    }
  }, []);

  const takeSelfie = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    // Crop center square and mirror
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.save();
    ctx.translate(300, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, sx, sy, size, size, 0, 0, 300, 300);
    ctx.restore();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setSelfieData(dataUrl);
    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const retakeSelfie = useCallback(() => {
    setSelfieData(null);
    startCamera();
  }, [startCamera]);

  // When entering selfie step, start camera
  useEffect(() => {
    if (step === STEP_SELFIE && !selfieData) {
      startCamera();
    }
  }, [step, selfieData, startCamera]);

  const handleFormSubmit = () => {
    setError("");
    if (!email || !email.includes("@")) { setError("Email invalide"); return; }
    if (!pin || pin.length !== 6) { setError("PIN : exactement 6 chiffres"); return; }
    if (isRegister && pin !== confirmPin) { setError("Les PINs ne correspondent pas"); return; }

    if (isRegister) {
      // Go to selfie step for registration
      setStep(STEP_SELFIE);
    } else {
      // Direct login
      doAuth();
    }
  };

  const handleSelfieConfirm = () => {
    if (!selfieData) { setError("Prenez un selfie d'abord"); return; }
    doAuth();
  };

  const doAuth = async () => {
    setLoading(true);
    setError("");
    if (isRegister) setStep(STEP_PROCESSING);
    try {
      const endpoint = isRegister ? "/api/v1/auth/register" : "/api/v1/auth/login";
      let data;

      // Use native bridge POST if available (WKWebView)
      if (window.__KINGEST_POST) {
        data = await new Promise((resolve) => {
          const cb = "__auth_" + Date.now();
          window[cb] = (b64) => {
            try { resolve(JSON.parse(atob(b64))); } catch { resolve(null); }
            delete window[cb];
          };
          window.__KINGEST_POST(API_BASE + endpoint, JSON.stringify({ email, pin }), cb);
          setTimeout(() => { if (window[cb]) { delete window[cb]; resolve(null); } }, 15000);
        });
      }

      // Fallback to direct fetch
      if (!data) {
        const r = await fetch(API_BASE + endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, pin }),
        });
        data = await r.json();
      }

      if (data?.ok && data.token) {
        try {
          localStorage.setItem("kingest_auth_token", data.token);
          localStorage.setItem("kingest_user_email", email.toLowerCase());
          localStorage.setItem("kingest_user_id", data.userId);
          localStorage.setItem("kingest_auth_version", "2");
          // Save selfie + Face ID enrollment flag
          if (isRegister && selfieData) {
            localStorage.setItem("kingest_selfie", selfieData);
            localStorage.setItem("kingest_faceid_enrolled", "true");
            // Tell native bridge to enroll Face ID + save token for next launch
            if (window.__KINGEST_ENROLL_FACEID) {
              window.__KINGEST_ENROLL_FACEID(email.toLowerCase(), data.token, data.userId);
            }
          }
        } catch {}
        onAuth(data.token, email.toLowerCase());
      } else {
        setStep(STEP_FORM);
        if (data?.error?.includes("Invalid")) setError("Email ou PIN incorrect");
        else if (data?.error?.includes("exists")) { setError("Ce compte existe déjà"); setIsRegister(false); }
        else if (data?.error?.includes("6 digits")) setError("Le PIN doit faire exactement 6 chiffres");
        else setError(data?.error || "Erreur");
      }
    } catch (e) {
      setStep(STEP_FORM);
      setError(serverReady ? "Erreur réseau" : "Serveur en démarrage... Réessayez dans 10s");
    }
    setLoading(false);
  };

  // ═══ RENDER ═══

  // Step: Selfie capture
  if (step === STEP_SELFIE) {
    return (
      <div style={s.container}>
        <div style={s.content}>
          <div style={s.header}>
            <h1 style={{ ...s.title, fontSize: 28 }}>Reconnaissance faciale</h1>
            <p style={s.subtitle}>Prenez un selfie pour activer Face ID</p>
          </div>

          <div style={s.selfieCard}>
            <div style={s.selfieFrame}>
              {!selfieData ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={s.video}
                  />
                  <div style={s.selfieOverlay}>
                    <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
                      <defs>
                        <mask id="faceMask">
                          <rect width="200" height="200" fill="white" />
                          <ellipse cx="100" cy="95" rx="65" ry="80" fill="black" />
                        </mask>
                      </defs>
                      <rect width="200" height="200" fill="rgba(0,0,0,0.5)" mask="url(#faceMask)" />
                      <ellipse cx="100" cy="95" rx="65" ry="80" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeDasharray="8,4" />
                    </svg>
                  </div>
                </>
              ) : (
                <img src={selfieData} alt="Selfie" style={s.selfieImg} />
              )}
            </div>
            <canvas ref={canvasRef} style={{ display: "none" }} />

            {!selfieData ? (
              <button
                style={{ ...s.btn, background: "rgba(255,255,255,0.25)", marginTop: 16 }}
                onClick={takeSelfie}
                disabled={!cameraActive}
              >
                {cameraActive ? "Prendre la photo" : "Chargement caméra..."}
              </button>
            ) : (
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button style={{ ...s.btn, flex: 1, background: "rgba(255,255,255,0.1)" }} onClick={retakeSelfie}>
                  Reprendre
                </button>
                <button style={{ ...s.btn, flex: 1, background: "rgba(76,175,80,0.4)" }} onClick={handleSelfieConfirm}>
                  Confirmer
                </button>
              </div>
            )}

            {error && <div style={s.error}>{error}</div>}
          </div>

          <button
            style={{ ...s.backBtn }}
            onClick={() => { setStep(STEP_FORM); setSelfieData(null); if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; } setCameraActive(false); }}
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  // Step: Processing animation
  if (step === STEP_PROCESSING) {
    return (
      <div style={s.container}>
        <div style={{ ...s.content, justifyContent: "center", minHeight: "60vh" }}>
          <div style={s.processingIcon}>
            <svg width="80" height="80" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3" />
              <circle cx="40" cy="40" r="36" fill="none" stroke="#fff" strokeWidth="3"
                strokeDasharray="180" strokeDashoffset="60" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" from="0 40 40" to="360 40 40" dur="1s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>
          <h2 style={{ color: "#fff", fontSize: 22, fontWeight: 700, marginTop: 24 }}>Création du compte...</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginTop: 8 }}>Configuration de Face ID</p>
        </div>
      </div>
    );
  }

  // Step: Main form (login / register)
  return (
    <div style={s.container}>
      <div style={s.content}>
        {/* Logo */}
        <div style={s.header}>
          <svg width="68" height="68" viewBox="0 0 68 68">
            <defs>
              <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />
              </linearGradient>
            </defs>
            <circle cx="34" cy="34" r="32" fill="url(#lg)" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
            <text x="34" y="44" textAnchor="middle" fill="#fff" fontSize="30" fontWeight="800" fontFamily="system-ui">K</text>
          </svg>
          <h1 style={s.title}>Kingest</h1>
          <p style={s.subtitle}>Investissement intelligent</p>
        </div>

        {/* Form */}
        <div style={s.card}>
          <div style={s.toggleRow}>
            <button style={{ ...s.toggle, ...(isRegister ? {} : s.toggleOn) }} onClick={() => { setIsRegister(false); setError(""); setStep(STEP_FORM); }}>
              Connexion
            </button>
            <button style={{ ...s.toggle, ...(isRegister ? s.toggleOn : {}) }} onClick={() => { setIsRegister(true); setError(""); }}>
              Inscription
            </button>
          </div>

          <label style={s.label}>Email</label>
          <input type="email" placeholder="votre@email.com" value={email}
            onChange={e => setEmail(e.target.value)} style={s.input}
            autoCapitalize="none" autoComplete="email" />

          <label style={s.label}>Code PIN (6 chiffres)</label>
          <input type="password" placeholder="••••••" value={pin}
            onChange={e => setPin(e.target.value.replace(/\D/g,"").slice(0,6))} style={s.input}
            inputMode="numeric" maxLength={6} />

          {isRegister && (
            <>
              <label style={s.label}>Confirmer le PIN</label>
              <input type="password" placeholder="••••••" value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/\D/g,"").slice(0,6))} style={s.input}
                inputMode="numeric" maxLength={6} />
            </>
          )}

          {error && <div style={s.error}>{error}</div>}

          <button style={{ ...s.btn, opacity: loading ? 0.6 : 1 }} onClick={handleFormSubmit} disabled={loading}>
            {loading ? "Connexion..." : isRegister ? "Suivant — Selfie" : "Se connecter"}
          </button>

          {isRegister && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textAlign: "center", marginTop: 12 }}>
              Un selfie sera demandé pour activer Face ID
            </p>
          )}
        </div>

        <div style={s.status}>
          <div style={{ width:6, height:6, borderRadius:"50%", background: serverReady ? "#4CAF50" : "#FF9500", transition:"background 0.3s" }} />
          <span style={{ fontSize:11, color:"rgba(255,255,255,0.4)" }}>{serverReady ? "Serveur connecté" : "Connexion au serveur..."}</span>
        </div>

        <p style={s.footer}>En continuant, vous acceptez nos conditions d'utilisation</p>
      </div>
    </div>
  );
}

const s = {
  container: {
    position:"fixed", inset:0,
    background:"linear-gradient(165deg, #667eea 0%, #764ba2 100%)",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontFamily:"-apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
    overflow:"auto",
  },
  content: {
    width:"100%", maxWidth:380, padding:"60px 28px 40px",
    display:"flex", flexDirection:"column", alignItems:"center",
  },
  header: { textAlign:"center", marginBottom:40 },
  title: { fontSize:38, fontWeight:800, color:"#fff", margin:"12px 0 0", letterSpacing:"-1px" },
  subtitle: { fontSize:16, color:"rgba(255,255,255,0.8)", margin:"4px 0 0", fontWeight:500 },
  card: {
    width:"100%", background:"rgba(255,255,255,0.1)", borderRadius:20,
    padding:"24px 20px", border:"1px solid rgba(255,255,255,0.15)",
    backdropFilter:"blur(20px)",
  },
  toggleRow: {
    display:"flex", gap:4, background:"rgba(255,255,255,0.08)",
    borderRadius:12, padding:3, marginBottom:20,
  },
  toggle: {
    flex:1, padding:"10px 0", border:"none", borderRadius:10,
    background:"transparent", color:"rgba(255,255,255,0.5)",
    fontSize:14, fontWeight:600, cursor:"pointer", fontFamily:"inherit",
  },
  toggleOn: { background:"rgba(255,255,255,0.15)", color:"#fff" },
  label: {
    display:"block", fontSize:13, fontWeight:600,
    color:"rgba(255,255,255,0.7)", margin:"12px 0 6px",
  },
  input: {
    width:"100%", padding:"14px 16px",
    background:"rgba(255,255,255,0.12)", border:"1px solid rgba(255,255,255,0.2)",
    borderRadius:12, fontSize:16, color:"#fff",
    outline:"none", boxSizing:"border-box", fontFamily:"inherit",
  },
  error: {
    background:"rgba(255,80,80,0.2)", border:"1px solid rgba(255,80,80,0.3)",
    borderRadius:10, padding:"10px 14px", color:"#fff",
    fontSize:13, fontWeight:500, margin:"14px 0 0", textAlign:"center",
  },
  btn: {
    width:"100%", padding:"16px 0", marginTop:20,
    background:"rgba(255,255,255,0.2)", border:"1px solid rgba(255,255,255,0.3)",
    borderRadius:14, color:"#fff", fontSize:17, fontWeight:700,
    cursor:"pointer", fontFamily:"inherit",
  },
  backBtn: {
    marginTop: 20, background: "none", border: "none",
    color: "rgba(255,255,255,0.6)", fontSize: 15, fontWeight: 600,
    cursor: "pointer", fontFamily: "inherit",
  },
  status: {
    display:"flex", alignItems:"center", justifyContent:"center",
    gap:6, marginTop:24,
  },
  footer: { marginTop:20, fontSize:12, color:"rgba(255,255,255,0.4)", textAlign:"center" },
  // Selfie styles
  selfieCard: {
    width:"100%", background:"rgba(255,255,255,0.1)", borderRadius:20,
    padding:"20px", border:"1px solid rgba(255,255,255,0.15)",
    backdropFilter:"blur(20px)",
  },
  selfieFrame: {
    width:"100%", aspectRatio:"1/1", borderRadius:20, overflow:"hidden",
    position:"relative", background:"#000",
  },
  video: {
    width:"100%", height:"100%", objectFit:"cover",
    transform:"scaleX(-1)", // Mirror front camera
  },
  selfieOverlay: {
    position:"absolute", inset:0, pointerEvents:"none",
  },
  selfieImg: {
    width:"100%", height:"100%", objectFit:"cover", borderRadius:0,
  },
  processingIcon: {
    display:"flex", alignItems:"center", justifyContent:"center",
  },
};
