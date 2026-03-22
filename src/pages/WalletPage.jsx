import { useState } from "react";
import { C } from "../data/constants";
import { fUSD } from "../utils";

const CONVERSION_RATES = {
  USD: 1,
  EUR: 1.08,
  BTC: 65000,
  ETH: 3500,
  USDT: 1.0,
  USDC: 1.0,
};

const CURRENCY_CONFIG = {
  USD: { name: "Dollar US", symbol: "$" },
  EUR: { name: "Euro", symbol: "€" },
  BTC: { name: "Bitcoin", symbol: "₿" },
  ETH: { name: "Ethereum", symbol: "Ξ" },
  USDT: { name: "Tether", symbol: "₮" },
  USDC: { name: "USD Coin", symbol: "$" },
};

// Inline SVG currency icons
const CurrencyIcon = ({ currency, size = 48 }) => {
  const iconProps = {
    width: size,
    height: size,
    viewBox: "0 0 48 48",
    style: { display: "block" },
  };

  const icons = {
    USD: (
      <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#26A69A" opacity="0.2" />
        <circle cx="24" cy="24" r="22" stroke="#26A69A" strokeWidth="0.5" fill="none" />
        <text x="24" y="32" fontSize="24" fontWeight="700" textAnchor="middle" fill="#26A69A">
          $
        </text>
      </svg>
    ),
    EUR: (
      <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#6BA5FF" opacity="0.2" />
        <circle cx="24" cy="24" r="22" stroke="#6BA5FF" strokeWidth="0.5" fill="none" />
        <text x="24" y="32" fontSize="24" fontWeight="700" textAnchor="middle" fill="#6BA5FF">
          €
        </text>
      </svg>
    ),
    BTC: (
      <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#FF9500" opacity="0.2" />
        <circle cx="24" cy="24" r="22" stroke="#FF9500" strokeWidth="0.5" fill="none" />
        <text x="24" y="32" fontSize="22" fontWeight="700" textAnchor="middle" fill="#FF9500">
          ₿
        </text>
      </svg>
    ),
    ETH: (
      <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#627EEA" opacity="0.2" />
        <circle cx="24" cy="24" r="22" stroke="#627EEA" strokeWidth="0.5" fill="none" />
        <text x="24" y="32" fontSize="24" fontWeight="700" textAnchor="middle" fill="#627EEA">
          Ξ
        </text>
      </svg>
    ),
    USDT: (
      <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#26A69A" opacity="0.2" />
        <circle cx="24" cy="24" r="22" stroke="#26A69A" strokeWidth="0.5" fill="none" />
        <text x="24" y="32" fontSize="22" fontWeight="700" textAnchor="middle" fill="#26A69A">
          ₮
        </text>
      </svg>
    ),
    USDC: (
      <svg {...iconProps} xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="22" fill="#2775CA" opacity="0.2" />
        <circle cx="24" cy="24" r="22" stroke="#2775CA" strokeWidth="0.5" fill="none" />
        <text x="24" y="32" fontSize="20" fontWeight="700" textAnchor="middle" fill="#2775CA">
          $
        </text>
      </svg>
    ),
  };

  return icons[currency] || null;
};

function WalletPage({ walletBalances, transactions, onBack, onNav }) {
  const [dailyChange] = useState(Math.random() * 7 - 2); // -2% to +5%

  // Inject animation styles into document
  if (typeof document !== "undefined") {
    const styleId = "wallet-page-styles";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .wallet-container {
          animation: fadeIn 0.5s ease-out;
        }
        .wallet-card {
          animation: slideUp 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
          opacity: 0;
        }
        .wallet-card:nth-child(1) { animation-delay: 0.1s; }
        .wallet-card:nth-child(2) { animation-delay: 0.2s; }
        .wallet-card:nth-child(3) { animation-delay: 0.3s; }
        .wallet-card:nth-child(4) { animation-delay: 0.4s; }
        .wallet-card:nth-child(5) { animation-delay: 0.5s; }
      `;
      document.head.appendChild(style);
    }
  }

  // Calculate total value in USD
  const totalValue = Object.entries(walletBalances).reduce((sum, [currency, balance]) => {
    return sum + balance * CONVERSION_RATES[currency];
  }, 0);

  // Create sorted asset list
  const assetsList = Object.entries(walletBalances)
    .map(([currency, balance]) => ({
      currency,
      balance,
      usdValue: balance * CONVERSION_RATES[currency],
    }))
    .filter((a) => a.balance > 0)
    .sort((a, b) => b.usdValue - a.usdValue);

  // Get transaction icon based on type
  const getTransactionIcon = (type) => {
    const icons = {
      deposit: "↓",
      receive: "↓",
      send: "→",
      withdraw: "↑",
      trade: "◈",
      close: "✓",
    };
    return icons[type] || "•";
  };

  // Get transaction type color
  const getTransactionColor = (type) => {
    if (type === "deposit" || type === "receive") return C.green;
    if (type === "send" || type === "withdraw" || type === "trade") return C.red;
    return C.primary;
  };

  // Format transaction amount
  const getTransactionSign = (type) => {
    if (type === "send" || type === "withdraw" || type === "trade") return "-";
    return "+";
  };

  // Get last 20 transactions
  const displayTransactions = transactions ? transactions.slice(0, 20) : [];

  return (
    <div
      className="wallet-container"
      style={{
        minHeight: "100vh",
        backgroundColor: "#020817",
        color: C.text,
        paddingTop: "20px",
        paddingBottom: "32px",
        paddingLeft: "16px",
        paddingRight: "16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* Header with Back Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          marginBottom: "28px",
          gap: "12px",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: C.primary,
            fontSize: "20px",
            cursor: "pointer",
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => (e.target.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.target.style.opacity = "1")}
        >
          ←
        </button>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "700",
            margin: "0",
            letterSpacing: "-0.5px",
            flex: 1,
          }}
        >
          Portefeuille
        </h1>
        <button
          onClick={() => onNav("settings")}
          style={{
            background: "rgba(107,165,255,0.12)",
            border: "1px solid rgba(107,165,255,0.2)",
            color: C.primary,
            fontSize: "20px",
            cursor: "pointer",
            padding: 0,
            width: 44,
            height: 44,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 14,
            transition: "all 0.2s ease",
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#6BA5FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>
      </div>

      {/* Total Balance Card - Premium */}
      <div
        className="wallet-card"
        style={{
          background: "linear-gradient(135deg, rgba(38,166,154,0.12) 0%, rgba(107,165,255,0.08) 100%)",
          border: "1px solid rgba(38,166,154,0.25)",
          borderRadius: "24px",
          padding: "32px",
          marginBottom: "32px",
          backdropFilter: "blur(16px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.1)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gradient accent background */}
        <div
          style={{
            position: "absolute",
            top: "-40%",
            right: "-40%",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(38,166,154,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div
            style={{
              fontSize: "12px",
              color: "#8899AA",
              textTransform: "uppercase",
              letterSpacing: "1px",
              marginBottom: "12px",
              fontWeight: "600",
            }}
          >
            Solde Total
          </div>

          <div
            style={{
              fontSize: "48px",
              fontWeight: "800",
              color: "#E8ECF1",
              marginBottom: "20px",
              letterSpacing: "-1px",
              lineHeight: "1.1",
            }}
          >
            {fUSD(totalValue)}
          </div>

          {/* Daily Change with better styling */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              fontSize: "15px",
              color: dailyChange >= 0 ? "#26A69A" : "#EF5350",
              fontWeight: "600",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "24px",
                height: "24px",
                borderRadius: "50%",
                background: dailyChange >= 0 ? "rgba(38,166,154,0.15)" : "rgba(239,83,80,0.15)",
              }}
            >
              {dailyChange >= 0 ? "↑" : "↓"}
            </span>
            <span>{Math.abs(dailyChange).toFixed(2)}%</span>
            <span style={{ color: "#8899AA", fontSize: "13px", fontWeight: "500" }}>aujourd'hui</span>
          </div>

          {/* Micro chart - visual indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "3px",
              marginTop: "20px",
              height: "28px",
            }}
          >
            {[0.5, 0.35, 0.65, 0.45, 0.75, 0.55, 0.85].map((h, i) => (
              <div
                key={i}
                style={{
                  width: "3px",
                  height: `${h * 100}%`,
                  backgroundColor: "#26A69A",
                  borderRadius: "1.5px",
                  opacity: 0.4 + h * 0.4,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons Row - Premium Style */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: "14px",
          marginBottom: "36px",
        }}
      >
        {/* Déposer Button */}
        <button
          onClick={() => onNav("deposit")}
          style={{
            background: "linear-gradient(135deg, #26A69A 0%, #1f8578 100%)",
            border: "none",
            borderRadius: "18px",
            padding: "18px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            color: "white",
            fontWeight: "700",
            fontSize: "12px",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: "0 8px 24px rgba(38,166,154,0.3)",
            letterSpacing: "0.3px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(38,166,154,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(38,166,154,0.3)";
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "700",
              backdropFilter: "blur(8px)",
            }}
          >
            ↓
          </div>
          <span>Déposer</span>
        </button>

        {/* Envoyer Button */}
        <button
          onClick={() => onNav("send")}
          style={{
            background: "linear-gradient(135deg, #6BA5FF 0%, #4a8ae8 100%)",
            border: "none",
            borderRadius: "18px",
            padding: "18px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            color: "white",
            fontWeight: "700",
            fontSize: "12px",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: "0 8px 24px rgba(107,165,255,0.3)",
            letterSpacing: "0.3px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(107,165,255,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(107,165,255,0.3)";
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "700",
              backdropFilter: "blur(8px)",
            }}
          >
            ↗
          </div>
          <span>Envoyer</span>
        </button>

        {/* Retirer Button */}
        <button
          onClick={() => onNav("collect")}
          style={{
            background: "linear-gradient(135deg, #FF9500 0%, #E67E22 100%)",
            border: "none",
            borderRadius: "18px",
            padding: "18px 12px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
            color: "white",
            fontWeight: "700",
            fontSize: "12px",
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: "0 8px 24px rgba(255,149,0,0.3)",
            letterSpacing: "0.3px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-4px)";
            e.currentTarget.style.boxShadow = "0 12px 36px rgba(255,149,0,0.4)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 8px 24px rgba(255,149,0,0.3)";
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "22px",
              fontWeight: "700",
              backdropFilter: "blur(8px)",
            }}
          >
            ↑
          </div>
          <span>Retirer</span>
        </button>
      </div>

      {/* Settings / Card Management Button */}
      <button
        onClick={() => onNav("settings")}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "16px 18px",
          marginBottom: 28,
          background: "linear-gradient(135deg, rgba(107,165,255,0.08) 0%, rgba(107,165,255,0.04) 100%)",
          border: "1px solid rgba(107,165,255,0.15)",
          borderRadius: 16,
          cursor: "pointer",
          color: "#E8ECF1",
          transition: "all 0.2s ease",
        }}
      >
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          background: "linear-gradient(135deg, rgba(107,165,255,0.2), rgba(107,165,255,0.1))",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#6BA5FF" strokeWidth="1.5">
            <rect x="1" y="4" width="22" height="16" rx="3" />
            <line x1="1" y1="10" x2="23" y2="10" />
            <circle cx="6" cy="15" r="1.5" fill="#6BA5FF" />
          </svg>
        </div>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.2px" }}>
            💳 Carte bancaire & Paramètres
          </div>
          <div style={{ fontSize: 12, color: "#8899AA", marginTop: 3 }}>
            Gérer votre carte par défaut, paiement en 1 clic
          </div>
        </div>
        <div style={{ color: "#6BA5FF", fontSize: 18, flexShrink: 0 }}>›</div>
      </button>

      {/* Mes Actifs Section */}
      <div style={{ marginBottom: "36px" }}>
        <h2
          style={{
            fontSize: "16px",
            fontWeight: "700",
            color: "#E8ECF1",
            marginBottom: "18px",
            letterSpacing: "-0.3px",
            textTransform: "uppercase",
            fontSize: "13px",
            color: "#8899AA",
            fontWeight: "600",
            letterSpacing: "0.5px",
          }}
        >
          Mes Actifs
        </h2>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {assetsList.length > 0 ? (
            assetsList.map((asset) => {
              const config = CURRENCY_CONFIG[asset.currency];
              const change = Math.random() * 6 - 3;
              return (
                <div
                  key={asset.currency}
                  className="wallet-card"
                  style={{
                    background: "rgba(12,28,56,0.4)",
                    border: "1px solid rgba(38,166,154,0.12)",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backdropFilter: "blur(10px)",
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(12,28,56,0.6)";
                    e.currentTarget.style.borderColor = "rgba(38,166,154,0.25)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(38,166,154,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(12,28,56,0.4)";
                    e.currentTarget.style.borderColor = "rgba(38,166,154,0.12)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Currency Icon and Name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
                    <CurrencyIcon currency={asset.currency} size={44} />
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#E8ECF1" }}>
                        {config.name}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#8899AA",
                          marginTop: "3px",
                        }}
                      >
                        {asset.balance.toFixed(asset.balance < 1 ? 4 : 2)} {config.symbol}
                      </div>
                    </div>
                  </div>

                  {/* Amount and Change */}
                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: "#E8ECF1",
                      }}
                    >
                      {fUSD(asset.usdValue)}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: change >= 0 ? "#26A69A" : "#EF5350",
                        fontWeight: "600",
                        marginTop: "2px",
                      }}
                    >
                      {change >= 0 ? "+" : ""}{change.toFixed(2)}%
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#8899AA",
                padding: "32px 16px",
                fontSize: "14px",
              }}
            >
              Aucun actif
            </div>
          )}
        </div>
      </div>

      {/* Transactions History Section */}
      <div style={{ marginBottom: "24px" }}>
        <h2
          style={{
            fontSize: "13px",
            fontWeight: "600",
            color: "#8899AA",
            marginBottom: "18px",
            letterSpacing: "0.5px",
            textTransform: "uppercase",
          }}
        >
          Dernières Transactions
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {displayTransactions.length > 0 ? (
            displayTransactions.map((tx) => {
              const iconChar = getTransactionIcon(tx.type);
              const color = getTransactionColor(tx.type);
              const sign = getTransactionSign(tx.type);
              return (
                <div
                  key={tx.id}
                  className="wallet-card"
                  style={{
                    background: "rgba(12,28,56,0.4)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: "16px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    backdropFilter: "blur(10px)",
                    transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(12,28,56,0.6)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(12,28,56,0.4)";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Icon and Description */}
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        background: `rgba(${hexToRgb(color)},0.12)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        fontWeight: "700",
                        color: color,
                      }}
                    >
                      {iconChar}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: "14px", fontWeight: "600", color: "#E8ECF1" }}>
                        {tx.desc || formatTransactionType(tx.type)}
                      </div>
                      <div style={{ fontSize: "12px", color: "#8899AA", marginTop: "3px" }}>
                        {formatTransactionDate(tx.date)}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ textAlign: "right", minWidth: "100px" }}>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: "700",
                        color: color,
                      }}
                    >
                      {sign}
                      {fUSD(tx.amount)} {tx.currency}
                    </div>
                    {tx.status && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#8899AA",
                          marginTop: "3px",
                          textTransform: "capitalize",
                          fontWeight: "500",
                        }}
                      >
                        {tx.status}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{
                textAlign: "center",
                color: "#8899AA",
                padding: "48px 24px",
                fontSize: "14px",
              }}
            >
              Aucune transaction
            </div>
          )}
        </div>
      </div>

      {/* Security Badge */}
      <div
        style={{
          textAlign: "center",
          paddingBottom: "16px",
          marginTop: "32px",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px 16px",
            background: "rgba(38,166,154,0.1)",
            border: "1px solid rgba(38,166,154,0.2)",
            borderRadius: "20px",
            fontSize: "12px",
            color: "#26A69A",
            fontWeight: "600",
            letterSpacing: "0.3px",
          }}
        >
          <span>🔒</span>
          <span>Fonds sécurisés</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert hex to RGB
function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return "107, 165, 255";
  return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)].join(",");
}

// Helper function to format transaction type
function formatTransactionType(type) {
  const labels = {
    deposit: "Dépôt",
    receive: "Réception",
    send: "Envoi",
    withdraw: "Retrait",
    trade: "Échange",
    close: "Fermeture",
  };
  return labels[type] || type;
}

// Helper function to format transaction date
function formatTransactionDate(date) {
  return new Date(date).toLocaleDateString("fr-FR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export { WalletPage };
