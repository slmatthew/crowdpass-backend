class FeaturesService {
  private TELEGRAM_PAYMENTS_ENABLED: boolean = false;
  private TELEGRAM_PAYMENTS_LIVE: boolean = false;
  private TELEGRAM_PAYMENTS_LIVE_TOKEN: string = '';
  private TELEGRAM_PAYMENTS_TEST_TOKEN: string = '';

  constructor(useTest?: boolean) {
    const tplt = process.env.TELEGRAM_PAYMENTS_LIVE_TOKEN;
    const tptt = process.env.TELEGRAM_PAYMENTS_TEST_TOKEN;

    if((!tplt && !tptt) || (tplt?.length === 0 && tptt?.length === 0)) {
      this.disableTelegramPayments();
    } else if(useTest || (process.env.NODE_ENV === 'development' && useTest === undefined)) {
      if(!tptt || tptt.length === 0) {
        this.disableTelegramPayments();
      } else {
        this.TELEGRAM_PAYMENTS_ENABLED = true;
        this.TELEGRAM_PAYMENTS_LIVE = false;
        this.TELEGRAM_PAYMENTS_LIVE_TOKEN = tplt ?? '';
        this.TELEGRAM_PAYMENTS_TEST_TOKEN = tptt;
      }
    } else if(tplt && tplt.length > 0) {
      this.TELEGRAM_PAYMENTS_ENABLED = true;
      this.TELEGRAM_PAYMENTS_LIVE = true;
      this.TELEGRAM_PAYMENTS_LIVE_TOKEN = tplt;
      this.TELEGRAM_PAYMENTS_TEST_TOKEN = tptt ?? '';
    } else {
      this.disableTelegramPayments();
    }

    console.info('💸 Telegram Payments status:', this.TELEGRAM_PAYMENTS_ENABLED ? 'working,' : 'not working,', this.isTelegramPaymentsTesting() ? 'test mode' : 'live mode');
  }

  private disableTelegramPayments(): void {
    this.TELEGRAM_PAYMENTS_ENABLED = false;
    this.TELEGRAM_PAYMENTS_LIVE = false;
    this.TELEGRAM_PAYMENTS_LIVE_TOKEN = '';
    this.TELEGRAM_PAYMENTS_TEST_TOKEN = '';
  };

  isTelegramPaymentsLive(): boolean {
    return this.TELEGRAM_PAYMENTS_LIVE;
  }

  isTelegramPaymentsWorking(): boolean {
    return this.TELEGRAM_PAYMENTS_ENABLED;
  }

  isTelegramPaymentsTesting(): boolean {
    return !this.TELEGRAM_PAYMENTS_LIVE && this.TELEGRAM_PAYMENTS_ENABLED;
  }

  getTelegramPaymentsToken(): string | undefined {
    if(this.TELEGRAM_PAYMENTS_ENABLED) {
      if(this.TELEGRAM_PAYMENTS_LIVE) return this.TELEGRAM_PAYMENTS_LIVE_TOKEN;

      return this.TELEGRAM_PAYMENTS_TEST_TOKEN;
    }

    return undefined;
  }
}

export const features = new FeaturesService(true);