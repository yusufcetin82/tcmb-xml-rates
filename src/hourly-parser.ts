/**
 * Parser for TCMB Reeskont/Hourly rates XML format.
 * This is a different format than the daily rates XML.
 */

import { XMLParser } from 'fast-xml-parser';
import { TcmbHourlyRate, TcmbHour } from './types.js';
import { ParseError } from './utils/errors.js';
import { normalizeHourlyDate } from './utils/date.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => name === 'kur'
});

/**
 * Currency name mappings for Reeskont endpoint currencies
 */
const CURRENCY_NAMES: Record<string, { tr: string; en: string }> = {
  USD: { tr: 'ABD Doları', en: 'US Dollar' },
  EUR: { tr: 'Euro', en: 'Euro' },
  GBP: { tr: 'İngiliz Sterlini', en: 'British Pound' },
  CHF: { tr: 'İsviçre Frangı', en: 'Swiss Franc' },
  XAU: { tr: 'Altın', en: 'Gold' },
  XAS: { tr: 'Gümüş', en: 'Silver' }
};

/**
 * Parses a number from Turkish format (comma as decimal separator).
 * Example: "43,0443" -> 43.0443
 */
function parseNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') {
    return 0;
  }
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'string') {
    // Replace Turkish decimal comma with dot, remove spaces
    const normalized = val.replace(',', '.').replace(/\s/g, '');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Parses TCMB Reeskont XML format into TcmbHourlyRate array.
 *
 * XML Structure:
 * ```xml
 * <tcmbVeri>
 *   <baslik_bilgi>
 *     <zaman_etiketi>2026-01-05T10:01:28+03:00</zaman_etiketi>
 *   </baslik_bilgi>
 *   <doviz_kur_liste gecerlilik_tarihi="2026-1-5" saat="10:00">
 *     <kur>
 *       <doviz_cinsi_tabani>TRY</doviz_cinsi_tabani>
 *       <doviz_cinsi>USD</doviz_cinsi>
 *       <birim>1</birim>
 *       <alis>43,0443</alis>
 *       <sira_no>1</sira_no>
 *     </kur>
 *   </doviz_kur_liste>
 * </tcmbVeri>
 * ```
 */
export function parseHourlyXml(xmlContent: string): TcmbHourlyRate[] {
  try {
    const parsed = parser.parse(xmlContent);

    if (!parsed.tcmbVeri || !parsed.tcmbVeri.doviz_kur_liste) {
      throw new Error('Invalid hourly XML structure: missing tcmbVeri or doviz_kur_liste');
    }

    const header = parsed.tcmbVeri.baslik_bilgi;
    const kurListe = parsed.tcmbVeri.doviz_kur_liste;

    // Extract metadata
    const timestamp = header?.zaman_etiketi || '';
    const dateAttr = kurListe['@_gecerlilik_tarihi']; // "2026-1-5"
    const hourAttr = kurListe['@_saat'] as TcmbHour;  // "10:00"

    // Normalize date to ISO format
    const isoDate = normalizeHourlyDate(dateAttr);

    // Get rate entries (ensured to be array by parser config)
    const kurlar = kurListe.kur || [];

    return kurlar.map((kur: Record<string, unknown>) => {
      const code = kur.doviz_cinsi as string;
      const names = CURRENCY_NAMES[code] || { tr: code, en: code };

      return {
        code,
        currencyCode: code,
        name: names.tr,
        nameEn: names.en,
        unit: parseInt(String(kur.birim), 10) || 1,
        buying: parseNumber(kur.alis),
        baseCurrency: (kur.doviz_cinsi_tabani as string) || 'TRY',
        date: isoDate,
        hour: hourAttr,
        timestamp,
        orderNo: parseInt(String(kur.sira_no), 10) || 0,
        raw: kur
      };
    });
  } catch (err) {
    if (err instanceof ParseError) {
      throw err;
    }
    throw new ParseError(
      'Failed to parse hourly TCMB XML',
      err instanceof Error ? err.message : String(err)
    );
  }
}
