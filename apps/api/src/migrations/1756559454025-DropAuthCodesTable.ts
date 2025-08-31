import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropAuthCodesTable1756559454025 implements MigrationInterface {
  name = 'DropAuthCodesTable1756559454025';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // AuthCode 엔티티 제거에 따른 auth_codes 테이블 삭제
    // Twilio Verify API 사용으로 자체 코드 저장 테이블 불필요
    await queryRunner.dropTable('auth_codes', true);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 롤백 시 auth_codes 테이블 복원
    // 하지만 Twilio Verify API 사용으로 실제로는 복원 불필요
    await queryRunner.query(`
      CREATE TABLE \`auth_codes\` (
        \`id\` varchar(36) NOT NULL,
        \`phoneNumber\` varchar(20) NOT NULL,
        \`code\` varchar(6) NOT NULL,
        \`expiresAt\` timestamp NOT NULL,
        \`isUsed\` boolean NOT NULL DEFAULT false,
        \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`IDX_auth_codes_phoneNumber\` (\`phoneNumber\`),
        INDEX \`IDX_auth_codes_code\` (\`code\`),
        INDEX \`IDX_auth_codes_expiresAt\` (\`expiresAt\`)
      ) ENGINE=InnoDB
    `);
  }
}
