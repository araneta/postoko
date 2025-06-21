import { Currency } from '../types';

export const formatPrice = (price: number, currency: Currency) => {
  let rate = currency.rate;
  if(!rate){
    rate = 1;
  }
  const convertedPrice = price * rate;
  return `${currency.symbol}${convertedPrice.toFixed(2)}`;
};