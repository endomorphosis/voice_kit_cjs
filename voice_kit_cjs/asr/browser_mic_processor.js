class BrowserMicProcessor {
    constructor(resources = {}, metadata = {}) {
        this.audioContext = null;
        this.mediaStream = null;
        this.micSource = null;
        this.processor = null;
        this.whisperDiarization = null;
        this.isRecording = false;
        
        // Audio processing parameters
        this.metadata = {
            lowPassFrequency: metadata.lowPassFrequency || 1000,
            threshold: metadata.threshold || -50,
            bufferSize: metadata.bufferSize || 4096,
            sampleRate: metadata.sampleRate || 16000
        };

        this.audioChunks = [];
        this.silenceStart = null;
        this.silenceDuration = 1000; // 1 second of silence to trigger processing
    }

    async initialize(whisperDiarization) {
        this.whisperDiarization = whisperDiarization;
        await this.whisperDiarization.initialize();

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.metadata.sampleRate
            });

            // Get microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            this.micSource = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Create low-pass filter
            this.lowPassFilter = this.audioContext.createBiquadFilter();
            this.lowPassFilter.type = 'lowpass';
            this.lowPassFilter.frequency.value = this.metadata.lowPassFrequency;

            // Create script processor for custom processing
            this.processor = this.audioContext.createScriptProcessor(
                this.metadata.bufferSize,
                1, // mono input
                1  // mono output
            );

            // Connect the audio processing chain
            this.micSource.connect(this.lowPassFilter);
            this.lowPassFilter.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            this.setupAudioProcessing();
        } catch (error) {
            console.error('Error initializing audio:', error);
            throw error;
        }
    }

    setupAudioProcessing() {
        this.processor.onaudioprocess = (e) => {
            if (!this.isRecording) return;

            const inputData = e.inputBuffer.getChannelData(0);
            const rms = this.calculateRMS(inputData);
            const db = 20 * Math.log10(rms);

            // Check if audio is above threshold
            if (db > this.metadata.threshold) {
                this.silenceStart = null;
                this.audioChunks.push(new Float32Array(inputData));
            } else if (this.audioChunks.length > 0) {
                if (!this.silenceStart) {
                    this.silenceStart = Date.now();
                } else if (Date.now() - this.silenceStart > this.silenceDuration) {
                    this.processAudioChunk();
                }
            }
        };
    }

    calculateRMS(buffer) {
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) {
            sum += buffer[i] * buffer[i];
        }
        return Math.sqrt(sum / buffer.length);
    }

    async processAudioChunk() {
        if (this.audioChunks.length === 0) return;

        // Combine all chunks into a single buffer
        const totalLength = this.audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
        const combinedBuffer = new Float32Array(totalLength);
        let offset = 0;

        for (const chunk of this.audioChunks) {
            combinedBuffer.set(chunk, offset);
            offset += chunk.length;
        }

        // Convert to 16-bit PCM
        const pcmBuffer = new Int16Array(combinedBuffer.length);
        for (let i = 0; i < combinedBuffer.length; i++) {
            pcmBuffer[i] = Math.max(-32768, Math.min(32767, combinedBuffer[i] * 32768));
        }

        try {
            const result = await this.whisperDiarization.transcribeWithDiarization(pcmBuffer.buffer);
            this.emitResult({
                timestamp: new Date().toISOString(),
                segments: result,
                duration: totalLength / this.metadata.sampleRate
            });
        } catch (error) {
            console.error('Error processing audio:', error);
        }

        // Clear the buffer
        this.audioChunks = [];
        this.silenceStart = null;
    }

    emitResult(result) {
        const event = new CustomEvent('transcription', { 
            detail: result 
        });
        window.dispatchEvent(event);
    }

    startRecording() {
        this.isRecording = true;
        this.audioChunks = [];
        this.silenceStart = null;
    }

    async stopRecording() {
        this.isRecording = false;
        await this.processAudioChunk(); // Process any remaining audio
    }

    cleanup() {
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        if (this.micSource) {
            this.micSource.disconnect();
            this.micSource = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }
}

module.exports = BrowserMicProcessor;