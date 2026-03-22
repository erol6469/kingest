import { useState } from "react";
import { C } from "../data/constants";
import { fUSD } from "../utils";

import { API_BASE } from "../config.js";

const CONTACTS = [
    { id: 1, name: "Thomas M.", avatar: "TM", color: "#6BA5FF" },
    { id: 2, name: "Sophie L.", avatar: "SL", color: "#FF6B9D" },
    { id: 3, name: "Lucas D.", avatar: "LD", color: "#26A69A" },
    { id: 4, name: "Emma R.", avatar: "ER", color: "#F5B731" },
    { id: 5, name: "Hugo P.", avatar: "HP", color: "#8247E5" },
    { id: 6, name: "Léa B.", avatar: "LB", color: "#FF6B35" },
    { id: 7, name: "Marc V.", avatar: "MV", color: "#E53935" },
    { id: 8, name: "Julie K.", avatar: "JK", color: "#00BCD4" },
];

const CRYPTO_TOKENS = ["BTC", "ETH", "USDT", "USDC"];

const SEND_NETWORKS = {
    BTC: [
        { id: "bitcoin", name: "Bitcoin", fee: "0.0001 BTC", feeUsd: 6.50, time: "~30 min", prefix: "bc1|1|3" },
        { id: "lightning", name: "Lightning Network", fee: "~0 sat", feeUsd: 0.01, time: "Instant", prefix: "ln" },
    ],
    ETH: [
        { id: "ethereum", name: "Ethereum (ERC-20)", fee: "~$5", feeUsd: 5, time: "~5 min", prefix: "0x" },
        { id: "arbitrum", name: "Arbitrum", fee: "~$0.30", feeUsd: 0.30, time: "~1 min", prefix: "0x" },
        { id: "base", name: "Base", fee: "~$0.15", feeUsd: 0.15, time: "~1 min", prefix: "0x" },
    ],
    USDT: [
        { id: "ethereum", name: "Ethereum (ERC-20)", fee: "~$5", feeUsd: 5, time: "~5 min", prefix: "0x" },
        { id: "tron", name: "Tron (TRC-20)", fee: "~$1", feeUsd: 1, time: "~3 min", prefix: "T" },
        { id: "polygon", name: "Polygon", fee: "~$0.01", feeUsd: 0.01, time: "~2 min", prefix: "0x" },
        { id: "bsc", name: "BNB Chain (BEP-20)", fee: "~$0.10", feeUsd: 0.10, time: "~3 min", prefix: "0x" },
    ],
    USDC: [
        { id: "ethereum", name: "Ethereum (ERC-20)", fee: "~$5", feeUsd: 5, time: "~5 min", prefix: "0x" },
        { id: "polygon", name: "Polygon", fee: "~$0.01", feeUsd: 0.01, time: "~2 min", prefix: "0x" },
        { id: "arbitrum", name: "Arbitrum", fee: "~$0.30", feeUsd: 0.30, time: "~1 min", prefix: "0x" },
        { id: "base", name: "Base", fee: "~$0.15", feeUsd: 0.15, time: "~1 min", prefix: "0x" },
    ],
};

const s = {
    page: { minHeight: "100vh", background: "#020817", padding: 16, paddingBottom: 96 },
    center: { minHeight: "100vh", background: "#020817", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 },
    container: { maxWidth: 420, margin: "0 auto", paddingTop: 24 },
    header: { display: "flex", alignItems: "center", marginBottom: 32 },
    backBtn: { padding: 8, background: "transparent", border: "none", cursor: "pointer", marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center" },
    title: { fontSize: 20, fontWeight: 700, color: "#E8ECF1", margin: 0 },
    searchInput: { width: "100%", background: "rgba(12,28,56,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", color: "#E8ECF1", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 32 },
    sectionTitle: { color: "#8899AA", fontSize: 12, fontWeight: 600, marginBottom: 16, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 },
    contactsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
    contactBtn: { display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 8, borderRadius: 12, background: "transparent", border: "none", cursor: "pointer", transition: "opacity 0.2s" },
    contactAvatar: (color) => ({ width: 56, height: 56, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, backgroundColor: color, boxShadow: `0 4px 12px ${color}33` }),
    contactName: { fontSize: 11, color: "#E8ECF1", textAlign: "center", fontWeight: 500, margin: 0 },
    avatarLg: (color) => ({ width: 64, height: 64, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 18, backgroundColor: color, marginBottom: 12, boxShadow: `0 8px 24px ${color}40` }),
    avatarXl: (color) => ({ width: 88, height: 88, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 24, backgroundColor: color, marginBottom: 24, boxShadow: `0 12px 32px ${color}40` }),
    nameText: { fontSize: 18, fontWeight: 700, color: "#E8ECF1", margin: 0 },
    contactInfoCard: { background: "rgba(12,28,56,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: 20, marginBottom: 24, textAlign: "center" },
    amountInput: { width: "100%", background: "rgba(12,28,56,0.3)", border: "2px solid rgba(38,166,154,0.3)", borderRadius: 16, padding: "20px 16px", textAlign: "center", fontSize: 36, fontWeight: 700, color: "#E8ECF1", outline: "none", boxSizing: "border-box", marginBottom: 20 },
    currLabel: { color: "#8899AA", fontSize: 12, marginBottom: 12, margin: 0, fontWeight: 600 },
    currRow: { display: "flex", gap: 8, marginBottom: 8 },
    currActive: { flex: 1, padding: "10px 12px", borderRadius: 12, fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #6BA5FF, #4a7bd1)", color: "#fff", boxShadow: "0 4px 12px rgba(107,165,255,0.3)" },
    currInactive: { flex: 1, padding: "10px 12px", borderRadius: 12, fontWeight: 600, fontSize: 13, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", background: "rgba(12,28,56,0.3)", color: "#8899AA" },
    balanceHint: { color: "#6b7280", fontSize: 11, marginTop: 8, margin: 0 },
    submitBtn: (enabled) => ({ width: "100%", padding: "16px", fontWeight: 700, borderRadius: 12, border: "none", cursor: enabled ? "pointer" : "not-allowed", fontSize: 16, background: enabled ? "linear-gradient(135deg, #6BA5FF, #4a7bd1)" : "rgba(255,255,255,0.05)", color: enabled ? "#fff" : "#4A5568", boxShadow: enabled ? "0 6px 20px rgba(107,165,255,0.35)" : "none", opacity: enabled ? 1 : 0.5 }),
    confirmCard: { background: "rgba(12,28,56,0.3)", border: "1px solid rgba(38,166,154,0.2)", borderRadius: 16, padding: 24, marginBottom: 28, textAlign: "center" },
    confirmAmount: { fontSize: 36, fontWeight: 700, color: "#E8ECF1", margin: 0, marginBottom: 8 },
    confirmSub: { color: "#6b7280", fontSize: 12, margin: "8px 0 0" },
    primaryBtn: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #6BA5FF, #4a7bd1)", color: "#fff", fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", fontSize: 16, marginBottom: 12, boxShadow: "0 6px 20px rgba(107,165,255,0.35)" },
    secondaryBtn: { width: "100%", padding: "16px", background: "rgba(12,28,56,0.3)", color: "#E8ECF1", fontWeight: 600, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontSize: 16 },
    successIcon: { width: 88, height: 88, margin: "0 auto 24px", borderRadius: "50%", background: "linear-gradient(135deg, #26A69A, #1a7d73)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(38,166,154,0.4)" },
    successTitle: { fontSize: 24, fontWeight: 700, color: "#E8ECF1", margin: "0 0 8px" },
    successAmount: { fontSize: 36, fontWeight: 700, color: "#26A69A", margin: "0 0 24px" },
};

function SendPage({ walletBalances, onBack, onSend }) {
    // Mode: "choose" | "contact" (P2P) | "crypto" (on-chain)
    const [mode, setMode] = useState("choose");

    // P2P states
    const [step, setStep] = useState("recipient");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedContact, setSelectedContact] = useState(null);
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");
    const [message, setMessage] = useState("");

    // Crypto send states
    const [cryptoStep, setCryptoStep] = useState("form"); // form | confirm | processing | done
    const [cryptoToken, setCryptoToken] = useState("USDC");
    const [cryptoNetwork, setCryptoNetwork] = useState("ethereum");
    const [cryptoAddress, setCryptoAddress] = useState("");
    const [cryptoAmount, setCryptoAmount] = useState("");
    const [cryptoMemo, setCryptoMemo] = useState("");
    const [cryptoError, setCryptoError] = useState("");
    const [cryptoLoading, setCryptoLoading] = useState(false);
    const [cryptoTxHash, setCryptoTxHash] = useState("");

    // P2P helpers
    const filteredContacts = CONTACTS.filter(contact =>
        contact.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const balance = walletBalances[currency] || 0;
    const numAmount = parseFloat(amount) || 0;
    const isValidAmount = numAmount > 0 && numAmount <= balance;

    // Crypto helpers
    const cryptoBalance = walletBalances[cryptoToken] || 0;
    const numCryptoAmount = parseFloat(cryptoAmount) || 0;
    const currentCryptoNet = (SEND_NETWORKS[cryptoToken] || []).find(n => n.id === cryptoNetwork);
    const cryptoFeeUsd = currentCryptoNet?.feeUsd || 0;
    const isCryptoValid = numCryptoAmount > 0 && numCryptoAmount <= cryptoBalance && cryptoAddress.trim().length > 10;

    // Animations
    const animStyle = document.getElementById("kingest-send-anim");
    if (!animStyle) {
        const st = document.createElement("style");
        st.id = "kingest-send-anim";
        st.textContent = `@keyframes spin { to { transform: rotate(360deg); } } @keyframes scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .kin-spin { animation: spin 1s linear infinite; } .kin-scale-in { animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); } .kin-fade-in { animation: fadeIn 0.8s ease-out; }`;
        document.head.appendChild(st);
    }

    // P2P handlers
    const handleSelectContact = (contact) => {
        setSelectedContact(contact);
        setStep("amount");
        setSearchQuery("");
    };

    const handleSend = () => {
        if (onSend) onSend(numAmount, currency, selectedContact.name);
        setStep("processing");
        setTimeout(() => setStep("done"), 1500);
    };

    const handleBack = () => {
        if (mode === "choose") onBack();
        else if (mode === "contact") {
            if (step === "recipient") { setMode("choose"); }
            else if (step === "amount") { setSelectedContact(null); setAmount(""); setCurrency("USD"); setMessage(""); setStep("recipient"); }
            else if (step === "confirm") { setAmount(""); setMessage(""); setStep("amount"); }
            else if (step === "done") { setMode("choose"); setStep("recipient"); }
        } else if (mode === "crypto") {
            if (cryptoStep === "form") { setMode("choose"); }
            else if (cryptoStep === "confirm") { setCryptoStep("form"); }
            else if (cryptoStep === "done") { setMode("choose"); setCryptoStep("form"); }
        }
    };

    // Crypto send handler
    const handleCryptoSend = async () => {
        setCryptoLoading(true);
        setCryptoError("");
        try {
            const doFetch = async (url, opts) => {
                if (window.__KINGEST_FETCH) {
                    return new Promise((resolve) => {
                        const cb = "__csend_" + Date.now();
                        window[cb] = (b64) => {
                            try { resolve(JSON.parse(atob(b64))); } catch { resolve(null); }
                            delete window[cb];
                        };
                        window.__KINGEST_FETCH(url, cb, opts?.method || "GET", opts?.body || "");
                    });
                }
                const r = await fetch(url, opts);
                return r.json();
            };
            const result = await doFetch(API_BASE + "/api/crypto/send", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: cryptoToken,
                    network: cryptoNetwork,
                    address: cryptoAddress.trim(),
                    amount: numCryptoAmount,
                    memo: cryptoMemo,
                })
            });
            if (result?.ok) {
                setCryptoTxHash(result.txHash || "0x" + Math.random().toString(16).slice(2, 18));
                if (onSend) onSend(numCryptoAmount, cryptoToken, cryptoAddress.slice(0, 8) + "...");
                setCryptoStep("processing");
                setTimeout(() => setCryptoStep("done"), 2000);
            } else {
                setCryptoError(result?.error || "Erreur lors de l'envoi");
            }
        } catch (err) {
            setCryptoError("Erreur réseau. Réessayez.");
        }
        setCryptoLoading(false);
    };

    // ===== MODE CHOOSER =====
    if (mode === "choose") {
        return (
            <div style={s.page}>
                <div style={s.container}>
                    <div style={s.header}>
                        <button onClick={onBack} style={s.backBtn}>
                            <svg width="24" height="24" fill="none" stroke="#8899AA" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 style={s.title}>Envoyer</h1>
                    </div>

                    <p style={{ ...s.sectionTitle, marginBottom: 16 }}>Choisir le mode d'envoi</p>

                    {/* P2P Contact */}
                    <button
                        onClick={() => { setMode("contact"); setStep("recipient"); }}
                        style={{
                            width: "100%", padding: 20, borderRadius: 16, display: "flex", alignItems: "center", gap: 16,
                            background: "linear-gradient(135deg, rgba(107,165,255,0.08), rgba(107,165,255,0.04))",
                            border: "1px solid rgba(107,165,255,0.2)", cursor: "pointer", marginBottom: 14, textAlign: "left"
                        }}
                    >
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #6BA5FF, #4a7bd1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ color: "#E8ECF1", fontWeight: 700, fontSize: 16, margin: 0 }}>Envoyer à un contact</p>
                            <p style={{ color: "#8899AA", fontSize: 12, margin: "4px 0 0" }}>Transfert P2P instantané · Sans frais</p>
                        </div>
                        <span style={{ color: "#6BA5FF", fontSize: 20 }}>›</span>
                    </button>

                    {/* Crypto On-Chain */}
                    <button
                        onClick={() => { setMode("crypto"); setCryptoStep("form"); }}
                        style={{
                            width: "100%", padding: 20, borderRadius: 16, display: "flex", alignItems: "center", gap: 16,
                            background: "linear-gradient(135deg, rgba(255,149,0,0.08), rgba(255,149,0,0.04))",
                            border: "1px solid rgba(255,149,0,0.2)", cursor: "pointer", marginBottom: 14, textAlign: "left"
                        }}
                    >
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: "linear-gradient(135deg, #FF9500, #E67E22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v12M6 12h12"/></svg>
                        </div>
                        <div style={{ flex: 1 }}>
                            <p style={{ color: "#E8ECF1", fontWeight: 700, fontSize: 16, margin: 0 }}>Envoyer Crypto</p>
                            <p style={{ color: "#8899AA", fontSize: 12, margin: "4px 0 0" }}>Transfert on-chain · BTC, ETH, USDT, USDC</p>
                        </div>
                        <span style={{ color: "#FF9500", fontSize: 20 }}>›</span>
                    </button>
                </div>
            </div>
        );
    }

    // ===== CRYPTO SEND DONE =====
    if (mode === "crypto" && cryptoStep === "done") {
        return (
            <div style={s.center}>
                <div style={{ textAlign: "center" }}>
                    <div style={s.successIcon} className="kin-scale-in">
                        <svg width="44" height="44" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 style={s.successTitle} className="kin-fade-in">Transaction envoyée!</h2>
                    <p style={s.successAmount} className="kin-fade-in">{numCryptoAmount} {cryptoToken}</p>
                    <div style={{ background: "rgba(12,28,56,0.3)", borderRadius: 12, padding: 14, marginBottom: 24, textAlign: "left" }}>
                        <p style={{ color: "#8899AA", fontSize: 11, margin: "0 0 6px", fontWeight: 600 }}>TX Hash</p>
                        <p style={{ color: "#E8ECF1", fontFamily: "monospace", fontSize: 11, margin: 0, wordBreak: "break-all" }}>{cryptoTxHash}</p>
                    </div>
                    <button onClick={handleBack} style={{ ...s.primaryBtn, marginTop: 8, marginBottom: 0 }}>Retour</button>
                </div>
            </div>
        );
    }

    // ===== CRYPTO SEND PROCESSING =====
    if (mode === "crypto" && cryptoStep === "processing") {
        return (
            <div style={s.center}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: 72, height: 72, margin: "0 auto 24px", borderRadius: "50%", background: "linear-gradient(135deg, #FF9500, #E67E22)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(255,149,0,0.3)" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #020817", borderTopColor: "#fff" }} className="kin-spin"></div>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: "#E8ECF1", margin: "0 0 8px" }}>Envoi en cours...</h2>
                    <p style={{ color: "#8899AA", margin: 0, fontSize: 14 }}>Broadcast sur {currentCryptoNet?.name || cryptoNetwork}</p>
                </div>
            </div>
        );
    }

    // ===== CRYPTO SEND CONFIRM =====
    if (mode === "crypto" && cryptoStep === "confirm") {
        return (
            <div style={s.page}>
                <div style={s.container}>
                    <div style={s.header}>
                        <button onClick={handleBack} style={s.backBtn}>
                            <svg width="24" height="24" fill="none" stroke="#8899AA" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 style={s.title}>Confirmer l'envoi</h1>
                    </div>

                    <div style={s.confirmCard}>
                        <p style={{ color: "#8899AA", fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>Montant</p>
                        <h3 style={s.confirmAmount}>{numCryptoAmount} {cryptoToken}</h3>
                    </div>

                    <div style={{ background: "rgba(12,28,56,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ color: "#8899AA", fontSize: 12 }}>Destinataire</span>
                            <span style={{ color: "#E8ECF1", fontSize: 11, fontFamily: "monospace", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{cryptoAddress}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ color: "#8899AA", fontSize: 12 }}>Réseau</span>
                            <span style={{ color: "#E8ECF1", fontSize: 12, fontWeight: 600 }}>{currentCryptoNet?.name}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                            <span style={{ color: "#8899AA", fontSize: 12 }}>Frais réseau</span>
                            <span style={{ color: "#E8ECF1", fontSize: 12, fontWeight: 600 }}>{currentCryptoNet?.fee}</span>
                        </div>
                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#8899AA", fontSize: 12 }}>Temps estimé</span>
                            <span style={{ color: "#26A69A", fontSize: 12, fontWeight: 700 }}>{currentCryptoNet?.time}</span>
                        </div>
                    </div>

                    {/* Warning */}
                    <div style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.3)", borderRadius: 12, padding: 14, marginBottom: 24 }}>
                        <p style={{ color: "#FCCF4F", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                            ⚠️ Vérifiez l'adresse et le réseau. Les transactions blockchain sont irréversibles.
                        </p>
                    </div>

                    <button onClick={handleCryptoSend} disabled={cryptoLoading} style={s.primaryBtn}>
                        {cryptoLoading ? "Envoi en cours..." : "Confirmer l'envoi"}
                    </button>
                    <button onClick={handleBack} style={s.secondaryBtn}>Annuler</button>
                </div>
            </div>
        );
    }

    // ===== CRYPTO SEND FORM =====
    if (mode === "crypto" && cryptoStep === "form") {
        return (
            <div style={s.page}>
                <div style={s.container}>
                    <div style={s.header}>
                        <button onClick={handleBack} style={s.backBtn}>
                            <svg width="24" height="24" fill="none" stroke="#8899AA" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 style={s.title}>Envoyer Crypto</h1>
                    </div>

                    {/* Token selection */}
                    <p style={{ ...s.sectionTitle, marginBottom: 10 }}>Token</p>
                    <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                        {CRYPTO_TOKENS.map(t => (
                            <button key={t} onClick={() => { setCryptoToken(t); const nets = SEND_NETWORKS[t]; if (nets?.length) setCryptoNetwork(nets[0].id); setCryptoError(""); }}
                                style={{
                                    flex: 1, padding: "10px 8px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
                                    background: cryptoToken === t ? "linear-gradient(135deg, #FF9500, #E67E22)" : "rgba(12,28,56,0.3)",
                                    color: cryptoToken === t ? "#fff" : "#8899AA",
                                    boxShadow: cryptoToken === t ? "0 4px 12px rgba(255,149,0,0.3)" : "none",
                                    border: cryptoToken === t ? "none" : "1px solid rgba(255,255,255,0.08)"
                                }}
                            >{t}</button>
                        ))}
                    </div>

                    {/* Network */}
                    <p style={{ ...s.sectionTitle, marginBottom: 10 }}>Réseau</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                        {(SEND_NETWORKS[cryptoToken] || []).map(net => (
                            <button key={net.id} onClick={() => setCryptoNetwork(net.id)}
                                style={{
                                    width: "100%", padding: "14px 16px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between",
                                    border: cryptoNetwork === net.id ? "1px solid rgba(255,149,0,0.5)" : "1px solid rgba(255,255,255,0.08)",
                                    background: cryptoNetwork === net.id ? "rgba(255,149,0,0.08)" : "rgba(12,28,56,0.3)",
                                    cursor: "pointer", textAlign: "left"
                                }}
                            >
                                <div>
                                    <p style={{ color: "#E8ECF1", fontWeight: 600, fontSize: 14, margin: 0 }}>{net.name}</p>
                                    <p style={{ color: "#6b7280", fontSize: 11, margin: "4px 0 0" }}>Frais: {net.fee} · {net.time}</p>
                                </div>
                                {cryptoNetwork === net.id && (
                                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#FF9500", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Address */}
                    <p style={{ ...s.sectionTitle, marginBottom: 10 }}>Adresse du destinataire</p>
                    <input
                        type="text" value={cryptoAddress} onChange={e => { setCryptoAddress(e.target.value); setCryptoError(""); }}
                        placeholder={cryptoToken === "BTC" ? "bc1q... ou 1... ou 3..." : cryptoToken === "USDT" && cryptoNetwork === "tron" ? "T..." : "0x..."}
                        style={{ width: "100%", background: "rgba(12,28,56,0.3)", border: cryptoError ? "2px solid #EF5350" : "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "14px 16px", color: "#E8ECF1", fontFamily: "monospace", fontSize: 13, outline: "none", boxSizing: "border-box", marginBottom: 24 }}
                    />

                    {/* Amount */}
                    <p style={{ ...s.sectionTitle, marginBottom: 10 }}>Montant</p>
                    <div style={{ position: "relative", marginBottom: 8 }}>
                        <input
                            type="number" value={cryptoAmount} onChange={e => setCryptoAmount(e.target.value)}
                            placeholder="0.00"
                            style={{ width: "100%", background: "rgba(12,28,56,0.3)", border: "2px solid rgba(255,149,0,0.3)", borderRadius: 12, padding: "14px 16px", textAlign: "center", fontSize: 28, fontWeight: 700, color: "#E8ECF1", outline: "none", boxSizing: "border-box" }}
                        />
                        <button onClick={() => setCryptoAmount(cryptoBalance.toString())}
                            style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", padding: "6px 12px", background: "rgba(255,149,0,0.2)", color: "#FF9500", fontSize: 12, borderRadius: 8, border: "1px solid rgba(255,149,0,0.3)", cursor: "pointer", fontWeight: 600 }}
                        >MAX</button>
                    </div>
                    <p style={s.balanceHint}>Solde: {cryptoBalance} {cryptoToken}</p>

                    {/* Fee summary */}
                    <div style={{ background: "rgba(12,28,56,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, marginTop: 20, marginBottom: 20 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                            <span style={{ color: "#8899AA", fontSize: 12 }}>Frais réseau</span>
                            <span style={{ color: "#E8ECF1", fontSize: 12, fontWeight: 600 }}>{currentCryptoNet?.fee}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ color: "#8899AA", fontSize: 12 }}>Temps estimé</span>
                            <span style={{ color: "#26A69A", fontSize: 12, fontWeight: 600 }}>{currentCryptoNet?.time}</span>
                        </div>
                    </div>

                    {/* Error */}
                    {cryptoError && (
                        <div style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                            <p style={{ color: "#EF5350", fontSize: 12, margin: 0 }}>{cryptoError}</p>
                        </div>
                    )}

                    <button onClick={() => { if (isCryptoValid) setCryptoStep("confirm"); }} disabled={!isCryptoValid}
                        style={s.submitBtn(isCryptoValid)}>
                        Continuer
                    </button>
                </div>
            </div>
        );
    }

    // ===== P2P: DONE =====
    if (mode === "contact" && step === "done") {
        return (
            <div style={s.center}>
                <div style={{ textAlign: "center" }}>
                    <div style={s.successIcon} className="kin-scale-in">
                        <svg width="44" height="44" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 style={s.successTitle} className="kin-fade-in">Envoyé à {selectedContact?.name}!</h2>
                    <p style={s.successAmount} className="kin-fade-in">{fUSD(numAmount)}</p>
                    <button onClick={handleBack} style={{ ...s.primaryBtn, marginTop: 16, marginBottom: 0 }}>Retour</button>
                </div>
            </div>
        );
    }

    // ===== P2P: PROCESSING =====
    if (mode === "contact" && step === "processing") {
        return (
            <div style={s.center}>
                <div style={{ textAlign: "center" }}>
                    <div style={{ width: 72, height: 72, margin: "0 auto 24px", borderRadius: "50%", background: "linear-gradient(135deg, #6BA5FF, #4a7bd1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(107,165,255,0.3)" }}>
                        <div style={{ width: 48, height: 48, borderRadius: "50%", border: "4px solid #020817", borderTopColor: "#fff" }} className="kin-spin"></div>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: "#E8ECF1", margin: "0 0 8px" }}>Envoi en cours...</h2>
                    <p style={{ color: "#8899AA", margin: 0, fontSize: 14 }}>Transfert vers {selectedContact?.name}</p>
                </div>
            </div>
        );
    }

    // ===== P2P: CONFIRM =====
    if (mode === "contact" && step === "confirm") {
        return (
            <div style={s.page}>
                <div style={s.container}>
                    <div style={s.header}>
                        <button onClick={handleBack} style={s.backBtn}>
                            <svg width="24" height="24" fill="none" stroke="#8899AA" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 style={s.title}>Confirmer</h1>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 36 }}>
                        <div style={s.avatarXl(selectedContact?.color || "#6BA5FF")}>{selectedContact?.avatar}</div>
                        <h2 style={s.nameText}>{selectedContact?.name}</h2>
                    </div>
                    <div style={s.confirmCard}>
                        <p style={{ color: "#8899AA", fontSize: 12, margin: "0 0 8px", fontWeight: 600 }}>Montant à envoyer</p>
                        <h3 style={s.confirmAmount}>{fUSD(numAmount)}</h3>
                        <p style={s.confirmSub}>{currency}</p>
                    </div>
                    {message && (
                        <div style={{ background: "rgba(12,28,56,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, marginBottom: 32 }}>
                            <p style={{ color: "#8899AA", fontSize: 11, marginBottom: 8, margin: 0, fontWeight: 600 }}>Message joint</p>
                            <p style={{ color: "#E8ECF1", fontStyle: "italic", margin: 0, fontSize: 13 }}>"{message}"</p>
                        </div>
                    )}
                    <button onClick={handleSend} style={s.primaryBtn}>Envoyer</button>
                    <button onClick={handleBack} style={s.secondaryBtn}>Annuler</button>
                </div>
            </div>
        );
    }

    // ===== P2P: AMOUNT =====
    if (mode === "contact" && step === "amount") {
        return (
            <div style={s.page}>
                <div style={s.container}>
                    <div style={s.header}>
                        <button onClick={handleBack} style={s.backBtn}>
                            <svg width="24" height="24" fill="none" stroke="#8899AA" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <h1 style={s.title}>Montant</h1>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 32 }}>
                        <div style={s.avatarLg(selectedContact?.color || "#6BA5FF")}>{selectedContact?.avatar}</div>
                        <h2 style={s.nameText}>{selectedContact?.name}</h2>
                    </div>
                    <div style={s.contactInfoCard}>
                        <p style={{ color: "#8899AA", fontSize: 11, margin: "0 0 8px", fontWeight: 600, textTransform: "uppercase" }}>Destinataire</p>
                        <p style={{ fontSize: 14, color: "#E8ECF1", margin: 0, fontWeight: 600 }}>{selectedContact?.name}</p>
                    </div>
                    <p style={s.currLabel}>Montant</p>
                    <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={s.amountInput} />
                    <p style={s.currLabel}>Devise</p>
                    <div style={s.currRow}>
                        {["USD", "EUR", "BTC", "ETH"].map(curr => (
                            <button key={curr} onClick={() => setCurrency(curr)} style={currency === curr ? s.currActive : s.currInactive}>{curr}</button>
                        ))}
                    </div>
                    <p style={s.balanceHint}>Solde disponible: {fUSD(balance)} {currency}</p>
                    <p style={{ color: "#8899AA", fontSize: 12, marginBottom: 12, margin: "24px 0 12px", fontWeight: 600 }}>Message (optionnel)</p>
                    <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Ajouter un message..." maxLength="100" style={{ width: "100%", background: "rgba(12,28,56,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", color: "#E8ECF1", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 32 }} />
                    <button onClick={() => setStep("confirm")} disabled={!isValidAmount} style={s.submitBtn(isValidAmount)}>Continuer</button>
                </div>
            </div>
        );
    }

    // ===== P2P: RECIPIENT =====
    return (
        <div style={s.page}>
            <div style={s.container}>
                <div style={s.header}>
                    <button onClick={handleBack} style={s.backBtn}>
                        <svg width="24" height="24" fill="none" stroke="#8899AA" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h1 style={s.title}>Envoyer à un contact</h1>
                </div>
                <input type="text" placeholder="Chercher un contact..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={s.searchInput} />
                {filteredContacts.length > 0 ? (
                    <>
                        <p style={s.sectionTitle}>Contacts</p>
                        <div style={s.contactsGrid}>
                            {filteredContacts.map(contact => (
                                <button key={contact.id} onClick={() => handleSelectContact(contact)} style={s.contactBtn}>
                                    <div style={s.contactAvatar(contact.color)}>{contact.avatar}</div>
                                    <p style={s.contactName}>{contact.name}</p>
                                </button>
                            ))}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: "center", padding: "32px 0", color: "#4A5568", fontSize: 13 }}>Aucun contact trouvé</div>
                )}
            </div>
        </div>
    );
}

export { SendPage };
