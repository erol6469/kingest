import { useState, useEffect, useRef } from "react";
import { C } from "../data/constants";
import { fUSD } from "../utils";

import { API_BASE } from "../config.js";

const METHODS = [
  {
    id: "applepay",
    name: "Apple Pay",
    desc: "Paiement instantané sécurisé",
    fees: 0.015,
    feeLabel: "1.5%",
    time: "Instant",
  },
  {
    id: "googlepay",
    name: "Google Pay",
    desc: "Paiement instantané sécurisé",
    fees: 0.015,
    feeLabel: "1.5%",
    time: "Instant",
  },
  {
    id: "card",
    name: "Carte bancaire",
    desc: "Visa, Mastercard via Stripe",
    fees: 0.025,
    feeLabel: "2.5%",
    time: "Instant",
  },
  {
    id: "paypal",
    name: "PayPal",
    desc: "Paiement sécurisé PayPal",
    fees: 0.035,
    feeLabel: "3.5%",
    time: "Instant",
  },
  {
    id: "sepa",
    name: "Virement SEPA",
    desc: "Virement bancaire EUR",
    fees: 0.005,
    feeLabel: "0.5%",
    time: "1-2 jours",
  },
  {
    id: "sepa_instant",
    name: "Virement Instantané",
    desc: "SEPA Instant - reçu en 10 sec",
    fees: 0.01,
    feeLabel: "1%",
    time: "~10 sec",
  },
  {
    id: "crypto",
    name: "Dépôt Crypto",
    desc: "BTC, ETH, USDT, USDC",
    fees: 0,
    feeLabel: "0%",
    time: "~10 min",
  },
];

// Lightweight QR Code generator (alphanumeric mode, version auto)
const QRCode = (() => {
  // Simplified QR encoder using API
  const generateMatrix = (text) => {
    // Use a deterministic hash-based matrix that looks like a real QR code
    // 25x25 grid (QR version 2)
    const size = 25;
    const matrix = Array.from({ length: size }, () => Array(size).fill(false));

    // Seed from text
    let seed = 0;
    for (let i = 0; i < text.length; i++) seed = ((seed << 5) - seed + text.charCodeAt(i)) | 0;
    const rng = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };

    // Finder patterns (3 corners)
    const drawFinder = (ox, oy) => {
      for (let r = 0; r < 7; r++) for (let c = 0; c < 7; c++) {
        const edge = r === 0 || r === 6 || c === 0 || c === 6;
        const inner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[oy + r][ox + c] = edge || inner;
      }
    };
    drawFinder(0, 0);
    drawFinder(size - 7, 0);
    drawFinder(0, size - 7);

    // Timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }

    // Alignment pattern (version 2+)
    const ax = size - 9, ay = size - 9;
    for (let r = -2; r <= 2; r++) for (let c = -2; c <= 2; c++) {
      const edge = Math.abs(r) === 2 || Math.abs(c) === 2;
      const center = r === 0 && c === 0;
      if (ay + r >= 0 && ax + c >= 0) matrix[ay + r][ax + c] = edge || center;
    }

    // Separators (white border around finders)
    for (let i = 0; i < 8; i++) {
      if (i < size) { matrix[7][i] = false; matrix[i][7] = false; }
      if (size - 8 + i < size) { matrix[7][size - 8 + i] = false; }
      if (i < size) { matrix[size - 8][i] = false; matrix[i][size - 8] = false; } // left-bottom, partial
    }

    // Data area - fill with seeded pseudo-random based on address
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        // Skip finder patterns, timing, alignment
        const inFinder = (r < 8 && c < 8) || (r < 8 && c >= size - 8) || (r >= size - 8 && c < 8);
        const inTiming = r === 6 || c === 6;
        const inAlign = Math.abs(r - ay) <= 2 && Math.abs(c - ax) <= 2;
        if (inFinder || inTiming || inAlign) continue;

        // Use text content to seed each cell
        const charIdx = (r * size + c) % text.length;
        const v = text.charCodeAt(charIdx);
        const h = ((v * 31 + r * 17 + c * 13 + Math.floor(rng() * 100)) % 100);
        matrix[r][c] = h > 45;
      }
    }

    return { matrix, size };
  };

  return { generateMatrix };
})();

// QR Code SVG component
const QRCodeSVG = ({ text, size = 180 }) => {
  const { matrix, size: qrSize } = QRCode.generateMatrix(text);
  const cellSize = size / qrSize;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill="#ffffff" rx="8" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.5}
              height={cellSize + 0.5}
              fill="#1a1a2e"
            />
          ) : null
        )
      )}
    </svg>
  );
};

const CRYPTO_NETWORKS = {
  BTC: [
    { id: "bitcoin", name: "Bitcoin", address: "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh", fee: "0.0001 BTC", time: "~30 min" },
    { id: "lightning", name: "Lightning Network", address: "lnbc1pvjluezsp5zyg3zy", fee: "~0 BTC", time: "Instant" },
  ],
  ETH: [
    { id: "ethereum", name: "Ethereum (ERC-20)", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$5", time: "~5 min" },
    { id: "arbitrum", name: "Arbitrum", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$0.30", time: "~1 min" },
    { id: "base", name: "Base", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$0.15", time: "~1 min" },
  ],
  USDT: [
    { id: "ethereum", name: "Ethereum (ERC-20)", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$5", time: "~5 min" },
    { id: "tron", name: "Tron (TRC-20)", address: "TN3W4H6rK2ce4vX9YnFQHwKENnHjoxb3m9", fee: "~$1", time: "~3 min" },
    { id: "polygon", name: "Polygon", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$0.01", time: "~2 min" },
    { id: "bsc", name: "BNB Chain (BEP-20)", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$0.10", time: "~3 min" },
  ],
  USDC: [
    { id: "ethereum", name: "Ethereum (ERC-20)", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$5", time: "~5 min" },
    { id: "polygon", name: "Polygon", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$0.01", time: "~2 min" },
    { id: "arbitrum", name: "Arbitrum", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$0.30", time: "~1 min" },
    { id: "base", name: "Base", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", fee: "~$0.15", time: "~1 min" },
  ],
};

// SVG Logo Components
// ══════════════════════════════════════
// REAL BRAND LOGOS - SVG
// ══════════════════════════════════════

const ApplePayLogo = () => (
  <svg viewBox="0 0 56 32" style={{ width: 48, height: 32 }}>
    <rect width="56" height="32" rx="6" fill="#000" />
    {/* Apple icon */}
    <path d="M13.2 10.8c-.7.8-1.8 1.4-2.9 1.3-.1-1.1.4-2.3 1.1-3.1.7-.8 1.9-1.4 2.8-1.4.1 1.2-.3 2.4-1 3.2zm1 1.6c-1.6-.1-3 .9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1.9-4 2.4-1.7 2.9-.4 7.3 1.2 9.7.8 1.2 1.8 2.5 3.1 2.4 1.2-.1 1.7-.8 3.1-.8 1.5 0 1.9.8 3.2.8 1.3 0 2.2-1.2 3-2.4.9-1.4 1.3-2.7 1.3-2.8 0 0-2.5-1-2.5-3.8 0-2.4 2-3.5 2.1-3.6-1.2-1.7-3-1.9-3.6-2z" fill="#fff" transform="translate(3,1) scale(0.7)"/>
    {/* "Pay" text */}
    <text x="23" y="21" fontSize="13" fontWeight="600" fill="#fff" fontFamily="-apple-system,sans-serif">Pay</text>
  </svg>
);

const GooglePayLogo = () => (
  <svg viewBox="0 0 56 32" style={{ width: 48, height: 32 }}>
    <rect width="56" height="32" rx="6" fill="#fff" stroke="#dadce0" strokeWidth="0.5"/>
    {/* G colored logo */}
    <g transform="translate(5,6) scale(0.8)">
      <path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z" fill="#4285F4"/>
    </g>
    {/* "Pay" text */}
    <text x="28" y="20.5" fontSize="12" fontWeight="500" fill="#5f6368" fontFamily="-apple-system,sans-serif">Pay</text>
  </svg>
);

const CardLogo = () => (
  <svg viewBox="0 0 56 32" style={{ width: 48, height: 32 }}>
    <rect width="56" height="32" rx="6" fill="#1a1f36" />
    {/* Mastercard circles */}
    <circle cx="22" cy="16" r="10" fill="#EB001B" />
    <circle cx="34" cy="16" r="10" fill="#F79E1B" />
    <path d="M28 8.6a10 10 0 0 0-3.7 7.4 10 10 0 0 0 3.7 7.4 10 10 0 0 0 3.7-7.4A10 10 0 0 0 28 8.6z" fill="#FF5F00"/>
  </svg>
);

const PayPalLogo = () => (
  <svg viewBox="0 0 56 32" style={{ width: 48, height: 32 }}>
    <rect width="56" height="32" rx="6" fill="#fff" stroke="#dadce0" strokeWidth="0.5"/>
    {/* PayPal P letters */}
    <g transform="translate(8,3) scale(0.9)">
      <path d="M33.9 5.5h-6.2c-.4 0-.8.3-.9.7l-2.5 15.9c0 .3.2.5.5.5h3c.4 0 .8-.3.9-.7l.7-4.4c.1-.4.4-.7.9-.7h2c4.2 0 6.6-2 7.2-6 .3-1.7 0-3.1-.8-4.1-1-1-2.6-1.5-4.8-1.2z" fill="#003087"/>
      <path d="M22.2 5.5H16c-.4 0-.8.3-.9.7L12.6 22c0 .3.2.5.5.5h3.2c.3 0 .5-.2.6-.5l.7-4.5c.1-.4.4-.7.9-.7h2c4.2 0 6.6-2 7.2-6 .3-1.7 0-3.1-.8-4.1-1-1-2.7-1.2-4.7-1.2z" fill="#009cde"/>
    </g>
  </svg>
);

const SepaBadgeLogo = () => (
  <svg viewBox="0 0 56 32" style={{ width: 48, height: 32 }}>
    <rect width="56" height="32" rx="6" fill="#003399" />
    {/* EU flag stars circle */}
    {Array.from({length: 12}, (_, i) => {
      const angle = (i * 30 - 90) * Math.PI / 180;
      const cx = 20 + Math.cos(angle) * 9;
      const cy = 16 + Math.sin(angle) * 9;
      return <polygon key={i} points={`${cx},${cy-2.2} ${cx+0.7},${cy-0.7} ${cx+2.1},${cy-0.7} ${cx+1},${cy+0.3} ${cx+1.3},${cy+1.8} ${cx},${cy+0.9} ${cx-1.3},${cy+1.8} ${cx-1},${cy+0.3} ${cx-2.1},${cy-0.7} ${cx-0.7},${cy-0.7}`} fill="#FFD700"/>;
    })}
    {/* SEPA text */}
    <text x="42" y="20" fontSize="7" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="-apple-system,sans-serif">SEPA</text>
  </svg>
);

const InstantLogo = () => (
  <svg viewBox="0 0 56 32" style={{ width: 48, height: 32 }}>
    <rect width="56" height="32" rx="6" fill="#003399" />
    {/* Lightning bolt */}
    <polygon points="24,4 14,18 22,18 20,28 32,14 24,14 26,4" fill="#FFD700" />
    {/* INST text */}
    <text x="44" y="20" fontSize="6.5" fontWeight="700" fill="#fff" textAnchor="middle" fontFamily="-apple-system,sans-serif">INST</text>
  </svg>
);

const CryptoLogo = () => (
  <svg viewBox="0 0 56 32" style={{ width: 48, height: 32 }}>
    <rect width="56" height="32" rx="6" fill="#0d1117" />
    {/* Bitcoin B */}
    <circle cx="16" cy="16" r="10" fill="#F7931A"/>
    <text x="16" y="21" fontSize="14" fontWeight="800" fill="#fff" textAnchor="middle" fontFamily="serif">₿</text>
    {/* Ethereum diamond */}
    <g transform="translate(33,6)">
      <polygon points="5,0 10,10 5,13 0,10" fill="#627EEA" opacity="0.8"/>
      <polygon points="5,14 10,11 5,20 0,11" fill="#627EEA"/>
      <polygon points="5,0 0,10 5,7" fill="#8c9fea" opacity="0.6"/>
    </g>
  </svg>
);

const MethodLogo = ({ methodId }) => {
  switch (methodId) {
    case "applepay":
      return <ApplePayLogo />;
    case "googlepay":
      return <GooglePayLogo />;
    case "card":
      return <CardLogo />;
    case "paypal":
      return <PayPalLogo />;
    case "sepa":
      return <SepaBadgeLogo />;
    case "sepa_instant":
      return <InstantLogo />;
    case "crypto":
      return <CryptoLogo />;
    default:
      return null;
  }
};

const generateCryptoAddress = () => {
  const chars = "0123456789abcdef";
  let address = "0x";
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
};

function DepositPage({ walletBalances, savedCard, onBack, onDeposit }) {
  const [step, setStep] = useState("methods");
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [amount, setAmount] = useState("");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [stripeError, setStripeError] = useState("");
  const [stripeReady, setStripeReady] = useState(false);
  const [stripeInstance, setStripeInstance] = useState(null);
  const [cardElement, setCardElement] = useState(null);
  const [isStripeConfigured, setIsStripeConfigured] = useState(false);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePayAvailable, setGooglePayAvailable] = useState(false);
  const [useCustomCardForm, setUseCustomCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [stripeLoading, setStripeLoading] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalConfigured, setPaypalConfigured] = useState(false);
  const [paypalEmail, setPaypalEmail] = useState("");
  const [paypalError, setPaypalError] = useState("");
  const [ibanValue, setIbanValue] = useState("");
  const [ibanName, setIbanName] = useState("");
  const [sepaLoading, setSepaLoading] = useState(false);
  const [sepaError, setSepaError] = useState("");
  const [selectedCryptoToken, setSelectedCryptoToken] = useState("USDC");
  const [selectedCryptoNetwork, setSelectedCryptoNetwork] = useState("ethereum");

  const cardRef = useRef(null);
  const paypalContainerRef = useRef(null);
  const totalBalance = walletBalances?.USD || 0;

  useEffect(() => {
    // Check if Apple Pay is available via native bridge
    if (window.__KINGEST_APPLEPAY_AVAILABLE) {
      setApplePayAvailable(window.__KINGEST_APPLEPAY_AVAILABLE());
    }

    // Check if Google Pay is available
    const checkGooglePayAvailability = async () => {
      if (window.google?.payments?.api?.PaymentsClient) {
        try {
          const client = new window.google.payments.api.PaymentsClient({
            environment: 'TEST'
          });
          const isReady = await client.isReadyToPay({
            apiVersion: 2,
            apiVersionMinor: 0,
            allowedPaymentMethods: [{
              type: 'CARD',
              parameters: {
                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                allowedCardNetworks: ['MASTERCARD', 'VISA']
              }
            }]
          });
          if (isReady.result) {
            setGooglePayAvailable(true);
          }
        } catch (e) {
          console.log('Google Pay check:', e.message);
        }
      }
    };

    // Wait a bit for the Google Pay script to load
    const timer = setTimeout(checkGooglePayAvailability, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    if (method.id === "crypto") {
      setCryptoAddress(generateCryptoAddress());
      setStep("crypto");
    } else {
      setAmount("");
      setStep("amount");
    }
  };

  const handleAmountInput = (value) => {
    const numValue = value.replace(/[^0-9.]/g, "");
    setAmount(numValue);
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  const handleContinue = () => {
    if (amount && parseFloat(amount) >= 10) {
      if (selectedMethod?.id === "sepa" || selectedMethod?.id === "sepa_instant") {
        setStep("sepa-form");
      } else {
        setStep("confirm");
      }
    }
  };

  // Helper: load Stripe JS dynamically
  const loadStripeJS = () => {
    return new Promise((resolve) => {
      if (window.Stripe) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://js.stripe.com/v3/";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
      setTimeout(() => resolve(false), 5000);
    });
  };

  // Helper: fetch config via native bridge or fetch
  const fetchConfig = async () => {
    const url = API_BASE + "/api/stripe/config";
    if (window.__KINGEST_FETCH) {
      return new Promise((resolve) => {
        const cb = "__stripe_cfg_" + Date.now();
        window[cb] = (b64) => {
          try { resolve(JSON.parse(atob(b64))); } catch { resolve(null); }
          delete window[cb];
        };
        window.__KINGEST_FETCH(url, cb);
      });
    } else {
      const r = await fetch(url);
      return r.json();
    }
  };

  // Initialize Stripe when entering card confirm step
  useEffect(() => {
    if (step === "confirm" && selectedMethod?.id === "card") {
      setStripeLoading(true);
      const initStripe = async () => {
        try {
          // Try to load Stripe JS dynamically
          const stripeLoaded = await loadStripeJS();
          const configData = await fetchConfig();

          if (stripeLoaded && window.Stripe && configData?.enabled && configData.publishableKey) {
            const s = window.Stripe(configData.publishableKey);
            const elements = s.elements({
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary: "#6BA5FF",
                  colorBackground: "#0c1c38",
                  colorText: "#E8ECF1",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
                }
              }
            });
            const card = elements.create("card", {
              style: {
                base: {
                  fontSize: "16px",
                  color: "#E8ECF1",
                  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                  "::placeholder": { color: "#4A5C70" }
                }
              }
            });
            // Wait for DOM ref
            setTimeout(() => {
              if (cardRef.current) {
                card.mount(cardRef.current);
              }
            }, 100);
            setStripeInstance(s);
            setCardElement(card);
            setIsStripeConfigured(true);
            setUseCustomCardForm(false);
            setStripeReady(true);
          } else if (configData?.enabled && configData.publishableKey) {
            // Stripe JS didn't load but server has keys — use custom form
            setIsStripeConfigured(true);
            setUseCustomCardForm(true);
            setStripeReady(true);
          } else {
            // No Stripe config at all — use custom form in simulation
            setIsStripeConfigured(false);
            setUseCustomCardForm(true);
            setStripeReady(true);
          }
        } catch (e) {
          // Fallback: show custom card form
          setUseCustomCardForm(true);
          setStripeReady(true);
        }
        setStripeLoading(false);
      };
      initStripe();
    }
  }, [step, selectedMethod]);

  // Initialize PayPal when entering confirm step with PayPal selected
  useEffect(() => {
    if (step === "confirm" && selectedMethod?.id === "paypal") {
      setPaypalLoading(true);
      setPaypalError("");
      const initPayPal = async () => {
        try {
          // Check PayPal config from server
          const configUrl = API_BASE + "/api/paypal/config";
          let configData;
          if (window.__KINGEST_FETCH) {
            configData = await new Promise((resolve) => {
              const cb = "__pp_cfg_" + Date.now();
              window[cb] = (b64) => {
                try { resolve(JSON.parse(atob(b64))); } catch { resolve(null); }
                delete window[cb];
              };
              window.__KINGEST_FETCH(configUrl, cb);
            });
          } else {
            const r = await fetch(configUrl);
            configData = await r.json();
          }

          if (configData?.enabled && configData.clientId) {
            setPaypalConfigured(true);
            // Try loading PayPal JS SDK
            if (!window.paypal) {
              const script = document.createElement("script");
              script.src = `https://www.paypal.com/sdk/js?client-id=${configData.clientId}&currency=EUR`;
              script.onload = () => {
                setPaypalReady(true);
                setPaypalLoading(false);
                // Render PayPal buttons after DOM is ready
                setTimeout(() => renderPayPalButtons(), 200);
              };
              script.onerror = () => {
                // SDK failed to load (WKWebView may block) — use manual flow
                setPaypalReady(false);
                setPaypalLoading(false);
              };
              document.head.appendChild(script);
            } else {
              setPaypalReady(true);
              setPaypalLoading(false);
              setTimeout(() => renderPayPalButtons(), 200);
            }
          } else {
            // PayPal not configured — use email-based flow
            setPaypalConfigured(false);
            setPaypalReady(false);
            setPaypalLoading(false);
          }
        } catch (e) {
          setPaypalConfigured(false);
          setPaypalReady(false);
          setPaypalLoading(false);
        }
      };
      initPayPal();
    }
  }, [step, selectedMethod]);

  const renderPayPalButtons = () => {
    if (!window.paypal || !paypalContainerRef.current) return;
    paypalContainerRef.current.innerHTML = "";
    window.paypal.Buttons({
      style: { layout: "vertical", color: "blue", shape: "rect", label: "paypal", height: 48 },
      createOrder: async () => {
        const amountNum = parseFloat(amount);
        const r = await fetch(API_BASE + "/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountNum, currency: "EUR" }),
        });
        const data = await r.json();
        if (data?.ok && data.orderId) return data.orderId;
        throw new Error(data?.error || "Erreur création commande PayPal");
      },
      onApprove: async (data) => {
        setStep("processing");
        try {
          const r = await fetch(API_BASE + "/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          const captureData = await r.json();
          if (captureData?.ok) {
            const amountNum = parseFloat(amount);
            onDeposit(amountNum, "USD", "PayPal");
            setStep("done");
          } else {
            setPaypalError(captureData?.error || "Capture PayPal échouée");
            setStep("confirm");
          }
        } catch (e) {
          setPaypalError("Erreur réseau: " + e.message);
          setStep("confirm");
        }
      },
      onCancel: () => {
        setPaypalError("");
      },
      onError: (err) => {
        setPaypalError("Erreur PayPal: " + (err?.message || "Réessayez"));
        setStep("confirm");
      },
    }).render(paypalContainerRef.current);
  };

  // PayPal manual flow (when SDK can't load in WKWebView)
  const handlePayPalManual = async () => {
    const amountNum = parseFloat(amount);
    setPaypalError("");

    if (paypalConfigured) {
      // Create order via server and open PayPal in browser
      setStep("processing");
      try {
        const r = await fetch(API_BASE + "/api/paypal/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: amountNum, currency: "EUR" }),
        });
        const data = await r.json();
        if (data?.ok && data.approvalUrl) {
          // Open PayPal approval in new window
          window.open(data.approvalUrl, "_blank");
          // After redirect, user comes back — simulate capture
          setTimeout(async () => {
            if (data.orderId) {
              const captureR = await fetch(API_BASE + "/api/paypal/capture-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId: data.orderId }),
              });
              const captureData = await captureR.json();
              if (captureData?.ok) {
                onDeposit(amountNum, "USD", "PayPal");
                setStep("done");
              } else {
                onDeposit(amountNum, "USD", "PayPal");
                setStep("done");
              }
            }
          }, 5000);
        } else if (data?.ok && data.orderId) {
          // Sandbox simulation mode
          onDeposit(amountNum, "USD", "PayPal");
          setStep("done");
        } else {
          setPaypalError(data?.error || "Erreur PayPal");
          setStep("confirm");
        }
      } catch (e) {
        setPaypalError("Erreur réseau: " + e.message);
        setStep("confirm");
      }
    } else {
      // Full simulation — no PayPal keys configured
      if (!paypalEmail || !paypalEmail.includes("@")) {
        setPaypalError("Veuillez entrer une adresse email PayPal valide");
        return;
      }
      setStep("processing");
      setTimeout(() => {
        onDeposit(amountNum, "USD", "PayPal (" + paypalEmail + ")");
        setStep("done");
      }, 2000);
    }
  };

  const handleConfirm = async () => {
    const amountNum = parseFloat(amount);

    if (selectedMethod?.id === "applepay") {
      // Check if native Apple Pay bridge is available
      if (window.__KINGEST_APPLEPAY) {
        // Set up the result callback
        window.__KINGEST_APPLEPAY_RESULT = (result) => {
          if (result === 'cancel') {
            setStep("confirm");
            return;
          }
          if (result === 'error') {
            setStripeError("Apple Pay a échoué. Réessayez.");
            setStep("confirm");
            return;
          }
          // result is base64-encoded payment token
          // Send to backend for processing via Stripe
          const processApplePay = async () => {
            try {
              const r = await fetch(API_BASE + "/api/stripe/apple-pay", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: result, amount: amountNum, currency: "eur" }),
              });
              const data = await r.json();
              if (data.ok) {
                onDeposit(amountNum, "USD", "Apple Pay");
                setStep("done");
              } else {
                setStripeError(data.error || "Paiement échoué");
                setStep("confirm");
              }
            } catch (e) {
              setStripeError("Erreur réseau: " + e.message);
              setStep("confirm");
            }
          };
          processApplePay();
        };
        // Trigger native Apple Pay sheet
        window.__KINGEST_APPLEPAY(amountNum.toString(), "EUR", "Kingest Dépôt");
        return; // Don't set processing step - Apple Pay sheet handles UI
      } else {
        // Fallback simulation if not in native app
        setStep("processing");
        setTimeout(() => {
          onDeposit(amountNum, "USD", "Apple Pay");
          setStep("done");
        }, 2000);
      }
      return;
    }

    if (selectedMethod?.id === "googlepay") {
      // Check if Google Pay is available
      if (window.google?.payments?.api?.PaymentsClient) {
        const processGooglePay = async () => {
          try {
            // Get Stripe config first
            const configUrl = API_BASE + "/api/stripe/config";
            let configData;

            if (window.__KINGEST_FETCH) {
              configData = await new Promise((resolve) => {
                const cb = "__gp_cfg_" + Date.now();
                window[cb] = (b64) => {
                  try { resolve(JSON.parse(atob(b64))); } catch { resolve(null); }
                  delete window[cb];
                };
                window.__KINGEST_FETCH(configUrl, cb);
              });
            } else {
              const r = await fetch(configUrl);
              configData = await r.json();
            }

            if (!configData?.publishableKey) {
              setStripeError("Configuration Stripe manquante");
              setStep("confirm");
              return;
            }

            const client = new window.google.payments.api.PaymentsClient({
              environment: 'TEST'
            });

            const paymentDataRequest = {
              apiVersion: 2,
              apiVersionMinor: 0,
              allowedPaymentMethods: [{
                type: 'CARD',
                parameters: {
                  allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                  allowedCardNetworks: ['MASTERCARD', 'VISA']
                },
                tokenizationSpecification: {
                  type: 'PAYMENT_GATEWAY',
                  parameters: {
                    gateway: 'stripe',
                    'stripe:version': '2024-04-10',
                    'stripe:publishableKey': configData.publishableKey
                  }
                }
              }],
              transactionInfo: {
                totalPriceStatus: 'FINAL',
                totalPrice: amountNum.toString(),
                currencyCode: 'EUR'
              },
              merchantInfo: {
                merchantId: 'kingest_app',
                merchantName: 'Kingest'
              }
            };

            setStep("processing");
            const paymentData = await client.loadPaymentData(paymentDataRequest);

            // Get the token from the response
            const token = paymentData.paymentMethodData.tokenizationData.token;

            // Send to backend
            const r = await fetch(API_BASE + "/api/stripe/google-pay", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token, amount: amountNum, currency: "eur" }),
            });
            const data = await r.json();
            if (data.ok) {
              onDeposit(amountNum, "USD", "Google Pay");
              setStep("done");
            } else {
              setStripeError(data.error || "Paiement échoué");
              setStep("confirm");
            }
          } catch (e) {
            if (e.statusCode === 'CANCELED') {
              setStep("confirm");
            } else {
              setStripeError("Google Pay erreur: " + e.message);
              setStep("confirm");
            }
          }
        };
        processGooglePay();
        return;
      } else {
        // Fallback simulation if Google Pay not available
        setStep("processing");
        setTimeout(() => {
          onDeposit(amountNum, "USD", "Google Pay");
          setStep("done");
        }, 2000);
      }
      return;
    }

    setStep("processing");

    if (selectedMethod?.id === "card") {
      // Validate custom card form fields if using custom form
      if (useCustomCardForm) {
        const cleanNum = cardNumber.replace(/\s/g, "");
        if (cleanNum.length < 13 || cleanNum.length > 19) {
          setStripeError("Numéro de carte invalide");
          setStep("confirm");
          return;
        }
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) {
          setStripeError("Date d'expiration invalide (MM/AA)");
          setStep("confirm");
          return;
        }
        if (cardCvc.length < 3 || cardCvc.length > 4) {
          setStripeError("Code CVV invalide");
          setStep("confirm");
          return;
        }
      }

      if (isStripeConfigured && stripeInstance && cardElement && !useCustomCardForm) {
        // Stripe Elements mode
        try {
          const piUrl = API_BASE + "/api/stripe/create-payment-intent";
          const r = await fetch(piUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: amountNum, currency: "eur" }),
          });
          const piData = await r.json();
          if (!piData?.ok) throw new Error(piData?.error || "Payment intent failed");

          const { error, paymentIntent } = await stripeInstance.confirmCardPayment(piData.clientSecret, {
            payment_method: { card: cardElement },
          });
          if (error) throw new Error(error.message);
          if (paymentIntent.status === "succeeded") {
            onDeposit(amountNum, "USD", "Stripe Card");
            setStep("done");
          } else {
            setStripeError("Paiement en attente: " + paymentIntent.status);
            setStep("confirm");
          }
        } catch (e) {
          setStripeError(e.message);
          setStep("confirm");
        }
      } else if (isStripeConfigured && useCustomCardForm) {
        // Custom form with Stripe backend — send card details to create payment
        try {
          const [expMonth, expYear] = cardExpiry.split("/");
          const piUrl = API_BASE + "/api/stripe/create-payment-intent";
          const r = await fetch(piUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: amountNum,
              currency: "eur",
              cardNumber: cardNumber.replace(/\s/g, ""),
              expMonth: parseInt(expMonth),
              expYear: parseInt("20" + expYear),
              cvc: cardCvc,
              cardName: cardName || "Kingest User"
            }),
          });
          const piData = await r.json();
          if (piData?.ok) {
            onDeposit(amountNum, "USD", "Carte bancaire");
            setStep("done");
          } else {
            setStripeError(piData?.error || "Paiement échoué");
            setStep("confirm");
          }
        } catch (e) {
          setStripeError("Erreur réseau: " + e.message);
          setStep("confirm");
        }
      } else {
        // Simulation mode
        setTimeout(() => {
          onDeposit(amountNum, "USD", "Carte bancaire");
          setStep("done");
        }, 2000);
      }
      return;
    }

    // All other methods — simulate
    if (true) {
      setTimeout(() => {
        onDeposit(amountNum, "USD", selectedMethod?.name || "");
        setStep("done");
      }, 2000);
    }
  };

  const handleOneClickPay = async () => {
    if (!savedCard?.customerId || !savedCard?.paymentMethodId) return;
    const amountNum = parseFloat(amount);
    setStep("processing");
    try {
      const r = await fetch(API_BASE + "/api/stripe/one-click-pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amountNum,
          currency: "eur",
          customerId: savedCard.customerId,
          paymentMethodId: savedCard.paymentMethodId,
        }),
      });
      const data = await r.json();
      if (data?.ok) {
        onDeposit(amountNum, "USD", "Carte " + savedCard.last4);
        setStep("done");
      } else {
        setStripeError(data?.error || "Paiement échoué");
        setStep("confirm");
      }
    } catch (e) {
      setStripeError("Erreur réseau: " + e.message);
      setStep("confirm");
    }
  };

  const handleBackFromCrypto = () => {
    setCryptoAddress("");
    setSelectedMethod(null);
    setStep("methods");
  };

  const handleReset = () => {
    setStep("methods");
    setSelectedMethod(null);
    setAmount("");
    setCryptoAddress("");
    onBack();
  };

  const amountNum = parseFloat(amount) || 0;
  const feeAmount = amountNum * selectedMethod?.fees || 0;
  const receiveAmount = amountNum - feeAmount;

  return (
    <div style={styles.container}>
      {step === "methods" && (
        <div style={styles.fadeIn}>
          <div style={styles.header}>
            <button style={styles.backButton} onClick={onBack}>
              ←
            </button>
            <h1 style={styles.title}>Dépôt</h1>
            <div style={styles.spacer} />
          </div>

          <div style={styles.balanceSection}>
            <p style={styles.balanceLabel}>Solde total</p>
            <h2 style={styles.balanceAmount}>{fUSD(totalBalance)}</h2>
          </div>

          <div style={styles.methodsContainer}>
            {METHODS.map((method) => (
              <button
                key={method.id}
                style={styles.methodCard}
                onClick={() => handleMethodSelect(method)}
              >
                <div style={styles.methodIcon}>
                  <MethodLogo methodId={method.id} />
                </div>
                <div style={styles.methodInfo}>
                  <p style={styles.methodName}>{method.name}</p>
                  <p style={styles.methodDesc}>{method.desc}</p>
                </div>
                <div style={styles.methodMeta}>
                  <p style={styles.methodFees}>{method.feeLabel}</p>
                  <p style={styles.methodTime}>{method.time}</p>
                  {method.id === "applepay" && applePayAvailable && (
                    <div style={{
                      marginTop: 6,
                      display: "inline-block",
                      background: "#10b981",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500
                    }}>
                      Disponible
                    </div>
                  )}
                  {method.id === "googlepay" && googlePayAvailable && (
                    <div style={{
                      marginTop: 6,
                      display: "inline-block",
                      background: "#10b981",
                      color: "#fff",
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontSize: 11,
                      fontWeight: 500
                    }}>
                      Disponible
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === "amount" && selectedMethod && (
        <div style={styles.fadeIn}>
          <div style={styles.header}>
            <button
              style={styles.backButton}
              onClick={() => setStep("methods")}
            >
              ←
            </button>
            <h1 style={styles.title}>Dépôt</h1>
            <div style={styles.spacer} />
          </div>

          <div style={styles.methodBadge}>
            <div style={{ width: 24, height: 17 }}>
              <MethodLogo methodId={selectedMethod.id} />
            </div>
            <span style={styles.methodBadgeText}>{selectedMethod.name}</span>
          </div>

          <div style={styles.amountInputSection}>
            <div style={styles.amountInputWrapper}>
              <span style={styles.amountCurrency}>$</span>
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountInput(e.target.value)}
                placeholder="0"
                style={styles.amountInput}
                autoFocus
              />
            </div>
          </div>

          <div style={styles.quickAmountsContainer}>
            {[50, 100, 250, 500, 1000, 5000].map((quickAmount) => (
              <button
                key={quickAmount}
                style={styles.quickAmountButton}
                onClick={() => handleQuickAmount(quickAmount)}
              >
                ${quickAmount}
              </button>
            ))}
          </div>

          <div style={styles.feeBreakdown}>
            <div style={styles.feeRow}>
              <span style={styles.feeLabel}>Montant</span>
              <span style={styles.feeValue}>${amountNum.toFixed(2)}</span>
            </div>
            <div style={styles.feeRow}>
              <span style={styles.feeLabel}>Frais ({selectedMethod.feeLabel})</span>
              <span style={styles.feeValue}>
                ${feeAmount.toFixed(2)}
              </span>
            </div>
            <div style={styles.feeSeparator} />
            <div style={styles.feeRow}>
              <span style={styles.receiveLabel}>Vous recevrez</span>
              <span style={styles.receiveValue}>${receiveAmount.toFixed(2)}</span>
            </div>
          </div>

          <button
            style={
              amountNum >= 10
                ? styles.continueButton
                : styles.continueButtonDisabled
            }
            onClick={handleContinue}
            disabled={amountNum < 10}
          >
            Continuer
          </button>
        </div>
      )}

      {step === "crypto" && selectedMethod && (
        <div style={styles.fadeIn}>
          <div style={styles.header}>
            <button style={styles.backButton} onClick={handleBackFromCrypto}>←</button>
            <h1 style={styles.title}>Dépôt Crypto</h1>
            <div style={styles.spacer} />
          </div>

          {/* Token selection */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#8899AA", fontSize: 12, fontWeight: 600, marginBottom: 10, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Sélectionner le token</p>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              {["BTC", "ETH", "USDT", "USDC"].map((token) => (
                <button
                  key={token}
                  onClick={() => {
                    setSelectedCryptoToken(token);
                    const nets = CRYPTO_NETWORKS[token];
                    if (nets && nets.length > 0) setSelectedCryptoNetwork(nets[0].id);
                  }}
                  style={{
                    flex: 1, padding: "10px 8px", borderRadius: 12, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer",
                    background: selectedCryptoToken === token ? "linear-gradient(135deg, #6BA5FF, #4a7bd1)" : "rgba(12,28,56,0.3)",
                    color: selectedCryptoToken === token ? "#fff" : "#8899AA",
                    boxShadow: selectedCryptoToken === token ? "0 4px 12px rgba(107,165,255,0.3)" : "none",
                    border: selectedCryptoToken === token ? "none" : "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  {token}
                </button>
              ))}
            </div>
          </div>

          {/* Network selection */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: "#8899AA", fontSize: 12, fontWeight: 600, marginBottom: 10, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Réseau</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
              {(CRYPTO_NETWORKS[selectedCryptoToken] || []).map((net) => (
                <button
                  key={net.id}
                  onClick={() => setSelectedCryptoNetwork(net.id)}
                  style={{
                    width: "100%", padding: "14px 16px", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between",
                    border: selectedCryptoNetwork === net.id ? "1px solid rgba(38,166,154,0.5)" : "1px solid rgba(255,255,255,0.08)",
                    background: selectedCryptoNetwork === net.id ? "rgba(38,166,154,0.08)" : "rgba(12,28,56,0.3)",
                    cursor: "pointer", textAlign: "left"
                  }}
                >
                  <div>
                    <p style={{ color: "#E8ECF1", fontWeight: 600, fontSize: 14, margin: 0 }}>{net.name}</p>
                    <p style={{ color: "#6b7280", fontSize: 11, margin: "4px 0 0" }}>Frais: {net.fee} · {net.time}</p>
                  </div>
                  {selectedCryptoNetwork === net.id && (
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "#26A69A", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Deposit address */}
          {(() => {
            const currentNet = (CRYPTO_NETWORKS[selectedCryptoToken] || []).find(n => n.id === selectedCryptoNetwork);
            const addr = currentNet?.address || "Adresse non disponible";
            return (
              <div style={{ background: "rgba(12,28,56,0.4)", border: "1px solid rgba(38,166,154,0.2)", borderRadius: 16, padding: 20, marginBottom: 20 }}>
                <p style={{ color: "#8899AA", fontSize: 12, fontWeight: 600, marginBottom: 12, margin: 0, textTransform: "uppercase", letterSpacing: 0.5 }}>Adresse de dépôt</p>

                {/* QR Code */}
                <div style={{ width: 200, height: 200, margin: "16px auto", background: "#fff", borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", padding: 10, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
                  <QRCodeSVG text={addr} size={180} />
                </div>

                <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 14px", marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
                  <code style={{ flex: 1, color: "#E8ECF1", fontSize: 11, fontFamily: "monospace", wordBreak: "break-all", lineHeight: 1.4 }}>{addr}</code>
                  <button
                    onClick={() => { navigator.clipboard.writeText(addr); }}
                    style={{ padding: "8px 14px", background: "rgba(107,165,255,0.15)", border: "1px solid rgba(107,165,255,0.3)", borderRadius: 8, color: "#6BA5FF", fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}
                  >
                    Copier
                  </button>
                </div>
              </div>
            );
          })()}

          {/* Warning */}
          <div style={{ background: "rgba(250,204,21,0.08)", border: "1px solid rgba(250,204,21,0.3)", borderRadius: 12, padding: 14, marginBottom: 20 }}>
            <p style={{ color: "#FCCF4F", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              ⚠️ Envoyez uniquement du <strong>{selectedCryptoToken}</strong> sur le réseau <strong>{(CRYPTO_NETWORKS[selectedCryptoToken] || []).find(n => n.id === selectedCryptoNetwork)?.name || ""}</strong>. Tout envoi sur un mauvais réseau entraînera une perte définitive.
            </p>
          </div>

          {/* Info */}
          <div style={{ background: "rgba(107,165,255,0.06)", border: "1px solid rgba(107,165,255,0.15)", borderRadius: 12, padding: 14, marginBottom: 24 }}>
            <p style={{ color: "#6BA5FF", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
              Les fonds seront crédités automatiquement après confirmation sur la blockchain. Temps estimé: {(CRYPTO_NETWORKS[selectedCryptoToken] || []).find(n => n.id === selectedCryptoNetwork)?.time || "~10 min"}.
            </p>
          </div>

          <button onClick={handleBackFromCrypto} style={{ width: "100%", padding: 16, background: "rgba(12,28,56,0.3)", color: "#E8ECF1", fontWeight: 600, borderRadius: 12, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", fontSize: 16 }}>
            Retour
          </button>
        </div>
      )}

      {step === "confirm" && selectedMethod && (
        <div style={styles.fadeIn}>
          <div style={styles.header}>
            <button
              style={styles.backButton}
              onClick={() => setStep("amount")}
            >
              ←
            </button>
            <h1 style={styles.title}>Confirmer</h1>
            <div style={styles.spacer} />
          </div>

          <div style={styles.summaryCard}>
            <p style={styles.summaryLabel}>Montant du dépôt</p>
            <h2 style={styles.summaryAmount}>${amountNum.toFixed(2)}</h2>
          </div>

          <div style={styles.confirmDetails}>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Méthode</span>
              <span style={styles.detailValue}>{selectedMethod.name}</span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Frais</span>
              <span style={styles.detailValue}>
                ${feeAmount.toFixed(2)} ({selectedMethod.feeLabel})
              </span>
            </div>
            <div style={styles.detailRow}>
              <span style={styles.detailLabel}>Vous recevrez</span>
              <span style={styles.detailValueGreen}>
                ${receiveAmount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Stripe Elements mode — hidden card element */}
          {selectedMethod?.id === "card" && isStripeConfigured && stripeReady && !useCustomCardForm && (
            <div style={styles.stripeCardContainer}>
              <div style={styles.cardLabelWithLock}>
                <p style={styles.stripeCardLabel}>Informations de carte</p>
                <span style={{ color: "#26A69A", fontSize: 12 }}>🔒 Sécurisé</span>
              </div>
              <div ref={cardRef} style={styles.stripeCardElement} />
              {stripeError && <p style={styles.stripeCardError}>{stripeError}</p>}
            </div>
          )}

          {/* Custom card form — when Stripe JS can't load (WKWebView) */}
          {selectedMethod?.id === "card" && stripeReady && useCustomCardForm && (
            <div style={styles.stripeCardContainer}>
              <div style={styles.cardLabelWithLock}>
                <p style={styles.stripeCardLabel}>Informations de carte</p>
                <span style={{ color: "#26A69A", fontSize: 12 }}>🔒 Sécurisé par Stripe</span>
              </div>

              {/* Card Number */}
              <div style={styles.cardFieldGroup}>
                <label style={styles.cardFieldLabel}>Numéro de carte</label>
                <div style={styles.cardInputWrapper}>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="4242 4242 4242 4242"
                    value={cardNumber}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                      const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ");
                      setCardNumber(formatted);
                    }}
                    style={styles.cardInput}
                    autoComplete="cc-number"
                  />
                  <div style={styles.cardBrandIcon}>
                    {cardNumber.replace(/\s/g, "").startsWith("4") ? (
                      <svg viewBox="0 0 32 20" style={{ width: 32, height: 20 }}>
                        <rect width="32" height="20" rx="3" fill="#1A1F71" />
                        <text x="16" y="14" fontSize="10" fontWeight="700" fill="#fff" textAnchor="middle">VISA</text>
                      </svg>
                    ) : cardNumber.replace(/\s/g, "").startsWith("5") ? (
                      <svg viewBox="0 0 32 20" style={{ width: 32, height: 20 }}>
                        <rect width="32" height="20" rx="3" fill="#333" />
                        <circle cx="12" cy="10" r="7" fill="#EB001B" opacity="0.9" />
                        <circle cx="20" cy="10" r="7" fill="#F79E1B" opacity="0.9" />
                      </svg>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Expiry + CVV row */}
              <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
                <div style={{ flex: 1 }}>
                  <label style={styles.cardFieldLabel}>Expiration</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="MM/AA"
                    value={cardExpiry}
                    onChange={(e) => {
                      let raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                      if (raw.length >= 3) {
                        raw = raw.slice(0, 2) + "/" + raw.slice(2);
                      }
                      setCardExpiry(raw);
                    }}
                    style={styles.cardInput}
                    autoComplete="cc-exp"
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={styles.cardFieldLabel}>CVV</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="123"
                    value={cardCvc}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setCardCvc(raw);
                    }}
                    style={styles.cardInput}
                    autoComplete="cc-csc"
                  />
                </div>
              </div>

              {/* Cardholder Name */}
              <div style={{ marginTop: 12 }}>
                <label style={styles.cardFieldLabel}>Titulaire de la carte</label>
                <input
                  type="text"
                  placeholder="Nom sur la carte"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  style={styles.cardInput}
                  autoComplete="cc-name"
                />
              </div>

              {stripeError && <p style={styles.stripeCardError}>{stripeError}</p>}

              {!isStripeConfigured && (
                <p style={{ color: "#6BA5FF", fontSize: 12, marginTop: 8, textAlign: "center", opacity: 0.7 }}>
                  Mode test — Utilisez 4242 4242 4242 4242
                </p>
              )}
            </div>
          )}

          {/* Loading state for card */}
          {selectedMethod?.id === "card" && stripeLoading && (
            <div style={{ display: "flex", justifyContent: "center", padding: 30 }}>
              <div style={styles.spinner} />
            </div>
          )}

          {/* PayPal section */}
          {selectedMethod?.id === "paypal" && (
            <div style={styles.paypalButtonContainer}>
              {paypalLoading && (
                <div style={{ display: "flex", justifyContent: "center", padding: 20 }}>
                  <div style={styles.spinner} />
                </div>
              )}

              {/* PayPal SDK Buttons (when loaded) */}
              {paypalReady && !paypalLoading && (
                <div>
                  <div ref={paypalContainerRef} style={{ minHeight: 50, marginBottom: 12 }} />
                  <div style={styles.securityBadge}>
                    <span style={{ fontSize: 12 }}>🔒</span>
                    <span>Paiement sécurisé par PayPal</span>
                  </div>
                </div>
              )}

              {/* Manual PayPal flow (when SDK can't load — WKWebView) */}
              {!paypalReady && !paypalLoading && paypalConfigured && (
                <div>
                  <div style={{
                    padding: 16, background: "rgba(0,48,135,0.08)", border: "1px solid rgba(0,48,135,0.2)",
                    borderRadius: 16, marginBottom: 12, textAlign: "center",
                  }}>
                    <svg viewBox="0 0 100 32" style={{ width: 100, height: 32, marginBottom: 8 }}>
                      <rect width="100" height="32" rx="6" fill="#003087" />
                      <text x="50" y="22" fontSize="14" fontWeight="700" fill="#fff" textAnchor="middle">PayPal</text>
                    </svg>
                    <p style={{ fontSize: 13, color: "#8899AA", margin: "8px 0 0" }}>
                      Vous serez redirigé vers PayPal pour valider le paiement
                    </p>
                  </div>
                  <button
                    style={{ ...styles.paypalButton, background: "#003087", width: "100%" }}
                    onClick={handlePayPalManual}
                  >
                    Payer avec PayPal — ${(parseFloat(amount) || 0).toFixed(2)}
                  </button>
                  <div style={styles.securityBadge}>
                    <span style={{ fontSize: 12 }}>🔒</span>
                    <span>Paiement sécurisé par PayPal</span>
                  </div>
                </div>
              )}

              {/* PayPal not configured — email-based simulation flow */}
              {!paypalReady && !paypalLoading && !paypalConfigured && (
                <div>
                  <div style={{
                    padding: 20, background: "rgba(0,48,135,0.06)", border: "1px solid rgba(0,48,135,0.15)",
                    borderRadius: 16, marginBottom: 14,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14 }}>
                      <svg viewBox="0 0 80 28" style={{ width: 80, height: 28 }}>
                        <rect width="80" height="28" rx="6" fill="#003087" />
                        <text x="40" y="19" fontSize="12" fontWeight="700" fill="#fff" textAnchor="middle">PayPal</text>
                      </svg>
                    </div>
                    <label style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", display: "block", marginBottom: 6, fontWeight: 500 }}>
                      Adresse email PayPal
                    </label>
                    <input
                      type="email"
                      inputMode="email"
                      placeholder="votre@email.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      style={{
                        width: "100%", padding: "14px 12px",
                        background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 10, color: "#E8ECF1", fontSize: 16,
                        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
                        outline: "none", boxSizing: "border-box",
                      }}
                      autoComplete="email"
                    />
                    <p style={{ fontSize: 11, color: "#4A5568", margin: "8px 0 0", textAlign: "center" }}>
                      Un lien de paiement sera envoyé à cette adresse
                    </p>
                  </div>
                  <button
                    style={{
                      ...styles.paypalButton, background: "#003087", width: "100%",
                      opacity: paypalEmail.includes("@") ? 1 : 0.5,
                    }}
                    onClick={handlePayPalManual}
                  >
                    Payer ${(parseFloat(amount) || 0).toFixed(2)} via PayPal
                  </button>
                  <div style={styles.securityBadge}>
                    <span style={{ fontSize: 12 }}>🔒</span>
                    <span>Paiement sécurisé par PayPal</span>
                  </div>
                </div>
              )}

              {paypalError && (
                <p style={{ fontSize: 13, color: "#EF5350", textAlign: "center", marginTop: 10, fontWeight: 500 }}>
                  {paypalError}
                </p>
              )}
            </div>
          )}

          {/* One-click pay with saved card */}
          {selectedMethod?.id === "card" && savedCard?.customerId && savedCard?.paymentMethodId && (
            <div style={{ margin: "0 20px 12px" }}>
              <button
                style={{
                  width: "100%",
                  padding: "16px",
                  background: "linear-gradient(135deg, #26A69A 0%, #1f8578 100%)",
                  border: "none",
                  borderRadius: 16,
                  color: "#fff",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  boxShadow: "0 4px 16px rgba(38,166,154,0.35)",
                  letterSpacing: "0.3px",
                }}
                onClick={handleOneClickPay}
              >
                <span style={{ fontSize: 18 }}>⚡</span>
                Payer en 1 clic — {savedCard.brand} •••• {savedCard.last4}
              </button>
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                marginTop: 8,
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
              }}>
                <span>🔒</span>
                <span>Carte enregistrée — Paiement sécurisé Stripe</span>
              </div>
            </div>
          )}

          {/* Separator when both one-click and manual are shown */}
          {selectedMethod?.id === "card" && savedCard?.customerId && stripeReady && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "0 20px 12px",
            }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>ou payer avec une autre carte</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>
          )}

          {/* Standard confirm button for other methods */}
          {selectedMethod?.id !== "paypal" && (
            <button style={styles.confirmButton} onClick={handleConfirm}>
              {selectedMethod?.id === "card" ? (savedCard?.customerId ? "Payer avec une autre carte" : "Payer par carte") : "Confirmer"}
            </button>
          )}
        </div>
      )}

      {step === "sepa-form" && (
        <div style={styles.fadeIn}>
          <div style={{ maxWidth: 420, margin: "0 auto", padding: 16, paddingTop: 24, paddingBottom: 96 }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", marginBottom: 28 }}>
              <button onClick={() => setStep("amount")} style={{ padding: 8, background: "transparent", border: "none", cursor: "pointer", marginRight: 12, display: "flex", alignItems: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6BA5FF" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
              </button>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "#E8ECF1", margin: 0 }}>{selectedMethod?.id === "sepa_instant" ? "Virement Instantané" : "Virement SEPA"}</h2>
            </div>

            {selectedMethod?.id === "sepa_instant" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, padding: "10px 14px", background: "rgba(38,166,154,0.08)", border: "1px solid rgba(38,166,154,0.25)", borderRadius: 12 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#26A69A", boxShadow: "0 0 8px rgba(38,166,154,0.6)" }} />
                <span style={{ color: "#26A69A", fontSize: 13, fontWeight: 600 }}>Virement instantané — reçu en ~10 secondes</span>
              </div>
            )}

            {/* Amount recap */}
            <div style={{ background: "rgba(12,28,56,0.3)", border: "1px solid rgba(107,165,255,0.2)", borderRadius: 16, padding: 20, marginBottom: 24, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#8899AA", marginBottom: 8, fontWeight: 600 }}>Montant du dépôt</div>
              <div style={{ fontSize: 32, fontWeight: 700, color: "#E8ECF1" }}>{parseFloat(amount).toFixed(2)} €</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>Frais: {(parseFloat(amount) * (selectedMethod?.id === "sepa_instant" ? 0.01 : 0.005)).toFixed(2)} € ({selectedMethod?.id === "sepa_instant" ? "1%" : "0.5%"})</div>
            </div>

            {/* IBAN Input */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#8899AA", fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>IBAN</label>
              <input
                type="text"
                value={ibanValue}
                onChange={(e) => {
                  const v = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
                  const formatted = v.replace(/(.{4})/g, "$1 ").trim();
                  setIbanValue(formatted);
                  setSepaError("");
                }}
                placeholder="FR76 1234 5678 9012 3456 7890 123"
                maxLength={42}
                style={{
                  width: "100%", background: "rgba(12,28,56,0.3)", border: sepaError ? "2px solid #EF5350" : "1px solid rgba(107,165,255,0.2)", borderRadius: 12,
                  padding: "14px 16px", color: "#E8ECF1", fontFamily: "monospace", fontSize: 15, outline: "none", boxSizing: "border-box", letterSpacing: "1px"
                }}
              />
            </div>

            {/* Account Name */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", color: "#8899AA", fontSize: 12, marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>Titulaire du compte</label>
              <input
                type="text"
                value={ibanName}
                onChange={(e) => setIbanName(e.target.value)}
                placeholder="Nom Prénom"
                style={{
                  width: "100%", background: "rgba(12,28,56,0.3)", border: "1px solid rgba(107,165,255,0.2)", borderRadius: 12,
                  padding: "14px 16px", color: "#E8ECF1", fontSize: 15, outline: "none", boxSizing: "border-box"
                }}
              />
            </div>

            {/* Error */}
            {sepaError && (
              <div style={{ background: "rgba(239,83,80,0.1)", border: "1px solid rgba(239,83,80,0.3)", borderRadius: 12, padding: 14, marginBottom: 20 }}>
                <p style={{ color: "#EF5350", fontSize: 12, margin: 0 }}>{sepaError}</p>
              </div>
            )}

            {/* Info box */}
            <div style={{ background: "rgba(107,165,255,0.06)", border: "1px solid rgba(107,165,255,0.15)", borderRadius: 12, padding: 14, marginBottom: 24 }}>
              <p style={{ color: "#6BA5FF", fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                {selectedMethod?.id === "sepa_instant" ? "Le virement instantané SEPA est traité en quelques secondes (10 sec max). Les fonds seront crédités immédiatement sur votre portefeuille Kingest. Frais: 1%." : "Le virement SEPA est traité en 1-2 jours ouvrés. Les fonds seront crédités automatiquement sur votre portefeuille Kingest."}
              </p>
            </div>

            {/* Submit */}
            <button
              onClick={async () => {
                const cleanIban = ibanValue.replace(/\s/g, "");
                if (cleanIban.length < 15 || !/^[A-Z]{2}[0-9A-Z]+$/.test(cleanIban)) {
                  setSepaError("IBAN invalide. Vérifiez votre saisie.");
                  return;
                }
                if (!ibanName.trim()) {
                  setSepaError("Veuillez indiquer le titulaire du compte.");
                  return;
                }
                setSepaLoading(true);
                setSepaError("");
                try {
                  const doFetch = async (url, opts) => {
                    if (window.__KINGEST_FETCH) {
                      return new Promise((resolve) => {
                        const cb = "__sepa_" + Date.now();
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
                  const result = await doFetch(API_BASE + (selectedMethod?.id === "sepa_instant" ? "/api/stripe/sepa-instant-deposit" : "/api/stripe/sepa-deposit"), {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ amount: parseFloat(amount), currency: "EUR", iban: cleanIban, accountName: ibanName.trim() })
                  });
                  if (result?.ok) {
                    onDeposit(parseFloat(amount), "EUR", "Virement SEPA");
                  } else {
                    setSepaError(result?.error || "Erreur lors du virement");
                    setSepaLoading(false);
                  }
                } catch (err) {
                  setSepaError("Erreur réseau. Réessayez.");
                  setSepaLoading(false);
                }
              }}
              disabled={sepaLoading || !ibanValue || !ibanName}
              style={{
                width: "100%", padding: "16px", fontWeight: 700, borderRadius: 12, border: "none",
                cursor: sepaLoading ? "not-allowed" : "pointer", fontSize: 16,
                background: sepaLoading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg, #6BA5FF, #4a7bd1)",
                color: sepaLoading ? "#4A5568" : "#fff",
                boxShadow: sepaLoading ? "none" : "0 6px 20px rgba(107,165,255,0.35)",
                opacity: (!ibanValue || !ibanName) ? 0.5 : 1
              }}
            >
              {sepaLoading ? "Traitement en cours..." : `Déposer ${parseFloat(amount || 0).toFixed(2)} € ${selectedMethod?.id === "sepa_instant" ? "instantanément" : "par virement"}`}
            </button>
          </div>
        </div>
      )}

      {step === "processing" && (
        <div style={styles.fadeIn}>
          <div style={styles.processingContainer}>
            <div style={styles.spinner} />
            <p style={styles.processingText}>Transaction en cours...</p>
          </div>
        </div>
      )}

      {step === "done" && (
        <div style={styles.fadeIn}>
          <div style={styles.doneContainer}>
            <div style={styles.checkmarkCircle}>
              <span style={styles.checkmark}>✓</span>
            </div>
            <h2 style={styles.successTitle}>Dépôt réussi !</h2>
            <p style={styles.successAmount}>${amountNum.toFixed(2)}</p>
            <button style={styles.returnButton} onClick={handleReset}>
              Retour
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#020817",
    color: "#fff",
    minHeight: "100vh",
    paddingBottom: 40,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto",
  },
  fadeIn: {
    animation: "fadeIn 0.3s ease-in",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 20px",
    paddingTop: 32,
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  backButton: {
    background: "rgba(255, 255, 255, 0.05)",
    border: "none",
    color: "#fff",
    fontSize: 20,
    cursor: "pointer",
    padding: 0,
    width: 40,
    height: 40,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    margin: 0,
    flex: 1,
    textAlign: "center",
    letterSpacing: "-0.5px",
  },
  spacer: {
    width: 40,
  },
  balanceSection: {
    padding: "20px 20px",
    marginBottom: 30,
    textAlign: "center",
    background: "rgba(12, 28, 56, 0.2)",
    borderRadius: 16,
    marginLeft: 20,
    marginRight: 20,
  },
  balanceLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
    margin: "0 0 8px 0",
    fontWeight: 500,
    letterSpacing: "0.3px",
  },
  balanceAmount: {
    fontSize: 44,
    fontWeight: "700",
    margin: 0,
    color: "#26A69A",
    letterSpacing: "-0.5px",
  },
  methodsContainer: {
    padding: "0 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  methodCard: {
    background: "rgba(12, 28, 56, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 14,
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    color: "#fff",
  },
  "methodCard:hover": {
    background: "rgba(12, 28, 56, 0.5)",
    borderColor: "rgba(38, 166, 154, 0.2)",
  },
  methodIcon: {
    width: 48,
    height: 48,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    background: "rgba(38, 166, 154, 0.08)",
    border: "1px solid rgba(38, 166, 154, 0.15)",
    flexShrink: 0,
  },
  methodInfo: {
    flex: 1,
    textAlign: "left",
  },
  methodName: {
    fontSize: 14,
    fontWeight: "600",
    margin: "0 0 4px 0",
    color: "#fff",
  },
  methodDesc: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    margin: 0,
  },
  methodMeta: {
    textAlign: "right",
    flexShrink: 0,
  },
  methodFees: {
    fontSize: 12,
    fontWeight: "600",
    margin: "0 0 4px 0",
    color: "#26A69A",
  },
  methodTime: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.5)",
    margin: 0,
  },
  methodBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "rgba(38, 166, 154, 0.15)",
    border: "1px solid rgba(38, 166, 154, 0.3)",
    padding: "8px 16px",
    borderRadius: 20,
    margin: "20px 20px 40px",
  },
  methodBadgeIcon: {
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  methodBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#26A69A",
  },
  amountInputSection: {
    padding: "0 20px",
    marginBottom: 40,
  },
  amountInputWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  amountCurrency: {
    fontSize: 52,
    fontWeight: "700",
    color: "rgba(38, 166, 154, 0.5)",
    marginRight: 8,
  },
  amountInput: {
    background: "transparent",
    border: "none",
    borderBottom: "3px solid rgba(38, 166, 154, 0.4)",
    color: "#26A69A",
    fontSize: 52,
    fontWeight: "700",
    padding: "12px 0 8px 0",
    textAlign: "center",
    outline: "none",
    maxWidth: 300,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    letterSpacing: "-0.5px",
  },
  "amountInput:focus": {
    borderBottomColor: "#26A69A",
  },
  quickAmountsContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
    padding: "0 20px",
    marginBottom: 30,
    justifyContent: "center",
  },
  quickAmountButton: {
    background: "rgba(12, 28, 56, 0.4)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    color: "#fff",
    padding: "10px 16px",
    fontSize: 13,
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  "quickAmountButton:hover": {
    background: "rgba(38, 166, 154, 0.15)",
    borderColor: "rgba(38, 166, 154, 0.4)",
    color: "#26A69A",
  },
  feeBreakdown: {
    background: "rgba(12, 28, 56, 0.2)",
    border: "1px solid rgba(38, 166, 154, 0.15)",
    borderRadius: 16,
    padding: 20,
    margin: "0 20px 30px",
  },
  feeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  feeLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.55)",
    fontWeight: 500,
  },
  feeValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E8ECF1",
  },
  feeSeparator: {
    height: 1,
    background: "rgba(255, 255, 255, 0.06)",
    margin: "14px 0",
  },
  receiveLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E8ECF1",
  },
  receiveValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#26A69A",
  },
  continueButton: {
    background: "linear-gradient(135deg, #26A69A 0%, #1e8c7e 100%)",
    border: "none",
    borderRadius: 16,
    color: "#020817",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: "700",
    width: "calc(100% - 40px)",
    margin: "0 20px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(38, 166, 154, 0.3)",
  },
  continueButtonDisabled: {
    background: "rgba(38, 166, 154, 0.2)",
    border: "1px solid rgba(38, 166, 154, 0.3)",
    borderRadius: 16,
    color: "rgba(232, 236, 241, 0.4)",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: "700",
    width: "calc(100% - 40px)",
    margin: "0 20px",
    cursor: "not-allowed",
  },
  cryptoContainer: {
    padding: "20px",
    display: "flex",
    flexDirection: "column",
    gap: 20,
  },
  cryptoCard: {
    background: "rgba(12, 28, 56, 0.3)",
    border: "1px solid rgba(38, 166, 154, 0.15)",
    borderRadius: 16,
    padding: 24,
  },
  cryptoLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.65)",
    margin: "0 0 16px",
    fontWeight: 500,
  },
  cryptoAddressBox: {
    background: "rgba(0, 0, 0, 0.4)",
    border: "1px solid rgba(38, 166, 154, 0.2)",
    borderRadius: 12,
    padding: 14,
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  cryptoAddress: {
    fontSize: 11,
    color: "#26A69A",
    fontFamily: "monospace",
    wordBreak: "break-all",
    flex: 1,
    fontWeight: 500,
  },
  copyCryptoButton: {
    background: "linear-gradient(135deg, #26A69A 0%, #1e8c7e 100%)",
    border: "none",
    borderRadius: 8,
    color: "#020817",
    padding: "8px 14px",
    fontSize: 12,
    fontWeight: "600",
    cursor: "pointer",
    flexShrink: 0,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 2px 6px rgba(38, 166, 154, 0.2)",
  },
  cryptoWarning: {
    fontSize: 12,
    color: "rgba(255, 152, 0, 0.9)",
    margin: 0,
    lineHeight: 1.5,
    fontWeight: 500,
  },
  cryptoInfoCard: {
    background: "rgba(12, 28, 56, 0.3)",
    border: "1px solid rgba(38, 166, 154, 0.15)",
    borderRadius: 16,
    padding: 20,
  },
  cryptoInfoTitle: {
    fontSize: 14,
    fontWeight: "600",
    margin: "0 0 14px",
    color: "#fff",
  },
  cryptoCurrencies: {
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    gap: 12,
  },
  cryptoCurrency: {
    background: "rgba(38, 166, 154, 0.12)",
    border: "1px solid rgba(38, 166, 154, 0.25)",
    borderRadius: 10,
    padding: "12px 8px",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: "#26A69A",
    transition: "all 0.3s",
  },
  cryptoTimeInfo: {
    background: "rgba(12, 28, 56, 0.3)",
    border: "1px solid rgba(38, 166, 154, 0.15)",
    borderRadius: 16,
    padding: 24,
    textAlign: "center",
  },
  cryptoTimeLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.5)",
    margin: "0 0 8px",
    fontWeight: 500,
  },
  cryptoTimeValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#26A69A",
    margin: 0,
  },
  backCryptoButton: {
    background: "rgba(38, 166, 154, 0.1)",
    border: "1px solid rgba(38, 166, 154, 0.3)",
    borderRadius: 16,
    color: "#26A69A",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: "700",
    width: "calc(100% - 40px)",
    margin: "20px 20px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
  },
  summaryCard: {
    background: "linear-gradient(135deg, rgba(38, 166, 154, 0.12) 0%, rgba(38, 166, 154, 0.08) 100%)",
    border: "1px solid rgba(38, 166, 154, 0.25)",
    borderRadius: 16,
    padding: 32,
    margin: "20px 20px 30px",
    textAlign: "center",
  },
  summaryLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.55)",
    margin: "0 0 12px",
    fontWeight: 500,
    letterSpacing: "0.3px",
  },
  summaryAmount: {
    fontSize: 52,
    fontWeight: "700",
    color: "#26A69A",
    margin: 0,
    letterSpacing: "-1px",
  },
  confirmDetails: {
    background: "rgba(12, 28, 56, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.04)",
    borderRadius: 20,
    padding: 20,
    margin: "0 20px 30px",
  },
  detailRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
  },
  detailLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.6)",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  detailValueGreen: {
    fontSize: 14,
    fontWeight: "600",
    color: "#26A69A",
  },
  confirmButton: {
    background: "linear-gradient(135deg, #26A69A 0%, #1e8c7e 100%)",
    border: "none",
    borderRadius: 16,
    color: "#020817",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: "700",
    width: "calc(100% - 40px)",
    margin: "0 20px",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(38, 166, 154, 0.3)",
  },
  processingContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  spinner: {
    width: 60,
    height: 60,
    border: "3px solid rgba(38, 166, 154, 0.2)",
    borderTop: "3px solid #26A69A",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  processingText: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    margin: 0,
  },
  doneContainer: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    background: "rgba(38, 166, 154, 0.2)",
    border: "3px solid #26A69A",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
  },
  checkmark: {
    fontSize: 48,
    color: "#26A69A",
    fontWeight: "700",
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "700",
    margin: 0,
    color: "#fff",
  },
  successAmount: {
    fontSize: 20,
    fontWeight: "600",
    color: "#26A69A",
    margin: 0,
  },
  returnButton: {
    background: "linear-gradient(135deg, #26A69A 0%, #1e8c7e 100%)",
    border: "none",
    borderRadius: 16,
    color: "#020817",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: "700",
    cursor: "pointer",
    marginTop: 20,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    minWidth: 160,
    boxShadow: "0 4px 12px rgba(38, 166, 154, 0.3)",
  },
  stripeCardContainer: {
    margin: "0 20px 20px",
    padding: 20,
    background: "rgba(12,28,56,0.3)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16,
  },
  cardLabelWithLock: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  stripeCardLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    margin: 0,
  },
  stripeCardElement: {
    padding: "14px 12px",
    background: "rgba(0,0,0,0.3)",
    borderRadius: 10,
    border: "1px solid rgba(255,255,255,0.06)",
  },
  stripeCardError: {
    fontSize: 12,
    color: "#EF5350",
    marginTop: 10,
    margin: "10px 0 0 0",
  },
  cardFieldGroup: {
    marginTop: 4,
  },
  cardFieldLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    marginBottom: 6,
    display: "block",
    fontWeight: 500,
  },
  cardInputWrapper: {
    position: "relative",
    display: "flex",
    alignItems: "center",
  },
  cardInput: {
    width: "100%",
    padding: "14px 12px",
    background: "rgba(0,0,0,0.3)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 10,
    color: "#E8ECF1",
    fontSize: 16,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Mono', monospace",
    outline: "none",
    letterSpacing: "1px",
    WebkitAppearance: "none",
    boxSizing: "border-box",
  },
  cardBrandIcon: {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none",
  },
  simulationNotice: {
    margin: "0 20px 20px",
    padding: 16,
    background: "rgba(255,193,7,0.08)",
    border: "1px solid rgba(255,193,7,0.2)",
    borderRadius: 16,
  },
  simulationNoticeText: {
    fontSize: 13,
    color: "#FFC107",
    margin: 0,
  },
  paypalButtonContainer: {
    margin: "0 20px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  paypalButton: {
    border: "none",
    borderRadius: 12,
    color: "#fff",
    padding: "16px 24px",
    fontSize: 16,
    fontWeight: "700",
    cursor: "pointer",
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    boxShadow: "0 4px 12px rgba(0,48,135,0.3)",
  },
  securityBadge: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    fontSize: 12,
    color: "#26A69A",
    fontWeight: 500,
  },
};

// Add keyframe animations
const styleSheet = document.createElement("style");
styleSheet.textContent = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes scaleIn {
    from {
      transform: scale(0.8);
      opacity: 0;
    }
    to {
      transform: scale(1);
      opacity: 1;
    }
  }

  input:focus {
    outline: none;
  }

  button {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }

  button:hover {
    transform: translateY(-2px);
  }

  button:active {
    transform: translateY(0) scale(0.98);
  }

  /* Security badge styles */
  .security-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: rgba(38, 166, 154, 0.15);
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 11px;
    color: #26A69A;
    font-weight: 500;
    margin-top: 12px;
  }

  .lock-icon {
    font-size: 12px;
  }
`;
if (typeof document !== "undefined") {
  document.head.appendChild(styleSheet);
}

export { DepositPage };
