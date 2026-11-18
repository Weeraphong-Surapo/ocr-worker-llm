#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3300}"

curl --fail --silent "$BASE_URL/api/v1/health" >/tmp/thai-ocr-health.json

response=$(curl --fail --silent --request POST "$BASE_URL/api/v1/documents" \
  --form document_type=receipt \
  --form 'file=@/etc/hosts;type=image/png')
document_id=$(printf '%s' "$response" | python3 -c 'import json,sys; print(json.load(sys.stdin)["document_id"])')

for _ in $(seq 1 30); do
  status=$(curl --fail --silent "$BASE_URL/api/v1/documents/$document_id/status")
  state=$(printf '%s' "$status" | python3 -c 'import json,sys; print(json.load(sys.stdin)["status"])')
  if [ "$state" = "completed" ]; then break; fi
  if [ "$state" = "failed" ]; then printf '%s\n' "$status"; exit 1; fi
  sleep 1
done

result=$(curl --fail --silent "$BASE_URL/api/v1/documents/$document_id/result")
printf '%s' "$result" | python3 -c 'import json,sys; d=json.load(sys.stdin); assert d["status"] == "completed"; assert d["pages"][0]["lines"][0]["text"] == "บริษัท ตัวอย่าง จำกัด"'
printf 'E2E_VERIFICATION=PASS document_id=%s\n' "$document_id"
