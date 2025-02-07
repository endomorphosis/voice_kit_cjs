#!/bin/bash

# Ensure the script exits on errors and undefined variables
set -euo pipefail

# Add -x for debugging:  Print each command before execution.
set -x

# Define paths and variables #$PWD
ENV_FILE="~/.zshrc"
OUTPUT_DIR="$PWD/team_chat/"
CHANNEL_ID="1332237033673850880"

# Check if the .zshrc file exists
if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: .zshrc file not found at $ENV_FILE"
  exit 1
fi

# Load the Discord token from the .zshrc file
if ! grep -q -E '^DISCORD_TOKEN=' "$ENV_FILE"; then
  echo "Error: DISCORD_TOKEN is not set in $ENV_FILE.  Please ensure that the file exists and contains a line like: DISCORD_TOKEN=your_discord_token"
  exit 1
fi

DISCORD_TOKEN=$(grep -E '^DISCORD_TOKEN=' "$ENV_FILE" | cut -d '=' -f 2)

if [[ -z "$DISCORD_TOKEN" ]]; then
  echo "Error: DISCORD_TOKEN is empty in the .zshrc file"
  exit 1
fi

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
