import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

export type Locale = 'ko' | 'en';

export const locales: Locale[] = ['ko', 'en'];
export const defaultLocale: Locale = 'ko';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const locale = (cookieStore.get('KAMF_LOCALE')?.value as Locale) ?? defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
