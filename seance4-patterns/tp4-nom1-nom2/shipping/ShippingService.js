export class ShippingService {
  constructor(carriers) {
    this.carriers = carriers;
  }

  async bestQuote(parcel) {
    const results = await Promise.allSettled(
      this.carriers.map((carrier) => carrier.getQuote(parcel)),
    );
    const quotes = results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => result.value);

    if (quotes.length === 0) throw new Error('Aucun transporteur disponible');
    return quotes.reduce((best, quote) => {
      if (quote.price < best.price) return quote;
      if (quote.price === best.price && quote.days < best.days) return quote;
      return best;
    });
  }
}
