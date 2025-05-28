import { Currency } from '../types';

export const formatPrice = (price: number, currency: Currency) => {
  const convertedPrice = price * currency.rate;
  return `${currency.symbol}${convertedPrice.toFixed(2)}`;
}; 