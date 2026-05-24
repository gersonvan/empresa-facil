#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://127.0.0.1:3333}"
DEVICE_ID="${DEVICE_ID:-smoke-device-1}"
EVENT_ID="smoke-evt-$(date +%s)"
TIMESTAMP_MS="$(($(date +%s) * 1000))"

printf '1) GET /health\n'
curl -sS "$BASE_URL/health"
echo

printf '2) GET /ready\n'
curl -sS "$BASE_URL/ready"
echo

printf '3) POST /api/sync/push\n'
curl -sS -X POST "$BASE_URL/api/sync/push" \
  -H 'content-type: application/json' \
  -d "{\"deviceId\":\"$DEVICE_ID\",\"since\":0,\"events\":[{\"id\":\"$EVENT_ID\",\"aggregateType\":\"launch\",\"aggregateId\":\"launch-001\",\"timestamp\":$TIMESTAMP_MS,\"eventType\":\"LaunchRegistered\",\"eventVersion\":1,\"payload\":{\"companyId\":\"cmp-001\",\"month\":\"2026-05\",\"costType\":\"fixed\",\"description\":\"Assinatura SaaS\",\"amount\":99.9},\"reason\":null}]}"
echo

printf '4) GET /api/sync/pull\n'
curl -sS "$BASE_URL/api/sync/pull?since=0&deviceId=$DEVICE_ID&limit=10"
echo

printf '\nSmoke test completed successfully.\n'
