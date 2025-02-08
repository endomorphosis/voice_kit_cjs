#!/bin/bash

# Set the target directory
TARGET_DIR="$HOME/Desktop/transformers.js-examples"

# Clone the repository
git clone https://github.com/huggingface/transformers.js-examples.git "$TARGET_DIR"

# Navigate to the project directory
cd "$TARGET_DIR/repositories/deepseek-r1-webgpu"

# Install dependencies
npm install

# Optionally, run the development server (commented out by default)
# npm run dev

echo "Setup complete. Project is located at ~/Desktop/transformers.js-examples/repositories/deepseek-r1-webgpu"

