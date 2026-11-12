const AMOUNT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export const CURRENCY_CODE = 'BDT';

export const formatAmount = (price: number) => AMOUNT_FORMATTER.format(price);

export const formatMoney = (price: number) =>
  `${CURRENCY_CODE} ${formatAmount(price)}`;

export const formatDateTime = (value: string) =>
  new Date(value).toLocaleString('en-US', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

export const formatLineCalculation = (quantity: number, price: number) =>
  quantity === 1 ? 'Qty 1' : `${quantity} × ${formatMoney(price)}`;
