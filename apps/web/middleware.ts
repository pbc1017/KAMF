import { NextRequest, NextResponse } from 'next/server';

import { defaultLocale, locales } from './src/i18n';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 쿠키에서 언어 설정 확인
  const cookieLocale = request.cookies.get('KAMF_LOCALE')?.value;
  const locale = (locales.includes(cookieLocale as never) ? cookieLocale : defaultLocale) as string;

  // 쿠키가 없거나 유효하지 않으면 기본 언어로 설정
  if (!cookieLocale || !locales.includes(cookieLocale as never)) {
    response.cookies.set('KAMF_LOCALE', locale, {
      maxAge: 365 * 24 * 60 * 60, // 1년
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
