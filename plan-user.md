# User 시스템 구현 계획

## 📋 개요

전화번호 + TOTP 기반 인증 시스템과 RBAC 권한 관리를 포함한 완전한 User 시스템을 구현합니다.

### 🎯 핵심 기능

- **전화번호 기반 인증**: SMS로 6자리 TOTP 코드 발송
- **다중 역할 지원**: USER, BOOTH, SAFETY, ADMIN
- **RBAC 권한 제어**: 데코레이터 기반 세밀한 권한 관리
- **JWT 토큰**: Access/Refresh Token 기반 세션 관리
- **자동 닉네임**: 신규 사용자 랜덤 닉네임 생성

---

## 🏗️ Phase 1: 기본 구조 설계

### 1-1. TypeScript 타입 정의

**파일**: `packages/interface/src/types/user.ts`

```typescript
export enum UserRole {
  USER = 'user',
  BOOTH = 'booth',
  SAFETY = 'safety',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  phoneNumber: string;
  displayName: string;
  roles: UserRole[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  phoneNumber: string;
  displayName?: string;
  roles?: UserRole[];
}

export interface UpdateUserRequest {
  displayName?: string;
  roles?: UserRole[];
}
```

### 1-2. API 응답 타입 (api.ts에 추가)

**파일**: `packages/interface/src/types/api.ts`

```typescript
// 기존 내용 유지 + 아래 추가

export interface AuthRequest {
  phoneNumber: string;
}

export interface VerifyCodeRequest {
  phoneNumber: string;
  code: string;
}

export interface AuthResponse {
  user: {
    id: string;
    phoneNumber: string;
    displayName: string;
    roles: string[];
  };
  tokens: AuthTokens;
}

export interface GetUserResponse {
  user: User;
}

export interface GetUsersResponse {
  users: User[];
}

export interface UpdateUserResponse {
  user: User;
}

export interface RequestCodeResponse {
  message: string;
}
```

### 1-3. Entity 설계

**User Entity**: `apps/api/src/entities/user.entity.ts`

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  phoneNumber: string;

  @Column()
  displayName: string;

  @ManyToMany(() => Role, role => role.users)
  @JoinTable({ name: 'user_roles' })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**Role Entity**: `apps/api/src/entities/role.entity.ts`

```typescript
@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: UserRole;

  @Column()
  description: string;

  @ManyToMany(() => User, user => user.roles)
  users: User[];

  @CreateDateColumn()
  createdAt: Date;
}
```

**AuthCode Entity**: `apps/api/src/entities/auth-code.entity.ts`

```typescript
@Entity('auth_codes')
export class AuthCode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  phoneNumber: string;

  @Column()
  code: string;

  @Column()
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
```

### 1-4. RBAC 시스템

**Roles 데코레이터**: `apps/api/src/common/decorators/roles.decorator.ts`

```typescript
export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

**Roles 가드**: `apps/api/src/common/guards/roles.guard.ts`

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some(role => user.roles?.map(r => r.name).includes(role));
  }
}
```

### 1-5. 닉네임 생성기

**파일**: `apps/api/src/common/utils/nickname-generator.ts`

```typescript
export class NicknameGenerator {
  private static adjectives = ['귀여운', '멋진', '행복한', '용감한', '똑똑한'];
  private static animals = ['강아지', '고양이', '토끼', '다람쥐', '햄스터'];

  static generate(): string {
    const adj = this.adjectives[Math.floor(Math.random() * this.adjectives.length)];
    const animal = this.animals[Math.floor(Math.random() * this.animals.length)];
    const number = Math.floor(Math.random() * 1000);
    return `${adj}${animal}${number}`;
  }
}
```

---

## 🔐 Phase 2: 인증 시스템 구현

### 2-1. TOTP 서비스

**파일**: `apps/api/src/modules/auth/totp.service.ts`

```typescript
@Injectable()
export class TotpService {
  constructor(
    @InjectRepository(AuthCode)
    private authCodeRepository: Repository<AuthCode>
  ) {}

  generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async saveCode(phoneNumber: string, code: string): Promise<void> {
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5분 후
    await this.authCodeRepository.save({ phoneNumber, code, expiresAt });
  }

  async verifyCode(phoneNumber: string, code: string): Promise<boolean> {
    const authCode = await this.authCodeRepository.findOne({
      where: { phoneNumber, code, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!authCode || new Date() > authCode.expiresAt) return false;

    authCode.isUsed = true;
    await this.authCodeRepository.save(authCode);
    return true;
  }
}
```

### 2-2. Twilio SMS 서비스

**파일**: `apps/api/src/modules/auth/sms.service.ts`

```typescript
@Injectable()
export class SmsService {
  private twilioClient: Twilio;

  constructor(private configService: ConfigService) {
    const accountSid = this.configService.get('TWILIO_ACCOUNT_SID');
    const authToken = this.configService.get('TWILIO_AUTH_TOKEN');
    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async sendAuthCode(phoneNumber: string, code: string): Promise<void> {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SMS] ${phoneNumber}에 인증코드 ${code} 발송됨`);
      return;
    }

    await this.twilioClient.messages.create({
      body: `[KAMF] 인증코드: ${code}`,
      from: this.configService.get('TWILIO_PHONE_NUMBER'),
      to: phoneNumber,
    });
  }
}
```

### 2-3. JWT 서비스

**파일**: `apps/api/src/modules/auth/jwt.service.ts`

```typescript
@Injectable()
export class JwtService {
  constructor(private configService: ConfigService) {}

  generateTokens(user: User): { accessToken: string; refreshToken: string; expiresIn: number } {
    const payload = {
      userId: user.id,
      phoneNumber: user.phoneNumber,
      roles: user.roles.map(r => r.name),
    };

    const accessToken = sign(payload, this.configService.get('JWT_SECRET'), { expiresIn: '1h' });
    const refreshToken = sign(payload, this.configService.get('JWT_REFRESH_SECRET'), {
      expiresIn: '7d',
    });

    return { accessToken, refreshToken, expiresIn: 3600 };
  }

  verifyAccessToken(token: string): any {
    return verify(token, this.configService.get('JWT_SECRET'));
  }
}
```

---

## 🛠 Phase 3: API 구현

### 3-1. Auth Controller

**파일**: `apps/api/src/modules/auth/auth.controller.ts`

```typescript
@Controller('auth')
export class AuthController {
  constructor(
    private totpService: TotpService,
    private smsService: SmsService,
    private jwtService: JwtService,
    private userService: UserService
  ) {}

  @Post('request-code')
  async requestCode(@Body() body: AuthRequest): Promise<ApiResponse<RequestCodeResponse>> {
    const code = this.totpService.generateCode();
    await this.totpService.saveCode(body.phoneNumber, code);
    await this.smsService.sendAuthCode(body.phoneNumber, code);

    return {
      success: true,
      data: { message: '인증코드가 발송되었습니다' },
    };
  }

  @Post('verify')
  async verifyCode(@Body() body: VerifyCodeRequest): Promise<ApiResponse<AuthResponse>> {
    const isValid = await this.totpService.verifyCode(body.phoneNumber, body.code);
    if (!isValid) throw new UnauthorizedException('Invalid code');

    let user = await this.userService.findByPhoneNumber(body.phoneNumber);
    if (!user) {
      user = await this.userService.createUser({
        phoneNumber: body.phoneNumber,
        roles: [UserRole.USER],
      });
    }

    const tokens = this.jwtService.generateTokens(user);
    return {
      success: true,
      data: {
        user: {
          id: user.id,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName,
          roles: user.roles.map(r => r.name),
        },
        tokens,
      },
    };
  }

  @Post('refresh')
  async refresh(@Body() body: RefreshTokenRequest): Promise<ApiResponse<AuthResponse>> {
    // JWT 갱신 로직 구현
  }
}
```

### 3-2. User Controller

**파일**: `apps/api/src/modules/users/users.controller.ts`

```typescript
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private userService: UserService) {}

  // 내 정보 조회 - 모든 인증 사용자
  @Get('me')
  @Roles(UserRole.USER, UserRole.BOOTH, UserRole.SAFETY, UserRole.ADMIN)
  async getMe(@CurrentUser() user: User): Promise<ApiResponse<GetUserResponse>> {
    return { success: true, data: { user } };
  }

  // 내 정보 수정 - 모든 인증 사용자
  @Patch('me')
  @Roles(UserRole.USER, UserRole.BOOTH, UserRole.SAFETY, UserRole.ADMIN)
  async updateMe(
    @CurrentUser() user: User,
    @Body() body: { displayName: string }
  ): Promise<ApiResponse<UpdateUserResponse>> {
    const updated = await this.userService.updateDisplayName(user.id, body.displayName);
    return { success: true, data: { user: updated } };
  }

  // 전체 사용자 조회 - ADMIN만
  @Get()
  @Roles(UserRole.ADMIN)
  async getUsers(): Promise<ApiResponse<GetUsersResponse>> {
    const users = await this.userService.findAll();
    return { success: true, data: { users } };
  }

  // 사용자 역할 관리 - ADMIN만
  @Patch(':id/roles')
  @Roles(UserRole.ADMIN)
  async updateUserRoles(
    @Param('id') userId: string,
    @Body() body: { roles: UserRole[] }
  ): Promise<ApiResponse<UpdateUserResponse>> {
    const updated = await this.userService.updateUserRoles(userId, body.roles);
    return { success: true, data: { user: updated } };
  }
}
```

---

## 🗄 Phase 4: 데이터베이스 Migration

### 4-1. 기존 테이블 제거

**파일**: `apps/api/src/migrations/001-DropOldUsers.ts`

```typescript
export class DropOldUsers implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users', true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 필요시 롤백 로직
  }
}
```

### 4-2. 새 사용자 시스템 생성

**파일**: `apps/api/src/migrations/002-CreateUserSystem.ts`

```typescript
export class CreateUserSystem implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. roles 테이블
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true, generationStrategy: 'uuid' },
          { name: 'name', type: 'varchar', isUnique: true },
          { name: 'description', type: 'varchar' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      })
    );

    // 2. users 테이블
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true, generationStrategy: 'uuid' },
          { name: 'phoneNumber', type: 'varchar', isUnique: true },
          { name: 'displayName', type: 'varchar' },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
          { name: 'updatedAt', type: 'timestamp', default: 'now()' },
        ],
      })
    );

    // 3. user_roles 조인 테이블
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          { name: 'userId', type: 'varchar' },
          { name: 'roleId', type: 'varchar' },
        ],
        foreignKeys: [
          {
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            columnNames: ['roleId'],
            referencedTableName: 'roles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      })
    );

    // 4. auth_codes 테이블
    await queryRunner.createTable(
      new Table({
        name: 'auth_codes',
        columns: [
          { name: 'id', type: 'varchar', isPrimary: true, generationStrategy: 'uuid' },
          { name: 'phoneNumber', type: 'varchar' },
          { name: 'code', type: 'varchar' },
          { name: 'expiresAt', type: 'timestamp' },
          { name: 'isUsed', type: 'boolean', default: false },
          { name: 'createdAt', type: 'timestamp', default: 'now()' },
        ],
      })
    );

    // 5. 초기 역할 데이터 삽입
    await queryRunner.query(`
      INSERT INTO roles (id, name, description) VALUES
      (UUID(), 'user', '일반 사용자'),
      (UUID(), 'booth', '부스 관리자'),  
      (UUID(), 'safety', '안전 관리자'),
      (UUID(), 'admin', '시스템 관리자')
    `);
  }
}
```

---

## 🎨 Phase 5: Frontend 구현

### 5-1. 로그인 페이지

**파일**: `apps/web/src/app/auth/login/page.tsx`

```tsx
'use client';

export default function LoginPage() {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [code, setCode] = useState('');

  const requestCode = async () => {
    await authApi.requestCode({ phoneNumber });
    setStep('code');
  };

  const verifyCode = async () => {
    const result = await authApi.verifyCode({ phoneNumber, code });
    // 토큰 저장 후 리다이렉트
    localStorage.setItem('accessToken', result.data.tokens.accessToken);
    router.push('/');
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-center mb-6">로그인</h1>

      {step === 'phone' ? (
        <PhoneNumberForm
          phoneNumber={phoneNumber}
          setPhoneNumber={setPhoneNumber}
          onRequestCode={requestCode}
        />
      ) : (
        <VerificationCodeForm
          phoneNumber={phoneNumber}
          code={code}
          setCode={setCode}
          onVerify={verifyCode}
        />
      )}
    </div>
  );
}
```

### 5-2. 마이페이지

**파일**: `apps/web/src/app/mypage/page.tsx`

```tsx
export default function MyPage() {
  const { data: user, refetch } = useQuery(['user', 'me'], userApi.getMe);
  const updateMutation = useMutation(userApi.updateMe, {
    onSuccess: () => refetch(),
  });

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">내 정보</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
          <p className="text-lg text-gray-900">{user?.phoneNumber}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
          <EditableDisplayName
            currentName={user?.displayName || ''}
            onSave={newName => updateMutation.mutate({ displayName: newName })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">역할</label>
          <div className="flex flex-wrap gap-2">
            {user?.roles.map(role => (
              <span key={role} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {role.toUpperCase()}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 5-3. API 클라이언트

**파일**: `apps/web/src/lib/api/authApi.ts`

```typescript
export const authApi = {
  requestCode: async (data: AuthRequest): Promise<ApiResponse<RequestCodeResponse>> => {
    return apiClient.post('/auth/request-code', data);
  },

  verifyCode: async (data: VerifyCodeRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await apiClient.post('/auth/verify', data);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<AuthResponse>> => {
    return apiClient.post('/auth/refresh', { refreshToken });
  },
};

export const userApi = {
  getMe: async (): Promise<ApiResponse<GetUserResponse>> => {
    return apiClient.get('/users/me');
  },

  updateMe: async (data: { displayName: string }): Promise<ApiResponse<UpdateUserResponse>> => {
    return apiClient.patch('/users/me', data);
  },
};
```

---

## 📋 RBAC 권한 매트릭스

| 기능                   | USER | BOOTH | SAFETY | ADMIN |
| ---------------------- | ---- | ----- | ------ | ----- |
| 내 정보 조회/수정      | ✅   | ✅    | ✅     | ✅    |
| 부스 관리              | ❌   | ✅    | ❌     | ✅    |
| 안전관리 (인원수 세기) | ❌   | ❌    | ✅     | ✅    |
| 사용자 역할 관리       | ❌   | ❌    | ❌     | ✅    |
| 전체 사용자 조회       | ❌   | ❌    | ❌     | ✅    |

---

## 🔧 환경 설정

### 환경 변수

```bash
# Twilio SMS 설정
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=your_twilio_number

# JWT 설정
JWT_SECRET=your_strong_jwt_secret
JWT_REFRESH_SECRET=your_strong_refresh_secret

# 데이터베이스 설정
DATABASE_URL=mysql://username:password@localhost:3306/kamf
```

### 의존성 설치

```bash
# Backend
npm install twilio @types/jsonwebtoken jsonwebtoken
npm install @types/twilio --save-dev

# Frontend
npm install @tanstack/react-query axios
```

---

## 🚀 구현 순서

1. **Phase 1**: 기본 구조 (Entity, 타입, RBAC)
2. **Phase 4**: DB Migration (새 테이블 생성)
3. **Phase 2**: 인증 핵심 (TOTP, SMS, JWT)
4. **Phase 3**: API 구현 (Controller, Service)
5. **Phase 5**: Frontend (로그인, 마이페이지)

---

## ✅ 완료 기준

- [ ] TypeScript 타입 정의 완료
- [ ] Entity 및 Migration 성공
- [ ] SMS 발송 및 TOTP 인증 동작
- [ ] JWT 토큰 발급/검증 정상
- [ ] RBAC 권한 제어 동작
- [ ] 전화번호 로그인 플로우 완료
- [ ] 마이페이지 이름 변경 기능

이 계획에 따라 체계적이고 안전한 사용자 인증 시스템을 구축할 수 있습니다.
