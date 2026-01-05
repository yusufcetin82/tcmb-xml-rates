# tcmb-xml-rates

[![npm version](https://img.shields.io/npm/v/tcmb-xml-rates.svg)](https://www.npmjs.com/package/tcmb-xml-rates)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

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
- ✅ **Gold & Silver prices**: Fetch precious metal rates (XAU, XAS) from TCMB Reeskont endpoint.
- ✅ **Hourly rates**: Access hourly exchange rates updated 6 times per day (10:00-15:00).

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
```

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

### Gold & Silver Prices

```ts
import { getGold, getSilver, getPreciousMetals } from 'tcmb-xml-rates';

// Get latest gold price
const gold = await getGold();
console.log(`Gold: ${gold?.buying} TRY/gram (${gold?.hour})`);

// Get latest silver price
const silver = await getSilver();
console.log(`Silver: ${silver?.buying} TRY/gram`);

// Get both at once
const metals = await getPreciousMetals();
console.log(`Gold: ${metals.gold?.buying}, Silver: ${metals.silver?.buying}`);
```

### Hourly Rates

```ts
import { getHourlyRates, getHourlyRate } from 'tcmb-xml-rates';

// Get all hourly rates (USD, EUR, GBP, CHF, XAU, XAS)
const rates = await getHourlyRates();

// Get specific currency at specific hour
const usd = await getHourlyRate('USD', { hour: '14:00' });
console.log(`USD at 14:00: ${usd?.buying} TRY`);
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

## Gold & Silver API (v1.1.0+)

These functions fetch data from TCMB's Reeskont endpoint, which provides hourly updates for gold, silver, and major currencies.

### `getGold(options?)`

Fetch the current gold (XAU) price in TRY.

```ts
import { getGold } from 'tcmb-xml-rates';

const gold = await getGold();
console.log(`Gold: ${gold?.buying} TRY/gram`);

// Get gold price for a specific hour
const gold14 = await getGold({ hour: '14:00' });

// Get gold price for a specific date
const goldYesterday = await getGold({ date: '2025-11-19' });
```

Returns `TcmbPreciousMetalRate | null`:

```ts
interface TcmbPreciousMetalRate {
  code: 'XAU' | 'XAS';
  name: string;       // 'Altın' or 'Gümüş'
  nameEn: string;     // 'Gold' or 'Silver'
  unit: number;
  buying: number;     // TRY per unit
  date: string;       // ISO date
  hour: TcmbHour;     // '10:00' | '11:00' | ... | '15:00'
  timestamp: string;  // ISO timestamp
}
```

---

### `getSilver(options?)`

Fetch the current silver (XAS) price in TRY.

```ts
import { getSilver } from 'tcmb-xml-rates';

const silver = await getSilver();
console.log(`Silver: ${silver?.buying} TRY/gram`);
```

---

### `getPreciousMetals(options?)`

Fetch both gold and silver prices in a single call.

```ts
import { getPreciousMetals } from 'tcmb-xml-rates';

const metals = await getPreciousMetals();
console.log(`Gold: ${metals.gold?.buying}, Silver: ${metals.silver?.buying}`);
```

---

## Hourly Rates API (v1.1.0+)

TCMB publishes hourly exchange rates at 10:00, 11:00, 12:00, 13:00, 14:00, and 15:00 (Istanbul time) on business days.

### `getHourlyRates(options?)`

Fetch all hourly rates (USD, EUR, GBP, CHF, XAU, XAS).

```ts
import { getHourlyRates } from 'tcmb-xml-rates';

// Get latest available rates
const rates = await getHourlyRates();

// Get rates for a specific hour
const rates14 = await getHourlyRates({ hour: '14:00' });

// Get rates for a specific date
const ratesYesterday = await getHourlyRates({ date: '2025-11-19' });
```

Returns an array of `TcmbHourlyRate`:

```ts
interface TcmbHourlyRate {
  code: string;           // 'USD', 'EUR', 'XAU', etc.
  name: string;           // Turkish name
  nameEn: string;         // English name
  unit: number;
  buying: number;         // Buying rate (no selling rate in hourly data)
  baseCurrency: string;   // 'TRY'
  date: string;           // ISO date
  hour: TcmbHour;         // '10:00', '11:00', etc.
  timestamp: string;      // ISO timestamp
}
```

---

### `getHourlyRate(code, options?)`

Fetch a single currency's hourly rate.

```ts
import { getHourlyRate } from 'tcmb-xml-rates';

const usd = await getHourlyRate('USD');
console.log(`USD: ${usd?.buying} TRY (${usd?.hour})`);
```

---

### Hourly Options

```ts
interface GetHourlyRatesOptions {
  date?: Date | string;
  hour?: TcmbHour | 'latest';          // Default: 'latest'
  fallbackToLastBusinessDay?: boolean; // Default: true
  fallbackToPreviousHour?: boolean;    // Default: true
  cache?: boolean;                     // Default: true
}

type TcmbHour = '10:00' | '11:00' | '12:00' | '13:00' | '14:00' | '15:00';
```

**Automatic fallback:**
- If the requested hour is not available, it tries earlier hours (14:00 → 13:00 → 12:00 → ...)
- If no data is available for the day, it falls back to the previous business day
- Set `fallbackToPreviousHour: false` or `fallbackToLastBusinessDay: false` to disable

---

## Usage Examples

### Basic Usage - Get Latest Gold Price

```ts
import { getGold } from 'tcmb-xml-rates';

async function displayGoldPrice() {
  const gold = await getGold();

  if (gold) {
    console.log(`Date: ${gold.date}`);
    console.log(`Hour: ${gold.hour}`);
    console.log(`Gold Price: ${gold.buying.toLocaleString('tr-TR')} TRY/gram`);
  }
}
```

### Compare Gold and Silver

```ts
import { getPreciousMetals } from 'tcmb-xml-rates';

async function comparePreciousMetals() {
  const { gold, silver } = await getPreciousMetals();

  if (gold && silver) {
    const ratio = gold.buying / silver.buying;
    console.log(`Gold/Silver Ratio: ${ratio.toFixed(2)}`);
    console.log(`1 gram gold = ${ratio.toFixed(2)} grams of silver`);
  }
}
```

### Track Gold Price Changes Throughout the Day

```ts
import { getGold, TcmbHour } from 'tcmb-xml-rates';

async function trackGoldPrices() {
  const hours: TcmbHour[] = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];
  const prices: { hour: TcmbHour; price: number }[] = [];

  for (const hour of hours) {
    const gold = await getGold({ hour, cache: false });
    if (gold) {
      prices.push({ hour, price: gold.buying });
    }
  }

  // Find daily high and low
  const high = Math.max(...prices.map(p => p.price));
  const low = Math.min(...prices.map(p => p.price));

  console.log(`Daily High: ${high} TRY`);
  console.log(`Daily Low: ${low} TRY`);
  console.log(`Daily Range: ${(high - low).toFixed(2)} TRY`);
}
```

### Get Historical Gold Price

```ts
import { getGold } from 'tcmb-xml-rates';

async function getHistoricalGold() {
  // Get gold price from a specific date
  const gold = await getGold({ date: '2025-12-15' });

  if (gold) {
    console.log(`Gold on ${gold.date}: ${gold.buying} TRY/gram`);
  }

  // Get gold price for a specific date and hour
  const goldAt14 = await getGold({
    date: '2025-12-15',
    hour: '14:00'
  });
}
```

### Compare Daily vs Hourly USD Rate

```ts
import { getRate, getHourlyRate } from 'tcmb-xml-rates';

async function compareRates() {
  // Daily rate (from /kurlar/ endpoint)
  const dailyUsd = await getRate('USD');

  // Hourly rate (from /reeskontkur/ endpoint)
  const hourlyUsd = await getHourlyRate('USD');

  if (dailyUsd && hourlyUsd) {
    console.log(`Daily USD (Forex Buying): ${dailyUsd.forexBuying}`);
    console.log(`Daily USD (Forex Selling): ${dailyUsd.forexSelling}`);
    console.log(`Hourly USD (${hourlyUsd.hour}): ${hourlyUsd.buying}`);
  }
}
```

### Error Handling

```ts
import {
  getGold,
  getHourlyRates,
  NoBusinessDayDataError,
  NetworkError,
  ParseError
} from 'tcmb-xml-rates';

async function fetchWithErrorHandling() {
  try {
    const gold = await getGold({
      fallbackToLastBusinessDay: false,
      fallbackToPreviousHour: false
    });
    return gold;
  } catch (error) {
    if (error instanceof NoBusinessDayDataError) {
      console.error('No data available for the requested date/hour');
    } else if (error instanceof NetworkError) {
      console.error('Network error:', error.message);
    } else if (error instanceof ParseError) {
      console.error('Failed to parse XML response');
    } else {
      throw error;
    }
    return null;
  }
}
```

### Calculate Gold Value

```ts
import { getGold } from 'tcmb-xml-rates';

async function calculateGoldValue(grams: number) {
  const gold = await getGold();

  if (!gold) {
    throw new Error('Could not fetch gold price');
  }

  const value = grams * gold.buying;

  return {
    grams,
    pricePerGram: gold.buying,
    totalValue: value,
    date: gold.date,
    hour: gold.hour
  };
}

// Usage
const result = await calculateGoldValue(50);
console.log(`50 grams of gold = ${result.totalValue.toLocaleString('tr-TR')} TRY`);
```

### Caching Strategies

```ts
import { getGold, getHourlyRates } from 'tcmb-xml-rates';

// Use built-in cache (default)
const gold1 = await getGold(); // Fetches from TCMB
const gold2 = await getGold(); // Returns cached data (no network request)

// Bypass cache for fresh data
const freshGold = await getGold({ cache: false }); // Always fetches from TCMB

// Implement your own cache layer
import Redis from 'ioredis';
const redis = new Redis();

async function getGoldWithRedisCache() {
  const cacheKey = 'tcmb:gold:latest';
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const gold = await getGold({ cache: false });
  if (gold) {
    await redis.setex(cacheKey, 300, JSON.stringify(gold)); // 5 minutes TTL
  }

  return gold;
}
```

### TypeScript Types

```ts
import type {
  TcmbRate,
  TcmbHourlyRate,
  TcmbPreciousMetalRate,
  TcmbHour,
  GetRatesOptions,
  GetHourlyRatesOptions,
  GetGoldOptions
} from 'tcmb-xml-rates';

// Type-safe hour values
const validHour: TcmbHour = '14:00'; // ✓ OK
// const invalidHour: TcmbHour = '16:00'; // ✗ Type error

// Type-safe options
const options: GetGoldOptions = {
  date: '2025-12-15',
  hour: '14:00',
  fallbackToLastBusinessDay: true,
  cache: true
};
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

### Gold Price API Route

```ts
// app/api/gold/route.ts
import { getGold, getPreciousMetals } from 'tcmb-xml-rates';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type'); // 'gold', 'silver', 'all'

  try {
    if (type === 'all') {
      const metals = await getPreciousMetals();
      return NextResponse.json(metals);
    }

    if (type === 'silver') {
      const silver = await getSilver();
      return NextResponse.json(silver);
    }

    // Default: gold
    const gold = await getGold();
    return NextResponse.json(gold);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch precious metal prices' },
      { status: 500 }
    );
  }
}
```

### Server Action Example

```ts
// app/actions/rates.ts
'use server';

import { getGold, getRate, convert } from 'tcmb-xml-rates';

export async function fetchGoldPrice() {
  const gold = await getGold();
  return gold;
}

export async function fetchUsdRate() {
  const usd = await getRate('USD');
  return usd;
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
) {
  const result = await convert(amount, from, to);
  return result;
}
```

### Client Component with Server Action

```tsx
// app/components/GoldPriceDisplay.tsx
'use client';

import { useState, useEffect } from 'react';
import { fetchGoldPrice } from '../actions/rates';

export function GoldPriceDisplay() {
  const [gold, setGold] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGoldPrice()
      .then(setGold)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!gold) return <div>Unable to fetch gold price</div>;

  return (
    <div className="p-4 bg-yellow-50 rounded-lg">
      <h2 className="text-xl font-bold text-yellow-800">Gold Price</h2>
      <p className="text-3xl font-bold text-yellow-600">
        {gold.buying.toLocaleString('tr-TR')} TRY/gram
      </p>
      <p className="text-sm text-gray-500">
        Updated: {gold.date} at {gold.hour}
      </p>
    </div>
  );
}
```

### Revalidation with Next.js Cache

```ts
// app/gold/page.tsx
import { getGold } from 'tcmb-xml-rates';
import { unstable_cache } from 'next/cache';

// Cache the gold price for 5 minutes
const getCachedGold = unstable_cache(
  async () => {
    return await getGold({ cache: false });
  },
  ['gold-price'],
  {
    revalidate: 300, // 5 minutes
    tags: ['gold']
  }
);

export default async function GoldPage() {
  const gold = await getCachedGold();

  return (
    <main className="p-8">
      <h1>TCMB Gold Price</h1>
      {gold && (
        <div>
          <p>Price: {gold.buying} TRY/gram</p>
          <p>Date: {gold.date}</p>
          <p>Hour: {gold.hour}</p>
        </div>
      )}
    </main>
  );
}

// Force revalidate with Server Action
// app/actions/revalidate.ts
'use server';

import { revalidateTag } from 'next/cache';

export async function revalidateGoldPrice() {
  revalidateTag('gold');
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
