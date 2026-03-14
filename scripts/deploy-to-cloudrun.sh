#!/bin/bash
# Deploy SayOps to Cloud Run and update Twilio webhooks
set -e

echo "🚀 Deploying SayOps to Cloud Run..."
echo ""

# Load environment variables
source .env.local 2>/dev/null || true

# Check required variables
if [ -z "$TWILIO_ACCOUNT_SID" ] || [ -z "$TWILIO_AUTH_TOKEN" ]; then
  echo "❌ Missing Twilio credentials in .env.local"
  exit 1
fi

# Get Firebase config from .env.local
FIREBASE_API_KEY=$(grep NEXT_PUBLIC_FIREBASE_API_KEY .env.local | cut -d'=' -f2)
FIREBASE_AUTH_DOMAIN=$(grep NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN .env.local | cut -d'=' -f2)
FIREBASE_PROJECT_ID=$(grep NEXT_PUBLIC_FIREBASE_PROJECT_ID .env.local | cut -d'=' -f2)
FIREBASE_STORAGE_BUCKET=$(grep NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET .env.local | cut -d'=' -f2)
FIREBASE_MESSAGING_SENDER_ID=$(grep NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID .env.local | cut -d'=' -f2)
FIREBASE_APP_ID=$(grep NEXT_PUBLIC_FIREBASE_APP_ID .env.local | cut -d'=' -f2)

# Trigger Cloud Build (Twilio/ElevenLabs/Ngrok/APP_URL come from Secret Manager)
echo "📦 Building and deploying..."
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions="\
_NEXT_PUBLIC_FIREBASE_API_KEY=${FIREBASE_API_KEY},\
_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${FIREBASE_AUTH_DOMAIN},\
_NEXT_PUBLIC_FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID},\
_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${FIREBASE_STORAGE_BUCKET},\
_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${FIREBASE_MESSAGING_SENDER_ID},\
_NEXT_PUBLIC_FIREBASE_APP_ID=${FIREBASE_APP_ID}"

echo ""
echo "✅ Deployment complete!"

# Get Cloud Run URL
echo ""
echo "🔍 Getting Cloud Run URL..."
CLOUD_RUN_URL=$(gcloud run services describe sayops \
  --region=us-central1 \
  --format='value(status.url)')

echo "✅ Cloud Run URL: $CLOUD_RUN_URL"

# Update Twilio webhook for existing agents
echo ""
echo "🔧 Updating Twilio webhooks..."

# Get all agents with phone numbers
AGENTS=$(bq query --format=csv --use_legacy_sql=false \
  "SELECT id, phone_number FROM sayops.agents WHERE phone_number IS NOT NULL" \
  | tail -n +2)

if [ -z "$AGENTS" ]; then
  echo "⚠️  No agents with phone numbers found"
else
  echo "$AGENTS" | while IFS=, read -r agent_id phone_number; do
    WEBHOOK_URL="${CLOUD_RUN_URL}/api/twilio/voice/${agent_id}"
    echo "   Updating webhook for agent $agent_id ($phone_number) → $WEBHOOK_URL"

    # Update via Twilio API with Bun
    bun -e "
      import { Twilio } from 'twilio';
      const client = new Twilio('${TWILIO_ACCOUNT_SID}', '${TWILIO_AUTH_TOKEN}');
      (async () => {
        const numbers = await client.incomingPhoneNumbers.list();
        const num = numbers.find(n => n.phoneNumber === '${phone_number}');
        if (num) {
          await client.incomingPhoneNumbers(num.sid).update({
            voiceUrl: '${WEBHOOK_URL}',
            voiceMethod: 'POST'
          });
          console.log('   ✅ Updated ${phone_number}');
        }
      })();
    "
  done
fi

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📞 Your app is live at: $CLOUD_RUN_URL"
echo ""
echo "🔧 Next steps:"
echo "   1. Test by calling your Twilio number"
echo "   2. Monitor logs: gcloud run services logs read sayops --region=us-central1"
echo "   3. Check calls in BigQuery: bq query 'SELECT * FROM sayops.call_history ORDER BY timestamp DESC LIMIT 5'"
echo ""
