import { getRates, getRate, convert } from '../src/index.js';

async function runDemo() {
  console.log('🚀 TCMB XML Rates - Canlı Test Başlıyor...\n');

  try {
    // 1. Tüm Kurları Listele
    console.log('1️⃣  Bugünün kurları çekiliyor...');
    const rates = await getRates();
    console.log(`✅ Başarılı! Toplam ${rates.length} adet kur bulundu.`);
    console.log(`   Tarih: ${rates[0]?.date}`);
    console.log('   Örnek:', rates.find(r => r.code === 'USD')?.name, '\n');

    // 2. USD Getir
    console.log('2️⃣  USD kuru sorgulanıyor...');
    const usd = await getRate('USD');
    if (usd) {
      console.log(`✅ USD Alış: ${usd.forexBuying}`);
      console.log(`✅ USD Satış: ${usd.forexSelling}\n`);
    } else {
      console.error('❌ USD bulunamadı!\n');
    }

    // 3. Çeviri Yap
    console.log('3️⃣  Çeviri testi: 100 EUR -> TRY');
    const eurToTry = await convert(100, 'EUR', 'TRY');
    console.log(`✅ 100 EUR = ${eurToTry.toFixed(2)} TRY\n`);

    console.log('4️⃣  Çeviri testi: 100 USD -> EUR (Çapraz Kur)');
    const usdToEur = await convert(100, 'USD', 'EUR');
    console.log(`✅ 100 USD = ${usdToEur.toFixed(2)} EUR\n`);

    console.log('🎉 Tüm testler başarıyla tamamlandı!');

  } catch (error) {
    console.error('❌ Test sırasında hata oluştu:');
    console.error(error);
    process.exit(1);
  }
}

runDemo();

