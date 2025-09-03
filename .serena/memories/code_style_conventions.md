# KAMF 코드 스타일 및 컨벤션

## TypeScript 설정

- **타겟**: ES2022
- **모듈**: ESNext (ESM)
- **엄격 모드**: 활성화
- **데코레이터**: 실험적 데코레이터 지원 (NestJS용)
- **Path Mapping**: `@kamf/interface` 절대 경로 지원

## ESLint 규칙

- **베이스**: eslint:recommended + prettier
- **파서**: @typescript-eslint/parser
- **주요 규칙**:
  - import/order: 알파벳 순서 정렬, 그룹별 줄바꿈
  - @typescript-eslint/no-unused-vars: \_ prefix 허용
  - @typescript-eslint/no-explicit-any: 경고
  - explicit-function-return-type: 비활성화

## Prettier 설정

- **세미콜론**: 사용 (semi: true)
- **따옴표**: 싱글 쿼트 (singleQuote: true)
- **최대 길이**: 100자 (printWidth: 100)
- **탭 크기**: 2스페이스 (tabWidth: 2)
- **탭 사용**: false (스페이스 사용)
- **trailing comma**: ES5 스타일
- **화살표 함수**: avoid parens
- **줄바꿈**: LF

## 명명 규칙

- **파일명**: kebab-case (예: user.controller.ts)
- **클래스명**: PascalCase (예: UserService)
- **변수/함수명**: camelCase (예: getUserData)
- **상수명**: SCREAMING_SNAKE_CASE (예: JWT_SECRET)
- **인터페이스**: PascalCase with I prefix 선택적

## Import 순서 규칙

1. Node.js 내장 모듈
2. 외부 라이브러리
3. 내부 모듈 (@kamf/\*)
4. 부모/형제 디렉토리
5. 인덱스 파일

- 각 그룹 사이에 빈 줄 삽입
- 알파벳 순서 정렬

## 디렉토리 구조 컨벤션

- **모노레포**: apps/_ (애플리케이션), packages/_ (라이브러리)
- **NestJS**: modules, entities, dto 분리
- **Next.js**: app router 기반, components/hooks/lib 분리
- **공통**: common, utils, types 디렉토리 활용
