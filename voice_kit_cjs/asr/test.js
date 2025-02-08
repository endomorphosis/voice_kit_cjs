const fs = require('fs');
const path = require('path');
const https = require('https');
const WhisperDiarization = require('./whisper_diarization');

async function downloadTestAudio() {
    // Using a short sample from Common Voice dataset
    const url = 'https://common-voice-data-download.s3.amazonaws.com/cv-corpus-6.1-2020-12-11/en/clips/common_voice_en_18885784.mp3';
    const outputPath = path.join(__dirname, 'test_audio.mp3');

    if (fs.existsSync(outputPath)) {
        return outputPath;
    }

    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            const fileStream = fs.createWriteStream(outputPath);
            response.pipe(fileStream);
            fileStream.on('finish', () => {
                fileStream.close();
                resolve(outputPath);
            });
        }).on('error', (err) => {
            fs.unlinkSync(outputPath);
            reject(err);
        });
    });
}

async function runTest() {
    try {
        console.log('Starting WhisperDiarization test...');
        
        // Download test audio if not exists
        const audioPath = await downloadTestAudio();
        console.log('Test audio ready at:', audioPath);

        // Initialize WhisperDiarization
        const whisperDiarization = new WhisperDiarization();
        console.log('Initializing WhisperDiarization...');
        await whisperDiarization.initialize();

        // Run transcription
        console.log('Running transcription with diarization...');
        const result = await whisperDiarization.transcribeWithDiarization(audioPath);

        console.log('\nTranscription Results:');
        console.log('===================');
        result.forEach(segment => {
            console.log(`[${segment.speaker}] ${segment.start.toFixed(2)}s - ${segment.end.toFixed(2)}s: ${segment.text}`);
        });

        console.log('\nTest completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
        process.exit(1);
    }
}

// Run the test
runTest();


const WhisperDiarization = require('./whisper_diarization');
const BrowserMicProcessor = require('./browser_mic_processor');

// Example usage in browser environment
async function demoMicProcessing() {
    const whisperDiarization = new WhisperDiarization();
    const micProcessor = new BrowserMicProcessor({
        lowPassFrequency: 1000,
        threshold: -50,
        bufferSize: 4096,
        sampleRate: 16000
    });

    // Listen for transcription results
    window.addEventListener('transcription', (event) => {
        console.log('Transcription result:', event.detail);
    });

    try {
        await micProcessor.initialize(whisperDiarization);
        
        // Start recording
        micProcessor.startRecording();

        // Stop after 10 seconds for demo
        setTimeout(async () => {
            await micProcessor.stopRecording();
            micProcessor.cleanup();
        }, 10000);

    } catch (error) {
        console.error('Error in demo:', error);
    }
}

// Only run if in browser environment
if (typeof window !== 'undefined') {
    demoMicProcessing();
}