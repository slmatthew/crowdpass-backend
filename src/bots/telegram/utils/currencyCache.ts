import axios from "axios";

export interface Currency {
  code: string;
  title: string;
  symbol: string;
  native: string;
  thousands_sep: string;
  decimal_sep: string;
  symbol_left: boolean;
  space_between: boolean;
  drop_zeros: boolean;
  exp: number;
  min_amount: string;
  max_amount: string;
}

class CurrencyCache {
  private cache: Record<string, Currency> | null = null;
  private lastUpdated: number = 0;
  private readonly ttl = 1000 * 60 * 60;

  private readonly url = "https://core.telegram.org/bots/payments/currencies.json";

  async getCurrencies() {
    const now = Date.now();

    if (this.cache && now - this.lastUpdated < this.ttl) {
      return this.cache;
    }

    try {
      const response = await axios.get(this.url);
      this.cache = response.data;
      this.lastUpdated = now;
      return this.cache;
    } catch (error) {
      if (this.cache) return this.cache;
      throw new Error("Failed to fetch currencies and no cache available");
    }
  }

  async getCurrency(): Promise<Currency> {
    if(!this.cache) await this.getCurrencies();

    return this.cache!.RUB;
  }
}

export const currencyCache = new CurrencyCache();