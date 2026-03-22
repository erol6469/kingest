import { useState } from "react";
import { C } from "../data/constants";
import { fUSD } from "../utils";

const NETWORKS = [
    { id: "eth", name: "Ethereum", color: "#627EEA", fee: 5.50, time: "5-15 min" },
    { id: "polygon", name: "Polygon", color: "#8247E5", fee: 0.10, time: "2-5 min" },
    { id: "arb", name: "Arbitrum", color: "#28A0F0", fee: 0.30, time: "1-3 min" },
    { id: "base", name: "Base", color: "#0052FF", fee: 0.15, time: "1-2 min" },
    { id: "bsc", name: "BNB Chain", color: "#F3BA2F", fee: 0.80, time: "3-5 min" },
];

const s = {
    page: { minHeight: "100vh", background: "#020817", padding: 16, paddingBottom: 96 },
    center: { minHeight: "100vh", background: "#020817", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 16 },
    container: { maxWidth: 420, margin: "0 auto", paddingTop: 24 },
    header: { display: "flex", alignItems: "center", marginBottom: 28 },
    backBtn: { padding: 8, background: "transparent", border: "none", cursor: "pointer", marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center" },
    title: { fontSize: 20, fontWeight: 700, color: "#E8ECF1", margin: 0 },
    balanceCard: { background: "rgba(12,28,56,0.3)", border: "1px solid rgba(38,166,154,0.2)", borderRadius: 16, padding: 20, marginBottom: 28, textAlign: "center" },
    balLabel: { color: "#8899AA", fontSize: 12, marginBottom: 8, margin: 0, fontWeight: 600 },
    balAmount: { fontSize: 32, fontWeight: 700, color: "#E8ECF1", margin: 0 },
    balSub: { color: "#6b7280", fontSize: 11, marginTop: 8, margin: 0 },
    tabRow: { display: "flex", gap: 10, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: 0 },
    tabBtn: (active) => ({
        flex: 1,
        padding: "12px 0",
        borderRadius: 0,
        fontWeight: 600,
        border: "none",
        cursor: "pointer",
        background: "transparent",
        color: active ? "#6BA5FF" : "#8899AA",
        fontSize: 13,
        borderBottom: active ? "2px solid #6BA5FF" : "2px solid transparent",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6
    }),
    tabIcon: { width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center" },
    sectionLabel: { color: "#8899AA", fontSize: 12, marginBottom: 12, margin: 0, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 },
    tokenRow: { display: "flex", gap: 8, marginBottom: 24 },
    tokenActive: { flex: 1, padding: "10px 12px", borderRadius: 12, fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer", background: "linear-gradient(135deg, #6BA5FF, #4a7bd1)", color: "#fff", boxShadow: "0 4px 12px rgba(107,165,255,0.3)" },
    tokenInactive: { flex: 1, padding: "10px 12px", borderRadius: 12, fontWeight: 600, fontSize: 13, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", background: "rgba(12,28,56,0.3)", color: "#8899AA" },
    networkBtn: (active) => ({ width: "100%", padding: 16, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", border: active ? "1px solid rgba(38,166,154,0.5)" : "1px solid rgba(255,255,255,0.08)", background: active ? "rgba(38,166,154,0.08)" : "rgba(12,28,56,0.3)", cursor: "pointer", marginBottom: 10 }),
    networkLeft: { display: "flex", alignItems: "center", gap: 12 },
    networkIcon: { width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 },
    networkName: { color: "#E8ECF1", fontWeight: 600, fontSize: 13, margin: 0, textAlign: "left" },
    networkTime: { color: "#6b7280", fontSize: 10, margin: 0, textAlign: "left" },
    networkFee: { color: "#E8ECF1", fontWeight: 600, fontSize: 12, margin: 0, textAlign: "right" },
    networkFeeSub: { color: "#6b7280", fontSize: 10, margin: 0, textAlign: "right" },
    amountInput: { width: "100%", background: "rgba(12,28,56,0.3)", border: "2px solid rgba(38,166,154,0.3)", borderRadius: 12, padding: "16px", textAlign: "center", fontSize: 32, fontWeight: 700, color: "#E8ECF1", outline: "none", boxSizing: "border-box" },
    amountWrap: { position: "relative", marginBottom: 20 },
    maxBtn: { position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", padding: "6px 12px", background: "rgba(38,166,154,0.2)", color: "#26A69A", fontSize: 12, borderRadius: 8, border: "1px solid rgba(38,166,154,0.3)", cursor: "pointer", fontWeight: 600 },
    textInput: { width: "100%", background: "rgba(12,28,56,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "12px 16px", color: "#E8ECF1", fontFamily: "monospace", fontSize: 12, outline: "none", boxSizing: "border-box", marginBottom: 20 },
    feeBox: { background: "rgba(12,28,56,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 16, marginBottom: 20 },
    feeRow: { display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 8 },
    feeLabel: { color: "#8899AA", margin: 0 },
    feeValue: { color: "#E8ECF1", fontWeight: 600, margin: 0 },
    feeDivider: { borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10, marginTop: 10, display: "flex", justifyContent: "space-between" },
    totalLabel: { color: "#8899AA", margin: 0, fontSize: 12 },
    totalValue: { color: "#E8ECF1", fontWeight: 700, margin: 0 },
    submitBtn: (enabled) => ({ width: "100%", marginTop: 20, padding: "16px", fontWeight: 700, borderRadius: 12, border: "none", cursor: enabled ? "pointer" : "not-allowed", fontSize: 16, background: enabled ? "linear-gradient(135deg, #6BA5FF, #4a7bd1)" : "rgba(255,255,255,0.05)", color: enabled ? "#fff" : "#4A5568", boxShadow: enabled ? "0 6px 20px rgba(107,165,255,0.35)" : "none", opacity: enabled ? 1 : 0.5 }),
    confirmCard: { background: "rgba(12,28,56,0.3)", border: "1px solid rgba(38,166,154,0.2)", borderRadius: 16, padding: 24, marginBottom: 24, textAlign: "center" },
    confirmAmount: { fontSize: 32, fontWeight: 700, color: "#E8ECF1", margin: 0, marginBottom: 8 },
    confirmSub: { color: "#8899AA", fontSize: 12, margin: 0, fontWeight: 600 },
    detailBox: { background: "rgba(12,28,56,0.3)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 12, marginBottom: 12 },
    detailLabel: { color: "#8899AA", fontSize: 10, margin: 0, marginBottom: 4, fontWeight: 600 },
    detailValue: { color: "#E8ECF1", fontFamily: "monospace", fontSize: 12, margin: 0, wordBreak: "break-all" },
    gridRow: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 },
    warningBox: { background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.3)", borderRadius: 12, padding: 14, marginBottom: 20 },
    warningText: { color: "#FCCF4F", fontSize: 12, margin: 0, lineHeight: 1.4 },
    primaryBtn: { width: "100%", padding: "16px", background: "linear-gradient(135deg, #6BA5FF, #4a7bd1)", color: "#fff", fontWeight: 700, borderRadius: 12, border: "none", cursor: "pointer", fontSize: 16, marginBottom: 12, boxShadow: "0 6px 20px rgba(107,165,255,0.35)" },
    secondaryBtn: { width: "100%", padding: "16px", background: "rgba(12,28,56,0.3)", color: "#E8ECF1", fontWeight: 600, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontSize: 16 },
    spinner: { width: 48, height: 48, borderRadius: "50%", border: "4px solid #020817", borderTopColor: "#6BA5FF", animation: "spin 1s linear infinite" },
    spinnerWrap: { width: 72, height: 72, margin: "0 auto 24px", borderRadius: "50%", background: "linear-gradient(135deg, #6BA5FF, #4a7bd1)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(107,165,255,0.3)" },
    successIcon: { width: 88, height: 88, margin: "0 auto 24px", borderRadius: "50%", background: "linear-gradient(135deg, #26A69A, #1a7d73)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(38,166,154,0.4)" },
    successTitle: { fontSize: 24, fontWeight: 700, color: "#E8ECF1", margin: "0 0 8px" },
    successSub: { color: "#8899AA", marginBottom: 24, margin: 0, fontSize: 13 },
    lockIcon: { marginRight: 8 }
};

// SVG Tab Icons
const CryptoTabIcon = () => (
    <svg style={s.tabIcon} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
        <text x="12" y="15" textAnchor="middle" fontSize="10" fontWeight="700" fill="currentColor">₿</text>
    </svg>
);

const SepatabIcon = () => (
    <svg style={s.tabIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#1052BA" opacity="0.2" stroke="currentColor" strokeWidth="1"/>
        <g fill="currentColor">
            <circle cx="6.5" cy="6.5" r="1"/>
            <circle cx="12" cy="6.5" r="1"/>
            <circle cx="17.5" cy="6.5" r="1"/>
            <circle cx="6.5" cy="12" r="1"/>
            <circle cx="17.5" cy="12" r="1"/>
            <circle cx="6.5" cy="17.5" r="1"/>
            <circle cx="12" cy="17.5" r="1"/>
            <circle cx="17.5" cy="17.5" r="1"/>
        </g>
    </svg>
);

const PayPalTabIcon = () => (
    <svg style={s.tabIcon} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1"/>
        <text x="8" y="15" fontSize="9" fontWeight="700" fill="currentColor">P</text>
        <text x="14" y="15" fontSize="9" fontWeight="700" fill="currentColor">P</text>
    </svg>
);

function CollectPage({ walletBalances, onBack, onWithdraw }) {
    const [step, setStep] = useState("form");
    const [method, setMethod] = useState("crypto");
    const [selectedToken, setSelectedToken] = useState("USDC");
    const [selectedNetwork, setSelectedNetwork] = useState("eth");
    const [amount, setAmount] = useState("");
    const [address, setAddress] = useState("");
    const [iban, setIban] = useState("");
    const [bic, setBic] = useState("");
    const [paypalEmail, setPaypalEmail] = useState("");
    const [paypalAmount, setPaypalAmount] = useState("");
    const [sepaName, setSepaName] = useState("");
    const [sepaLoading, setSepaLoading] = useState(false);
    const [sepaError, setSepaError] = useState("");

    const currentNetwork = NETWORKS.find(n => n.id === selectedNetwork);
    const cryptoFee = currentNetwork?.fee || 0;
    const sepaFee = (parseFloat(amount) || 0) * 0.005;
    const sepaInstantFee = (parseFloat(amount) || 0) * 0.01;
    const paypalFee = method === "paypal" ? (parseFloat(paypalAmount) || 0) * 0.025 : 0;

    const balance = walletBalances[selectedToken] || walletBalances.USD || 0;
    const numAmount = parseFloat(amount) || 0;
    const numPaypalAmount = parseFloat(paypalAmount) || 0;

    const fee = method === "crypto" ? cryptoFee : method === "sepa" ? sepaFee : method === "sepa_instant" ? sepaInstantFee : paypalFee;
    const total = numAmount + fee;
    const paypalTotal = numPaypalAmount + paypalFee;

    const isValidForm = method === "crypto" ? (numAmount > 0 && numAmount <= balance && address.trim().startsWith("0x") && address.length === 42) :
                        method === "sepa" || method === "sepa_instant" ? (numAmount > 0 && numAmount <= balance && iban.trim().length > 15 && sepaName.trim().length > 0) :
                        method === "paypal" ? (numPaypalAmount > 0 && numPaypalAmount <= balance && paypalEmail.includes("@")) : false;

    const handleSubmit = async () => {
        if (method === "sepa" || method === "sepa_instant") {
            setSepaLoading(true);
            setSepaError("");
            try {
                const { API_BASE } = await import("../config.js");
                const cleanIban = iban.replace(/\s/g, "").toUpperCase();
                const response = await fetch(API_BASE + (method === "sepa_instant" ? "/api/stripe/sepa-instant-withdraw" : "/api/stripe/sepa-withdraw"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        amount: parseFloat(amount),
                        currency: "EUR",
                        iban: cleanIban,
                        accountName: sepaName.trim()
                    })
                });
                const result = await response.json();
                setSepaLoading(false);
                if (result.ok) {
                    if (onWithdraw) {
                        onWithdraw(parseFloat(amount), "EUR", method === "sepa_instant" ? "Virement Instantané" : "Virement SEPA");
                    }
                    setStep("processing");
                    setTimeout(() => {
                        setStep("done");
                    }, 2000);
                } else {
                    setSepaError(result.error || "Erreur lors du traitement");
                }
            } catch (err) {
                setSepaLoading(false);
                setSepaError("Erreur de connexion: " + err.message);
            }
        } else {
            setStep("confirm");
        }
    };

    const handleConfirm = () => {
        if (onWithdraw) {
            const withdrawAmount = method === "paypal" ? numPaypalAmount : numAmount;
            const withdrawCurrency = method === "crypto" ? selectedToken : method === "sepa" ? "EUR" : "USD";
            onWithdraw(withdrawAmount, withdrawCurrency, method);
        }
        setStep("processing");
        setTimeout(() => {
            setStep("done");
        }, 2000);
    };

    const handleBack = () => {
        if (step === "form") onBack();
        else setStep("form");
    };

    const handleMax = () => {
        if (method === "paypal") {
            setPaypalAmount(Math.max(0, balance - paypalFee).toString());
        } else {
            setAmount(Math.max(0, balance - fee).toString());
        }
    };

    // Animation keyframes
    const animStyle = document.getElementById("kingest-collect-anim");
    if (!animStyle) {
        const st = document.createElement("style");
        st.id = "kingest-collect-anim";
        st.textContent = `@keyframes spin { to { transform: rotate(360deg); } } @keyframes scaleIn { from { transform: scale(0.5); opacity: 0; } to { transform: scale(1); opacity: 1; } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } } .kin-spin { animation: spin 1s linear infinite; } .kin-scale-in { animation: scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); } .kin-fade-in { animation: fadeIn 0.8s ease-out; }`;
        document.head.appendChild(st);
    }

    if (step === "processing") {
        return (
            <div style={s.center}>
                <div style={{ textAlign: "center" }}>
                    <div style={s.spinnerWrap}>
                        <div style={s.spinner} className="kin-spin"></div>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 600, color: "#E8ECF1", margin: "0 0 8px" }}>Traitement en cours...</h2>
                    <p style={{ color: "#8899AA", margin: 0, fontSize: 14 }}>Votre retrait est en cours de traitement</p>
                </div>
            </div>
        );
    }

    if (step === "done") {
        const estimatedTime = method === "crypto" ? currentNetwork?.time : method === "sepa" ? "1-3 jours" : method === "sepa_instant" ? "~10 sec" : "instant";
        return (
            <div style={s.center}>
                <div style={{ textAlign: "center" }}>
                    <div style={s.successIcon} className="kin-scale-in">
                        <svg width="44" height="44" fill="none" stroke="#fff" viewBox="0 0 24 24" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 style={s.successTitle} className="kin-fade-in">Retrait envoyé !</h2>
                    <p style={{ ...s.successSub, marginBottom: 24 }} className="kin-fade-in">
                        Temps estimé: {estimatedTime}
                    </p>
                    <button onClick={onBack} style={s.primaryBtn}>
                        Retour
                    </button>
                </div>
            </div>
        );
    }

    if (step === "confirm") {
        let displayAmount, feeDisplay, recipientDisplay, methodDisplay;

        if (method === "crypto") {
            displayAmount = `${numAmount.toFixed(2)} ${selectedToken}`;
            feeDisplay = `${cryptoFee.toFixed(2)} ${selectedToken}`;
            recipientDisplay = address;
            methodDisplay = currentNetwork?.name;
        } else if (method === "sepa") {
            displayAmount = `${numAmount.toFixed(2)} €`;
            feeDisplay = `${sepaFee.toFixed(2)} €`;
            recipientDisplay = sepaName;
            methodDisplay = "SEPA";
        } else if (method === "sepa_instant") {
            displayAmount = `${numAmount.toFixed(2)} €`;
            feeDisplay = `${sepaInstantFee.toFixed(2)} €`;
            recipientDisplay = sepaName;
            methodDisplay = "SEPA Instant";
        } else {
            displayAmount = `${numPaypalAmount.toFixed(2)} USD`;
            feeDisplay = `${paypalFee.toFixed(2)} USD`;
            recipientDisplay = paypalEmail;
            methodDisplay = "PayPal";
        }

        return (
            <div style={s.page}>
                <div style={s.container}>
                    <div style={s.header}>
                        <button onClick={handleBack} style={s.backBtn}>
                            <svg width="24" height="24" fill="none" stroke="#8899AA" viewBox="0 0 24 24" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 style={s.title}>Confirmer</h1>
                    </div>

                    <div style={s.confirmCard}>
                        <p style={s.balLabel}>Montant à retirer</p>
                        <h2 style={s.confirmAmount}>{displayAmount}</h2>
                        <p style={s.confirmSub}>{methodDisplay}</p>
                    </div>

                    <div style={s.detailBox}>
                        <p style={s.detailLabel}>Destinataire</p>
                        <p style={s.detailValue}>{recipientDisplay}</p>
                    </div>

                    <div style={s.gridRow}>
                        <div style={s.detailBox}>
                            <p style={s.detailLabel}>Frais</p>
                            <p style={{ color: "#E8ECF1", fontWeight: 600, margin: 0, fontSize: 12 }}>{feeDisplay}</p>
                        </div>
                        <div style={s.detailBox}>
                            <p style={s.detailLabel}>Total</p>
                            <p style={{ color: "#E8ECF1", fontWeight: 600, margin: 0, fontSize: 12 }}>
                                {method === "paypal" ? paypalTotal.toFixed(2) : total.toFixed(2)} {method === "crypto" ? selectedToken : (method === "sepa" || method === "sepa_instant") ? "€" : "USD"}
                            </p>
                        </div>
                    </div>

                    <div style={s.warningBox}>
                        <p style={s.warningText}>⚠ Cette action est irréversible. Vérifiez bien les détails.</p>
                    </div>

                    <button onClick={handleConfirm} style={s.primaryBtn}>
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} style={s.lockIcon}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm6-10V7a3 3 0 00-3-3H9a3 3 0 00-3 3v2h6z" />
                        </svg>
                        Confirmer le retrait
                    </button>
                    <button onClick={handleBack} style={s.secondaryBtn}>Annuler</button>
                </div>
            </div>
        );
    }

    return (
        <div style={s.page}>
            <div style={s.container}>
                <div style={s.header}>
                    <button onClick={handleBack} style={s.backBtn}>
                        <svg width="24" height="24" fill="none" stroke="#8899AA" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 style={s.title}>Retrait</h1>
                </div>

                <div style={s.balanceCard}>
                    <p style={s.balLabel}>Solde disponible</p>
                    <h2 style={s.balAmount}>{fUSD(balance)}</h2>
                    <p style={s.balSub}>{method === "crypto" ? selectedToken : (method === "sepa" || method === "sepa_instant") ? "EUR" : "USD"}</p>
                </div>

                {/* Tabs with SVG icons */}
                <div style={s.tabRow}>
                    <button onClick={() => { setMethod("crypto"); setAddress(""); }} style={s.tabBtn(method === "crypto")}>
                        <CryptoTabIcon />
                        Crypto
                    </button>
                    <button onClick={() => { setMethod("sepa"); setIban(""); setSepaName(""); setSepaError(""); }} style={s.tabBtn(method === "sepa")}>
                        <SepatabIcon />
                        SEPA
                    </button>
                    <button onClick={() => { setMethod("sepa_instant"); setIban(""); setSepaName(""); setSepaError(""); }} style={s.tabBtn(method === "sepa_instant")}>
                        <div style={s.tabIcon}><span style={{ fontSize: 14 }}>⚡</span></div>
                        Instant
                    </button>
                    <button onClick={() => { setMethod("paypal"); setPaypalEmail(""); setPaypalAmount(""); }} style={s.tabBtn(method === "paypal")}>
                        <PayPalTabIcon />
                        PayPal
                    </button>
                </div>

                {method === "crypto" && (
                    <div>
                        <p style={s.sectionLabel}>Token</p>
                        <div style={s.tokenRow}>
                            {["USDC", "USDT", "ETH", "BTC"].map(token => (
                                <button key={token} onClick={() => setSelectedToken(token)} style={selectedToken === token ? s.tokenActive : s.tokenInactive}>{token}</button>
                            ))}
                        </div>

                        <p style={s.sectionLabel}>Réseau</p>
                        <div style={{ marginBottom: 20 }}>
                            {NETWORKS.map(network => (
                                <button key={network.id} onClick={() => setSelectedNetwork(network.id)} style={s.networkBtn(selectedNetwork === network.id)}>
                                    <div style={s.networkLeft}>
                                        <div style={{ ...s.networkIcon, background: network.color, color: "#fff" }}>
                                            {network.id === "eth" && "◊"}
                                            {network.id === "polygon" && "⬡"}
                                            {network.id === "arb" && "◇"}
                                            {network.id === "base" && "▣"}
                                            {network.id === "bsc" && "◆"}
                                        </div>
                                        <div>
                                            <p style={s.networkName}>{network.name}</p>
                                            <p style={s.networkTime}>{network.time}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p style={s.networkFee}>${network.fee.toFixed(2)}</p>
                                        <p style={s.networkFeeSub}>fee</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        <p style={s.sectionLabel}>Montant</p>
                        <div style={s.amountWrap}>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={s.amountInput} />
                            <button onClick={handleMax} style={s.maxBtn}>MAX</button>
                        </div>

                        <p style={s.sectionLabel}>Adresse de destination</p>
                        <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="0x..." style={s.textInput} />

                        <div style={s.feeBox}>
                            <div style={s.feeRow}>
                                <p style={s.feeLabel}>Frais réseau</p>
                                <p style={s.feeValue}>${cryptoFee.toFixed(2)}</p>
                            </div>
                            <div style={s.feeDivider}>
                                <p style={s.totalLabel}>Total</p>
                                <p style={s.totalValue}>{total.toFixed(2)} {selectedToken}</p>
                            </div>
                        </div>
                    </div>
                )}

                {(method === "sepa" || method === "sepa_instant") && (
                    <div>
                        <p style={s.sectionLabel}>Montant en EUR</p>
                        <div style={s.amountWrap}>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" style={s.amountInput} />
                            <button onClick={handleMax} style={s.maxBtn}>MAX</button>
                        </div>

                        <p style={s.sectionLabel}>Titulaire du compte</p>
                        <input type="text" value={sepaName} onChange={e => setSepaName(e.target.value)} placeholder="Nom complet" style={s.textInput} />

                        <p style={s.sectionLabel}>IBAN</p>
                        <input type="text" value={iban} onChange={e => {
                            const formatted = e.target.value.toUpperCase().replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
                            setIban(formatted);
                        }} placeholder="FR76 0000 0000 0000..." style={s.textInput} />

                        <div style={s.feeBox}>
                            <div style={s.feeRow}>
                                <p style={s.feeLabel}>{method === "sepa_instant" ? "Frais Instant (1%)" : "Frais SEPA (0.5%)"}</p>
                                <p style={s.feeValue}>{method === "sepa_instant" ? sepaInstantFee.toFixed(2) : sepaFee.toFixed(2)} €</p>
                            </div>
                            <div style={s.feeDivider}>
                                <p style={s.totalLabel}>Total</p>
                                <p style={s.totalValue}>{total.toFixed(2)} €</p>
                            </div>
                        </div>

                        <div style={{ ...s.warningBox, background: "rgba(38,166,154,0.08)", border: "1px solid rgba(38,166,154,0.3)" }}>
                            <p style={{ ...s.warningText, color: "#26A69A" }}>{method === "sepa_instant" ? "⚡ Virement instantané — reçu en ~10 secondes" : "ℹ Le virement sera traité en 1-2 jours ouvrés"}</p>
                        </div>

                        {sepaError && (
                            <div style={{ ...s.warningBox, background: "rgba(239,83,80,0.08)", border: "1px solid rgba(239,83,80,0.3)", marginBottom: 20 }}>
                                <p style={{ ...s.warningText, color: "#EF5350" }}>{sepaError}</p>
                            </div>
                        )}
                    </div>
                )}

                {method === "paypal" && (
                    <div>
                        <p style={s.sectionLabel}>Email PayPal</p>
                        <input type="email" value={paypalEmail} onChange={e => setPaypalEmail(e.target.value)} placeholder="email@example.com" style={s.textInput} />

                        <p style={s.sectionLabel}>Montant en USD</p>
                        <div style={s.amountWrap}>
                            <input type="number" value={paypalAmount} onChange={e => setPaypalAmount(e.target.value)} placeholder="0.00" style={s.amountInput} />
                            <button onClick={handleMax} style={s.maxBtn}>MAX</button>
                        </div>

                        <div style={s.feeBox}>
                            <div style={s.feeRow}>
                                <p style={s.feeLabel}>Frais PayPal (2.5%)</p>
                                <p style={s.feeValue}>${paypalFee.toFixed(2)}</p>
                            </div>
                            <div style={s.feeDivider}>
                                <p style={s.totalLabel}>Total</p>
                                <p style={s.totalValue}>${paypalTotal.toFixed(2)}</p>
                            </div>
                        </div>
                    </div>
                )}

                <button onClick={handleSubmit} disabled={!isValidForm || sepaLoading} style={s.submitBtn(isValidForm && !sepaLoading)}>
                    {sepaLoading ? "Traitement..." : "Retirer"}
                </button>
            </div>
        </div>
    );
}

export { CollectPage };
