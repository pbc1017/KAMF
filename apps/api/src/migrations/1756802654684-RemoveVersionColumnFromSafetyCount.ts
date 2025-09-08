import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVersionColumnFromSafetyCount1756802654684 implements MigrationInterface {
  name = 'RemoveVersionColumnFromSafetyCount1756802654684';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. version 컬럼 삭제 (이 마이그레이션의 실제 목적)
    await queryRunner.query(`ALTER TABLE \`safety_counts\` DROP COLUMN \`version\``);

    // 2. id 컬럼 UUID 기본값 설정 (일관성 유지)
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );

    // 참고: 외래키 제약조건은 이미 존재하므로 재생성하지 않음
    // FK_97c1940ffc651b0b3a6aceb0646 (safety_counts → users)
    // FK_472b25323af01488f1f66a06b67 (user_roles → users)
    // 불필요한 DROP/CREATE 제거로 안정성 향상
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. id 컬럼 기본값 되돌리기
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT 'uuid()'`
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT 'uuid()'`
    );

    // 2. version 컬럼 다시 추가
    await queryRunner.query(`ALTER TABLE \`safety_counts\` ADD \`version\` int NOT NULL`);
  }
}
