# tcmb-xml-rates

A modern, type-safe, and reliable Node.js package for fetching exchange rates from the **Central Bank of the Republic of Turkey (TCMB)**. Features built-in caching, automatic fallback to the last business day, and a promise-based API.

## Features

*   🚀 **Modern & Lightweight:** Promise-based API, ESM + CJS support, minimal dependencies.
*   🛡️ **Type-Safe:** Written in TypeScript with full type definitions.
*   🔄 **Reliable:** Automatically falls back to the previous business day if today's rates are not yet published or if it's a holiday.
*   ⚡ **Fast:** Built-in in-memory caching to prevent redundant network requests.
*   💱 **Utilities:** Easy currency conversion and listing capabilities.

## Installation

```bash
npm install tcmb-xml-rates
# or
yarn add tcmb-xml-rates
# or
pnpm add tcmb-xml-rates
```

## Usage

### 1. Get Today's Rates

Fetches the latest available rates. If today is a holiday or weekend, it intelligently fetches the last available business day's data by default.

```typescript
import { getRates } from 'tcmb-xml-rates';

const rates = await getRates();
console.log(rates);
// Output: [{ code: 'USD', forexBuying: 28.61, ... }, ...]
```

### 2. Get Specific Currency Rate

```typescript
import { getRate } from 'tcmb-xml-rates';

const usd = await getRate('USD');
console.log(`USD Buying: ${usd?.forexBuying}`);
console.log(`USD Selling: ${usd?.forexSelling}`);
```

### 3. Currency Conversion

Easily convert between TRY and foreign currencies, or between two foreign currencies (Cross Rate via TRY).

```typescript
import { convert } from 'tcmb-xml-rates';

// Convert 100 USD to TRY
const tryAmount = await convert(100, 'USD', 'TRY');
console.log(`100 USD is ${tryAmount} TRY`);

// Convert 500 EUR to USD (Cross Rate)
const usdAmount = await convert(500, 'EUR', 'USD');
console.log(`500 EUR is ${usdAmount} USD`);
```

### 4. Historical Data & Fallback Logic

You can fetch rates for a specific date. The package automatically handles holidays and weekends.

**How Fallback Works:**
If you request a date (e.g., Sunday) where no official rates exist, the package automatically fetches the data from the **previous business day** (e.g., Friday).

You can detect if a fallback occurred by checking the `date` field in the response.

```typescript
import { getRates } from 'tcmb-xml-rates';

// Requesting rates for a Sunday (e.g., 16 Nov 2025)
const requestedDate = '2025-11-16'; 
const rates = await getRates({ date: requestedDate });

const rateDate = rates[0].date; // '2025-11-14' (Friday)

if (requestedDate !== rateDate) {
  console.log(`Notice: No data for ${requestedDate}. Returned data from ${rateDate}.`);
}
```

### Options

Most functions accept an options object:

```typescript
interface GetRatesOptions {
  date?: Date | string;          // Specific date (default: today)
  rateType?: 'forex' | 'banknote' | 'all'; // Filter rate types
  fallbackToLastBusinessDay?: boolean; // Default: true. If false, throws error on holidays.
  cache?: boolean;               // Default: true
}
```

## Next.js Integration (App Router)

This package is designed to be used primarily on the **server-side** (Server Components, Route Handlers, or Server Actions) in Next.js to avoid CORS issues and expose API keys if any.

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
    return NextResponse.json({ error: 'Failed to fetch rates' }, { status: 500 });
  }
}
```

## Disclaimer & Credits

This package is an **unofficial** open-source project and is not affiliated with the Central Bank of the Republic of Turkey (TCMB).

*   **Data Source:** All exchange rate data is fetched directly from the official [TCMB XML service](https://www.tcmb.gov.tr/kurlar/today.xml).
*   **Terms of Use:** Please refer to TCMB's official website for terms of use regarding their data.
*   **Gratitude:** We thank **TCMB (Türkiye Cumhuriyet Merkez Bankası)** for providing this public service transparency.

## License

MIT
