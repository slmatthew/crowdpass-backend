import { Currency } from "./currencyCache";

export function formatAmount(amount: number, currency: Currency): string {
  const factor = Math.pow(10, currency.exp);
  const value = amount / factor;

  let [integer, fraction] = value.toFixed(currency.exp).split(".");

  integer = integer.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousands_sep);

  if(currency.drop_zeros && Number(fraction) === 0) {
    fraction = "";
  } else if(fraction) {
    fraction = currency.decimal_sep + fraction;
  }

  const formatted = integer + fraction;

  const space = currency.space_between ? " " : "";
  if(currency.symbol_left) {
    return `${currency.native}${space}${formatted}`;
  } else {
    return `${formatted}${space}${currency.native}`;
  }
}