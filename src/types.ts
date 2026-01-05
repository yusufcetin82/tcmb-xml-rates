export type RateType = 'forex' | 'banknote' | 'all';

// ============= HOURLY RATES TYPES =============

/**
 * Valid hours for TCMB hourly rates (Reeskont endpoint)
 * Rates are published at these times on business days
 */
export type TcmbHour = '10:00' | '11:00' | '12:00' | '13:00' | '14:00' | '15:00';

/**
 * Hourly rate data from TCMB Reeskont endpoint
 * Contains gold (XAU), silver (XAS), and major currencies (USD, EUR, GBP, CHF)
 */
export interface TcmbHourlyRate {
  code: string;             // 'USD', 'EUR', 'XAU', 'XAS'
  currencyCode: string;     // Same as code
  name: string;             // Turkish name: 'ABD Doları', 'Altın'
  nameEn: string;           // English name: 'US Dollar', 'Gold'
  unit: number;             // 1
  buying: number;           // Buying rate (Reeskont only has buying, no selling)
  baseCurrency: string;     // 'TRY'
  date: string;             // ISO date 'YYYY-MM-DD'
  hour: TcmbHour;           // '10:00', '11:00', etc.
  timestamp: string;        // ISO timestamp from zaman_etiketi
  orderNo: number;          // sira_no from XML
  raw?: Record<string, any>;
}

/**
 * Precious metal rate (subset of TcmbHourlyRate for gold/silver)
 */
export interface TcmbPreciousMetalRate {
  code: 'XAU' | 'XAS';
  name: string;             // 'Altın' or 'Gümüş'
  nameEn: string;           // 'Gold' or 'Silver'
  unit: number;
  buying: number;           // TRY per unit
  date: string;
  hour: TcmbHour;
  timestamp: string;
}

/**
 * Options for fetching hourly rates
 */
export interface GetHourlyRatesOptions {
  date?: Date | string;
  hour?: TcmbHour | 'latest';        // Default: 'latest'
  fallbackToLastBusinessDay?: boolean; // Default: true
  fallbackToPreviousHour?: boolean;    // Default: true
  signal?: AbortSignal;
  cache?: boolean;                     // Default: true
}

export interface GetHourlyRateOptions extends GetHourlyRatesOptions {}

export interface GetGoldOptions extends GetHourlyRatesOptions {}

export interface GetHourlyRawXmlOptions {
  date?: Date | string;
  hour?: TcmbHour | 'latest';
  signal?: AbortSignal;
}

// ============= DAILY RATES TYPES =============

export interface TcmbRate {
  code: string;             // 'USD'
  currencyCode: string;     // XML'deki CurrencyCode (çoğunlukla code ile aynı)
  name: string;             // 'ABD DOLARI'
  nameEn?: string | null;   // eğer XML'den İngilizce isim türetilebiliyorsa
  unit: number;             // 1, 10 vb.
  forexBuying: number | null;
  forexSelling: number | null;
  banknoteBuying: number | null;
  banknoteSelling: number | null;
  crossRateUsd: number | null;
  crossRateOther: number | null;
  date: string;             // ISO '2025-11-19'
  effectiveDate: string;    // TCMB'nin Date/Tarih bilgisi, yine ISO
  raw?: Record<string, any>; // İsteğe bağlı: orijinal XML node'unun ham hali
}

export interface GetRatesOptions {
  date?: Date | string;         // '2025-11-19' | new Date()
  rateType?: RateType;          // default: 'all'
  fallbackToLastBusinessDay?: boolean; // default: true
  signal?: AbortSignal;         // isteği iptal etmek için
  cache?: boolean;              // default: true
}

export interface GetRateOptions extends GetRatesOptions {}

export interface ConvertOptions extends GetRatesOptions {
  use?: 'forexBuying' | 'forexSelling' | 'banknoteBuying' | 'banknoteSelling';
}

export interface ListCurrenciesOptions extends GetRatesOptions {}

export interface GetRawXmlOptions {
  date?: Date | string;
  signal?: AbortSignal;
}

