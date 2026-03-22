# Intégration Google Pay - Kingest

## Vue d'ensemble

Google Pay a été intégré dans l'app Kingest comme méthode de paiement en utilisant Stripe comme gateway de tokenisation.

## Fichiers modifiés

### 1. `/sessions/sweet-epic-rubin/mnt/kingest/index.html`
- **Changement**: Ajout du script Google Pay dans le `<head>`
- **Script**: `<script src="https://pay.google.com/gp/p/js/pay.js" async></script>`
- **Raison**: Charge l'API Google Pay JavaScript globalement

### 2. `/sessions/sweet-epic-rubin/mnt/kingest/src/pages/DepositPage.jsx`

#### États ajoutés
```javascript
const [googlePayAvailable, setGooglePayAvailable] = useState(false);
```

#### useEffect - Détection Google Pay
- Vérifie si `window.google.payments.api.PaymentsClient` est disponible
- Lance `isReadyToPay()` avec une configuration TEST
- Demande les méthodes de paiement: CARD avec VISA/MASTERCARD
- Active le badge "Disponible" si Google Pay est détecté
- Délai de 500ms pour attendre le chargement du script asynchrone

#### handleConfirm - Bloc Google Pay
S'exécute AVANT `setStep("processing")` pour les autres méthodes.

**Si Google Pay est disponible:**
1. Récupère la configuration Stripe via `/api/stripe/config`
2. Crée un `PaymentDataRequest` en mode TEST avec:
   - Gateway: `stripe`
   - Version Stripe: `2024-04-10`
   - PublishableKey: récupéré du backend
3. Lance `loadPaymentData()` pour afficher le popup Google Pay
4. Envoie le token à `/api/stripe/google-pay`
5. Gère les réponses (succès/erreur/annulation)

**Si Google Pay n'est pas disponible:**
- Active le mode simulation
- Délai de 2 secondes
- Crédite automatiquement le montant

#### Badge "Disponible"
Affiche un badge vert "Disponible" sous Google Pay quand `googlePayAvailable === true`.

### 3. `/sessions/sweet-epic-rubin/mnt/kingest/server/index.js`

#### Endpoint: `POST /api/stripe/google-pay`

**Rate Limiting**: 10 requêtes par 15 minutes (paymentLimiter)

**Paramètres d'entrée**:
```javascript
{
  token: string,      // Token Google Pay (JSON stringifié)
  amount: number,     // Montant en EUR
  currency: string    // Devise (optionnel, défaut: "eur")
}
```

**Traitement**:
1. Valide les paramètres (token, amount > 1)
2. Parse le token JSON
3. Extrait le Stripe payment method ID
4. Crée un PaymentIntent Stripe avec:
   - Amount en centimes
   - Currency: EUR
   - Payment method: Stripe token ID
   - Confirm: true (confirmation immédiate)
   - Metadata: `{ source: "google_pay", platform: "kingest_ios" }`
5. Enregistre la transaction si succès

**Réponse succès**:
```javascript
{
  ok: true,
  id: paymentIntentId,
  transactionId: uuidv4()
}
```

**Réponse erreur**:
```javascript
{
  ok: false,
  error: "Message d'erreur"
}
```

## Architecture du flux de paiement

```
Utilisateur sélectionne Google Pay
         ↓
DepositPage.jsx charge Google Pay API
         ↓
useEffect détecte isReadyToPay()
         ↓
Badge "Disponible" affiché
         ↓
Utilisateur entre montant → Clique "Confirmer"
         ↓
handleConfirm lance processGooglePay()
         ↓
Récupère config Stripe (/api/stripe/config)
         ↓
Lance loadPaymentData() → Popup Google Pay
         ↓
Utilisateur complète le paiement
         ↓
Google Pay retourne token Stripe
         ↓
Frontend envoie token au backend
         ↓
Backend: POST /api/stripe/google-pay
         ↓
Parse token → Crée PaymentIntent Stripe
         ↓
Si succès: Enregistre transaction
         ↓
UI passe à l'étape "done"
```

## Mode simulation (fallback)

Si Google Pay n'est pas disponible (ex: iOS WKWebView sans support):
1. Détection échoue dans le useEffect
2. Badge "Disponible" ne s'affiche pas
3. Utilisateur peut toujours sélectionner Google Pay
4. Mode simulation s'active: délai de 2 secondes
5. Montant crédité automatiquement

## Configuration requise

### Frontend
- React avec Vite IIFE build (compatible WKWebView iOS)
- Stripe.js v3 déjà chargé
- Google Pay API script chargé asynchroniquement

### Backend (Express.js)
- Stripe SDK configuré (stripe npm package)
- STRIPE_SECRET_KEY et STRIPE_PUBLISHABLE_KEY dans .env
- Rate limiting configuré
- Body parser JSON pour les requêtes POST

## Schéma du token Google Pay

Le token Google Pay reçu au backend a la structure:
```javascript
{
  "id": "pm_XXXXX",
  "object": "payment_method",
  "type": "card",
  "card": {
    "brand": "visa|mastercard",
    "last4": "4242",
    ...
  }
}
```

Le token est JSON stringifié dans `paymentMethodData.tokenizationData.token`.

## Tests à effectuer

### Test 1: Détection Google Pay
- [ ] Ouvrir l'app sur Android avec Google Pay installé
- [ ] Accéder à Dépôt → Vérifier le badge "Disponible" sous Google Pay

### Test 2: Paiement successful
- [ ] Sélectionner Google Pay
- [ ] Entrer un montant ≥ 10 EUR
- [ ] Cliquer "Confirmer"
- [ ] Completer le paiement dans Google Pay
- [ ] Vérifier que le montant est crédité

### Test 3: Annulation
- [ ] Sélectionner Google Pay
- [ ] Cliquer "Confirmer"
- [ ] Appuyer sur Annuler dans Google Pay
- [ ] Vérifier retour à l'écran de confirmation

### Test 4: Fallback mode (iOS)
- [ ] Ouvrir l'app sur iOS WKWebView
- [ ] Accéder à Dépôt
- [ ] Badge "Disponible" NE s'affiche PAS
- [ ] Sélectionner Google Pay
- [ ] Mode simulation s'active (délai 2s)
- [ ] Montant crédité automatiquement

### Test 5: Validation montant
- [ ] Montant < 10 EUR → "Continuer" désactivé
- [ ] Montant > 50000 EUR → Erreur backend

### Test 6: Erreur réseau
- [ ] Simuler erreur réseau pendant /api/stripe/config
- [ ] Vérifier message "Configuration Stripe manquante"

### Test 7: Erreur Stripe
- [ ] PaymentIntent échoue (carte refusée)
- [ ] Vérifier message d'erreur affiché
- [ ] Retour à l'écran de confirmation

## Journalisation

### Frontend (console)
```javascript
console.log('Google Pay check:', error.message); // Erreur isReadyToPay
```

### Backend
```javascript
console.error("[GOOGLE PAY ERROR]", err.message); // Erreur endpoint
```

## Compatibilité

- **Android**: Google Pay natif supporté (isReadyToPay retourne true)
- **iOS**: Google Pay non supporté en WKWebView (fallback simulation)
- **Desktop**: Dépend de la présence de Google Pay installé
- **Navigateur**: Chrome/Firefox sur Android, Safari sur iOS

## Sécurité

1. **Tokenisation Stripe**: Clé publique Stripe utilisée pour tokeniser
2. **Rate limiting**: Max 10 requêtes/15 min par IP
3. **Validation montants**: MIN_AMOUNT=10, MAX_AMOUNT=50000
4. **Métadonnées**: Source et plateforme enregistrées
5. **No PII**: Aucune donnée sensible stockée côté backend

## Prochaines étapes (optionnel)

1. Ajouter supportement des cryptos comme payment method en Google Pay
2. Ajouter webhooks Stripe pour confirmer les paiements asynchrones
3. Ajouter retry logic pour les paiements échoués
4. Intégrer Google Pay Web Token API pour plus de contrôle
5. Ajouter 3D Secure pour cartes nécessitant authentification
