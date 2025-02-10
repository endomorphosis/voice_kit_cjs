import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ICON_URL = 'https://avatars.githubusercontent.com/u/123265934';
const SIZES = [16, 24, 32, 48, 128];
const ICONS_DIR = path.join(__dirname, '../public/icons');

// Create icons directory if it doesn't exist
if (!fs.existsSync(ICONS_DIR)) {
    fs.mkdirSync(ICONS_DIR, { recursive: true });
}

// Download and process icon
https.get(ICON_URL, (res) => {
    const chunks = [];
    res.on('data', (chunk) => chunks.push(chunk));
    res.on('end', async () => {
        const buffer = Buffer.concat(chunks);
        
        // Generate icons for all sizes
        for (const size of SIZES) {
            await sharp(buffer)
                .resize(size, size)
                .png()
                .toFile(path.join(ICONS_DIR, `icon${size}.png`));
            console.log(`Generated ${size}x${size} icon`);
        }
    });
}).on('error', (err) => {
    console.error('Error downloading icon:', err);
});