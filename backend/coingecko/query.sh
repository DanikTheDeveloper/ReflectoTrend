#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_FILE="${SCRIPT_DIR}/trending-coins.json"
LOG_FILE="${SCRIPT_DIR}/cron.log"

mkdir -p "$SCRIPT_DIR"

echo "$(date): Fetching CoinGecko top gainers..." | tee -a "$LOG_FILE"

RESPONSE=$(curl -s "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=price_change_percentage_24h_desc&per_page=10&page=1&sparkline=false")

if [[ -z "$RESPONSE" ]]; then
    echo "$(date): ERROR - Empty response from API" | tee -a "$LOG_FILE"
    exit 1
fi

echo "$RESPONSE" | jq -c '.' > "$OUTPUT_FILE"

echo "$(date): SUCCESS - coins saved" | tee -a "$LOG_FILE"
