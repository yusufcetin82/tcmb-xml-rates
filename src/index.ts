import { fetchRates, fetchRawXml } from './client.js';
import { 
  TcmbRate, 
  GetRatesOptions, 
  GetRateOptions, 
  ConvertOptions, 
  ListCurrenciesOptions, 
  GetRawXmlOptions 
} from './types.js';
import { 
  RateNotFoundError, 
  InvalidCurrencyCodeError 
} from './utils/errors.js';

export * from './types.js';
export * from './utils/errors.js';

/**
 * Fetches exchange rates from TCMB.
 */
export async function getRates(options?: GetRatesOptions): Promise<TcmbRate[]> {
  return fetchRates(options);
}

/**
 * Fetches a single exchange rate for a specific currency.
 */
export async function getRate(
  currencyCode: string, 
  options?: GetRateOptions
): Promise<TcmbRate | null> {
  if (!currencyCode) throw new InvalidCurrencyCodeError('');
  
  const rates = await fetchRates(options);
  const code = currencyCode.toUpperCase();
  return rates.find(r => r.code === code || r.currencyCode === code) || null;
}

/**
 * Converts an amount from one currency to another.
 */
export async function convert(
  amount: number,
  from: string,
  to: string,
  options?: ConvertOptions
): Promise<number> {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();

  if (fromCode === toCode) {
    return amount;
  }

  const rates = await fetchRates(options);

  const getRateValue = (code: string, field: string): number => {
    const rate = rates.find(r => r.code === code || r.currencyCode === code);
    if (!rate) throw new RateNotFoundError(`Currency not found: ${code}`);
    
    const val = (rate as any)[field];
    if (typeof val !== 'number') {
      throw new RateNotFoundError(`Rate field '${field}' is not available for ${code}`);
    }
    return val;
  };

  // Default behaviors if 'use' is not specified:
  // TRY -> X : Bank sells X (ForexSelling)
  // X -> TRY : Bank buys X (ForexBuying)
  // X -> Y   : X -> TRY (Buying), TRY -> Y (Selling)
  
  const use = options?.use;

  if (fromCode === 'TRY') {
    // Converting TRY to Foreign Currency
    // We need the rate of the target currency
    // Default: ForexSelling (Bank Sells Foreign Currency)
    const field = use || 'forexSelling';
    const rateVal = getRateValue(toCode, field);
    return amount / rateVal;
  }

  if (toCode === 'TRY') {
    // Converting Foreign Currency to TRY
    // We need the rate of the source currency
    // Default: ForexBuying (Bank Buys Foreign Currency)
    const field = use || 'forexBuying';
    const rateVal = getRateValue(fromCode, field);
    return amount * rateVal;
  }

  // Cross Currency (X -> Y) via TRY
  // Step 1: X -> TRY
  const fieldForFrom = use || 'forexBuying'; 
  const rateFrom = getRateValue(fromCode, fieldForFrom);
  const amountInTry = amount * rateFrom;

  // Step 2: TRY -> Y
  const fieldForTo = use || 'forexSelling';
  const rateTo = getRateValue(toCode, fieldForTo);
  return amountInTry / rateTo;
}

/**
 * Lists all available currency codes for the given date.
 */
export async function listCurrencies(options?: ListCurrenciesOptions): Promise<string[]> {
  const rates = await fetchRates(options);
  return rates.map(r => r.code);
}

/**
 * Fetches the raw XML string from TCMB.
 */
export async function getRawXml(options?: GetRawXmlOptions): Promise<string> {
  return fetchRawXml(options);
}

