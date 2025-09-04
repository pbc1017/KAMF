export { default as ko } from './ko.json';
export { default as en } from './en.json';

export type MessageKeys = keyof typeof import('./ko.json');
