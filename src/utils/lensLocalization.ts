import { COLORS, COATINGS, DESIGNS, MATERIALS } from '../components/OphthalmicLensSelector';

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const localizeLensName = (value: string, language: 'en' | 'bn') => {
  if (!value) return value;

  let result = value;

  for (const entry of [...MATERIALS, ...COATINGS, ...COLORS, ...DESIGNS]) {
    result = result
      .replace(new RegExp(`${escapeRegExp(entry.bn)}\\s*\\([^)]*\\)`, 'g'), entry[language])
      .replace(new RegExp(escapeRegExp(entry.bn), 'g'), entry[language])
      .replace(new RegExp(escapeRegExp(entry.en), 'gi'), entry[language]);
  }

  return result;
};
