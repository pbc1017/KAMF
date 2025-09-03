# KAMF 개발 가이드라인 및 디자인 패턴

## 🏗️ 아키텍처 원칙

### 모노레포 설계

- **관심사 분리**: web(UI), api(비즈니스 로직), interface(타입 공유)
- **의존성 방향**: web → interface ← api (순환 참조 방지)
- **타입 안전성**: TypeScript 엄격 모드로 컴파일 타임 오류 방지
- **코드 재사용**: 공통 타입과 유틸리티는 interface 패키지에서 관리

### 레이어드 아키텍처 (API)

```
Controller → Service → Repository → Database
    ↓         ↓          ↓
   DTO    Business    Entity
```

## 🎨 디자인 패턴

### NestJS 백엔드 패턴

#### 1. Module 패턴

```typescript
// 각 기능별로 독립적인 모듈 구성
@Module({
  imports: [TypeOrmModule.forFeature([Entity])],
  controllers: [Controller],
  providers: [Service, Repository],
  exports: [Service], // 다른 모듈에서 사용 시
})
```

#### 2. Repository 패턴

```typescript
// 데이터 액세스 추상화
@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}
}
```

#### 3. DTO 패턴

```typescript
// 데이터 검증 및 변환
export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;
}
```

#### 4. Guard 패턴

```typescript
// 인증/권한 검사
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
export class AdminController {}
```

### Next.js 프론트엔드 패턴

#### 1. App Router 패턴

```typescript
// 파일 기반 라우팅
app/
├── layout.tsx          # 루트 레이아웃
├── page.tsx           # 홈 페이지
├── login/page.tsx     # 로그인 페이지
└── safety/page.tsx    # 안전 모니터링
```

#### 2. Server/Client 컴포넌트 분리

```typescript
// Server Component (기본)
export default function Page() {
  return <div>서버에서 렌더링</div>
}

// Client Component (상태/이벤트 필요시)
'use client'
export default function InteractiveComponent() {
  const [state, setState] = useState()
}
```

#### 3. Custom Hook 패턴

```typescript
// 비즈니스 로직 재사용
export function useAuth() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: fetchAuthUser,
  });
}
```

## 📋 코딩 컨벤션

### TypeScript 스타일

```typescript
// 인터페이스 정의
interface User {
  id: string;
  name: string;
  email: string;
}

// 타입 정의 (유니온, 상수 등)
type UserRole = 'admin' | 'user' | 'manager';

// Generic 사용
interface ApiResponse<T> {
  data: T;
  message: string;
}
```

### React 컴포넌트 스타일

```typescript
// 함수형 컴포넌트 (화살표 함수)
export const Button = ({ children, onClick }: ButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 bg-blue-500"
    >
      {children}
    </button>
  )
}
```

### NestJS 서비스 스타일

```typescript
@Injectable()
export class UserService {
  constructor(
    private userRepository: UserRepository,
    private configService: ConfigService
  ) {}

  async createUser(dto: CreateUserDto): Promise<User> {
    // 비즈니스 로직
    return this.userRepository.create(dto);
  }
}
```

## 🔐 보안 및 인증 패턴

### JWT 인증 플로우

1. SMS 인증번호 발송
2. 인증번호 확인 후 JWT 발급
3. Refresh Token으로 토큰 갱신
4. 권한별 라우트 가드 적용

### 권한 관리

```typescript
// 역할 기반 접근 제어 (RBAC)
enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  USER = 'user'
}

@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
```

## 📡 API 설계 원칙

### RESTful API

```
GET    /api/users         # 사용자 목록
GET    /api/users/:id     # 특정 사용자
POST   /api/users         # 사용자 생성
PUT    /api/users/:id     # 사용자 수정
DELETE /api/users/:id     # 사용자 삭제
```

### 응답 구조 표준화

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
}
```

### 오류 처리

```typescript
// 커스텀 예외 필터
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    // 통일된 오류 응답 형식
  }
}
```

## 🚀 성능 최적화

### 프론트엔드 최적화

- **React Query**: 서버 상태 캐싱 및 동기화
- **Code Splitting**: 동적 import로 번들 크기 최적화
- **Image Optimization**: Next.js Image 컴포넌트 사용
- **Memoization**: React.memo, useMemo, useCallback 활용

### 백엔드 최적화

- **Database Indexing**: 자주 조회되는 필드 인덱스 설정
- **Query Optimization**: N+1 문제 방지, 필요한 필드만 조회
- **Caching**: Redis 캐싱 (safety 모니터링)
- **Connection Pooling**: 데이터베이스 연결 풀 관리

## 🧪 테스트 전략

### 백엔드 테스트

```typescript
// 단위 테스트
describe('UserService', () => {
  it('should create user', async () => {
    // Given-When-Then 패턴
  });
});

// E2E 테스트
it('/users (POST)', () => {
  return request(app.getHttpServer()).post('/users').send(createUserDto).expect(201);
});
```

### 프론트엔드 테스트

- **Component Testing**: React Testing Library
- **Integration Testing**: API 연동 테스트
- **E2E Testing**: 사용자 시나리오 테스트

## 📝 문서화 원칙

### API 문서

- **Swagger/OpenAPI**: 자동 생성되는 API 문서
- **DTO Validation**: class-validator로 스키마 정의
- **예제 포함**: 실제 요청/응답 예시 제공

### 코드 문서화

```typescript
/**
 * 사용자 생성 서비스
 * @param dto 사용자 생성 데이터
 * @returns 생성된 사용자 정보
 * @throws BadRequestException 유효하지 않은 데이터
 */
async createUser(dto: CreateUserDto): Promise<User> {}
```

## 🔄 Git 워크플로우

### 브랜치 전략

- `main`: 프로덕션 안정 버전
- `dev`: 개발 통합 브랜치
- `feature/*`: 기능 개발 브랜치
- `hotfix/*`: 긴급 수정 브랜치

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드/설정 변경
```
