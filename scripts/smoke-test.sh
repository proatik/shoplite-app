#!/usr/bin/env bash
# Starts the stack, places one order through the web entry point and waits for it to complete.
set -euo pipefail

BASE_URL=${BASE_URL:-http://localhost:8080/api}
READY_TIMEOUT_SECONDS=${READY_TIMEOUT_SECONDS:-120}
ORDER_TIMEOUT_SECONDS=${ORDER_TIMEOUT_SECONDS:-30}

cd "$(dirname "$0")/.."

fail() {
  echo "smoke test FAILED: $1" >&2
  exit 1
}

echo "1/4 starting the stack"
docker compose up -d --wait || fail 'the stack did not start healthy'

echo "2/4 waiting for $BASE_URL/readyz"
deadline=$((SECONDS + READY_TIMEOUT_SECONDS))
until curl -fsS "$BASE_URL/readyz" > /dev/null 2>&1; do
  ((SECONDS < deadline)) || fail "/readyz not ready after ${READY_TIMEOUT_SECONDS}s"
  sleep 2
done

echo "3/4 placing an order"
response=$(curl -fsS -X POST "$BASE_URL/orders" \
  -H 'Content-Type: application/json' \
  -d '{"product_id": 1, "quantity": 1}') || fail 'POST /orders did not answer 201'
order_id=$(sed -n 's/.*"id":\([0-9][0-9]*\).*/\1/p' <<< "$response")
[[ -n $order_id ]] || fail "no order id in: $response"
echo "    order $order_id created"

echo "4/4 waiting for order $order_id to complete"
deadline=$((SECONDS + ORDER_TIMEOUT_SECONDS))
while :; do
  status=$(curl -fsS "$BASE_URL/orders/$order_id" | sed -n 's/.*"status":"\([A-Z]*\)".*/\1/p')
  echo "    status: ${status:-unknown}"
  case $status in
    COMPLETED) break ;;
    FAILED) fail "order $order_id FAILED" ;;
  esac
  ((SECONDS < deadline)) || fail "order $order_id not COMPLETED after ${ORDER_TIMEOUT_SECONDS}s"
  sleep 1
done

echo "smoke test passed: order $order_id is COMPLETED"
