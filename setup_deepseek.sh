#!/bin/bash
set -e

# Directory to clone the repository into
TARGET_DIR="$HOME/Desktop/transformers.js-examples"

# Repository URL
REPO_URL="https://github.com/huggingface/transformers.js-examples.git"

# Clone repository if it doesn't exist
if [ -d "$TARGET_DIR" ]; then
  echo "Repository already cloned into $TARGET_DIR."
else
  echo "Cloning repository into $TARGET_DIR..."
  git clone "$REPO_URL" "$TARGET_DIR"
fi

# Change directory to the deepseek-r1-webgpu folder
if [ -d "$TARGET_DIR/deepseek-r1-webgpu" ]; then
  cd "$TARGET_DIR/deepseek-r1-webgpu"
else
  echo "deepseek-r1-webgpu folder not found. Exiting."
  exit 1
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Start the development server
echo "Starting development server..."
npm run dev
