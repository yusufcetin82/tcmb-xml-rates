import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getRates, getRate, convert } from '../src/index.js';
import fs from 'fs';
import path from 'path';

const MOCK_XML = fs.readFileSync(path.join(__dirname, 'fixtures/today.xml'), 'utf-8');

describe('TCMB Client', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should fetch and parse rates correctly', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => MOCK_XML,
      status: 200
    });

    const rates = await getRates({ cache: false });
    expect(rates).toHaveLength(2);
    expect(rates[0].code).toBe('USD');
    expect(rates[0].forexBuying).toBe(28.6145);
    expect(rates[0].name).toBe('ABD DOLARI');
  });

  it('should get a specific rate', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => MOCK_XML,
      status: 200
    });

    const usd = await getRate('USD', { cache: false });
    expect(usd).not.toBeNull();
    expect(usd?.code).toBe('USD');
  });

  it('should convert TRY to USD (selling)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => MOCK_XML,
      status: 200
    });

    // 100 TRY -> USD
    // Rate: 28.6660 (Selling)
    const amount = 100;
    const expected = amount / 28.6660;
    
    const result = await convert(100, 'TRY', 'USD', { cache: false });
    expect(result).toBeCloseTo(expected, 4);
  });

  it('should convert USD to TRY (buying)', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      text: async () => MOCK_XML,
      status: 200
    });

    // 10 USD -> TRY
    // Rate: 28.6145 (Buying)
    const amount = 10;
    const expected = amount * 28.6145;
    
    const result = await convert(10, 'USD', 'TRY', { cache: false });
    expect(result).toBeCloseTo(expected, 4);
  });
});

