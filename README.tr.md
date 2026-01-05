# tcmb-xml-rates (Türkçe)

[![npm version](https://img.shields.io/npm/v/tcmb-xml-rates.svg)](https://www.npmjs.com/package/tcmb-xml-rates)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

`tcmb-xml-rates`, TCMB'nin (Türkiye Cumhuriyet Merkez Bankası) yayınladığı **XML döviz kurlarını**
Node.js ve Next.js projelerinde modern, güvenilir ve **TypeScript destekli** bir yapıyla kullanmanı sağlar.

- **Altın (XAU) ve Gümüş (XAS) fiyatları** - TCMB Reeskont endpoint'inden
- **Saatlik kurlar** - Gün içi saat başı güncellemeler (10:00-15:00)
- Dahili önbellekleme (in-memory cache)
- Otomatik **son iş günü fallback** (hafta sonu / resmi tatil)
- Promise tabanlı, TypeScript tipleri hazır bir API

---

## Neden bu paket?

Piyasada TCMB için yazılmış bazı npm paketleri var; ancak çoğu:

- çok eski (callback veya sadece CommonJS),
- TypeScript tipi sunmuyor,
- hafta sonu / resmi tatil mantığını ya hiç düşünmüyor ya da zayıf uyguluyor,
- **altın ve gümüş fiyatlarını desteklemiyor**.

`tcmb-xml-rates` ile amaç:

- **Modern** (ESM + CJS, TS-first),
- **Güvenilir** (iş günü fallback + cache),
- **Tam kapsamlı** (günlük kurlar + saatlik kurlar + altın + gümüş),
- **Kolay entegre edilebilir** (Next.js route handler, server component, cron script)
bir çözüm sunmak.

---

## Özellikler

- **Modern & Hafif**
  Promise tabanlı API, ESM + CJS desteği, minimum bağımlılık.

- **TypeScript Dostu**
  Tam tip tanımları ile geliyor.

- **Altın & Gümüş Fiyatları**
  TCMB Reeskont endpoint'inden XAU (altın) ve XAS (gümüş) fiyatları.

- **Saatlik Kurlar**
  10:00-15:00 arası her saat güncellenen kurlar.

- **Güvenilir**
  İstenilen tarihte veri yoksa (hafta sonu / resmi tatil), otomatik olarak **bir önceki iş gününün** kurlarını getirir (isteğe bağlı kapatılabilir).

- **Hızlı**
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
```

---

## Hızlı Başlangıç

### Günlük Döviz Kurları

```ts
import { getRate, convert } from 'tcmb-xml-rates';

// Bugünkü USD kurunu al (gerekirse son iş gününe fallback yapar)
const usd = await getRate('USD');

console.log('USD Alış:', usd?.forexBuying);
console.log('USD Satış:', usd?.forexSelling);

// 100 USD'yi TL'ye çevir
const tryAmount = await convert(100, 'USD', 'TRY');
console.log(`100 USD = ${tryAmount.toFixed(2)} TL`);
```

### Altın ve Gümüş Fiyatları

```ts
import { getGold, getSilver, getPreciousMetals } from 'tcmb-xml-rates';

// Altın fiyatı
const gold = await getGold();
console.log(`Altın: ${gold?.buying} TRY/gram (${gold?.hour})`);

// Gümüş fiyatı
const silver = await getSilver();
console.log(`Gümüş: ${silver?.buying} TRY/gram`);

// İkisini birden al
const metals = await getPreciousMetals();
console.log(`Altın: ${metals.gold?.buying}, Gümüş: ${metals.silver?.buying}`);
```

### Saatlik Kurlar

```ts
import { getHourlyRates, getHourlyRate } from 'tcmb-xml-rates';

// Tüm saatlik kurlar
const rates = await getHourlyRates();
// [{ code: 'USD', buying: 35.12, hour: '14:00', ... }, ...]

// Tek bir döviz
const usd = await getHourlyRate('USD');
console.log(`USD: ${usd?.buying} TRY (${usd?.hour})`);
```

---

## API Referansı

### Günlük Kurlar (Mevcut)

#### `getRates(options?)`

Tüm döviz kurlarını getirir.

```ts
const rates = await getRates();
// veya belirli bir tarih için
const rates = await getRates({ date: '2026-01-03' });
```

#### `getRate(currencyCode, options?)`

Tek bir döviz kurunu getirir.

```ts
const usd = await getRate('USD');
const eur = await getRate('EUR', { date: '2026-01-03' });
```

#### `convert(amount, from, to, options?)`

Para birimi dönüştürme yapar.

```ts
// USD → TRY
const tryAmount = await convert(100, 'USD', 'TRY');

// TRY → EUR
const eurAmount = await convert(1000, 'TRY', 'EUR');

// EUR → USD (çapraz kur, TRY üzerinden)
const usdAmount = await convert(100, 'EUR', 'USD');
```

#### `listCurrencies(options?)`

Mevcut döviz kodlarını listeler.

```ts
const codes = await listCurrencies();
// ['USD', 'AUD', 'DKK', 'EUR', 'GBP', ...]
```

#### `getRawXml(options?)`

Ham XML'i döndürür.

```ts
const xml = await getRawXml({ date: '2026-01-03' });
```

---

### Saatlik Kurlar (v1.1.0+)

#### `getHourlyRates(options?)`

Saatlik kurları getirir (USD, EUR, GBP, CHF, XAU, XAS).

```ts
// En son yayınlanan saatin kurları
const rates = await getHourlyRates();

// Belirli saat için
const rates = await getHourlyRates({ hour: '14:00' });

// Belirli tarih ve saat için
const rates = await getHourlyRates({
  date: '2026-01-03',
  hour: '15:00'
});
```

**Opsiyonlar:**

| Parametre | Tip | Varsayılan | Açıklama |
|-----------|-----|------------|----------|
| `date` | `Date \| string` | bugün | Tarih (YYYY-MM-DD) |
| `hour` | `TcmbHour \| 'latest'` | `'latest'` | Saat (10:00-15:00) |
| `fallbackToLastBusinessDay` | `boolean` | `true` | Hafta sonu → önceki iş günü |
| `fallbackToPreviousHour` | `boolean` | `true` | Saat yoksa → önceki saat |
| `cache` | `boolean` | `true` | Önbellekleme |

#### `getHourlyRate(currencyCode, options?)`

Tek bir dövizin saatlik kurunu getirir.

```ts
const usd = await getHourlyRate('USD');
const eur = await getHourlyRate('EUR', { hour: '11:00' });
```

#### `getGold(options?)`

Altın (XAU) fiyatını getirir.

```ts
// En son fiyat
const gold = await getGold();
console.log(`Altın: ${gold?.buying} TRY/gram`);

// Belirli saat
const gold14 = await getGold({ hour: '14:00' });

// Belirli tarih
const goldYesterday = await getGold({ date: '2026-01-04' });
```

**Dönen tip:**

```ts
interface TcmbPreciousMetalRate {
  code: 'XAU' | 'XAS';
  name: string;       // 'Altın' veya 'Gümüş'
  nameEn: string;     // 'Gold' veya 'Silver'
  unit: number;       // 1
  buying: number;     // TRY cinsinden fiyat
  date: string;       // '2026-01-05'
  hour: TcmbHour;     // '14:00'
  timestamp: string;  // ISO timestamp
}
```

#### `getSilver(options?)`

Gümüş (XAS) fiyatını getirir.

```ts
const silver = await getSilver();
console.log(`Gümüş: ${silver?.buying} TRY/gram`);
```

#### `getPreciousMetals(options?)`

Altın ve gümüşü birlikte getirir.

```ts
const metals = await getPreciousMetals();

if (metals.gold) {
  console.log(`Altın: ${metals.gold.buying} TRY/gram`);
}
if (metals.silver) {
  console.log(`Gümüş: ${metals.silver.buying} TRY/gram`);
}
```

#### `listHourlyCurrencies(options?)`

Saatlik kurlardaki döviz kodlarını listeler.

```ts
const codes = await listHourlyCurrencies();
// ['USD', 'EUR', 'GBP', 'CHF', 'XAU', 'XAS']
```

#### `getHourlyRawXml(options?)`

Saatlik kurların ham XML'ini döndürür.

```ts
const xml = await getHourlyRawXml({ hour: '14:00' });
```

---

## Kullanım Örnekleri

### 1. Bugünkü Kurları Getir

```ts
import { getRates } from 'tcmb-xml-rates';

const rates = await getRates();
console.log(rates);
// Örnek: [{ code: 'USD', forexBuying: 35.12, ... }, ...]
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

İstersen hangi alanı kullanacağını (`forexSelling`, `banknoteBuying` vs.) opsiyonlarla belirleyebilirsin:

```ts
// Efektif satış kuru kullan
const amount = await convert(100, 'USD', 'TRY', { use: 'banknoteSelling' });
```

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

Fallback'i kapatmak istersen:

```ts
const rates = await getRates({
  date: '2025-11-16',
  fallbackToLastBusinessDay: false,
}); // Veri yoksa hata fırlatır
```

---

### 5. Saatlik Kurları Kullanma

```ts
import { getHourlyRates, getHourlyRate } from 'tcmb-xml-rates';

// En son yayınlanan saatin tüm kurları
const rates = await getHourlyRates();
for (const rate of rates) {
  console.log(`${rate.code}: ${rate.buying} TRY (${rate.hour})`);
}

// Sadece USD
const usd = await getHourlyRate('USD');
console.log(`USD: ${usd?.buying} TRY`);

// Belirli bir saat için
const rates14 = await getHourlyRates({ hour: '14:00' });
```

---

### 6. Altın Fiyatını Takip Etme

```ts
import { getGold } from 'tcmb-xml-rates';

// En güncel altın fiyatı
const gold = await getGold();

if (gold) {
  console.log(`Altın Fiyatı: ${gold.buying} TRY/gram`);
  console.log(`Tarih: ${gold.date}`);
  console.log(`Saat: ${gold.hour}`);
} else {
  console.log('Altın fiyatı alınamadı');
}

// Dünkü kapanış fiyatı (15:00)
const goldYesterday = await getGold({
  date: new Date(Date.now() - 86400000) // 1 gün önce
});
```

---

### 7. Gün İçi Altın Değişimini Takip Etme

```ts
import { getGold, TcmbHour } from 'tcmb-xml-rates';

const today = new Date().toISOString().split('T')[0];
const hours: TcmbHour[] = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'];

console.log(`${today} Altın Fiyat Değişimi:`);
console.log('='.repeat(40));

for (const hour of hours) {
  const gold = await getGold({
    date: today,
    hour,
    fallbackToPreviousHour: false // Sadece tam o saat
  });

  if (gold) {
    console.log(`${hour}: ${gold.buying.toFixed(2)} TRY/gram`);
  } else {
    console.log(`${hour}: Veri yok`);
  }
}
```

---

### 8. Altın ve Gümüşü Birlikte Kullanma

```ts
import { getPreciousMetals } from 'tcmb-xml-rates';

const metals = await getPreciousMetals();

console.log('Kıymetli Madenler:');
console.log('-'.repeat(30));

if (metals.gold) {
  console.log(`Altın (XAU): ${metals.gold.buying.toFixed(2)} TRY/gram`);
}

if (metals.silver) {
  console.log(`Gümüş (XAS): ${metals.silver.buying.toFixed(2)} TRY/gram`);
}

// Altın/Gümüş oranı
if (metals.gold && metals.silver) {
  const ratio = metals.gold.buying / metals.silver.buying;
  console.log(`Altın/Gümüş Oranı: ${ratio.toFixed(2)}`);
}
```

---

### 9. Hata Yönetimi

```ts
import {
  getGold,
  getRate,
  TcmbError,
  RateNotFoundError
} from 'tcmb-xml-rates';

try {
  const gold = await getGold();
  const usd = await getRate('USD');

  console.log(`Altın: ${gold?.buying}`);
  console.log(`USD: ${usd?.forexBuying}`);
} catch (error) {
  if (error instanceof RateNotFoundError) {
    console.error('İstenen kur bulunamadı:', error.message);
  } else if (error instanceof TcmbError) {
    console.error('TCMB hatası:', error.message);
  } else {
    console.error('Beklenmeyen hata:', error);
  }
}
```

---

### 10. Önbellekleme Kontrolü

```ts
import { getGold, getHourlyRates } from 'tcmb-xml-rates';

// Cache'i kullanarak (varsayılan)
const gold1 = await getGold(); // İlk çağrı: TCMB'ye HTTP isteği
const gold2 = await getGold(); // İkinci çağrı: Cache'den gelir (hızlı)

// Cache'i devre dışı bırak (her seferinde yeni istek)
const freshRates = await getHourlyRates({ cache: false });
```

---

### 11. İstek İptali (AbortController)

```ts
import { getGold } from 'tcmb-xml-rates';

const controller = new AbortController();

// 5 saniye sonra iptal et
setTimeout(() => controller.abort(), 5000);

try {
  const gold = await getGold({ signal: controller.signal });
  console.log(`Altın: ${gold?.buying}`);
} catch (error) {
  if (error instanceof Error && error.name === 'AbortError') {
    console.log('İstek iptal edildi');
  }
}
```

---

### 12. TypeScript Tipleri

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

// Tip güvenli kullanım
const hour: TcmbHour = '14:00'; // Sadece geçerli saatler: 10:00-15:00

const options: GetHourlyRatesOptions = {
  date: '2026-01-03',
  hour: '14:00',
  fallbackToLastBusinessDay: true,
  cache: true
};

// Fonksiyon dönen tipleri
async function getGoldPrice(): Promise<TcmbPreciousMetalRate | null> {
  return await getGold();
}
```

---

## Opsiyonlar

### Günlük Kurlar

```ts
export interface GetRatesOptions {
  date?: Date | string;          // Belirli gün. Örn: '2025-11-19'
  rateType?: 'forex' | 'banknote' | 'all';
  fallbackToLastBusinessDay?: boolean; // Varsayılan: true
  cache?: boolean;               // Varsayılan: true
}
```

### Saatlik Kurlar

```ts
export interface GetHourlyRatesOptions {
  date?: Date | string;
  hour?: TcmbHour | 'latest';    // Varsayılan: 'latest'
  fallbackToLastBusinessDay?: boolean; // Varsayılan: true
  fallbackToPreviousHour?: boolean;    // Varsayılan: true
  cache?: boolean;               // Varsayılan: true
  signal?: AbortSignal;          // İstek iptali için
}
```

---

## Next.js ile Kullanım (App Router)

Bu paket, Next.js içinde **server-side** kullanım için tasarlanmıştır
(Server Components, Route Handlers, Server Actions). Böylece:

* CORS problemleri yaşamazsın,
* iç ağ mantığını / config'ini client tarafına sızdırmamış olursun.

### Server Component Örneği

```tsx
// app/page.tsx
import { getRate, getGold } from 'tcmb-xml-rates';

export default async function Page() {
  const usd = await getRate('USD');
  const gold = await getGold();

  return (
    <main>
      <h1>Piyasa Verileri</h1>
      <p>1 USD = {usd?.forexSelling?.toFixed(2)} TL</p>
      <p>Altın: {gold?.buying?.toFixed(2)} TL/gram</p>
    </main>
  );
}
```

---

### Route Handler Örneği

```ts
// app/api/rates/route.ts
import { getRates, getGold, getSilver } from 'tcmb-xml-rates';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [rates, gold, silver] = await Promise.all([
      getRates(),
      getGold(),
      getSilver()
    ]);

    return NextResponse.json({
      currencies: rates,
      gold: gold ? { price: gold.buying, hour: gold.hour } : null,
      silver: silver ? { price: silver.buying, hour: silver.hour } : null,
      timestamp: new Date().toISOString()
    });
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

### Server Action Örneği

```ts
// app/actions.ts
'use server';

import { getGold, convert } from 'tcmb-xml-rates';

export async function getGoldPrice() {
  const gold = await getGold();
  return gold ? {
    price: gold.buying,
    date: gold.date,
    hour: gold.hour
  } : null;
}

export async function convertCurrency(
  amount: number,
  from: string,
  to: string
) {
  const result = await convert(amount, from, to);
  return { amount, from, to, result };
}
```

---

### Client Component Örneği

```tsx
// app/components/GoldPrice.tsx
'use client';

import { useState, useEffect } from 'react';

// Server action'ı kullan
import { getGoldPrice } from '../actions';

export function GoldPrice() {
  const [gold, setGold] = useState<{
    price: number;
    date: string;
    hour: string;
  } | null>(null);

  useEffect(() => {
    getGoldPrice().then(setGold);
  }, []);

  if (!gold) return <p>Yükleniyor...</p>;

  return (
    <div>
      <p>Altın: {gold.price.toFixed(2)} TL/gram</p>
      <small>{gold.date} {gold.hour}</small>
    </div>
  );
}
```

---

## Günlük ve Saatlik Kurlar Karşılaştırması

| Özellik | Günlük Kurlar | Saatlik Kurlar |
|---------|--------------|----------------|
| **Fonksiyonlar** | `getRates`, `getRate`, `convert` | `getHourlyRates`, `getHourlyRate`, `getGold`, `getSilver` |
| **Endpoint** | `/kurlar/` | `/reeskontkur/` |
| **Güncelleme** | Günde 1 kez | Saatte 1 kez (10:00-15:00) |
| **Döviz Sayısı** | 22+ | 6 (USD, EUR, GBP, CHF, XAU, XAS) |
| **Altın/Gümüş** | Yok | Var |
| **Alış/Satış** | Her ikisi | Sadece alış |

---

## En İyi Pratikler

* **Her istekte TCMB'ye gitme.**
  Dahili cache'i ve/veya kendi cache katmanını (Redis, KV, veritabanı) kullan.

* **Server-side kullan.**
  Tarayıcıdan doğrudan TCMB endpoint'ine çağrı yapmak yerine, backend veya Next.js API route üzerinden çağır.

* **TCMB güncellemelerini gerçek zamanlı değil, günlük/saatlik düşün.**
  Bu veri daha çok günlük raporlama ve fiyatlama için uygundur, high-frequency trading için değil.

* **Saatlik kurlar için doğru saati seç.**
  Eğer tarihi veri çekiyorsan, `hour: 'latest'` yerine belirli bir saat belirt.

---

## Uyarı & Teşekkür

Bu paket **resmi değildir** ve TCMB (Türkiye Cumhuriyet Merkez Bankası) ile **hiçbir bağlantısı yoktur**.

* **Veri kaynağı:** Tüm kurlar doğrudan TCMB'nin resmi XML servisinden çekilir.
* **Kullanım koşulları:** Lütfen TCMB'nin sitesindeki resmi şartları ve yasal uyarıları inceleyin.
* **Teşekkür:** Bu veriyi kamuya açık sunduğu için TCMB'ye teşekkürler.

---

## Lisans

MIT
