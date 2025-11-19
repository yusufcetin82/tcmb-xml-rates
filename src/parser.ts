import { XMLParser } from 'fast-xml-parser';
import { TcmbRate } from './types.js';
import { ParseError } from './utils/errors.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name, jpath) => {
    // Currency tag'inin her zaman array olmasını sağla
    if (name === 'Currency') return true;
    return false;
  }
});

function parseNumber(val: any): number | null {
  if (!val) return null;
  if (typeof val === 'number') return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed === '') return null;
    // TCMB uses '.' for decimal usually, but PRD mentions possibility of ','
    // We replace ',' with '.' to be safe if it ever changes or mixes
    // Note: Standard TCMB XML uses '.' for decimals.
    return parseFloat(trimmed.replace(',', '.'));
  }
  return null;
}

export function parseTcmbXml(xmlContent: string): TcmbRate[] {
  try {
    const parsed = parser.parse(xmlContent);

    if (!parsed.Tarih_Date || !parsed.Tarih_Date.Currency) {
      throw new Error('Invalid XML structure: Missing Tarih_Date or Currency nodes');
    }

    const date = parsed.Tarih_Date['@_Date']; // "11/19/2025" or similar
    // Convert date to ISO "YYYY-MM-DD"
    // TCMB Date attr format: MM/DD/YYYY usually
    let isoDate = '';
    if (date) {
      const parts = date.split('/');
      if (parts.length === 3) {
        isoDate = `${parts[2]}-${parts[0]}-${parts[1]}`;
      } else {
        // fallback or keep as is
        isoDate = date;
      }
    }

    const currencies = parsed.Tarih_Date.Currency;
    const rates: TcmbRate[] = currencies.map((c: any) => {
      return {
        code: c['@_CurrencyCode'],
        currencyCode: c['@_CurrencyCode'],
        name: c.Isim ? c.Isim.trim() : '',
        nameEn: c.CurrencyName ? c.CurrencyName.trim() : null,
        unit: c.Unit ? parseInt(c.Unit, 10) : 1,
        forexBuying: parseNumber(c.ForexBuying),
        forexSelling: parseNumber(c.ForexSelling),
        banknoteBuying: parseNumber(c.BanknoteBuying),
        banknoteSelling: parseNumber(c.BanknoteSelling),
        crossRateUsd: parseNumber(c.CrossRateUSD),
        crossRateOther: parseNumber(c.CrossRateOther),
        date: isoDate,
        effectiveDate: date || '', // raw date from attribute
        raw: c // for debug
      };
    });

    return rates;
  } catch (err) {
    throw new ParseError('Failed to parse TCMB XML', (err as Error).message);
  }
}

