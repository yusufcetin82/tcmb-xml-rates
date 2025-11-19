Süper, artık “gerçek” bir paket olduğuna göre onu biraz cilayalım. 😊
Aşağıya direkt kopyalayıp kullanabileceğin metinler bırakıyorum.

---

## 1. GitHub “About” alanı için öneri

**Description** (repo header’daki küçük açıklama):

> Type-safe TCMB (Central Bank of Turkey) XML exchange rates client for Node.js & Next.js. Built-in caching, last business day fallback, and simple currency conversion.

**Topics** (etiketler):

```text
tcmb
exchange-rates
currency
turkey
xml
typescript
nodejs
nextjs
financial
forex
```

Bunlar GitHub aramasında güzel çalışır ve ne yaptığını net anlatır.

---

## 2. `package.json` için description + keywords

`package.json` içine (muhtemelen zaten vardır ama daha “marketing” hale getirelim):

```jsonc
{
  "name": "tcmb-xml-rates",
  "version": "1.0.0",
  "description": "A modern, type-safe TCMB (Central Bank of Turkey) XML exchange rates client for Node.js and Next.js with built-in caching and last business day fallback.",
  "keywords": [
    "tcmb",
    "central bank of turkey",
    "exchange rates",
    "currency",
    "forex",
    "xml",
    "turkey",
    "node",
    "nodejs",
    "nextjs",
    "typescript",
    "ts",
    "finance",
    "doviz",
    "kur"
  ]
}
```

---

## 3. Güncellenmiş `README.md` (tam versiyon)

Aşağıdakini direkt mevcut README’nin yerine koyabilirsin. İçindeki örnekler seninkinin üzerine kurulmuş durumda, sadece “Why this package?” ve birkaç ek bölüm ekledim.

````md
# tcmb-xml-rates

[![npm version](https://img.shields.io/npm/v/tcmb-xml-rates.svg)](https://www.npmjs.com/package/tcmb-xml-rates)
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)

A modern, type-safe, and reliable Node.js package for fetching exchange rates from the Central Bank of the Republic of Turkey (TCMB).  
Features built-in caching, automatic fallback to the last business day, and a promise-based API.

---

## Why this package?

There are a few old TCMB-related packages on npm, but most of them:

- are **callback-based** or CommonJS-only,
- have **no TypeScript types**,
- don’t handle **weekends / holidays** or **caching** very well.

`tcmb-xml-rates` aims to be a **modern, TS-first** solution:

- ✅ **Type-safe**: Written in TypeScript with full type definitions.  
- ✅ **Modern & lightweight**: Promise-based API, ESM + CJS support, minimal dependencies.  
- ✅ **Production-friendly**: Built-in last business day fallback and in-memory caching.  
- ✅ **Next.js ready**: Great fit for route handlers, server components, and server-side scripts.

---

## Features

- **Modern & Lightweight**  
  Promise-based API, ESM + CJS support, minimal dependencies.

- **Type-Safe**  
  Written in TypeScript with full type definitions.

- **Reliable**  
  Automatically falls back to the previous business day if today’s rates are not yet published or if it’s a holiday.

- ⚡ **Fast**  
  Built-in in-memory caching to prevent redundant network requests.

- **Utilities**  
  Easy currency conversion and currency listing helpers.

---

## Installation

```bash
npm install tcmb-xml-rates
# or
yarn add tcmb-xml-rates
# or
pnpm add tcmb-xml-rates
````

---

## Quick Start

```ts
import { getRate, convert } from 'tcmb-xml-rates';

// Get today's USD rate (with automatic last business day fallback)
const usd = await getRate('USD');

console.log('USD Forex Buying:', usd?.forexBuying);
console.log('USD Forex Selling:', usd?.forexSelling);

// Convert 100 USD to TRY
const tryAmount = await convert(100, 'USD', 'TRY');
console.log(`100 USD is ${tryAmount} TRY`);
```

---

## Usage

### 1. Get Today’s Rates

Fetches the latest available rates.
If today is a holiday or weekend, it intelligently fetches the last available business day’s data by default.

```ts
import { getRates } from 'tcmb-xml-rates';

const rates = await getRates();
console.log(rates);
// Output: [{ code: 'USD', forexBuying: 28.61, ... }, ...]
```

---

### 2. Get Specific Currency Rate

```ts
import { getRate } from 'tcmb-xml-rates';

const usd = await getRate('USD');

console.log(`USD Buying: ${usd?.forexBuying}`);
console.log(`USD Selling: ${usd?.forexSelling}`);
```

---

### 3. Currency Conversion

Easily convert between TRY and foreign currencies, or between two foreign currencies (cross rate via TRY).

```ts
import { convert } from 'tcmb-xml-rates';

// Convert 100 USD to TRY
const tryAmount = await convert(100, 'USD', 'TRY');
console.log(`100 USD is ${tryAmount} TRY`);

// Convert 500 EUR to USD (Cross Rate via TRY)
const usdAmount = await convert(500, 'EUR', 'USD');
console.log(`500 EUR is ${usdAmount} USD`);
```

You can customize which rate field is used (forex vs banknote, buying vs selling) via the options object (see **API – `convert`** below).

---

### 4. Historical Data & Fallback Logic

You can fetch rates for a specific date. The package automatically handles holidays and weekends.

**How fallback works:**
If you request a date (e.g., Sunday) where no official rates exist, the package automatically fetches the data from the previous business day (e.g., Friday).

You can detect if a fallback occurred by checking the `date` field in the response.

```ts
import { getRates } from 'tcmb-xml-rates';

// Requesting rates for a Sunday (e.g., 16 Nov 2025)
const requestedDate = '2025-11-16';

const rates = await getRates({ date: requestedDate });

const rateDate = rates[0].date; // e.g. '2025-11-14' (Friday)

if (requestedDate !== rateDate) {
  console.log(
    `Notice: No data for ${requestedDate}. Returned data from ${rateDate}.`
  );
}
```

---

## Options

Most functions accept a shared options object:

```ts
export interface GetRatesOptions {
  /**
   * Specific date to fetch rates for.
   * - Date object
   * - 'YYYY-MM-DD'
   * Defaults to "today" (in Europe/Istanbul timezone).
   */
  date?: Date | string;

  /**
   * Filter rate types.
   * - 'forex': only entries with forexBuying/forexSelling
   * - 'banknote': only entries with banknoteBuying/banknoteSelling
   * - 'all': return everything
   * Default: 'all'
   */
  rateType?: 'forex' | 'banknote' | 'all';

  /**
   * If true (default), automatically falls back to the previous business day
   * when there is no data for the requested date (weekends, holidays).
   * If false, throws an error when no data exists for the given date.
   */
  fallbackToLastBusinessDay?: boolean;

  /**
   * Enable/disable in-memory caching.
   * Default: true
   */
  cache?: boolean;
}
```

---

## API Overview

### `getRates(options?: GetRatesOptions)`

Fetch all available currency rates for a given date (or today by default).

```ts
import { getRates } from 'tcmb-xml-rates';

const allRates = await getRates();
const onlyForex = await getRates({ rateType: 'forex' });
const onSpecificDate = await getRates({ date: '2025-11-19' });
```

Returns an array of `TcmbRate` objects:

```ts
export interface TcmbRate {
  code: string;             // 'USD'
  currencyCode: string;     // XML CurrencyCode, usually the same as code
  name: string;             // 'ABD DOLARI'
  unit: number;             // e.g. 1, 10 etc.
  forexBuying: number | null;
  forexSelling: number | null;
  banknoteBuying: number | null;
  banknoteSelling: number | null;
  crossRateUsd: number | null;
  crossRateOther: number | null;
  date: string;             // ISO date, e.g. '2025-11-19'
  effectiveDate: string;    // TCMB date in ISO format
}
```

---

### `getRate(code: string, options?: GetRatesOptions)`

Fetch a single currency’s rate.

```ts
import { getRate } from 'tcmb-xml-rates';

const eur = await getRate('EUR');
if (!eur) {
  // not found
}
```

Returns `TcmbRate | null`.

---

### `convert(amount, from, to, options?)`

Convert currency amounts using TCMB rates.

```ts
import { convert } from 'tcmb-xml-rates';

const amountInTry = await convert(250, 'EUR', 'TRY');
const amountInUsd = await convert(1000, 'TRY', 'USD', {
  // use banknote selling instead of forex selling
  use: 'banknoteSelling',
});
```

**Signature:**

```ts
export interface ConvertOptions extends GetRatesOptions {
  /**
   * Which rate field to use when converting.
   * Default: 'forexSelling'
   */
  use?: 'forexBuying' | 'forexSelling' | 'banknoteBuying' | 'banknoteSelling';
}

export async function convert(
  amount: number,
  from: string,
  to: string,
  options?: ConvertOptions
): Promise<number>;
```

---

### `listCurrencies(options?: GetRatesOptions)`

List all available currency codes (e.g. `['USD', 'EUR', 'GBP', ...]`):

```ts
import { listCurrencies } from 'tcmb-xml-rates';

const codes = await listCurrencies();
console.log(codes);
```

---

### `getRawXml(options?)`

For advanced use cases or debugging, you can fetch the raw XML as a string.

```ts
import { getRawXml } from 'tcmb-xml-rates';

const xml = await getRawXml();               // today.xml
const xmlOnDate = await getRawXml({ date: '2025-11-19' });
console.log(xml);
```

---

## Next.js Integration (App Router)

This package is designed to be used primarily on the **server-side**
(Server Components, Route Handlers, or Server Actions) in Next.js to avoid CORS issues and exposing internal logic.

### Server Component Example

```tsx
// app/page.tsx
import { getRate } from 'tcmb-xml-rates';

export default async function Page() {
  const usd = await getRate('USD');

  return (
    <main>
      <h1>Exchange Rates</h1>
      <p>1 USD = {usd?.forexSelling} TRY</p>
    </main>
  );
}
```

---

### Route Handler Example

Create an API endpoint to serve rates to your client-side components.

```ts
// app/api/rates/route.ts
import { getRates } from 'tcmb-xml-rates';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rates = await getRates();
    return NextResponse.json(rates);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Failed to fetch rates' },
      { status: 500 }
    );
  }
}
```

---

## Best Practices & Production Notes

* **Do not call TCMB on every request.**
  Use the built-in cache (`cache: true`) and/or implement your own caching layer (Redis, KV, etc.) in front of `tcmb-xml-rates`.

* **Use server-side only.**
  Avoid calling TCMB directly from the browser to prevent CORS issues and leaking internal details.

* **Be aware of TCMB publication times.**
  Rates are typically updated on business days. Fallback logic helps, but you should still design your system assuming daily, not real-time, updates.

---

## Translations

* 🇬🇧 English: `README.md` (this file)
* 🇹🇷 Turkish: [README.tr.md](./README.tr.md)

---

## Disclaimer & Credits

This package is an **unofficial open-source project** and is **not affiliated** with the Central Bank of the Republic of Turkey (TCMB).

* **Data Source:** All exchange rate data is fetched directly from the official [TCMB XML service](https://www.tcmb.gov.tr).
* **Terms of Use:** Please refer to TCMB’s official website for terms of use regarding their data.
* **Gratitude:** Thanks to TCMB (Türkiye Cumhuriyet Merkez Bankası) for providing public access to this data.

---

## License

MIT

````

---

## 4. Önerilen `README.tr.md` (tam versiyon)

Şu anki Türkçe README’ye erişemedim, o yüzden aşağıya direkt “tam versiyon” bir taslak veriyorum. İstersen birebir değiştir, istersen bölümlerini mevcut dosyanın içine taşı.

```md
# tcmb-xml-rates (Türkçe)

`tcmb-xml-rates`, TCMB’nin (Türkiye Cumhuriyet Merkez Bankası) yayınladığı **XML döviz kurlarını**  
Node.js ve Next.js projelerinde modern, güvenilir ve **TypeScript destekli** bir yapıyla kullanmanı sağlar.

- Dahili önbellekleme (in-memory cache)
- Otomatik **son iş günü fallback** (hafta sonu / resmi tatil)
- Promise tabanlı, TypeScript tipleri hazır bir API

---

## Neden bu paket?

Piyasada TCMB için yazılmış bazı npm paketleri var; ancak çoğu:

- çok eski (callback veya sadece CommonJS),
- TypeScript tipi sunmuyor,
- hafta sonu / resmi tatil mantığını ya hiç düşünmüyor ya da zayıf uyguluyor.

`tcmb-xml-rates` ile amaç:

- **Modern** (ESM + CJS, TS-first),
- **Güvenilir** (iş günü fallback + cache),
- **Kolay entegre edilebilir** (Next.js route handler, server component, cron script)  
bir çözüm sunmak.

---

## Özellikler

- **Modern & Hafif**  
  Promise tabanlı API, ESM + CJS desteği, minimum bağımlılık.

- **TypeScript Dostu**  
  Tam tip tanımları ile geliyor.

- **Güvenilir**  
  İstenilen tarihte veri yoksa (hafta sonu / resmi tatil), otomatik olarak **bir önceki iş gününün** kurlarını getirir (isteğe bağlı kapatılabilir).

- ⚡ **Hızlı**  
  Aynı URL için gereksiz istekleri engelleyen dahili in-memory cache.

- **Kullanışlı yardımcılar**  
  Kolay kur dönüştürme (`convert`) ve döviz listesi alma (`listCurrencies`) fonksiyonları.

---

## Kurulum

```bash
npm install tcmb-xml-rates
# veya
yarn add tcmb-xml-rates
# veya
pnpm add tcmb-xml-rates
````

---

## Hızlı Başlangıç

```ts
import { getRate, convert } from 'tcmb-xml-rates';

// Bugünkü USD kurunu al (gerekirse son iş gününe fallback yapar)
const usd = await getRate('USD');

console.log('USD Alış:', usd?.forexBuying);
console.log('USD Satış:', usd?.forexSelling);

// 100 USD'yi TL'ye çevir
const tryAmount = await convert(100, 'USD', 'TRY');
console.log(`100 USD = ${tryAmount} TL`);
```

---

## Kullanım

### 1. Bugünkü Kurları Getir

```ts
import { getRates } from 'tcmb-xml-rates';

const rates = await getRates();
console.log(rates);
// Örnek: [{ code: 'USD', forexBuying: 28.61, ... }, ...]
```

* Bugün veri yoksa (örneğin Pazar günü) otomatik olarak **bir önceki iş günü** kullanılır.

---

### 2. Tek Bir Dövizin Kurunu Getir

```ts
import { getRate } from 'tcmb-xml-rates';

const eur = await getRate('EUR');

console.log('EUR Alış:', eur?.forexBuying);
console.log('EUR Satış:', eur?.forexSelling);
```

---

### 3. Kur Dönüştürme

```ts
import { convert } from 'tcmb-xml-rates';

// 100 EUR → TL
const tryAmount = await convert(100, 'EUR', 'TRY');

// 500 TL → USD
const usdAmount = await convert(500, 'TRY', 'USD');

// 200 EUR → USD (önce TL, sonra USD üzerinden çapraz kur)
const eurToUsd = await convert(200, 'EUR', 'USD');

console.log({ tryAmount, usdAmount, eurToUsd });
```

İstersen hangi alanı kullanacağını (`forexSelling`, `banknoteBuying` vs.) opsiyonlarla belirleyebilirsin.

---

### 4. Tarihli Veri & İş Günü Fallback

```ts
import { getRates } from 'tcmb-xml-rates';

const istediginTarih = '2025-11-16'; // Pazar diyelim

const rates = await getRates({ date: istediginTarih });

const actualDate = rates[0].date; // Örn: '2025-11-14' (Cuma)

if (actualDate !== istediginTarih) {
  console.log(
    `${istediginTarih} için veri yok. Son iş günü ${actualDate} kullanıldı.`
  );
}
```

Fallback’i kapatmak istersen:

```ts
const rates = await getRates({
  date: '2025-11-16',
  fallbackToLastBusinessDay: false,
}); // Veri yoksa hata fırlatır
```

---

## Opsiyonlar

```ts
export interface GetRatesOptions {
  date?: Date | string;          // Belirli gün. Örn: '2025-11-19'
  rateType?: 'forex' | 'banknote' | 'all';
  fallbackToLastBusinessDay?: boolean; // Varsayılan: true
  cache?: boolean;               // Varsayılan: true
}
```

---

## Next.js ile Kullanım (App Router)

Bu paket, Next.js içinde **server-side** kullanım için tasarlanmıştır
(Server Components, Route Handlers, Server Actions). Böylece:

* CORS problemleri yaşamazsın,
* iç ağ mantığını / config’ini client tarafına sızdırmamış olursun.

### Server Component Örneği

```tsx
// app/page.tsx
import { getRate } from 'tcmb-xml-rates';

export default async function Page() {
  const usd = await getRate('USD');

  return (
    <main>
      <h1>Döviz Kurları</h1>
      <p>1 USD = {usd?.forexSelling} TL</p>
    </main>
  );
}
```

---

### Route Handler Örneği

```ts
// app/api/rates/route.ts
import { getRates } from 'tcmb-xml-rates';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rates = await getRates();
    return NextResponse.json(rates);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Kurlar alınırken bir hata oluştu' },
      { status: 500 }
    );
  }
}
```

---

## En İyi Pratikler

* **Her istekte TCMB’ye gitme.**
  Dahili cache’i ve/veya kendi cache katmanını (Redis, KV, veritabanı) kullan.

* **Server-side kullan.**
  Tarayıcıdan doğrudan TCMB endpoint’ine çağrı yapmak yerine, backend veya Next.js API route üzerinden çağır.

* **TCMB güncellemelerini gerçek zamanlı değil, günlük düşün.**
  Bu veri daha çok günlük raporlama ve fiyatlama için uygundur, high-frequency trading için değil. 🙂

---

## Uyarı & Teşekkür

Bu paket **resmi değildir** ve TCMB (Türkiye Cumhuriyet Merkez Bankası) ile **hiçbir bağlantısı yoktur**.

* **Veri kaynağı:** Tüm kurlar doğrudan TCMB’nin resmi XML servisinden çekilir.
* **Kullanım koşulları:** Lütfen TCMB’nin sitesindeki resmi şartları ve yasal uyarıları inceleyin.
* **Teşekkür:** Bu veriyi kamuya açık sunduğu için TCMB’ye teşekkürler.

---

## Lisans

MIT

```

---

Eğer istersen bir sonraki adımda:

- basit bir GitHub Actions workflow (test + build + release),
- veya kısa bir örnek “cron script” (günlük kurları alıp DB’ye yazan)  

için de hazır dosya şablonları çıkartabilirim.
::contentReference[oaicite:0]{index=0}
```
