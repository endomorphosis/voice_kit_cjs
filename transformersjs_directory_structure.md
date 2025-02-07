Directory structure:
└── huggingface-transformers.js-examples/
    ├── README.md
    ├── LICENSE
    ├── package.json
    ├── .prettierrc
    ├── adaptive-retrieval/
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .eslintrc.cjs
    │   ├── .gitignore
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       └── worker.js
    ├── attention-visualization/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       └── worker.js
    ├── browser-extension/
    │   ├── README.md
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── webpack.config.js
    │   ├── .gitignore
    │   ├── build/
    │   │   └── .gitignore
    │   ├── public/
    │   │   ├── manifest.json
    │   │   └── icons/
    │   └── src/
    │       ├── background.js
    │       ├── constants.js
    │       ├── content.js
    │       ├── popup.css
    │       ├── popup.html
    │       └── popup.js
    ├── bun/
    │   ├── README.md
    │   ├── bun.lockb
    │   ├── index.ts
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── .gitignore
    ├── code-completion/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           └── Progress.jsx
    ├── cross-encoder/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       └── worker.js
    ├── deepseek-r1-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── Chat.css
    │           ├── Chat.jsx
    │           ├── Progress.jsx
    │           └── icons/
    │               ├── ArrowRightIcon.jsx
    │               ├── BotIcon.jsx
    │               ├── BrainIcon.jsx
    │               ├── StopIcon.jsx
    │               └── UserIcon.jsx
    ├── deno-embed/
    │   ├── README.md
    │   ├── deno.json
    │   ├── deno.lock
    │   └── main.ts
    ├── depth-anything/
    │   ├── index.html
    │   ├── main.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── style.css
    │   ├── vite.config.js
    │   └── .gitignore
    ├── depth-estimation-video/
    │   ├── index.html
    │   ├── main.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── style.css
    │   ├── vite.config.js
    │   └── .gitignore
    ├── depth-pro-node/
    │   ├── README.md
    │   ├── index.js
    │   ├── package-lock.json
    │   ├── package.json
    │   └── assets/
    ├── florence2-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── ImageInput.jsx
    │           └── Progress.jsx
    ├── gemma-2-2b-jpn-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── Chat.css
    │           ├── Chat.jsx
    │           ├── Progress.jsx
    │           └── icons/
    │               ├── ArrowRightIcon.jsx
    │               ├── BotIcon.jsx
    │               ├── StopIcon.jsx
    │               └── UserIcon.jsx
    ├── janus-pro-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── Chat.css
    │           ├── Chat.jsx
    │           ├── ImagePreview.jsx
    │           ├── Progress.jsx
    │           └── icons/
    │               ├── ArrowRightIcon.jsx
    │               ├── BotIcon.jsx
    │               ├── CrossIcon.jsx
    │               ├── ImageIcon.jsx
    │               ├── StopIcon.jsx
    │               └── UserIcon.jsx
    ├── janus-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── Chat.css
    │           ├── Chat.jsx
    │           ├── ImagePreview.jsx
    │           ├── Progress.jsx
    │           └── icons/
    │               ├── ArrowRightIcon.jsx
    │               ├── BotIcon.jsx
    │               ├── CrossIcon.jsx
    │               ├── ImageIcon.jsx
    │               ├── StopIcon.jsx
    │               └── UserIcon.jsx
    ├── llama-3.2-node/
    │   ├── README.md
    │   ├── index.js
    │   ├── package-lock.json
    │   └── package.json
    ├── llama-3.2-reasoning-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── Chat.css
    │           ├── Chat.jsx
    │           ├── Progress.jsx
    │           └── icons/
    │               ├── ArrowRightIcon.jsx
    │               ├── BotIcon.jsx
    │               ├── BrainIcon.jsx
    │               ├── StopIcon.jsx
    │               └── UserIcon.jsx
    ├── llama-3.2-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── Chat.css
    │           ├── Chat.jsx
    │           ├── Progress.jsx
    │           └── icons/
    │               ├── ArrowRightIcon.jsx
    │               ├── BotIcon.jsx
    │               ├── StopIcon.jsx
    │               └── UserIcon.jsx
    ├── moonshine-web/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── constants.js
    │       ├── index.css
    │       ├── main.jsx
    │       ├── processor.js
    │       ├── utils.js
    │       ├── worker.js
    │       └── components/
    │           ├── AnimatedMesh.jsx
    │           └── BloomScene.jsx
    ├── musicgen-web/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.css
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       └── utils.js
    ├── next-server/
    │   ├── README.md
    │   ├── Dockerfile
    │   ├── jsconfig.json
    │   ├── next.config.mjs
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.mjs
    │   ├── tailwind.config.js
    │   ├── .eslintrc.json
    │   ├── .gitignore
    │   ├── app/
    │   │   ├── classifier.js
    │   │   ├── globals.css
    │   │   ├── layout.js
    │   │   ├── page.js
    │   │   ├── api/
    │   │   │   └── classify/
    │   │   │       └── route.js
    │   │   └── fonts/
    │   │       ├── GeistMonoVF.woff
    │   │       └── GeistVF.woff
    │   └── public/
    ├── node-audio-processing/
    │   ├── index.js
    │   ├── package-lock.json
    │   └── package.json
    ├── node-cjs/
    │   ├── README.md
    │   ├── index.js
    │   ├── package-lock.json
    │   └── package.json
    ├── node-esm/
    │   ├── README.md
    │   ├── index.js
    │   ├── package-lock.json
    │   └── package.json
    ├── omniparser-node/
    │   ├── captioning.js
    │   ├── detector.js
    │   ├── index.js
    │   ├── package-lock.json
    │   └── package.json
    ├── pglite-semantic-search/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── globals.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── utils/
    │           └── db.js
    ├── phi-3.5-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── Chat.css
    │           ├── Chat.jsx
    │           ├── Progress.jsx
    │           └── icons/
    │               ├── ArrowRightIcon.jsx
    │               ├── BotIcon.jsx
    │               ├── StopIcon.jsx
    │               └── UserIcon.jsx
    ├── realtime-whisper-webgpu/
    │   ├── README.md
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .eslintrc.cjs
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── AudioVisualizer.jsx
    │           ├── LanguageSelector.jsx
    │           └── Progress.jsx
    ├── remove-background-web/
    │   ├── index.html
    │   ├── main.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── style.css
    │   ├── vite.config.js
    │   └── .gitignore
    ├── remove-background-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       └── main.jsx
    ├── sapiens-node/
    │   ├── README.md
    │   ├── index.js
    │   ├── package-lock.json
    │   ├── package.json
    │   └── assets/
    ├── segment-anything-webgpu/
    │   ├── README.md
    │   ├── index.css
    │   ├── index.html
    │   └── index.js
    ├── semantic-audio-search/
    │   ├── index.html
    │   ├── index.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── style.css
    │   ├── utils.js
    │   ├── worker.js
    │   └── .gitignore
    ├── semantic-image-search-web/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── utils.js
    │       ├── worker.js
    │       └── components/
    │           ├── Image.jsx
    │           ├── ImageGrid.jsx
    │           ├── Modal.jsx
    │           └── SearchBar.jsx
    ├── smollm-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── Chat.css
    │           ├── Chat.jsx
    │           ├── Progress.jsx
    │           └── icons/
    │               ├── ArrowRightIcon.jsx
    │               ├── BotIcon.jsx
    │               ├── StopIcon.jsx
    │               └── UserIcon.jsx
    ├── smolvlm-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── Chat.css
    │           ├── Chat.jsx
    │           ├── ImagePreview.jsx
    │           ├── Progress.jsx
    │           └── icons/
    │               ├── ArrowRightIcon.jsx
    │               ├── BotIcon.jsx
    │               ├── CrossIcon.jsx
    │               ├── ImageIcon.jsx
    │               ├── StopIcon.jsx
    │               └── UserIcon.jsx
    ├── speecht5-web/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── constants.js
    │       ├── index.css
    │       ├── main.jsx
    │       ├── utils.js
    │       ├── worker.js
    │       └── components/
    │           ├── AudioPlayer.jsx
    │           └── Progress.jsx
    ├── sveltekit/
    │   ├── README.md
    │   ├── Dockerfile
    │   ├── eslint.config.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── svelte.config.js
    │   ├── tailwind.config.ts
    │   ├── tsconfig.json
    │   ├── vite.config.ts
    │   ├── .gitignore
    │   ├── .npmrc
    │   ├── .prettierignore
    │   ├── .prettierrc
    │   ├── src/
    │   │   ├── app.css
    │   │   ├── app.d.ts
    │   │   ├── app.html
    │   │   ├── lib/
    │   │   │   └── Classifier.svelte
    │   │   └── routes/
    │   │       ├── +layout.svelte
    │   │       ├── +page.svelte
    │   │       └── api/
    │   │           └── classify/
    │   │               └── +server.ts
    │   └── static/
    ├── text-to-speech-webgpu/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── assets/
    ├── the-tokenizer-playground/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── postcss.config.js
    │   ├── tailwind.config.js
    │   ├── vite.config.js
    │   ├── .gitignore
    │   └── src/
    │       ├── App.css
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           └── Token.jsx
    ├── vanilla-js/
    │   ├── README.md
    │   ├── index.html
    │   ├── index.js
    │   └── style.css
    ├── video-background-removal/
    │   ├── index.html
    │   ├── main.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── style.css
    │   ├── vite.config.js
    │   └── .gitignore
    ├── video-object-detection/
    │   ├── index.html
    │   ├── main.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── style.css
    │   ├── vite.config.js
    │   └── .gitignore
    ├── webgpu-clip/
    │   ├── index.html
    │   ├── main.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── style.css
    │   ├── vite.config.js
    │   └── .gitignore
    ├── webgpu-embedding-benchmark/
    │   ├── index.html
    │   ├── main.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── style.css
    │   ├── vite.config.js
    │   └── .gitignore
    ├── webgpu-nomic-embed/
    │   ├── index.html
    │   ├── main.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── style.css
    │   ├── vite.config.js
    │   └── .gitignore
    ├── whisper-node/
    │   ├── README.md
    │   ├── index.js
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── utils.js
    │   └── word-level-timestamps.js
    ├── whisper-word-timestamps/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       ├── worker.js
    │       └── components/
    │           ├── LanguageSelector.jsx
    │           ├── MediaInput.jsx
    │           ├── Progress.jsx
    │           └── Transcript.jsx
    ├── zero-shot-classification/
    │   ├── README.md
    │   ├── eslint.config.js
    │   ├── index.html
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── vite.config.js
    │   ├── .gitignore
    │   ├── public/
    │   └── src/
    │       ├── App.jsx
    │       ├── index.css
    │       ├── main.jsx
    │       └── worker.js
    └── .scripts/
        ├── build.js
        └── update.js