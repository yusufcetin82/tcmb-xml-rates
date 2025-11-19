export class TcmbError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TcmbError';
  }
}

export class NetworkError extends TcmbError {
  constructor(message: string, public originalError?: unknown) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ParseError extends TcmbError {
  constructor(message: string, public rawData?: string) {
    super(message);
    this.name = 'ParseError';
  }
}

export class TcmbResponseError extends TcmbError {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'TcmbResponseError';
  }
}

export class RateNotFoundError extends TcmbError {
  constructor(message: string) {
    super(message);
    this.name = 'RateNotFoundError';
  }
}

export class InvalidCurrencyCodeError extends TcmbError {
  constructor(currencyCode: string) {
    super(`Invalid currency code: ${currencyCode}`);
    this.name = 'InvalidCurrencyCodeError';
  }
}

export class NoBusinessDayDataError extends TcmbError {
  constructor(message: string = 'No data found for the specified business day and fallback is disabled or exhausted.') {
    super(message);
    this.name = 'NoBusinessDayDataError';
  }
}

