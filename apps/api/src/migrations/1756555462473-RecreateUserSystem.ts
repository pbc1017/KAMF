import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class RecreateUserSystem1756555462473 implements MigrationInterface {
  name = 'RecreateUserSystem1756555462473';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 기존 users 테이블 제거
    await queryRunner.dropTable('users', true);

    // 2. roles 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'roles',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'name',
            type: 'enum',
            enum: ['user', 'booth', 'safety', 'admin'],
            isUnique: true,
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      })
    );

    // 3. users 테이블 생성 (새로운 구조)
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            length: '20',
            isUnique: true,
          },
          {
            name: 'displayName',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP',
          },
        ],
      })
    );

    // 4. user_roles 조인 테이블 생성
    await queryRunner.createTable(
      new Table({
        name: 'user_roles',
        columns: [
          {
            name: 'userId',
            type: 'varchar',
            length: '36',
          },
          {
            name: 'roleId',
            type: 'varchar',
            length: '36',
          },
        ],
        indices: [
          {
            name: 'IDX_user_roles_userId',
            columnNames: ['userId'],
          },
          {
            name: 'IDX_user_roles_roleId',
            columnNames: ['roleId'],
          },
          {
            name: 'IDX_user_roles_unique',
            columnNames: ['userId', 'roleId'],
            isUnique: true,
          },
        ],
        foreignKeys: [
          {
            name: 'FK_user_roles_userId',
            columnNames: ['userId'],
            referencedTableName: 'users',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
          {
            name: 'FK_user_roles_roleId',
            columnNames: ['roleId'],
            referencedTableName: 'roles',
            referencedColumnNames: ['id'],
            onDelete: 'CASCADE',
          },
        ],
      })
    );

    // 5. auth_codes 테이블 생성 (TOTP 코드 임시 저장)
    await queryRunner.createTable(
      new Table({
        name: 'auth_codes',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            generationStrategy: 'uuid',
          },
          {
            name: 'phoneNumber',
            type: 'varchar',
            length: '20',
          },
          {
            name: 'code',
            type: 'varchar',
            length: '6',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
          },
          {
            name: 'isUsed',
            type: 'boolean',
            default: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
        indices: [
          {
            name: 'IDX_auth_codes_phoneNumber',
            columnNames: ['phoneNumber'],
          },
          {
            name: 'IDX_auth_codes_code',
            columnNames: ['code'],
          },
          {
            name: 'IDX_auth_codes_expiresAt',
            columnNames: ['expiresAt'],
          },
        ],
      })
    );

    // 6. 초기 역할 데이터 삽입
    await queryRunner.query(`
      INSERT INTO roles (id, name, description) VALUES
      (UUID(), 'user', '일반 사용자'),
      (UUID(), 'booth', '부스 관리자'),
      (UUID(), 'safety', '안전 관리자'),
      (UUID(), 'admin', '시스템 관리자')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백 시 새 테이블들 모두 제거
    await queryRunner.dropTable('auth_codes');
    await queryRunner.dropTable('user_roles');
    await queryRunner.dropTable('users');
    await queryRunner.dropTable('roles');

    // 기존 users 테이블 복원 (필요시)
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`username\` varchar(255) NOT NULL, \`firstName\` varchar(255) NULL, \`lastName\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`role\` enum ('admin', 'user', 'moderator') NOT NULL DEFAULT 'user', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
  }
}
