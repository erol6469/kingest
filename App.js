// ═══════════════════════════════════════════════════════════════════════
//  👑 KINGEST v8 — React Native · 4 Live Data Agents
//  Agent 1: Actions (Finnhub) · Agent 2: Crypto (CoinGecko+Binance WS)
//  Agent 3: Forex (Frankfurter) · Agent 4: Commodités (gold-api.com)
// ═══════════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, StatusBar,
  StyleSheet, Dimensions, Animated, RefreshControl, FlatList, Modal,
  SafeAreaView, ActivityIndicator, Platform,
} from 'react-native';
import { useAllLiveAgents, AGENT_STATUS, LIVE_CONFIG } from './src/hooks/useLiveAgents';

const { width: SW, height: SH } = Dimensions.get('window');

// ═══════════════════════════════════════════════════════════════
//  DESIGN SYSTEM
// ═══════════════════════════════════════════════════════════════

const C = {
  bg: '#0a1628',
  surface: '#0F1C32',
  card: '#0E1C36',
  border: 'rgba(255,255,255,0.06)',
  primary: '#6BA5FF',
  green: '#26A69A',
  red: '#EF5350',
  gold: '#F5B731',
  text: '#E8ECF1',
  textMid: '#8899AA',
  textDim: '#4A5568',
  elite: '#EC4899',
};

const fmt = (n) => n >= 1000 ? n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : n < 1 ? n.toFixed(4) : n.toFixed(2);
const fUSD = (n) => '$' + fmt(Math.abs(n));

// ═══════════════════════════════════════════════════════════════
//  STATIC DATA — Top assets for display
// ═══════════════════════════════════════════════════════════════

const TOP_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'NVDA', 'TSLA', 'AMZN', 'META', 'JPM', 'V', 'JNJ', 'WMT', 'UNH', 'MA', 'PG', 'HD', 'DIS', 'NFLX', 'PYPL', 'CRM', 'INTC'];
const TOP_CRYPTO = ['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK', 'MATIC', 'UNI', 'SHIB', 'LTC', 'ATOM', 'FIL', 'APT', 'NEAR', 'ARB', 'OP'];

const STOCK_NAMES = { AAPL: 'Apple Inc.', MSFT: 'Microsoft', GOOGL: 'Alphabet', NVDA: 'NVIDIA', TSLA: 'Tesla', AMZN: 'Amazon', META: 'Meta Platforms', JPM: 'JPMorgan Chase', V: 'Visa Inc.', JNJ: 'Johnson & Johnson', WMT: 'Walmart', UNH: 'UnitedHealth', MA: 'Mastercard', PG: 'Procter & Gamble', HD: 'Home Depot', DIS: 'Walt Disney', NFLX: 'Netflix', PYPL: 'PayPal', CRM: 'Salesforce', INTC: 'Intel' };
const CRYPTO_NAMES = { BTC: 'Bitcoin', ETH: 'Ethereum', SOL: 'Solana', BNB: 'Binance Coin', XRP: 'Ripple', ADA: 'Cardano', DOGE: 'Dogecoin', AVAX: 'Avalanche', DOT: 'Polkadot', LINK: 'Chainlink', MATIC: 'Polygon', UNI: 'Uniswap', SHIB: 'Shiba Inu', LTC: 'Litecoin', ATOM: 'Cosmos', FIL: 'Filecoin', APT: 'Aptos', NEAR: 'NEAR Protocol', ARB: 'Arbitrum', OP: 'Optimism' };
const STOCK_EMOJIS = { AAPL: '🍎', MSFT: '🪟', GOOGL: '🔍', NVDA: '🟢', TSLA: '⚡', AMZN: '📦', META: '👤', JPM: '🏦', V: '💳', JNJ: '💊', WMT: '🛒', UNH: '🏥', MA: '💳', PG: '🧴', HD: '🔨', DIS: '🏰', NFLX: '🎬', PYPL: '💰', CRM: '☁️', INTC: '💾' };
const CRYPTO_EMOJIS = { BTC: '₿', ETH: '⟠', SOL: '◎', BNB: '🔶', XRP: '💧', ADA: '🔵', DOGE: '🐕', AVAX: '🔺', DOT: '⬡', LINK: '🔗', MATIC: '🟣', UNI: '🦄', SHIB: '🐕', LTC: '⚪', ATOM: '⚛️', FIL: '📁', APT: '🅰️', NEAR: '🌐', ARB: '🔵', OP: '🔴' };

// ═══════════════════════════════════════════════════════════════
//  COMPONENTS
// ═══════════════════════════════════════════════════════════════

function AgentBadge({ agent }) {
  const isOk = agent.status === 'success';
  const isFetch = agent.status === 'fetching';
  return (
    <View style={[s.card, { borderLeftWidth: 3, borderLeftColor: agent.color, marginBottom: 12 }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
        <Text style={{ fontSize: 26, marginRight: 12 }}>{agent.icon}</Text>
        <View style={{ flex: 1 }}>
          <Text style={[s.textBold, { fontSize: 14 }]}>{agent.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isOk ? C.green : isFetch ? agent.color : C.textDim, marginRight: 6 }} />
            <Text style={{ fontSize: 11, color: isOk ? C.green : isFetch ? agent.color : C.textDim, fontWeight: '600' }}>
              {isOk ? '✓ Connecté' : isFetch ? '⟳ Récupération...' : agent.status === 'error' ? '✗ Erreur' : '⏸ En attente'}
            </Text>
          </View>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { l: 'MAJ', v: agent.last || '—' },
          { l: 'Latence', v: agent.lat ? `${agent.lat}ms` : '—' },
          { l: 'Fetches', v: `${agent.fetches || 0}` },
          { l: 'Erreurs', v: `${agent.errs || 0}`, c: agent.errs > 0 ? C.red : C.textDim },
        ].map((stat, i) => (
          <View key={i} style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: 8, padding: 8 }}>
            <Text style={{ fontSize: 8, color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.8 }}>{stat.l}</Text>
            <Text style={{ fontSize: 12, fontWeight: '700', color: stat.c || C.text, marginTop: 2 }}>{stat.v}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function AssetRow({ sym, name, emoji, price, chg, onPress }) {
  const up = (chg || 0) >= 0;
  return (
    <TouchableOpacity onPress={onPress} style={[s.row, { borderBottomWidth: 1, borderBottomColor: C.border }]}>
      <Text style={{ fontSize: 22, width: 36, textAlign: 'center' }}>{emoji || '📊'}</Text>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text style={[s.textBold, { fontSize: 14 }]}>{sym}</Text>
        <Text style={{ fontSize: 11, color: C.textDim }}>{name || ''}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[s.textBold, { fontSize: 14 }]}>${price ? fmt(price) : '—'}</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: up ? C.green : C.red }}>
          {up ? '+' : ''}{(chg || 0).toFixed(2)}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function SectionHeader({ title, icon, onSeeAll }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginTop: 24, marginBottom: 12 }}>
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 1.2 }}>{icon} {title}</Text>
      {onSeeAll && (
        <TouchableOpacity onPress={onSeeAll}>
          <Text style={{ fontSize: 12, color: C.primary }}>Voir tout →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function StatCard({ label, value, color = C.primary, icon }) {
  return (
    <View style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 14 }]}>
      {icon && <Text style={{ fontSize: 18, marginBottom: 4 }}>{icon}</Text>}
      <Text style={{ fontSize: 9, color: C.textDim, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 0.8 }}>{label}</Text>
      <Text style={{ fontSize: 18, fontWeight: '800', color, marginTop: 2 }}>{value}</Text>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════
//  SCREENS
// ═══════════════════════════════════════════════════════════════

function HomeScreen({ liveAgents, stocks, crypto, forex, commodities, balance, positions, setPage }) {
  const activeCount = liveAgents.agents.filter(a => a.status === 'success').length;
  const totalPnl = positions.reduce((s, p) => s + (p.pnl || 0), 0);
  const equity = balance + positions.reduce((s, p) => s + p.amt + (p.pnl || 0), 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
      {/* Header Card */}
      <View style={[s.card, { margin: 20, alignItems: 'center', paddingVertical: 28, borderWidth: 1, borderColor: 'rgba(107,165,255,0.15)' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeCount > 0 ? C.green : C.gold, marginRight: 6 }} />
          <Text style={{ fontSize: 11, fontWeight: '700', color: activeCount > 0 ? C.green : C.gold }}>
            {activeCount > 0 ? `● LIVE ${activeCount}/4` : '● SIMULATED'}
          </Text>
        </View>
        <Text style={{ fontSize: 38, fontWeight: '800', color: C.text }}>{fUSD(equity)}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: 'rgba(38,166,154,0.1)', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 12 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: totalPnl >= 0 ? C.green : C.red }}>
            ▲ {totalPnl >= 0 ? '+' : ''}{fUSD(totalPnl)} ({totalPnl !== 0 ? ((totalPnl / (equity - totalPnl)) * 100).toFixed(2) : '0.00'}%)
          </Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 8 }}>
        <TouchableOpacity style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 16 }]}>
          <Text style={{ fontSize: 20, marginBottom: 4 }}>↓</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.primary }}>Dépôt</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 16 }]}>
          <Text style={{ fontSize: 20, marginBottom: 4 }}>↑</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.primary }}>Collect</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 16 }]}>
          <Text style={{ fontSize: 20, marginBottom: 4 }}>◇</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.primary }}>Wallet</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 8 }}>
        <StatCard label="Daily P&L" value={`+${fUSD(totalPnl)}`} color={totalPnl >= 0 ? C.green : C.red} />
        <StatCard label="Free Margin" value={fUSD(balance)} color={C.gold} />
      </View>

      {/* Markets Quick Access */}
      <SectionHeader title="Markets" icon="📊" onSeeAll={() => setPage('markets')} />
      <View style={{ flexDirection: 'row', paddingHorizontal: 20, gap: 10 }}>
        {[
          { l: 'Actions', e: '📊', c: C.primary, tab: 'stock' },
          { l: 'Crypto', e: '₿', c: C.gold, tab: 'crypto' },
          { l: 'Forex', e: '💱', c: C.green, tab: 'forex' },
          { l: 'Matières 1res', e: '🏆', c: C.red, tab: 'commodity' },
        ].map((m, i) => (
          <TouchableOpacity key={i} onPress={() => setPage('markets')} style={[s.card, { flex: 1, alignItems: 'center', paddingVertical: 16 }]}>
            <Text style={{ fontSize: 22, marginBottom: 6 }}>{m.e}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.textMid }}>{m.l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Top Movers - Stocks */}
      <SectionHeader title="Top Movers" icon="🔥" />
      {Object.entries(stocks.data).slice(0, 5).map(([sym, d]) => (
        <AssetRow key={sym} sym={sym} name={STOCK_NAMES[sym]} emoji={STOCK_EMOJIS[sym]} price={d.price} chg={d.chg} />
      ))}

      {/* Crypto */}
      <SectionHeader title="Cryptomonnaies" icon="₿" />
      {Object.entries(crypto.data).slice(0, 5).map(([sym, d]) => (
        <AssetRow key={sym} sym={sym} name={CRYPTO_NAMES[sym]} emoji={CRYPTO_EMOJIS[sym]} price={d.price} chg={d.chg} />
      ))}
    </ScrollView>
  );
}

function MarketsScreen({ liveAgents }) {
  const [tab, setTab] = useState('stock');
  const tabs = [
    { id: 'stock', label: 'Actions', icon: '📊', data: liveAgents.stocks.data, names: STOCK_NAMES, emojis: STOCK_EMOJIS },
    { id: 'crypto', label: 'Crypto', icon: '₿', data: liveAgents.crypto.data, names: CRYPTO_NAMES, emojis: CRYPTO_EMOJIS },
    { id: 'forex', label: 'Forex', icon: '💱', data: liveAgents.forex.data, names: {}, emojis: {} },
    { id: 'commodity', label: 'Commodités', icon: '🏆', data: liveAgents.commodities.data, names: {}, emojis: {} },
  ];
  const current = tabs.find(t => t.id === tab);

  return (
    <View style={{ flex: 1 }}>
      {/* Tab Bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 50, borderBottomWidth: 1, borderBottomColor: C.border }} contentContainerStyle={{ paddingHorizontal: 16, gap: 6, alignItems: 'center' }}>
        {tabs.map(t => (
          <TouchableOpacity key={t.id} onPress={() => setTab(t.id)} style={{
            paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
            backgroundColor: tab === t.id ? 'rgba(107,165,255,0.12)' : 'transparent',
            borderWidth: 1, borderColor: tab === t.id ? 'rgba(107,165,255,0.25)' : 'transparent',
          }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: tab === t.id ? C.primary : C.textDim }}>
              {t.icon} {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Asset List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100 }}>
        {Object.keys(current?.data || {}).length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color={C.primary} />
            <Text style={{ color: C.textDim, marginTop: 12, fontSize: 13 }}>Chargement des données live...</Text>
          </View>
        ) : (
          Object.entries(current.data).map(([sym, d]) => (
            <AssetRow
              key={sym}
              sym={d.sym || sym}
              name={d.name || current.names[sym] || ''}
              emoji={d.emoji || current.emojis[sym] || '📊'}
              price={d.price}
              chg={d.chg}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function PortfolioScreen({ positions, balance, getPnl, closePo }) {
  const totalPnl = positions.reduce((s, p) => s + (getPnl?.(p) || 0), 0);
  const equity = balance + positions.reduce((s, p) => s + p.amt + (getPnl?.(p) || 0), 0);

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 100, padding: 20 }}>
      <View style={[s.card, { alignItems: 'center', paddingVertical: 24, marginBottom: 16 }]}>
        <Text style={{ fontSize: 10, color: C.textDim, textTransform: 'uppercase', fontWeight: '700', letterSpacing: 1 }}>Valeur du portefeuille</Text>
        <Text style={{ fontSize: 32, fontWeight: '800', color: C.text, marginTop: 4 }}>{fUSD(equity)}</Text>
        <Text style={{ fontSize: 14, fontWeight: '700', color: totalPnl >= 0 ? C.green : C.red, marginTop: 4 }}>
          P&L: {totalPnl >= 0 ? '+' : ''}{fUSD(totalPnl)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <StatCard label="Cash" value={fUSD(balance)} color={C.green} icon="💵" />
        <StatCard label="Positions" value={`${positions.length}`} color={C.primary} icon="📊" />
      </View>

      <Text style={{ fontSize: 13, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Positions ouvertes</Text>

      {positions.length === 0 ? (
        <View style={[s.card, { alignItems: 'center', paddingVertical: 40 }]}>
          <Text style={{ fontSize: 40, marginBottom: 8, opacity: 0.3 }}>📊</Text>
          <Text style={{ color: C.textDim, fontSize: 14 }}>Aucune position. Commencez à investir !</Text>
        </View>
      ) : (
        positions.map((p, i) => {
          const pnl = getPnl?.(p) || 0;
          return (
            <View key={i} style={[s.card, { marginBottom: 8, flexDirection: 'row', alignItems: 'center' }]}>
              <Text style={{ fontSize: 20, marginRight: 10 }}>{p.icon || '📊'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.textBold, { fontSize: 14 }]}>{p.sym}</Text>
                <Text style={{ fontSize: 10, color: C.textDim }}>
                  {p.side === 'long' ? '↑ LONG' : '↓ SHORT'} · x{p.lev} · {fUSD(p.amt)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: pnl >= 0 ? C.green : C.red }}>
                  {pnl >= 0 ? '+' : ''}{fUSD(pnl)}
                </Text>
                <TouchableOpacity onPress={() => closePo(i)} style={{ marginTop: 4, backgroundColor: 'rgba(239,83,80,0.12)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: C.red }}>Fermer</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function LiveAgentsScreen({ liveAgents }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 100 }}>
      <Text style={{ fontSize: 11, color: C.textDim, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '700', marginBottom: 6 }}>📡 Données en temps réel</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 4 }}>4 Agents Live</Text>
      <Text style={{ fontSize: 13, color: C.textMid, marginBottom: 24, lineHeight: 20 }}>
        Chaque agent récupère indépendamment les données de marché. Pas de CORS en React Native — les APIs sont appelées directement.
      </Text>

      {/* Status Overview */}
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
        <StatCard label="Agents actifs" value={`${liveAgents.activeCount}/4`} color={C.green} icon="✓" />
        <StatCard label="Total fetches" value={`${liveAgents.agents.reduce((s, a) => s + (a.fetches || 0), 0)}`} color={C.primary} icon="📡" />
      </View>

      {/* Agent Cards */}
      {liveAgents.agents.map((agent, i) => (
        <AgentBadge key={i} agent={agent} />
      ))}

      {/* Live Data Preview */}
      <Text style={{ fontSize: 13, fontWeight: '700', color: C.primary, textTransform: 'uppercase', letterSpacing: 1, marginTop: 20, marginBottom: 12 }}>Aperçu des données</Text>

      {[
        { title: '📊 Actions', data: liveAgents.stocks.data },
        { title: '₿ Crypto', data: liveAgents.crypto.data },
        { title: '💱 Forex', data: liveAgents.forex.data },
        { title: '🏆 Commodités', data: liveAgents.commodities.data },
      ].map((sec, i) => (
        <View key={i} style={[s.card, { marginBottom: 12 }]}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.textMid, marginBottom: 8 }}>{sec.title}</Text>
          {Object.entries(sec.data).length === 0 ? (
            <Text style={{ fontSize: 11, color: C.textDim, fontStyle: 'italic' }}>En attente...</Text>
          ) : (
            Object.entries(sec.data).slice(0, 4).map(([k, v]) => (
              <View key={k} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: C.border }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.text }}>{v.sym || k}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.text }}>${typeof v.price === 'number' ? fmt(v.price) : '—'}</Text>
                  {v.chg != null && (
                    <Text style={{ fontSize: 10, fontWeight: '600', color: v.chg >= 0 ? C.green : C.red }}>
                      {v.chg >= 0 ? '+' : ''}{(+v.chg).toFixed(2)}%
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
      ))}
    </ScrollView>
  );
}

// ═══════════════════════════════════════════════════════════════
//  MAIN APP
// ═══════════════════════════════════════════════════════════════

export default function App() {
  const [page, setPage] = useState('home');
  const [balance, setBalance] = useState(50000);
  const [positions, setPositions] = useState([]);

  // ── 4 Live Data Agents ──
  const liveAgents = useAllLiveAgents({
    stockSymbols: TOP_STOCKS,
    cryptoSymbols: TOP_CRYPTO,
  });

  // P&L calculation
  const getPnl = useCallback((pos) => {
    const allData = { ...liveAgents.stocks.data, ...liveAgents.crypto.data, ...liveAgents.forex.data, ...liveAgents.commodities.data };
    const live = allData[pos.sym];
    const curPrice = live?.price || pos.entryPrice;
    if (pos.side === 'long') return ((curPrice - pos.entryPrice) / pos.entryPrice) * pos.amt * pos.lev;
    return ((pos.entryPrice - curPrice) / pos.entryPrice) * pos.amt * pos.lev;
  }, [liveAgents]);

  const closePo = useCallback((i) => {
    setPositions(p => {
      const pos = p[i];
      if (pos) {
        const pnl = getPnl(pos);
        setBalance(b => b + pos.amt + pnl);
      }
      return p.filter((_, j) => j !== i);
    });
  }, [getPnl]);

  const NAV = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'markets', label: 'Markets', icon: '📊' },
    { id: 'portfolio', label: 'Portfolio', icon: '💼' },
    { id: 'live', label: 'Live', icon: '📡' },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Top Bar */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff' }}>K</Text>
          </View>
          <Text style={{ fontSize: 18, fontWeight: '800' }}>
            <Text style={{ color: C.primary }}>KING</Text>
            <Text style={{ color: C.text }}>EST</Text>
          </Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 4,
            backgroundColor: liveAgents.activeCount > 0 ? 'rgba(38,166,154,0.12)' : 'rgba(107,165,255,0.12)',
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
          }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: liveAgents.activeCount > 0 ? C.green : C.primary }} />
            <Text style={{ fontSize: 10, fontWeight: '700', color: liveAgents.activeCount > 0 ? C.green : C.primary }}>
              {liveAgents.activeCount > 0 ? 'LIVE' : 'SIM'} {liveAgents.activeCount}/4
            </Text>
          </View>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 9, color: C.textDim, textTransform: 'uppercase' }}>Equity</Text>
          <Text style={{ fontSize: 16, fontWeight: '800', color: C.primary }}>
            {fUSD(balance + positions.reduce((s, p) => s + p.amt + (getPnl(p) || 0), 0))}
          </Text>
        </View>
      </View>

      {/* Content */}
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        {page === 'home' && <HomeScreen liveAgents={liveAgents} stocks={liveAgents.stocks} crypto={liveAgents.crypto} forex={liveAgents.forex} commodities={liveAgents.commodities} balance={balance} positions={positions} setPage={setPage} />}
        {page === 'markets' && <MarketsScreen liveAgents={liveAgents} />}
        {page === 'portfolio' && <PortfolioScreen positions={positions} balance={balance} getPnl={getPnl} closePo={closePo} />}
        {page === 'live' && <LiveAgentsScreen liveAgents={liveAgents} />}
      </View>

      {/* Bottom Tab Bar */}
      <View style={{
        flexDirection: 'row', borderTopWidth: 1, borderTopColor: C.border,
        backgroundColor: 'rgba(10,22,40,0.97)', paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8,
      }}>
        {NAV.map(n => (
          <TouchableOpacity key={n.id} onPress={() => setPage(n.id)} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 20 }}>{n.icon}</Text>
            <Text style={{ fontSize: 10, fontWeight: page === n.id ? '700' : '400', color: page === n.id ? C.primary : C.textDim }}>
              {n.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════
//  STYLES
// ═══════════════════════════════════════════════════════════════

const s = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  textBold: {
    color: C.text,
    fontWeight: '700',
  },
});
