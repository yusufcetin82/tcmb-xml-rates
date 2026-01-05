import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Import functions to test
import {
  getHourlyRates,
  getHourlyRate,
  getGold,
  getSilver,
  getPreciousMetals,
  listHourlyCurrencies,
  getHourlyRawXml
} from '../src/index.js';

// Import parser directly for unit testing
import { parseHourlyXml } from '../src/hourly-parser.js';

// Import date utils for testing
import {
  formatDateForHourly,
  getLatestAvailableHour,
  getHoursToTry,
  normalizeHourlyDate
} from '../src/utils/date.js';

// Import cache for clearing between tests
import { globalCache } from '../src/utils/cache.js';

// Get directory path for fixtures
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test fixtures
const HOURLY_XML = fs.readFileSync(
  path.join(__dirname, 'fixtures', 'hourly-sample.xml'),
  'utf-8'
);

describe('Hourly Parser', () => {
  it('should parse hourly XML correctly', () => {
    const rates = parseHourlyXml(HOURLY_XML);

    expect(rates).toHaveLength(6);
    expect(rates[0].code).toBe('USD');
    expect(rates[0].buying).toBe(43.0443);
    expect(rates[0].hour).toBe('10:00');
    expect(rates[0].date).toBe('2026-01-05');
    expect(rates[0].baseCurrency).toBe('TRY');
  });

  it('should parse Turkish decimal format correctly', () => {
    const rates = parseHourlyXml(HOURLY_XML);

    // "43,0443" should become 43.0443
    const usd = rates.find(r => r.code === 'USD');
    expect(usd?.buying).toBe(43.0443);

    // "6115,17" should become 6115.17
    const gold = rates.find(r => r.code === 'XAU');
    expect(gold?.buying).toBe(6115.17);
  });

  it('should include gold (XAU) and silver (XAS)', () => {
    const rates = parseHourlyXml(HOURLY_XML);

    const gold = rates.find(r => r.code === 'XAU');
    const silver = rates.find(r => r.code === 'XAS');

    expect(gold).toBeDefined();
    expect(gold?.name).toBe('Altın');
    expect(gold?.nameEn).toBe('Gold');
    expect(gold?.buying).toBe(6115.17);

    expect(silver).toBeDefined();
    expect(silver?.name).toBe('Gümüş');
    expect(silver?.nameEn).toBe('Silver');
    expect(silver?.buying).toBe(71.45);
  });

  it('should normalize date format', () => {
    const rates = parseHourlyXml(HOURLY_XML);

    // "2026-1-5" should become "2026-01-05"
    expect(rates[0].date).toBe('2026-01-05');
  });

  it('should extract timestamp correctly', () => {
    const rates = parseHourlyXml(HOURLY_XML);

    expect(rates[0].timestamp).toBe('2026-01-05T10:01:28+03:00');
  });
});

describe('Date Utilities', () => {
  describe('formatDateForHourly', () => {
    it('should format date and hour into URL path', () => {
      const date = new Date('2026-01-05');
      const result = formatDateForHourly(date, '10:00');

      expect(result.path).toBe('202601/05012026-1000.xml');
    });

    it('should handle different hours', () => {
      const date = new Date('2026-01-05');

      expect(formatDateForHourly(date, '14:00').path).toBe('202601/05012026-1400.xml');
      expect(formatDateForHourly(date, '15:00').path).toBe('202601/05012026-1500.xml');
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2026-03-07');
      const result = formatDateForHourly(date, '11:00');

      expect(result.path).toBe('202603/07032026-1100.xml');
    });
  });

  describe('getHoursToTry', () => {
    it('should return hours in reverse order from start', () => {
      expect(getHoursToTry('14:00')).toEqual(['14:00', '13:00', '12:00', '11:00', '10:00']);
      expect(getHoursToTry('10:00')).toEqual(['10:00']);
      expect(getHoursToTry('15:00')).toEqual(['15:00', '14:00', '13:00', '12:00', '11:00', '10:00']);
    });
  });

  describe('normalizeHourlyDate', () => {
    it('should normalize date format', () => {
      expect(normalizeHourlyDate('2026-1-5')).toBe('2026-01-05');
      expect(normalizeHourlyDate('2026-12-25')).toBe('2026-12-25');
      expect(normalizeHourlyDate('2026-1-15')).toBe('2026-01-15');
    });
  });

  describe('getLatestAvailableHour', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return 15:00 before 10:00 Istanbul time', () => {
      // 06:00 UTC = 09:00 Istanbul
      vi.setSystemTime(new Date('2026-01-05T06:00:00Z'));
      expect(getLatestAvailableHour()).toBe('15:00');
    });

    it('should return 10:00 at 10:xx Istanbul time', () => {
      // 07:00 UTC = 10:00 Istanbul
      vi.setSystemTime(new Date('2026-01-05T07:30:00Z'));
      expect(getLatestAvailableHour()).toBe('10:00');
    });

    it('should return 14:00 at 14:xx Istanbul time', () => {
      // 11:00 UTC = 14:00 Istanbul
      vi.setSystemTime(new Date('2026-01-05T11:30:00Z'));
      expect(getLatestAvailableHour()).toBe('14:00');
    });

    it('should return 15:00 after 15:00 Istanbul time', () => {
      // 13:00 UTC = 16:00 Istanbul
      vi.setSystemTime(new Date('2026-01-05T13:00:00Z'));
      expect(getLatestAvailableHour()).toBe('15:00');
    });
  });
});

describe('Hourly Rates API', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Set time to Monday 2026-01-05 14:00 Istanbul (11:00 UTC)
    vi.setSystemTime(new Date('2026-01-05T11:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should fetch and parse hourly rates', async () => {
    // Mock fetch to return our fixture
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const rates = await getHourlyRates({ cache: false });

    expect(rates).toHaveLength(6);
    expect(rates.map(r => r.code)).toContain('USD');
    expect(rates.map(r => r.code)).toContain('XAU');
    expect(rates.map(r => r.code)).toContain('XAS');
  });

  it('should fetch single hourly rate', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const usd = await getHourlyRate('USD', { cache: false });

    expect(usd).not.toBeNull();
    expect(usd?.code).toBe('USD');
    expect(usd?.buying).toBe(43.0443);
  });

  it('should return null for non-existent currency', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const xyz = await getHourlyRate('XYZ', { cache: false });

    expect(xyz).toBeNull();
  });

  it('should fetch gold price', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const gold = await getGold({ cache: false });

    expect(gold).not.toBeNull();
    expect(gold?.code).toBe('XAU');
    expect(gold?.name).toBe('Altın');
    expect(gold?.nameEn).toBe('Gold');
    expect(gold?.buying).toBe(6115.17);
    expect(gold?.hour).toBe('10:00');
  });

  it('should fetch silver price', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const silver = await getSilver({ cache: false });

    expect(silver).not.toBeNull();
    expect(silver?.code).toBe('XAS');
    expect(silver?.name).toBe('Gümüş');
    expect(silver?.nameEn).toBe('Silver');
    expect(silver?.buying).toBe(71.45);
  });

  it('should fetch precious metals together', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const metals = await getPreciousMetals({ cache: false });

    expect(metals.gold).not.toBeNull();
    expect(metals.silver).not.toBeNull();
    expect(metals.gold?.code).toBe('XAU');
    expect(metals.silver?.code).toBe('XAS');
  });

  it('should list hourly currencies', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const currencies = await listHourlyCurrencies({ cache: false });

    expect(currencies).toContain('USD');
    expect(currencies).toContain('EUR');
    expect(currencies).toContain('XAU');
    expect(currencies).toContain('XAS');
  });

  it('should fallback to previous hour on 404', async () => {
    const fetchMock = vi.fn()
      // First call (14:00) returns 404
      .mockResolvedValueOnce({ ok: false, status: 404 })
      // Second call (13:00) returns data
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(HOURLY_XML)
      });

    global.fetch = fetchMock;

    const rates = await getHourlyRates({ hour: '14:00', cache: false });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(rates).toHaveLength(6);
  });

  it('should fallback to previous day when all hours fail', async () => {
    const fetchMock = vi.fn()
      // All hours for today return 404
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 14:00
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 13:00
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 12:00
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 11:00
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 10:00
      // Previous day 15:00 returns data
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(HOURLY_XML)
      });

    global.fetch = fetchMock;

    const rates = await getHourlyRates({ hour: '14:00', cache: false });

    // Should have tried all today's hours + previous day's 15:00
    expect(fetchMock).toHaveBeenCalledTimes(6);
    expect(rates).toHaveLength(6);
  });

  it('should throw when fallback is disabled and data not found', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(
      getHourlyRates({
        hour: '14:00',
        fallbackToLastBusinessDay: false,
        fallbackToPreviousHour: false,
        cache: false
      })
    ).rejects.toThrow();
  });

  it('should handle specific date parameter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const rates = await getHourlyRates({
      date: '2026-01-03',
      hour: '15:00',
      cache: false
    });

    expect(rates).toHaveLength(6);
    // Verify the URL was constructed with the correct date
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('03012026-1500.xml'),
      expect.anything()
    );
  });

  it('should handle Date object as date parameter', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const rates = await getHourlyRates({
      date: new Date('2026-01-03'),
      hour: '12:00',
      cache: false
    });

    expect(rates).toHaveLength(6);
  });

  it('should throw InvalidCurrencyCodeError for empty currency code', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    await expect(getHourlyRate('', { cache: false })).rejects.toThrow('Invalid currency code');
  });

  it('should handle case-insensitive currency codes', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const usdLower = await getHourlyRate('usd', { cache: false });
    const usdUpper = await getHourlyRate('USD', { cache: false });
    const goldMixed = await getHourlyRate('xAu', { cache: false });

    expect(usdLower?.code).toBe('USD');
    expect(usdUpper?.code).toBe('USD');
    expect(goldMixed?.code).toBe('XAU');
  });

  it('should include all expected fields in TcmbHourlyRate', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const rates = await getHourlyRates({ cache: false });
    const usd = rates.find(r => r.code === 'USD');

    expect(usd).toMatchObject({
      code: 'USD',
      currencyCode: 'USD',
      name: expect.any(String),
      nameEn: expect.any(String),
      unit: expect.any(Number),
      buying: expect.any(Number),
      baseCurrency: 'TRY',
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      hour: expect.stringMatching(/^\d{2}:\d{2}$/),
      timestamp: expect.any(String),
      orderNo: expect.any(Number)
    });
  });

  it('should include all expected fields in TcmbPreciousMetalRate', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    const gold = await getGold({ cache: false });

    expect(gold).toMatchObject({
      code: 'XAU',
      name: 'Altın',
      nameEn: 'Gold',
      unit: expect.any(Number),
      buying: expect.any(Number),
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      hour: expect.stringMatching(/^\d{2}:\d{2}$/),
      timestamp: expect.any(String)
    });
  });

  it('should handle network errors gracefully', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    await expect(
      getHourlyRates({
        fallbackToLastBusinessDay: false,
        fallbackToPreviousHour: false,
        cache: false
      })
    ).rejects.toThrow();
  });

  it('should handle non-404 HTTP errors', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(
      getHourlyRates({
        fallbackToLastBusinessDay: false,
        cache: false
      })
    ).rejects.toThrow();
  });
});

describe('Hourly Parser Edge Cases', () => {
  it('should handle empty kur list', () => {
    const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
    <tcmbVeri>
      <baslik_bilgi>
        <zaman_etiketi>2026-01-05T10:01:28+03:00</zaman_etiketi>
      </baslik_bilgi>
      <doviz_kur_liste gecerlilik_tarihi="2026-1-5" saat="10:00">
      </doviz_kur_liste>
    </tcmbVeri>`;

    const rates = parseHourlyXml(emptyXml);
    expect(rates).toHaveLength(0);
  });

  it('should handle missing optional fields', () => {
    const minimalXml = `<?xml version="1.0" encoding="UTF-8"?>
    <tcmbVeri>
      <baslik_bilgi>
        <zaman_etiketi>2026-01-05T10:00:00+03:00</zaman_etiketi>
      </baslik_bilgi>
      <doviz_kur_liste gecerlilik_tarihi="2026-1-5" saat="10:00">
        <kur>
          <doviz_cinsi>USD</doviz_cinsi>
          <birim>1</birim>
          <alis>43,00</alis>
        </kur>
      </doviz_kur_liste>
    </tcmbVeri>`;

    const rates = parseHourlyXml(minimalXml);
    expect(rates).toHaveLength(1);
    expect(rates[0].code).toBe('USD');
    expect(rates[0].baseCurrency).toBe('TRY'); // Default value
  });

  it('should throw ParseError for invalid XML', () => {
    const invalidXml = 'not valid xml';

    expect(() => parseHourlyXml(invalidXml)).toThrow();
  });

  it('should throw ParseError for missing required structure', () => {
    const incompleteXml = `<?xml version="1.0" encoding="UTF-8"?>
    <someOtherRoot>
      <data>test</data>
    </someOtherRoot>`;

    expect(() => parseHourlyXml(incompleteXml)).toThrow();
  });

  it('should handle various Turkish decimal formats', () => {
    const xmlWithDecimals = `<?xml version="1.0" encoding="UTF-8"?>
    <tcmbVeri>
      <baslik_bilgi>
        <zaman_etiketi>2026-01-05T10:00:00+03:00</zaman_etiketi>
      </baslik_bilgi>
      <doviz_kur_liste gecerlilik_tarihi="2026-1-5" saat="10:00">
        <kur>
          <doviz_cinsi>TEST1</doviz_cinsi>
          <birim>1</birim>
          <alis>43,0443</alis>
        </kur>
        <kur>
          <doviz_cinsi>TEST2</doviz_cinsi>
          <birim>1</birim>
          <alis>1234,56</alis>
        </kur>
        <kur>
          <doviz_cinsi>TEST3</doviz_cinsi>
          <birim>1</birim>
          <alis>0,99</alis>
        </kur>
      </doviz_kur_liste>
    </tcmbVeri>`;

    const rates = parseHourlyXml(xmlWithDecimals);

    expect(rates[0].buying).toBe(43.0443);
    expect(rates[1].buying).toBe(1234.56);
    expect(rates[2].buying).toBe(0.99);
  });
});

describe('Date Edge Cases', () => {
  it('should handle year boundary dates', () => {
    const dec31 = new Date('2025-12-31');
    const jan1 = new Date('2026-01-01');

    expect(formatDateForHourly(dec31, '15:00').path).toBe('202512/31122025-1500.xml');
    expect(formatDateForHourly(jan1, '10:00').path).toBe('202601/01012026-1000.xml');
  });

  it('should handle leap year dates', () => {
    const feb29 = new Date('2024-02-29'); // 2024 is a leap year

    expect(formatDateForHourly(feb29, '12:00').path).toBe('202402/29022024-1200.xml');
  });

  it('should normalize various date formats', () => {
    expect(normalizeHourlyDate('2026-1-1')).toBe('2026-01-01');
    expect(normalizeHourlyDate('2026-12-1')).toBe('2026-12-01');
    expect(normalizeHourlyDate('2026-1-31')).toBe('2026-01-31');
  });
});

describe('Weekend and Holiday Fallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should fallback from Saturday to Friday', async () => {
    // Set time to Saturday 2026-01-03 (actually this is a Saturday)
    vi.setSystemTime(new Date('2026-01-03T12:00:00Z'));

    const fetchMock = vi.fn()
      // Saturday all hours fail
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 15:00
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 14:00
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 13:00
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 12:00
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 11:00
      .mockResolvedValueOnce({ ok: false, status: 404 }) // 10:00
      // Friday 15:00 succeeds
      .mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(HOURLY_XML)
      });

    global.fetch = fetchMock;

    const rates = await getHourlyRates({ cache: false });

    expect(rates).toHaveLength(6);
    // Should have called fetch 7 times (6 for Saturday + 1 for Friday)
    expect(fetchMock).toHaveBeenCalledTimes(7);
  });

  it('should handle multiple day fallback for long holidays', async () => {
    vi.setSystemTime(new Date('2026-01-05T12:00:00Z'));

    // Simulate 3 days of no data (long holiday)
    const fetchMock = vi.fn();

    // Day 1: all hours 404
    for (let i = 0; i < 6; i++) {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    }
    // Day 2: all hours 404
    for (let i = 0; i < 6; i++) {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    }
    // Day 3: all hours 404
    for (let i = 0; i < 6; i++) {
      fetchMock.mockResolvedValueOnce({ ok: false, status: 404 });
    }
    // Day 4: 15:00 succeeds
    fetchMock.mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });

    global.fetch = fetchMock;

    const rates = await getHourlyRates({ cache: false });

    expect(rates).toHaveLength(6);
    expect(fetchMock).toHaveBeenCalledTimes(19); // 6+6+6+1
  });
});

describe('Cache Behavior', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T11:00:00Z'));
    // Clear cache before each test
    globalCache.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should use cached data on subsequent calls with same parameters', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });
    global.fetch = fetchMock;

    // First call - should fetch
    await getHourlyRates({ hour: '10:00' });
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    await getHourlyRates({ hour: '10:00' });
    expect(fetchMock).toHaveBeenCalledTimes(1); // Still 1, used cache
  });

  it('should bypass cache when cache: false', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });
    global.fetch = fetchMock;

    await getHourlyRates({ hour: '10:00', cache: false });
    await getHourlyRates({ hour: '10:00', cache: false });

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('should have different cache keys for different hours', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(HOURLY_XML)
    });
    global.fetch = fetchMock;

    await getHourlyRates({ hour: '10:00' });
    await getHourlyRates({ hour: '11:00' });

    expect(fetchMock).toHaveBeenCalledTimes(2); // Different cache keys
  });
});
