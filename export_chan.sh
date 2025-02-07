#!/bin/bash

# Ensure the script exits on errors and undefined variables
set -euo pipefail

# Add -x for debugging:  Print each command before execution.
set -x

# Define paths and variables #$PWD
OUTPUT_DIR="$PWD/team_chat/"
CHANNEL_ID="1332237033673850880"

# Check if Docker is installed and running
if ! docker info > /dev/null 2>&1; then
  echo "Error: Docker is not installed or not running."
  exit 1
fi

# Create the output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"
if [[ $? -ne 0 ]]; then
  echo "Error: Failed to create output directory: $OUTPUT_DIR"
  exit 1
fi

# Prompt the user for the Discord token
read -r -s -p "Enter your Discord token: " DISCORD_TOKEN
echo ""  # Newline after the prompt

# Run the Docker command to export the Discord channel
docker run --rm -it \
  -v "$OUTPUT_DIR:/out" \
  --env DISCORD_TOKEN="$DISCORD_TOKEN" \
  tyrrrz/discordchatexporter:stable export \
  -f "Json" \
  -c "$CHANNEL_ID" \
  -t "$DISCORD_TOKEN"
  #--after "2024-10-11 23:59"  <- Temporarily removed for debugging

# checking return code from docker
if [[ $? -ne 0 ]]; then
    echo "Error: Docker command failed."
    exit 1
fi

echo "Export complete. Files saved to $OUTPUT_DIR."
