// Utility for generating optical barcodes and confidential admin cost ciphers

/**
 * Encodes a numeric purchase price into an optical merchant secret cipher.
 * Cipher Keyword: MAKINGHOUS (10 unique letters)
 * 1:M, 2:A, 3:K, 4:I, 5:N, 6:G, 7:H, 8:O, 9:U, 0:S
 * Examples:
 *   450 BDT -> I-N-S -> 'INS'
 *   1850 BDT -> M-O-N-S -> 'MONS'
 *   950 BDT -> U-N-S -> 'UNS'
 */
export const DEFAULT_CIPHER_WORD = 'MAKINGHOUS';

export const CIPHER_MAP: Record<string, string> = {
  '1': 'M',
  '2': 'A',
  '3': 'K',
  '4': 'I',
  '5': 'N',
  '6': 'G',
  '7': 'H',
  '8': 'O',
  '9': 'U',
  '0': 'S',
};

export const REVERSE_CIPHER_MAP: Record<string, string> = {
  M: '1',
  A: '2',
  K: '3',
  I: '4',
  N: '5',
  G: '6',
  H: '7',
  O: '8',
  U: '9',
  S: '0',
};

export function encodeAdminCostCipher(costBDT: number, withAsterisks: boolean = false): string {
  if (isNaN(costBDT) || costBDT <= 0) return withAsterisks ? '*S*' : 'S';
  const rounded = Math.round(costBDT).toString();
  const cipherLetters = rounded
    .split('')
    .map((digit) => CIPHER_MAP[digit] || digit)
    .join('');
  return withAsterisks ? `*${cipherLetters}*` : cipherLetters;
}

export function decodeAdminCostCipher(code: string): number | null {
  if (!code) return null;
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (!clean) return null;
  let numStr = '';
  for (const ch of clean) {
    if (REVERSE_CIPHER_MAP[ch] !== undefined) {
      numStr += REVERSE_CIPHER_MAP[ch];
    } else if (/\d/.test(ch)) {
      numStr += ch;
    } else {
      return null;
    }
  }
  return numStr ? parseInt(numStr, 10) : null;
}

/**
 * Standard Code-128 B subset pattern table for rendering high-precision SVG barcodes.
 * Each character is represented by 6 bar/space widths totaling 11 module units.
 */
const CODE128_PATTERNS: Record<string, string> = {
  ' ': '212222', '!': '222122', '"': '222221', '#': '121223', '$': '121322',
  '%': '131222', '&': '122213', "'": '122312', '(': '132212', ')': '221213',
  '*': '221312', '+': '231212', ',': '112232', '-': '122132', '.': '122231',
  '/': '113222', '0': '123122', '1': '123221', '2': '223211', '3': '221132',
  '4': '221231', '5': '213212', '6': '223112', '7': '312131', '8': '311222',
  '9': '321122', ':': '321221', ';': '312212', '<': '322112', '=': '322211',
  '>': '212123', '?': '212321', '@': '232121', 'A': '111323', 'B': '131123',
  'C': '131321', 'D': '112313', 'E': '132113', 'F': '132311', 'G': '211313',
  'H': '231113', 'I': '231311', 'J': '112133', 'K': '112331', 'L': '132131',
  'M': '113123', 'N': '113321', 'O': '133121', 'P': '313121', 'Q': '211331',
  'R': '231131', 'S': '213113', 'T': '213311', 'U': '213131', 'V': '311123',
  'W': '311321', 'X': '331121', 'Y': '312113', 'Z': '312311', '[': '332111',
  '\\': '314111', ']': '221411', '^': '431111', '_': '111224', '`': '111422',
  'a': '121124', 'b': '121421', 'c': '141122', 'd': '141221', 'e': '112214',
  'f': '112412', 'g': '122114', 'h': '122411', 'i': '142112', 'j': '142211',
  'k': '241211', 'l': '221114', 'm': '413111', 'n': '241112', 'o': '134111',
  'p': '111242', 'q': '121142', 'r': '121241', 's': '114212', 't': '124112',
  'u': '124211', 'v': '411212', 'w': '421112', 'x': '421211', 'y': '212141',
  'z': '214121',
};

// Start B is 211214, Stop is 2331112
const START_B_PATTERN = '211214';
const STOP_PATTERN = '2331112';

/**
 * Generates an SVG path string or bar array for Code-128
 */
export function generateBarcodeBars(text: string): { width: number; isBar: boolean }[] {
  const safeText = text.replace(/[^A-Za-z0-9\-._ ]/g, '').substring(0, 16);
  const patternString =
    START_B_PATTERN +
    safeText
      .split('')
      .map((ch) => CODE128_PATTERNS[ch] || '111111')
      .join('') +
    STOP_PATTERN;

  const bars: { width: number; isBar: boolean }[] = [];
  let isBar = true;

  for (let i = 0; i < patternString.length; i++) {
    const width = parseInt(patternString[i], 10) || 1;
    bars.push({ width, isBar });
    isBar = !isBar;
  }

  return bars;
}

/**
 * Generate a unique SKU for new eyewear entries
 */
export function generateEyewearSKU(brand: string, model: string): string {
  const bCode = brand.replace(/[^A-Za-z0-9]/g, '').substring(0, 3).toUpperCase() || 'FRM';
  const mCode = model.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase() || 'MOD';
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `MDN-${bCode}-${mCode}-${randomSuffix}`;
}
