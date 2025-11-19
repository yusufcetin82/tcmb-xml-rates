# @tcmb/kurlar

A modern, type-safe, and reliable Node.js package for fetching exchange rates from the Central Bank of the Republic of Turkey (TCMB). Features built-in caching, automatic fallback to the last business day, and promise-based API.

## Features

*   🚀 **Modern & Lightweight:** Promise-based API, ESM + CJS support, minimal dependencies.
*   🛡️ **Type-Safe:** Written in TypeScript with full type definitions.
*   🔄 **Reliable:** Automatically falls back to the previous business day if today's rates are not yet published or if it's a holiday.
*   ⚡ **Fast:** Built-in in-memory caching to prevent redundant network requests.
*   💱 **Utilities:** Easy currency conversion and listing capabilities.

## Installation

```bash
npm install @tcmb/kurlar
# or
yarn add @tcmb/kurlar
# or
pnpm add @tcmb/kurlar
```

## Usage

### 1. Get Today's Rates

Fetches the latest available rates. If today is a holiday or weekend, it intelligently fetches the last available business day's data by default.

```typescript
import { getRates } from '@tcmb/kurlar';

const rates = await getRates();
console.log(rates);
// Output: [{ code: 'USD', forexBuying: 28.61, ... }, ...]
```

### 2. Get Specific Currency Rate

```typescript
import { getRate } from '@tcmb/kurlar';

const usd = await getRate('USD');
console.log(`USD Buying: ${usd?.forexBuying}`);
console.log(`USD Selling: ${usd?.forexSelling}`);
```

### 3. Currency Conversion

Easily convert between TRY and foreign currencies, or between two foreign currencies (Cross Rate via TRY).

```typescript
import { convert } from '@tcmb/kurlar';

// Convert 100 USD to TRY
const tryAmount = await convert(100, 'USD', 'TRY');
console.log(`100 USD is ${tryAmount} TRY`);

// Convert 500 EUR to USD (Cross Rate)
const usdAmount = await convert(500, 'EUR', 'USD');
console.log(`500 EUR is ${usdAmount} USD`);
```

### 4. Historical Data

Fetch rates for a specific date.

```typescript
import { getRates } from '@tcmb/kurlar';

const rates = await getRates({ date: '2023-05-15' });
```

### Options

Most functions accept an options object:

```typescript
interface GetRatesOptions {
  date?: Date | string;          // Specific date (default: today)
  rateType?: 'forex' | 'banknote' | 'all'; // Filter rate types
  fallbackToLastBusinessDay?: boolean; // Default: true
  cache?: boolean;               // Default: true
}
```

## Next.js Integration (App Router)

This package is designed to be used primarily on the **server-side** (Server Components, Route Handlers, or Server Actions) in Next.js to avoid CORS issues and expose API keys if any.

### Server Component Example

```tsx
// app/page.tsx
import { getRate } from '@tcmb/kurlar';

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
import { getRates } from '@tcmb/kurlar';
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

## License

MIT

