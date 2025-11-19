export type RateType = 'forex' | 'banknote' | 'all';

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

