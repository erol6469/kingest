#!/bin/bash
# ============================================
# KINGEST - Activation des clés API
# ============================================
# Usage:
#   ./activate-keys.sh --stripe-sk "sk_test_..." --stripe-pk "pk_test_..." --paypal-id "..." --paypal-secret "..."
#
# Ou juste Stripe:
#   ./activate-keys.sh --stripe-sk "sk_test_xxx" --stripe-pk "pk_test_xxx"
# ============================================

STRIPE_SK=""
STRIPE_PK=""
PAYPAL_ID=""
PAYPAL_SECRET=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --stripe-sk) STRIPE_SK="$2"; shift 2 ;;
    --stripe-pk) STRIPE_PK="$2"; shift 2 ;;
    --paypal-id) PAYPAL_ID="$2"; shift 2 ;;
    --paypal-secret) PAYPAL_SECRET="$2"; shift 2 ;;
    *) echo "Option inconnue: $1"; exit 1 ;;
  esac
done

ENV_FILE="$(dirname "$0")/.env"

echo "# Kingest API Keys - $(date)" > "$ENV_FILE"

if [ -n "$STRIPE_SK" ]; then
  echo "STRIPE_SECRET_KEY=$STRIPE_SK" >> "$ENV_FILE"
  echo "✅ Stripe Secret Key configurée"
fi

if [ -n "$STRIPE_PK" ]; then
  echo "STRIPE_PK=$STRIPE_PK" >> "$ENV_FILE"
  echo "✅ Stripe Publishable Key configurée"
fi

if [ -n "$PAYPAL_ID" ]; then
  echo "PAYPAL_CLIENT_ID=$PAYPAL_ID" >> "$ENV_FILE"
  echo "✅ PayPal Client ID configuré"
fi

if [ -n "$PAYPAL_SECRET" ]; then
  echo "PAYPAL_SECRET=$PAYPAL_SECRET" >> "$ENV_FILE"
  echo "✅ PayPal Secret configuré"
fi

echo ""
echo "📁 Fichier .env créé: $ENV_FILE"
echo ""
echo "🔄 Redémarrage du serveur..."

# Kill existing server
pkill -f "node index.js" 2>/dev/null || true
sleep 1

# Start with env file
cd "$(dirname "$0")"
export $(cat .env | xargs)
nohup node index.js > /tmp/kingest_server.log 2>&1 &
sleep 2

# Test
RESPONSE=$(curl -s http://127.0.0.1:3001/api/config)
echo "📊 Config serveur:"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""
echo "🚀 Serveur redémarré avec les nouvelles clés!"
