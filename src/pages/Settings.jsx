import { useState } from "react";
import { C } from "../data/constants";

import { API_BASE } from "../config.js";

function Settings({ savedCard, setSavedCard, onBack }) {
  const [addingCard, setAddingCard] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile and security states
  const [faceIdEnabled, setFaceIdEnabled] = useState(true);
  const [touchIdEnabled, setTouchIdEnabled] = useState(false);
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(false);

  // PIN hash helper — SHA-256 based
  const SALT = "kingest_v7_salt_";
  const hashPin = async (pin) => {
    const data = new TextEncoder().encode(SALT + pin);
    const buf = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  };

  // PIN states
  const [pinView, setPinView] = useState(null); // null | "current" | "new" | "confirm" | "done"
  const [currentPinInput, setCurrentPinInput] = useState("");
  const [newPinInput, setNewPinInput] = useState("");
  const [confirmPinInput, setConfirmPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [storedPinHash, setStoredPinHash] = useState(() => {
    try { return localStorage.getItem("kingest_pin_hash") || null; } catch { return null; }
  });
  // Migrate from old plain-text PIN to hash on first load
  const [migrated] = useState(() => {
    try {
      const oldPin = localStorage.getItem("kingest_pin");
      const existingHash = localStorage.getItem("kingest_pin_hash");
      if (oldPin && !existingHash) {
        // Migrate: hash the old PIN and store hash, remove plain text
        const data = new TextEncoder().encode(SALT + oldPin);
        // Sync hash for migration (SubtleCrypto is async, use simple fallback)
        let h = 0;
        for (let i = 0; i < (SALT + oldPin).length; i++) { h = ((h << 5) - h + (SALT + oldPin).charCodeAt(i)) | 0; }
        const migrationHash = "migrated_" + Math.abs(h).toString(16);
        localStorage.setItem("kingest_pin_hash", migrationHash);
        localStorage.removeItem("kingest_pin");
        // Also do proper async hash
        crypto.subtle.digest("SHA-256", data).then(buf => {
          const properHash = Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
          localStorage.setItem("kingest_pin_hash", properHash);
        });
        return migrationHash;
      }
      return existingHash;
    } catch { return null; }
  });

  // About sub-views
  const [aboutView, setAboutView] = useState(null); // null | "cgu" | "privacy"

  // ── PIN LOGIC ──
  const handlePinKey = (key) => {
    setPinError("");
    if (pinView === "current") {
      if (key === "delete") {
        setCurrentPinInput(p => p.slice(0, -1));
      } else if (currentPinInput.length < 4) {
        const next = currentPinInput + key;
        setCurrentPinInput(next);
        if (next.length === 4) {
          setTimeout(async () => {
            const inputHash = await hashPin(next);
            const stored = localStorage.getItem("kingest_pin_hash");
            // Also check migration hash
            if (inputHash === stored || (stored && stored.startsWith("migrated_"))) {
              // If migration hash, upgrade to proper hash now
              if (stored && stored.startsWith("migrated_")) {
                localStorage.setItem("kingest_pin_hash", inputHash);
              }
              setPinView("new");
              setCurrentPinInput("");
            } else if (!stored) {
              // No PIN set yet — accept default 1234
              const defaultHash = await hashPin("1234");
              if (inputHash === defaultHash) {
                setPinView("new");
                setCurrentPinInput("");
              } else {
                setPinError("Code PIN incorrect");
                setCurrentPinInput("");
              }
            } else {
              setPinError("Code PIN incorrect");
              setCurrentPinInput("");
            }
          }, 300);
        }
      }
    } else if (pinView === "new") {
      if (key === "delete") {
        setNewPinInput(p => p.slice(0, -1));
      } else if (newPinInput.length < 4) {
        const next = newPinInput + key;
        setNewPinInput(next);
        if (next.length === 4) {
          setTimeout(() => {
            setPinView("confirm");
          }, 300);
        }
      }
    } else if (pinView === "confirm") {
      if (key === "delete") {
        setConfirmPinInput(p => p.slice(0, -1));
      } else if (confirmPinInput.length < 4) {
        const next = confirmPinInput + key;
        setConfirmPinInput(next);
        if (next.length === 4) {
          setTimeout(async () => {
            if (next === newPinInput) {
              const newHash = await hashPin(newPinInput);
              try {
                localStorage.setItem("kingest_pin_hash", newHash);
                localStorage.removeItem("kingest_pin"); // Remove any old plain text
              } catch {}
              setStoredPinHash(newHash);
              setPinView("done");
              setNewPinInput("");
              setConfirmPinInput("");
            } else {
              setPinError("Les codes ne correspondent pas");
              setConfirmPinInput("");
            }
          }, 300);
        }
      }
    }
  };

  const pinValue = pinView === "current" ? currentPinInput : pinView === "new" ? newPinInput : confirmPinInput;

  const renderPinDots = (val) => (
    <div style={{ display: "flex", gap: 20, justifyContent: "center", marginBottom: 30 }}>
      {[0,1,2,3].map(i => (
        <div key={i} style={{
          width: 20, height: 20, borderRadius: 10,
          background: i < val.length ? "#26A69A" : "rgba(255,255,255,0.1)",
          border: i < val.length ? "none" : "2px solid rgba(255,255,255,0.2)",
          transition: "all 0.2s ease",
          transform: i < val.length ? "scale(1.1)" : "scale(1)",
        }} />
      ))}
    </div>
  );

  const renderKeypad = () => (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, maxWidth: 280, margin: "0 auto" }}>
      {["1","2","3","4","5","6","7","8","9","","0","delete"].map(k => {
        if (k === "") return <div key="empty" />;
        return (
          <button key={k} onClick={() => handlePinKey(k)} style={{
            width: 72, height: 72, borderRadius: 36,
            background: k === "delete" ? "rgba(239,83,80,0.1)" : "rgba(255,255,255,0.05)",
            border: k === "delete" ? "1px solid rgba(239,83,80,0.2)" : "1px solid rgba(255,255,255,0.08)",
            color: k === "delete" ? "#EF5350" : "#E8ECF1",
            fontSize: k === "delete" ? 14 : 28,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease",
          }}>
            {k === "delete" ? "⌫" : k}
          </button>
        );
      })}
    </div>
  );

  // ── PIN VIEW ──
  if (pinView) {
    if (pinView === "done") {
      return (
        <div style={s.container}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: 40 }}>
            <div style={{
              width: 80, height: 80, borderRadius: 40,
              background: "rgba(38,166,154,0.15)", border: "2px solid rgba(38,166,154,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, marginBottom: 24,
            }}>✓</div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, textAlign: "center" }}>
              PIN modifié !
            </h2>
            <p style={{ fontSize: 14, color: "#8899AA", textAlign: "center", marginBottom: 32 }}>
              Votre nouveau code PIN a été enregistré avec succès.
            </p>
            <button onClick={() => { setPinView(null); setPinError(""); }} style={{
              padding: "14px 40px", background: "linear-gradient(135deg, #26A69A 0%, #1f8578 100%)",
              border: "none", borderRadius: 14, color: "#fff", fontSize: 16, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 16px rgba(38,166,154,0.3)",
            }}>
              Retour aux paramètres
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={s.container}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => {
            setPinView(null); setCurrentPinInput(""); setNewPinInput(""); setConfirmPinInput(""); setPinError("");
          }}>←</button>
          <h1 style={s.title}>Changer le PIN</h1>
          <div style={{ width: 40 }} />
        </div>

        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          {/* Step indicator */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 30 }}>
            {["current", "new", "confirm"].map((step, i) => (
              <div key={step} style={{
                width: 8, height: 8, borderRadius: 4,
                background: pinView === step ? "#6BA5FF" :
                  (pinView === "new" && i === 0) || (pinView === "confirm" && i <= 1) ? "#26A69A" : "rgba(255,255,255,0.1)",
                transition: "all 0.3s ease",
              }} />
            ))}
          </div>

          <div style={{
            width: 64, height: 64, borderRadius: 32, margin: "0 auto 20px",
            background: pinView === "current" ? "rgba(107,165,255,0.12)" : pinView === "new" ? "rgba(38,166,154,0.12)" : "rgba(255,149,0,0.12)",
            border: `2px solid ${pinView === "current" ? "rgba(107,165,255,0.3)" : pinView === "new" ? "rgba(38,166,154,0.3)" : "rgba(255,149,0,0.3)"}`,
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
          }}>
            {pinView === "current" ? "🔐" : pinView === "new" ? "🔑" : "✓"}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
            {pinView === "current" ? "Code PIN actuel" : pinView === "new" ? "Nouveau code PIN" : "Confirmer le code PIN"}
          </h2>
          <p style={{ fontSize: 14, color: "#8899AA", marginBottom: 30 }}>
            {pinView === "current" ? "Entrez votre code PIN actuel à 4 chiffres" :
             pinView === "new" ? "Choisissez un nouveau code PIN à 4 chiffres" :
             "Saisissez le nouveau code PIN une seconde fois"}
          </p>

          {renderPinDots(pinValue)}

          {pinError && (
            <div style={{
              background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)",
              borderRadius: 12, padding: "10px 16px", marginBottom: 20, color: "#EF5350",
              fontSize: 14, fontWeight: 600,
            }}>
              {pinError}
            </div>
          )}

          {renderKeypad()}

          <p style={{ fontSize: 12, color: "#4A5568", marginTop: 24 }}>
            Le PIN est chiffré et stocké de manière sécurisée
          </p>
        </div>
      </div>
    );
  }

  // ── CGU VIEW ──
  if (aboutView === "cgu") {
    return (
      <div style={s.container}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => setAboutView(null)}>←</button>
          <h1 style={s.title}>Conditions d'utilisation</h1>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ padding: 20 }}>
          <div style={s.settingsCard}>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "linear-gradient(135deg, #6BA5FF 0%, #4A8AE8 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, fontWeight: 700, color: "#fff",
                }}>K</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Kingest</div>
                  <div style={{ fontSize: 12, color: "#8899AA" }}>par GEST-IA</div>
                </div>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#6BA5FF", marginBottom: 12 }}>
                1. Objet
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Les présentes conditions générales d'utilisation (CGU) régissent l'accès et l'utilisation de l'application
                Kingest, développée et éditée par GEST-IA,
                immatriculée sous le numéro SIREN 492 577 143, dont le siège social est situé au
                60 rue François Ier, 75008 Paris, France.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#6BA5FF", marginBottom: 12 }}>
                2. Description du service
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Kingest est une plateforme de trading tokenisé permettant l'achat et la vente d'actifs financiers
                (indices, cryptomonnaies, forex, matières premières) ainsi que la gestion de portefeuille numérique.
                L'application propose des fonctionnalités de dépôt, retrait et paiement via Apple Pay, Google Pay,
                carte bancaire (Stripe) et autres méthodes.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#6BA5FF", marginBottom: 12 }}>
                3. Inscription et compte
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                L'utilisateur doit être majeur et fournir des informations exactes lors de son inscription.
                Il est responsable de la confidentialité de ses identifiants et de toute activité sur son compte.
                GEST-IA se réserve le droit de suspendre ou fermer tout compte en cas de non-respect des CGU.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#6BA5FF", marginBottom: 12 }}>
                4. Paiements et transactions
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Les transactions financières sont traitées par des prestataires de paiement sécurisés (Stripe).
                Les frais applicables sont affichés avant chaque transaction. GEST-IA ne stocke aucune donnée
                bancaire directement — toutes les informations de paiement sont gérées par Stripe conformément
                aux normes PCI DSS.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#6BA5FF", marginBottom: 12 }}>
                5. Risques liés au trading
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Le trading d'actifs financiers comporte des risques de perte en capital. Les performances passées
                ne préjugent pas des performances futures. L'utilisateur reconnaît être informé de ces risques
                et agir sous sa propre responsabilité.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#6BA5FF", marginBottom: 12 }}>
                6. Propriété intellectuelle
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                L'ensemble du contenu de l'application Kingest (marques, logos, logiciels, interfaces) est la propriété
                exclusive de GEST-IA. Toute reproduction ou utilisation non autorisée est interdite.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#6BA5FF", marginBottom: 12 }}>
                7. Contact
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 8 }}>
                Pour toute question relative aux présentes CGU :
              </p>
              <p style={{ fontSize: 13, color: "#E8ECF1", lineHeight: 1.6 }}>
                GEST-IA
              </p>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6 }}>
                60 rue François Ier, 75008 Paris
              </p>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6 }}>
                SIRET : 492 577 143 00083
              </p>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6 }}>
                APE : 62.01Z — Programmation informatique
              </p>

              <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(107,165,255,0.08)", borderRadius: 12, border: "1px solid rgba(107,165,255,0.15)" }}>
                <p style={{ fontSize: 12, color: "#6BA5FF", margin: 0, textAlign: "center" }}>
                  Dernière mise à jour : Février 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── PRIVACY VIEW ──
  if (aboutView === "privacy") {
    return (
      <div style={s.container}>
        <div style={s.header}>
          <button style={s.backBtn} onClick={() => setAboutView(null)}>←</button>
          <h1 style={s.title}>Politique de confidentialité</h1>
          <div style={{ width: 40 }} />
        </div>
        <div style={{ padding: 20 }}>
          <div style={s.settingsCard}>
            <div style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: "linear-gradient(135deg, #26A69A 0%, #1f8578 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20,
                }}>🛡️</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Protection des données</div>
                  <div style={{ fontSize: 12, color: "#8899AA" }}>RGPD — GEST-IA</div>
                </div>
              </div>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#26A69A", marginBottom: 12 }}>
                1. Responsable du traitement
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Le responsable du traitement des données personnelles est GEST-IA,
                SIREN 492 577 143, siège social : 60 rue François Ier, 75008 Paris, France.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#26A69A", marginBottom: 12 }}>
                2. Données collectées
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Nous collectons les données nécessaires au fonctionnement du service : nom, prénom, adresse email,
                données de transaction, adresse IP et données d'utilisation de l'application. Les données bancaires
                sont traitées exclusivement par notre prestataire de paiement Stripe et ne sont jamais stockées sur
                nos serveurs.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#26A69A", marginBottom: 12 }}>
                3. Finalités du traitement
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Vos données sont utilisées pour : la gestion de votre compte, l'exécution des transactions,
                la conformité réglementaire (KYC/AML), l'amélioration du service, et l'envoi de notifications
                relatives à votre compte (avec votre consentement).
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#26A69A", marginBottom: 12 }}>
                4. Durée de conservation
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Les données personnelles sont conservées pendant la durée de votre inscription et pendant 5 ans
                après la clôture du compte conformément aux obligations légales en matière de lutte contre le
                blanchiment d'argent.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#26A69A", marginBottom: 12 }}>
                5. Vos droits (RGPD)
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits
                suivants : droit d'accès, de rectification, d'effacement, de limitation du traitement, de portabilité
                et d'opposition. Vous pouvez exercer ces droits en nous contactant à l'adresse du siège social.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#26A69A", marginBottom: 12 }}>
                6. Sécurité
              </h3>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6, marginBottom: 16 }}>
                Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger vos
                données : chiffrement TLS, authentification biométrique, tokenisation des paiements via Stripe,
                et surveillance continue de la sécurité.
              </p>

              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#26A69A", marginBottom: 12 }}>
                7. Contact DPO
              </h3>
              <p style={{ fontSize: 13, color: "#E8ECF1", lineHeight: 1.6 }}>
                GEST-IA
              </p>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6 }}>
                60 rue François Ier, 75008 Paris
              </p>
              <p style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6 }}>
                SIRET : 492 577 143 00083
              </p>

              <div style={{ marginTop: 20, padding: "12px 16px", background: "rgba(38,166,154,0.08)", borderRadius: 12, border: "1px solid rgba(38,166,154,0.15)" }}>
                <p style={{ fontSize: 12, color: "#26A69A", margin: 0, textAlign: "center" }}>
                  Conforme RGPD — Dernière mise à jour : Février 2026
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── CARD LOGIC ──
  const handleSaveCard = async () => {
    setError("");
    setSuccess("");
    const cleanNum = cardNumber.replace(/\s/g, "");
    if (cleanNum.length < 13 || cleanNum.length > 19) { setError("Numéro de carte invalide"); return; }
    if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) { setError("Date d'expiration invalide (MM/AA)"); return; }
    if (cardCvc.length < 3 || cardCvc.length > 4) { setError("Code CVV invalide"); return; }
    setSaving(true);
    try {
      const [expMonth, expYear] = cardExpiry.split("/");
      const fetchUrl = API_BASE + "/api/stripe/save-card";
      const body = { cardNumber: cleanNum, expMonth: parseInt(expMonth), expYear: parseInt("20" + expYear), cvc: cardCvc, cardName: cardName || "Kingest User" };
      let data;
      if (window.__KINGEST_FETCH) {
        data = await new Promise((resolve) => {
          const cb = "__save_card_" + Date.now();
          window[cb] = (b64) => { try { resolve(JSON.parse(atob(b64))); } catch { resolve(null); } delete window[cb]; };
          window.__KINGEST_FETCH(fetchUrl, cb, "POST", JSON.stringify(body));
        });
      } else {
        const r = await fetch(fetchUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        data = await r.json();
      }
      if (data?.ok) {
        setSavedCard({
          last4: cleanNum.slice(-4),
          brand: cleanNum.startsWith("4") ? "Visa" : cleanNum.startsWith("5") ? "Mastercard" : "Carte",
          expiry: cardExpiry, name: cardName || "Kingest User",
          customerId: data.customerId, paymentMethodId: data.paymentMethodId,
        });
        setAddingCard(false); setCardNumber(""); setCardExpiry(""); setCardCvc(""); setCardName("");
        setSuccess("Carte enregistrée avec succès !"); setTimeout(() => setSuccess(""), 3000);
      } else { setError(data?.error || "Échec de l'enregistrement"); }
    } catch (e) { setError("Erreur réseau: " + e.message); }
    setSaving(false);
  };

  const handleDeleteCard = () => {
    setSavedCard(null);
    setSuccess("Carte supprimée");
    setTimeout(() => setSuccess(""), 3000);
  };

  // ── MAIN SETTINGS VIEW ──
  return (
    <div style={s.container}>
      <div style={s.header}>
        <button style={s.backBtn} onClick={onBack}>←</button>
        <h1 style={s.title}>Paramètres</h1>
        <div style={{ width: 40 }} />
      </div>

      {/* Profile Section */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionIcon}>👤</span>
          <span style={s.sectionTitle}>Profil</span>
        </div>
        <div style={s.settingsCard}>
          <div style={s.profileContent}>
            <div style={s.avatarCircle}>KU</div>
            <div style={s.profileInfo}>
              <div style={s.profileName}>Kingest User</div>
              <div style={s.profileEmail}>user@kingest.app</div>
            </div>
          </div>
        </div>
      </div>

      {/* Saved Card Section */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionIcon}>💳</span>
          <span style={s.sectionTitle}>Carte bancaire par défaut</span>
        </div>

        {success && (
          <div style={s.successBanner}><span>✓ {success}</span></div>
        )}

        {savedCard && !addingCard ? (
          <div style={s.savedCardBox}>
            <div style={s.cardVisual}>
              <div style={s.cardVisualTop}>
                <span style={s.cardBrandLabel}>{savedCard.brand}</span>
                <span style={s.cardChip}>
                  <svg viewBox="0 0 24 18" style={{ width: 24, height: 18 }}>
                    <rect width="24" height="18" rx="3" fill="#C5A55A" opacity="0.8" />
                    <line x1="0" y1="6" x2="24" y2="6" stroke="#B8963E" strokeWidth="0.5" />
                    <line x1="0" y1="12" x2="24" y2="12" stroke="#B8963E" strokeWidth="0.5" />
                    <line x1="8" y1="0" x2="8" y2="18" stroke="#B8963E" strokeWidth="0.5" />
                    <line x1="16" y1="0" x2="16" y2="18" stroke="#B8963E" strokeWidth="0.5" />
                  </svg>
                </span>
              </div>
              <div style={s.cardNumberDisplay}>•••• •••• •••• {savedCard.last4}</div>
              <div style={s.cardVisualBottom}>
                <div>
                  <div style={s.cardMiniLabel}>TITULAIRE</div>
                  <div style={s.cardMiniValue}>{savedCard.name}</div>
                </div>
                <div>
                  <div style={s.cardMiniLabel}>EXPIRE</div>
                  <div style={s.cardMiniValue}>{savedCard.expiry}</div>
                </div>
              </div>
            </div>
            <div style={s.cardActions}>
              <button style={s.changeCardBtn} onClick={() => setAddingCard(true)}>Changer de carte</button>
              <button style={s.deleteCardBtn} onClick={handleDeleteCard}>Supprimer</button>
            </div>
            <div style={s.oneClickBadge}>
              <span style={{ fontSize: 14 }}>⚡</span>
              <span>Paiement en 1 clic activé</span>
            </div>
          </div>
        ) : !addingCard ? (
          <div style={s.noCardBox}>
            <div style={s.noCardIcon}>
              <svg viewBox="0 0 48 48" style={{ width: 48, height: 48 }}>
                <rect x="4" y="10" width="40" height="28" rx="4" fill="none" stroke="rgba(107,165,255,0.3)" strokeWidth="2" strokeDasharray="4 3" />
                <line x1="4" y1="18" x2="44" y2="18" stroke="rgba(107,165,255,0.2)" strokeWidth="2" />
                <text x="24" y="34" textAnchor="middle" fill="rgba(107,165,255,0.4)" fontSize="16">+</text>
              </svg>
            </div>
            <p style={s.noCardText}>Aucune carte enregistrée</p>
            <p style={s.noCardSubText}>Ajoutez une carte pour payer en 1 clic</p>
            <button style={s.addCardBtn} onClick={() => setAddingCard(true)}>+ Ajouter une carte</button>
          </div>
        ) : null}

        {addingCard && (
          <div style={s.formBox}>
            <div style={s.formHeader}>
              <span style={{ fontWeight: 600, fontSize: 15 }}>Nouvelle carte</span>
              <span style={{ color: "#26A69A", fontSize: 12 }}>🔒 Sécurisé par Stripe</span>
            </div>
            <div style={s.fieldGroup}>
              <label style={s.fieldLabel}>Numéro de carte</label>
              <div style={{ position: "relative" }}>
                <input type="tel" inputMode="numeric" placeholder="4242 4242 4242 4242" value={cardNumber}
                  onChange={(e) => { const raw = e.target.value.replace(/\D/g, "").slice(0, 16); setCardNumber(raw.replace(/(\d{4})(?=\d)/g, "$1 ")); }}
                  style={s.input} autoComplete="cc-number" />
                <div style={s.brandIcon}>
                  {cardNumber.replace(/\s/g, "").startsWith("4") ? (
                    <svg viewBox="0 0 32 20" style={{ width: 28, height: 18 }}><rect width="32" height="20" rx="3" fill="#1A1F71" /><text x="16" y="14" fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle">VISA</text></svg>
                  ) : cardNumber.replace(/\s/g, "").startsWith("5") ? (
                    <svg viewBox="0 0 32 20" style={{ width: 28, height: 18 }}><rect width="32" height="20" rx="3" fill="#333" /><circle cx="12" cy="10" r="7" fill="#EB001B" opacity="0.9" /><circle cx="20" cy="10" r="7" fill="#F79E1B" opacity="0.9" /></svg>
                  ) : null}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={s.fieldLabel}>Expiration</label>
                <input type="tel" inputMode="numeric" placeholder="MM/AA" value={cardExpiry}
                  onChange={(e) => { let raw = e.target.value.replace(/\D/g, "").slice(0, 4); if (raw.length >= 3) raw = raw.slice(0, 2) + "/" + raw.slice(2); setCardExpiry(raw); }}
                  style={s.input} autoComplete="cc-exp" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={s.fieldLabel}>CVV</label>
                <input type="tel" inputMode="numeric" placeholder="123" value={cardCvc}
                  onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  style={s.input} autoComplete="cc-csc" />
              </div>
            </div>
            <div>
              <label style={s.fieldLabel}>Titulaire de la carte</label>
              <input type="text" placeholder="Nom sur la carte" value={cardName}
                onChange={(e) => setCardName(e.target.value)} style={s.input} autoComplete="cc-name" />
            </div>
            {error && <p style={s.error}>{error}</p>}
            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button style={s.cancelBtn} onClick={() => { setAddingCard(false); setError(""); }}>Annuler</button>
              <button style={saving ? { ...s.saveBtn, opacity: 0.6 } : s.saveBtn} onClick={handleSaveCard} disabled={saving}>
                {saving ? "Enregistrement..." : "Enregistrer la carte"}
              </button>
            </div>
            <p style={s.testHint}>Mode test — Utilisez 4242 4242 4242 4242</p>
          </div>
        )}
      </div>

      {/* Security Section */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionIcon}>🔒</span>
          <span style={s.sectionTitle}>Sécurité</span>
        </div>
        <div style={s.settingsCard}>
          <div style={s.settingRow}>
            <div style={s.settingLabel}>
              <div style={s.settingTitle}>Face ID</div>
              <div style={s.settingDesc}>Authentification biométrique</div>
            </div>
            <div style={s.toggleSwitch(faceIdEnabled)} onClick={() => setFaceIdEnabled(!faceIdEnabled)}>
              <div style={s.toggleThumb(faceIdEnabled)} />
            </div>
          </div>
          <div style={s.divider} />
          <div style={s.settingRow}>
            <div style={s.settingLabel}>
              <div style={s.settingTitle}>Touch ID</div>
              <div style={s.settingDesc}>Empreinte digitale</div>
            </div>
            <div style={s.toggleSwitch(touchIdEnabled)} onClick={() => setTouchIdEnabled(!touchIdEnabled)}>
              <div style={s.toggleThumb(touchIdEnabled)} />
            </div>
          </div>
          <div style={s.divider} />
          <button style={s.settingButton} onClick={() => setPinView("current")}>
            <div style={s.settingLabel}>
              <div style={s.settingTitle}>Changer le PIN</div>
              <div style={s.settingDesc}>Modifier votre code PIN</div>
            </div>
            <span style={{ fontSize: 20 }}>›</span>
          </button>
        </div>
      </div>

      {/* Notifications Section */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionIcon}>🔔</span>
          <span style={s.sectionTitle}>Notifications</span>
        </div>
        <div style={s.settingsCard}>
          <div style={s.settingRow}>
            <div style={s.settingLabel}>
              <div style={s.settingTitle}>Notifications push</div>
              <div style={s.settingDesc}>Alertes et mises à jour</div>
            </div>
            <div style={s.toggleSwitch(pushNotificationsEnabled)} onClick={() => setPushNotificationsEnabled(!pushNotificationsEnabled)}>
              <div style={s.toggleThumb(pushNotificationsEnabled)} />
            </div>
          </div>
          <div style={s.divider} />
          <div style={s.settingRow}>
            <div style={s.settingLabel}>
              <div style={s.settingTitle}>Alertes par email</div>
              <div style={s.settingDesc}>Notifications par courrier électronique</div>
            </div>
            <div style={s.toggleSwitch(emailAlertsEnabled)} onClick={() => setEmailAlertsEnabled(!emailAlertsEnabled)}>
              <div style={s.toggleThumb(emailAlertsEnabled)} />
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div style={s.section}>
        <div style={s.sectionHeader}>
          <span style={s.sectionIcon}>ℹ️</span>
          <span style={s.sectionTitle}>À propos</span>
        </div>
        <div style={s.settingsCard}>
          {/* Company info */}
          <div style={s.settingRow}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: "linear-gradient(135deg, #6BA5FF 0%, #4A8AE8 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff", flexShrink: 0,
              }}>K</div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#E8ECF1" }}>Kingest</div>
                <div style={{ fontSize: 11, color: "#8899AA" }}>par GEST-IA — Paris, France</div>
              </div>
            </div>
            <div style={s.versionBadge}>v1.0.0</div>
          </div>
          <div style={s.divider} />
          {/* Éditeur */}
          <div style={{ padding: "12px 20px" }}>
            <div style={{ fontSize: 11, color: "#4A5568", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8, fontWeight: 600 }}>Éditeur</div>
            <div style={{ fontSize: 13, color: "#8899AA", lineHeight: 1.6 }}>
              GEST-IA
            </div>
            <div style={{ fontSize: 12, color: "#4A5568", lineHeight: 1.6 }}>
              60 rue François Ier, 75008 Paris
            </div>
            <div style={{ fontSize: 12, color: "#4A5568", lineHeight: 1.6 }}>
              SIREN 492 577 143 — APE 62.01Z
            </div>
          </div>
          <div style={s.divider} />
          <button style={s.settingButton} onClick={() => setAboutView("cgu")}>
            <div style={s.settingLabel}>
              <div style={s.settingTitle}>Conditions d'utilisation</div>
            </div>
            <span style={{ fontSize: 20 }}>›</span>
          </button>
          <div style={s.divider} />
          <button style={s.settingButton} onClick={() => setAboutView("privacy")}>
            <div style={s.settingLabel}>
              <div style={s.settingTitle}>Politique de confidentialité</div>
            </div>
            <span style={{ fontSize: 20 }}>›</span>
          </button>
        </div>
      </div>

      {/* Logout Button */}
      <div style={s.section}>
        <button style={s.logoutBtn}>Déconnexion</button>
      </div>
    </div>
  );
}

const s = {
  container: {
    backgroundColor: "#020817",
    color: "#fff",
    minHeight: "100vh",
    paddingBottom: 100,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "20px", paddingTop: 32,
    borderBottom: "1px solid rgba(255,255,255,0.04)",
  },
  backBtn: {
    background: "rgba(255,255,255,0.05)", border: "none", color: "#fff", fontSize: 20,
    cursor: "pointer", width: 40, height: 40,
    display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 12,
  },
  title: {
    fontSize: 20, fontWeight: 700, margin: 0, flex: 1, textAlign: "center", letterSpacing: "-0.5px",
  },
  section: { padding: "12px 20px" },
  sectionHeader: { display: "flex", alignItems: "center", gap: 10, marginBottom: 14 },
  sectionIcon: { fontSize: 20 },
  sectionTitle: { fontSize: 16, fontWeight: 700, letterSpacing: "-0.3px" },
  successBanner: {
    background: "rgba(38,166,154,0.12)", border: "1px solid rgba(38,166,154,0.3)",
    borderRadius: 12, padding: "12px 16px", marginBottom: 14, fontSize: 14, color: "#26A69A", fontWeight: 600,
  },
  savedCardBox: {
    background: "rgba(12,28,56,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20,
  },
  cardVisual: {
    background: "linear-gradient(135deg, #1a2a4a 0%, #0c1c38 50%, #162040 100%)",
    borderRadius: 16, padding: "20px", marginBottom: 16,
    border: "1px solid rgba(107,165,255,0.15)", boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
  },
  cardVisualTop: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  cardBrandLabel: { fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.8)", letterSpacing: "1px", textTransform: "uppercase" },
  cardChip: {},
  cardNumberDisplay: { fontSize: 20, fontFamily: "'SF Mono', 'Courier New', monospace", letterSpacing: "3px", color: "rgba(255,255,255,0.9)", marginBottom: 20 },
  cardVisualBottom: { display: "flex", justifyContent: "space-between" },
  cardMiniLabel: { fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: "1px", marginBottom: 3 },
  cardMiniValue: { fontSize: 13, color: "rgba(255,255,255,0.8)", fontWeight: 600 },
  cardActions: { display: "flex", gap: 10, marginBottom: 12 },
  changeCardBtn: { flex: 1, padding: "12px", background: "rgba(107,165,255,0.1)", border: "1px solid rgba(107,165,255,0.2)", borderRadius: 12, color: "#6BA5FF", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  deleteCardBtn: { padding: "12px 20px", background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.2)", borderRadius: 12, color: "#EF5350", fontSize: 14, fontWeight: 600, cursor: "pointer" },
  oneClickBadge: { display: "flex", alignItems: "center", gap: 8, justifyContent: "center", padding: "10px", background: "rgba(38,166,154,0.08)", border: "1px solid rgba(38,166,154,0.2)", borderRadius: 12, fontSize: 13, color: "#26A69A", fontWeight: 600 },
  noCardBox: { background: "rgba(12,28,56,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "30px 20px", textAlign: "center" },
  noCardIcon: { marginBottom: 12 },
  noCardText: { fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: "rgba(255,255,255,0.7)" },
  noCardSubText: { fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 20px" },
  addCardBtn: { background: "linear-gradient(135deg, #6BA5FF 0%, #4A8AE8 100%)", border: "none", borderRadius: 14, color: "#fff", fontSize: 15, fontWeight: 700, padding: "14px 28px", cursor: "pointer", boxShadow: "0 4px 16px rgba(107,165,255,0.3)" },
  formBox: { background: "rgba(12,28,56,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 20, display: "flex", flexDirection: "column", gap: 14 },
  formHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  fieldGroup: {},
  fieldLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6, display: "block", fontWeight: 500 },
  input: { width: "100%", padding: "14px 12px", background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "#E8ECF1", fontSize: 16, fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Mono', monospace", outline: "none", letterSpacing: "1px", WebkitAppearance: "none", boxSizing: "border-box" },
  brandIcon: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" },
  error: { fontSize: 13, color: "#EF5350", margin: 0, fontWeight: 500 },
  cancelBtn: { flex: 1, padding: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#8899AA", fontSize: 15, fontWeight: 600, cursor: "pointer" },
  saveBtn: { flex: 2, padding: "14px", background: "linear-gradient(135deg, #26A69A 0%, #1f8578 100%)", border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(38,166,154,0.3)" },
  testHint: { color: "#6BA5FF", fontSize: 12, textAlign: "center", opacity: 0.6, margin: 0 },
  profileContent: { display: "flex", alignItems: "center", gap: 16, padding: "16px 20px" },
  avatarCircle: { width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, #6BA5FF 0%, #4A8AE8 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "#fff", flexShrink: 0 },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 16, fontWeight: 700, color: "#E8ECF1", marginBottom: 4 },
  profileEmail: { fontSize: 13, color: "#8899AA" },
  settingsCard: { background: "rgba(12,28,56,0.4)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: "4px 0", overflow: "hidden" },
  settingRow: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", gap: 12 },
  settingLabel: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: 600, color: "#E8ECF1", marginBottom: 2 },
  settingDesc: { fontSize: 12, color: "#8899AA" },
  settingButton: { background: "none", border: "none", padding: "14px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", cursor: "pointer", color: "#E8ECF1", fontSize: 15, fontWeight: 600, gap: 12 },
  divider: { height: "1px", background: "rgba(255,255,255,0.04)", margin: "0 20px" },
  toggleSwitch: (enabled) => ({ width: 52, height: 32, borderRadius: 16, background: enabled ? "rgba(38,166,154,0.6)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", padding: "2px", cursor: "pointer", transition: "background 0.3s ease", flexShrink: 0 }),
  toggleThumb: (enabled) => ({ width: 28, height: 28, borderRadius: 14, background: "#fff", transition: "transform 0.3s ease", transform: enabled ? "translateX(20px)" : "translateX(0)" }),
  versionBadge: { fontSize: 13, fontWeight: 600, color: "#8899AA", background: "rgba(255,255,255,0.05)", padding: "6px 12px", borderRadius: 8, flexShrink: 0 },
  logoutBtn: { width: "100%", padding: "16px 20px", background: "rgba(239,83,80,0.12)", border: "1px solid rgba(239,83,80,0.3)", borderRadius: 20, color: "#EF5350", fontSize: 15, fontWeight: 700, cursor: "pointer", transition: "all 0.2s ease" },
};

export { Settings };
