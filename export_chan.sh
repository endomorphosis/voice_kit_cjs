#!/bin/bash

# Ensure the script exits on errors and undefined variables
set -euo pipefail

# Define paths and variables #$PWD
ENV_FILE="$PWD/.env"
OUTPUT_DIR="$PWD/team_chat/"
CHANNEL_ID="1332237033673850880"

# Check if the .env file exists
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .env file not found at $ENV_FILE"
  exit 1
fi

# Load the Discord token from the .env file
DISCORD_TOKEN=$(grep -E '^DISCORD_TOKEN=' "$ENV_FILE" | cut -d '=' -f 2)

if [[ -z "$DISCORD_TOKEN" ]]; then
  echo "Error: DISCORD_TOKEN is not set in the .env file"
  exit 1
fi

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

# Run the Docker command to export the Discord channel
docker run --rm -it \
  -v "$OUTPUT_DIR:/out" \
  --env DISCORD_TOKEN="$DISCORD_TOKEN" \
  tyrrrz/discordchatexporter:stable export \
  -f "Json" \
  -c "$CHANNEL_ID" \
  -t "$DISCORD_TOKEN" \
  --after "2024-10-11 23:59"

echo "Export complete. Files saved to $OUTPUT_DIR."
