# 👑 KINGEST v8 — React Native iOS App + 4 Live Data Agents

App iOS native avec **4 agents de données live indépendants** pour les marchés financiers.

## 📡 4 Live Data Agents (natifs, pas de CORS)

| Agent | API | Intervalle | Clé requise |
|-------|-----|-----------|-------------|
| 📊 Actions | Finnhub (60 req/min) | 30s | ✅ Intégrée |
| ₿ Crypto | CoinGecko + Binance WebSocket | 60s + streaming | ❌ Aucune |
| 💱 Forex | Frankfurter (illimité) | 5 min | ❌ Aucune |
| 🏆 Commodités | gold-api.com + Finnhub ETFs | 60s | ✅ Intégrée |

**Avantage React Native** : pas de problème CORS — les APIs sont appelées directement depuis l'app.

## 🚀 Installation (5 minutes)

### 1. Cloner et installer
```bash
git clone https://github.com/erol6469/kingest.git
cd kingest
git checkout ios-app
npm install
```

### 2. Installer les pods iOS
```bash
cd ios
pod install
cd ..
```

### 3. Lancer sur iPhone
```bash
npx react-native run-ios
```

Ou ouvrir `ios/kingest.xcworkspace` dans Xcode et build (⌘+R).

## 📂 Structure

```
kingest/
├── App.js                      ← App principale (tout-en-un)
├── src/
│   └── hooks/
│       └── useLiveAgents.js    ← 4 agents de données live
├── index.js                    ← Entry point
├── package.json
├── metro.config.js
├── babel.config.js
└── app.json
```

## 🔧 Intégration dans ton app existante

Si tu as déjà une app React Native Kingest, tu peux juste :

### Option A — Remplacer App.js
Copie `App.js` et `src/hooks/useLiveAgents.js` dans ton projet existant.

### Option B — Ajouter juste les agents live
1. Copie `src/hooks/useLiveAgents.js` dans ton projet
2. Dans ton App.js existant, ajoute :
```javascript
import { useAllLiveAgents } from './src/hooks/useLiveAgents';

// Dans ton composant App :
const liveAgents = useAllLiveAgents({
  stockSymbols: ['AAPL', 'MSFT', 'GOOGL', ...],
  cryptoSymbols: ['BTC', 'ETH', 'SOL', ...],
});

// Accéder aux données live :
liveAgents.stocks.data     // { AAPL: { price, chg, ... }, ... }
liveAgents.crypto.data     // { BTC: { price, chg, ... }, ... }
liveAgents.forex.data      // { 'EUR/USD': { price, ... }, ... }
liveAgents.commodities.data // { 'XAU/USD': { price, chg, ... }, ... }
liveAgents.agents          // Status des 4 agents
liveAgents.activeCount     // Nombre d'agents connectés (0-4)
```

## Auteur
Built by **Erol** with Claude AI.
