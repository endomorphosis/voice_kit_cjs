// Basic English phoneme mapping
const PHONEME_MAP = {
  'a': 'ah',
  'e': 'eh',
  'i': 'ih',
  'o': 'oh',
  'u': 'uh',
  'th': 'θ',
  'ch': 'tʃ',
  'sh': 'ʃ',
  'ph': 'f',
  'wh': 'w',
};

/**
 * Simple English text to phoneme conversion
 * @param {string} text Input text
 * @param {string} language "a" for English or "b" for alternative
 * @returns {Promise<string>} Phonemized text
 */
export async function phonemize(text, language = "a") {
  // Basic English phoneme mapping - can be expanded for better quality
  const phonemeMap = {
    'a': 'ah',
    'e': 'eh',
    'i': 'iy',
    'o': 'ow',
    'u': 'uw',
    'th': 'th',
    'ch': 'ch',
    'sh': 'sh'
  };

  // Convert to lowercase and split into words
  let words = text.toLowerCase().split(' ');
  
  // Simple phoneme conversion
  let phonemes = words.map(word => {
    let result = word;
    for (const [grapheme, phoneme] of Object.entries(phonemeMap)) {
      result = result.replace(new RegExp(grapheme, 'g'), phoneme);
    }
    return result;
  });

  return phonemes.join(' ');
}
