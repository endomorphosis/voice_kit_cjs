const { pipeline } = require('@xenova/transformers');

class WhisperDiarization {
    constructor() {
        this.pipe = null;
        this.initialized = false;
    }

    async initialize() {
        if (!this.initialized) {
            this.pipe = await pipeline('automatic-speech-recognition', 'Xenova/whisper-small');
            this.initialized = true;
        }
    }

    /**
     * Process audio for transcription with speaker diarization
     * @param {ArrayBuffer | string} audioData - Audio data as ArrayBuffer or path to audio file
     * @returns {Promise<Array>} Array of transcribed segments with timing and speaker information
     */
    async transcribeWithDiarization(audioData) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const result = await this.pipe(audioData, {
                chunk_length_s: 30,
                return_timestamps: true,
                stride_length_s: 5
            });

            return this.processTranscription(result);
        } catch (error) {
            console.error('Error during transcription:', error);
            throw error;
        }
    }

    /**
     * Process the transcription result to format segments
     * @private
     */
    processTranscription(result) {
        if (!result.chunks) {
            return [];
        }

        return result.chunks.map((chunk, index) => ({
            id: index,
            start: chunk.timestamp[0],
            end: chunk.timestamp[1],
            text: chunk.text.trim(),
            speaker: `Speaker ${this.detectSpeakerChange(chunk, index, result.chunks) ? index + 1 : index}`
        }));
    }

    /**
     * Simple speaker change detection based on timing gaps
     * @private
     */
    detectSpeakerChange(currentChunk, index, chunks) {
        if (index === 0) return true;
        const previousChunk = chunks[index - 1];
        // If there's a gap of more than 2 seconds, assume it's a different speaker
        return (currentChunk.timestamp[0] - previousChunk.timestamp[1]) > 2;
    }
}

module.exports = WhisperDiarization;