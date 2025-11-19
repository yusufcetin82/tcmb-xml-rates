# tcmb-xml-rates (Türkçe)

[![npm version](https://img.shields.io/npm/v/tcmb-xml-rates.svg)](https://www.npmjs.com/package/tcmb-xml-rates)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

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
```

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
