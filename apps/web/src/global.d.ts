type Messages = typeof import('./messages/ko.json');

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}

export {};
