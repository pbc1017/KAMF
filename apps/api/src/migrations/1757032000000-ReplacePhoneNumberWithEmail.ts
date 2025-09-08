import { MigrationInterface, QueryRunner } from 'typeorm';

import { findIndexByColumn, safeDropIndex } from './utils/migration-helpers';

export class ReplacePhoneNumberWithEmail1757032000000 implements MigrationInterface {
  name = 'ReplacePhoneNumberWithEmail1757032000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. email 컬럼 추가 (nullable로 시작)
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`email\` varchar(255) NULL`);

    // 2. 기존 사용자들에게 기본 이메일 할당
    // 사용자 ID의 마지막 8자리를 사용하여 고유한 이메일 생성
    await queryRunner.query(`
      UPDATE \`users\`
      SET \`email\` = CONCAT('example', RIGHT(\`id\`, 8), '@test.com')
      WHERE \`email\` IS NULL
    `);

    // 3. email 컬럼을 NOT NULL로 변경
    await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`email\` varchar(255) NOT NULL`);

    // 4. email 컬럼에 UNIQUE 인덱스 추가
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_users_email\` (\`email\`)`
    );

    // 5. phoneNumber 컬럼의 UNIQUE 인덱스 동적 검색 후 삭제
    const phoneIndexName = await findIndexByColumn(queryRunner, 'users', 'phoneNumber');
    if (phoneIndexName) {
      await safeDropIndex(queryRunner, 'users', phoneIndexName);
      console.log(`✅ Dropped phoneNumber index: ${phoneIndexName}`);
    } else {
      console.log(`ℹ️  No phoneNumber index found, continuing...`);
    }

    // 6. phoneNumber 컬럼 삭제
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`phoneNumber\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. phoneNumber 컬럼 다시 추가
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`phoneNumber\` varchar(255) NOT NULL`);

    // 2. phoneNumber 컬럼에 UNIQUE 인덱스 추가 (TypeORM 스타일)
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD UNIQUE INDEX \`UQ_1e3d0240b49c40521aaeb953293\` (\`phoneNumber\`)`
    );

    // 3. 기존 이메일에서 전화번호 형태로 변환 (롤백용 - 실제 전화번호는 복구 불가)
    await queryRunner.query(`
      UPDATE \`users\`
      SET \`phoneNumber\` = CONCAT('010', LPAD((ROW_NUMBER() OVER (ORDER BY \`createdAt\`) % 100000000), 8, '0'))
    `);

    // 4. email 컬럼의 UNIQUE 인덱스 동적 검색 후 제거
    const emailIndexName = await findIndexByColumn(queryRunner, 'users', 'email');
    if (emailIndexName) {
      await safeDropIndex(queryRunner, 'users', emailIndexName);
    }

    // 5. email 컬럼 삭제
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`email\``);
  }
}
