# 👑 KINGEST v8 — Decentralized AI Investment Platform

Plateforme d'investissement hybride CeFi/DeFi avec **4 agents de données live indépendants**.

## 📡 4 Live Data Agents

| Agent | API | Intervalle | CORS |
|-------|-----|-----------|------|
| 📊 Actions | Finnhub (60 req/min) | 30s | Proxy Vercel |
| ₿ Crypto | CoinGecko + Binance WebSocket | 60s + streaming | Proxy + WS |
| 💱 Forex | Frankfurter (illimité) | 5 min | Proxy Vercel |
| 🏆 Commodités | gold-api.com + Finnhub ETFs | 60s | Proxy Vercel |

## 🚀 Déploiement sur Vercel

1. Fork ce repo
2. Connecte-le à [vercel.com](https://vercel.com)
3. Vercel détecte automatiquement Vite → build & deploy
4. Les rewrites API sont configurées dans `vercel.json`

## 💻 Développement local

```bash
npm install
npm run dev
```

L'app tourne sur `http://localhost:3000` avec les proxies API configurés dans `vite.config.js`.

## 📱 Features

- **10 200+ actifs** : Actions, Crypto, Forex, Commodités
- **8 agents IA** financiers (Claude API + Web Search)
- **Wallets Web3** : MetaMask, WalletConnect, Coinbase, Phantom
- **7 blockchains** : Ethereum, Arbitrum, Polygon, BSC, Solana, Base, Hyperliquid
- **Système de tiers** : Free / Pro / Elite
- **Copy Trading** avec leaderboard
- **Token $KING** avec staking
- **Design** : Glassmorphism premium

## Tech Stack

- React 18 + Vite
- Recharts
- WebSocket (Binance streaming)
- Vercel (deployment + API proxy)

## Auteur

Built by **Erol** with Claude AI.
