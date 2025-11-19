# tcmb-xml-rates

Türkiye Cumhuriyet Merkez Bankası (TCMB) döviz kurlarını çekmek için geliştirilmiş modern, tip güvenli ve güvenilir bir Node.js paketi. Önbellekleme (caching), resmi tatillerde son iş gününe otomatik geri düşme (fallback) ve Promise tabanlı yapı sunar.

## Özellikler

*   🚀 **Modern & Hafif:** Promise tabanlı API, ESM + CJS desteği, minimal bağımlılık.
*   🛡️ **Tip Güvenli:** TypeScript ile yazılmıştır, tam tip desteği sunar.
*   🔄 **Güvenilir:** Hafta sonu veya resmi tatillerde otomatik olarak bir önceki iş gününün verisini getirir (Fallback).
*   ⚡ **Hızlı:** Gereksiz ağ isteklerini önlemek için dahili in-memory önbellekleme (cache) sunar.
*   💱 **Araçlar:** Kolay döviz çevirici ve kur listeleme fonksiyonları.

## Kurulum

```bash
npm install tcmb-xml-rates
# veya
yarn add tcmb-xml-rates
# veya
pnpm add tcmb-xml-rates
```

## Kullanım

### 1. Güncel Kurları Getir

En güncel kurları çeker. Eğer bugün haftasonu ise veya kurlar henüz açıklanmadıysa, varsayılan olarak son iş gününün verisini döner.

```typescript
import { getRates } from 'tcmb-xml-rates';

const rates = await getRates();
console.log(rates);
// Çıktı: [{ code: 'USD', forexBuying: 28.61, ... }, ...]
```

### 2. Tek Bir Kur Getir

```typescript
import { getRate } from 'tcmb-xml-rates';

const usd = await getRate('USD');
console.log(`Dolar Alış: ${usd?.forexBuying}`);
console.log(`Dolar Satış: ${usd?.forexSelling}`);
```

### 3. Döviz Çevirici (Convert)

TRY ile döviz arasında veya iki farklı döviz arasında (Çapraz Kur) çeviri yapın.

```typescript
import { convert } from 'tcmb-xml-rates';

// 100 USD -> TRY
const tryAmount = await convert(100, 'USD', 'TRY');
console.log(`100 USD = ${tryAmount} TRY`);

// 500 EUR -> USD (Çapraz kur hesabı ile)
const usdAmount = await convert(500, 'EUR', 'USD');
console.log(`500 EUR = ${usdAmount} USD`);
```

### 4. Geçmiş Tarihli Veri ve Fallback Mantığı

Belirli bir tarihin kurlarını çekebilirsiniz. Paket, hafta sonu ve resmi tatilleri otomatik yönetir.

**Fallback Nasıl Çalışır?**
Eğer resmi kur verisi olmayan bir gün (örneğin Pazar) isterseniz, paket otomatik olarak **bir önceki iş gününün** (örneğin Cuma) verisini getirir.

Dönen verinin içindeki `date` alanına bakarak fallback olup olmadığını anlayabilirsiniz.

```typescript
import { getRates } from 'tcmb-xml-rates';

// Pazar günü için istek atalım (Örn: 16 Kasım 2025)
const requestedDate = '2025-11-16'; 
const rates = await getRates({ date: requestedDate });

const rateDate = rates[0].date; // '2025-11-14' (Cuma)

if (requestedDate !== rateDate) {
  console.log(`Bilgi: ${requestedDate} tarihli veri yok. ${rateDate} verisi getirildi.`);
}
```

### Seçenekler (Options)

Çoğu fonksiyon aşağıdaki ayar objesini kabul eder:

```typescript
interface GetRatesOptions {
  date?: Date | string;          // Belirli tarih (default: bugün)
  rateType?: 'forex' | 'banknote' | 'all'; // Kur tipi filtreleme
  fallbackToLastBusinessDay?: boolean; // Default: true. False ise tatillerde hata fırlatır.
  cache?: boolean;               // Önbellekleme (default: true)
}
```

## Next.js Entegrasyonu (App Router)

Bu paket, CORS sorunlarını ve API anahtarı güvenliğini (bu pakette key yok ama best practice olarak) sağlamak için Next.js'de **server-side** (Server Components, Route Handlers veya Server Actions) tarafında kullanılmak üzere tasarlanmıştır.

### Server Component Örneği

Sayfa render edilirken veriyi sunucuda çeker.

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

### Route Handler Örneği

Frontend tarafına (Client Component) veri sağlamak için bir API endpoint'i oluşturun.

```ts
// app/api/rates/route.ts
import { getRates } from 'tcmb-xml-rates';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const rates = await getRates();
    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json({ error: 'Kurlar çekilemedi' }, { status: 500 });
  }
}
```

## Feragatname ve Teşekkür (Disclaimer & Credits)

Bu paket **resmi olmayan (unofficial)** bir açık kaynak projesidir ve Türkiye Cumhuriyet Merkez Bankası (TCMB) ile doğrudan bir ilişkisi yoktur.

*   **Veri Kaynağı:** Tüm döviz kuru verileri doğrudan resmi [TCMB XML servisi](https://www.tcmb.gov.tr/kurlar/today.xml) üzerinden çekilmektedir.
*   **Kullanım Koşulları:** Veri kullanımıyla ilgili koşullar için lütfen TCMB'nin resmi web sitesini ziyaret ediniz.
*   **Teşekkür:** Bu veriyi şeffaf bir şekilde kamuya sundukları için **TCMB (Türkiye Cumhuriyet Merkez Bankası)**'na teşekkür ederiz.

## Lisans

MIT
