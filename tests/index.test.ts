import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRates, getRate, convert } from '../src/index.js';
import { NoBusinessDayDataError, InvalidCurrencyCodeError } from '../src/utils/errors.js';
import fs from 'fs';
import path from 'path';

const MOCK_XML = fs.readFileSync(path.join(__dirname, 'fixtures/today.xml'), 'utf-8');

describe('TCMB Client', () => {
  beforeEach(() => {
    // Her testten önce fake timers'ı başlat (zamanı manipüle etmek için gerekirse)
    vi.useFakeTimers();
    // 2023-11-17 Cuma gününü "Bugün" olarak simüle edelim
    vi.setSystemTime(new Date('2023-11-17T10:00:00Z'));
    
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetAllMocks();
  });

  it('should fetch and parse rates correctly (Happy Path)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => MOCK_XML,
      status: 200
    });

    const rates = await getRates({ cache: false });
    expect(rates).toHaveLength(2);
    expect(rates[0].code).toBe('USD');
    expect(rates[0].forexBuying).toBe(28.6145);
  });

  it('should fallback to previous business day if data is missing (Weekend Scenario)', async () => {
    // Senaryo: 19 Kasım 2023 Pazar günü veri isteniyor.
    // 19 Kasım (Pazar) -> 404
    // 18 Kasım (Cumartesi) -> 404
    // 17 Kasım (Cuma) -> 200 (MOCK_XML)
    
    (global.fetch as any).mockImplementation(async (url: string) => {
      if (url.includes('19112023')) return { ok: false, status: 404 };
      if (url.includes('18112023')) return { ok: false, status: 404 };
      if (url.includes('17112023')) return { ok: true, status: 200, text: async () => MOCK_XML };
      return { ok: false, status: 404 };
    });

    const rates = await getRates({ 
      date: '2023-11-19', 
      fallbackToLastBusinessDay: true,
      cache: false 
    });

    expect(rates).toBeDefined();
    expect(rates[0].code).toBe('USD');
    // Mock XML içindeki tarih 17.11.2023
    expect(rates[0].date).toBe('2023-11-17');
    
    // 3 kere çağrılmış olmalı (19, 18, 17)
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('should throw error if fallback is disabled and date has no data', async () => {
    // Senaryo: 19 Kasım Pazar, Fallback KAPALI
    (global.fetch as any).mockResolvedValue({ ok: false, status: 404 });

    await expect(getRates({ 
      date: '2023-11-19', 
      fallbackToLastBusinessDay: false,
      cache: false 
    })).rejects.toThrow(NoBusinessDayDataError);
  });

  it('should handle future dates by falling back to last available data', async () => {
    // Senaryo: Gelecek bir tarih (2025-01-01) isteniyor ama biz 2023'teyiz (mock verisi)
    // Gelecek -> 404
    // ...geri sarar...
    // 17 Kasım -> 200
    
    // Basitleştirilmiş mock: 2025-01-01 ve öncesindeki bir kaç gün yok, sonra var.
    (global.fetch as any).mockImplementation(async (url: string) => {
      // DİKKAT: URL formatı YYYYMM/DDMMYYYY.xml -> 17112023
      if (url.includes('17112023')) return { ok: true, status: 200, text: async () => MOCK_XML };
      return { ok: false, status: 404 };
    });

    // Çok uzak bir gelecek vermeyelim test hızlı sürsün diye, ya da mock'u kısıtlayalım
    // Test için sadece 2 günlük gelecek verelim: 19 Kasım (Pazar) -> 17 Kasım (Cuma)
    
    const rates = await getRates({ 
      date: '2023-11-19', 
      fallbackToLastBusinessDay: true,
      cache: false 
    });

    expect(rates[0].date).toBe('2023-11-17');
  });

  it('should throw InvalidCurrencyCodeError for empty code', async () => {
    await expect(getRate('')).rejects.toThrow(InvalidCurrencyCodeError);
  });

  it('should return null for non-existent currency', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => MOCK_XML,
      status: 200
    });

    const rate = await getRate('XYZ', { cache: false });
    expect(rate).toBeNull();
  });

  it('should perform conversion correctly', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => MOCK_XML,
      status: 200
    });

    // USD -> TRY conversion (Foreign Currency -> Local Currency)
    // Bank BUYS the foreign currency from you.
    // Rate: ForexBuying (28.6145)
    const result = await convert(100, 'USD', 'TRY', { cache: false });
    expect(result).toBe(100 * 28.6145);
  });
});
