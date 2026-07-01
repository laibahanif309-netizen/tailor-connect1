#!/usr/bin/env bash
# Exercise GET/PATCH /api/tailors/me and portfolio/fabric routes.
#
# Usage:
#   export TOKEN='<jwt from POST /api/auth/login>'
#   export API_URL='http://127.0.0.1:3001/api'   # optional
#   ./scripts/curl-tailor-me-api.sh
#
# Or one-shot login (tailor account must exist):
#   API_URL=http://127.0.0.1:3001/api \
#   TAILOR_EMAIL=tailor1@tailorconnect.com TAILOR_PASSWORD='Password@123' \
#   ./scripts/curl-tailor-me-api.sh
set -euo pipefail

API_URL="${API_URL:-http://127.0.0.1:3001/api}"
IMG="$(mktemp /tmp/tailor-curl-XXXXXX.png)"
printf 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' | base64 -d >"$IMG"
trap 'rm -f "$IMG"' EXIT

if [[ -z "${TOKEN:-}" ]]; then
  if [[ -n "${TAILOR_EMAIL:-}" && -n "${TAILOR_PASSWORD:-}" ]]; then
    TOKEN="$(curl -sS -X POST "$API_URL/auth/login" \
      -H 'Content-Type: application/json' \
      -d "{\"email\":\"$TAILOR_EMAIL\",\"password\":\"$TAILOR_PASSWORD\"}" \
      | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); if(!j.success)throw new Error(j.message); process.stdout.write(j.data.token);")"
    echo "Logged in, token length: ${#TOKEN}"
  else
    echo "Set TOKEN, or TAILOR_EMAIL + TAILOR_PASSWORD" >&2
    exit 1
  fi
fi

AUTH=( -H "Authorization: Bearer $TOKEN" )

echo "== GET $API_URL/tailors/me =="
curl -sS "$API_URL/tailors/me" "${AUTH[@]}" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.success,j.message,j.data?.tailor?.businessName)"

echo "== PATCH $API_URL/tailors/me =="
curl -sS -X PATCH "$API_URL/tailors/me" "${AUTH[@]}" \
  -H 'Content-Type: application/json' \
  -d '{"businessName":"Curl Shop","location":"Test City","description":"curl","yearsOfExperience":5,"specializations":["Men'\''s Wear","Formal"],"isAvailable":true,"phone":"+10005550199"}' \
  | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.success,j.data?.tailor?.businessName)"

echo "== POST $API_URL/tailors/me/profile-image =="
curl -sS -X POST "$API_URL/tailors/me/profile-image" "${AUTH[@]}" \
  -F "image=@$IMG;type=image/png" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.success,j.data)"

echo "== POST $API_URL/tailors/me/portfolio =="
P="$(curl -sS -X POST "$API_URL/tailors/me/portfolio" "${AUTH[@]}" \
  -F "image=@$IMG;type=image/png" -F "description=script test")"
echo "$P" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.success,j.data?.item?.id)"
ITEM_ID="$(echo "$P" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(j.data.item.id)")"

echo "== GET $API_URL/tailors/me/fabrics =="
curl -sS "$API_URL/tailors/me/fabrics" "${AUTH[@]}" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.success,'fabrics',j.data?.fabrics?.length)"

echo "== POST $API_URL/tailors/me/fabrics =="
F="$(curl -sS -X POST "$API_URL/tailors/me/fabrics" "${AUTH[@]}" \
  -F "name=Curl Fabric" -F "price=99" -F "description=script" -F "image=@$IMG;type=image/png")"
echo "$F" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.success,j.data?.fabric?.id)"
FAB_ID="$(echo "$F" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); process.stdout.write(j.data.fabric.id)")"

echo "== PATCH $API_URL/tailors/me/fabrics/$FAB_ID =="
curl -sS -X PATCH "$API_URL/tailors/me/fabrics/$FAB_ID" "${AUTH[@]}" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Curl Fabric v2","price":120,"isActive":true}' \
  | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.success,j.data?.fabric?.name,j.data?.fabric?.price)"

echo "== DELETE $API_URL/tailors/me/fabrics/$FAB_ID (soft) =="
curl -sS -X DELETE "$API_URL/tailors/me/fabrics/$FAB_ID" "${AUTH[@]}" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.success,j.data)"

echo "== DELETE $API_URL/tailors/me/portfolio/$ITEM_ID =="
curl -sS -X DELETE "$API_URL/tailors/me/portfolio/$ITEM_ID" "${AUTH[@]}" | node -e "const j=JSON.parse(require('fs').readFileSync(0,'utf8')); console.log(j.success,j.data)"

echo "All curl checks finished OK."
