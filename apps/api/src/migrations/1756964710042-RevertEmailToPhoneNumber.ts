import { MigrationInterface, QueryRunner } from 'typeorm';

export class RevertEmailToPhoneNumber1756964710042 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. phoneNumber 컬럼 추가 (nullable로 시작)
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`phoneNumber\` varchar(255) NULL`);

    // 2. 기존 사용자들에게 임시 전화번호 할당 (이메일 기반 사용자들을 전화번호로 변환)
    // 사용자 ID를 기반으로 고유한 전화번호 생성
    await queryRunner.query(`
            UPDATE \`users\` 
            SET \`phoneNumber\` = CONCAT('010', LPAD((CONV(SUBSTRING(\`id\`, -8), 16, 10) % 100000000), 8, '0'))
            WHERE \`phoneNumber\` IS NULL
        `);

    // 3. phoneNumber 컬럼을 NOT NULL로 변경
    await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`phoneNumber\` varchar(255) NOT NULL`);

    // 4. phoneNumber 컬럼에 UNIQUE 인덱스 추가
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_users_phoneNumber\` (\`phoneNumber\`)`
    );

    // 5. email 컬럼의 UNIQUE 인덱스 제거
    await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_users_email\``);

    // 6. email 컬럼 삭제
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`email\``);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
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

    // 5. phoneNumber 컬럼의 UNIQUE 인덱스 제거
    await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_users_phoneNumber\``);

    // 6. phoneNumber 컬럼 삭제
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`phoneNumber\``);
  }
}
