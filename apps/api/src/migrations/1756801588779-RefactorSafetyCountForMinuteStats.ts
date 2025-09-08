import { MigrationInterface, QueryRunner } from 'typeorm';

import { safeDropIndex } from './utils/migration-helpers';

export class RefactorSafetyCountForMinuteStats1756801588779 implements MigrationInterface {
  name = 'RefactorSafetyCountForMinuteStats1756801588779';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 기존 date 관련 인덱스 삭제
    await safeDropIndex(queryRunner, 'safety_counts', 'IDX_5c75c899a30d2e46bf0c2b4140'); // date 인덱스
    await safeDropIndex(queryRunner, 'safety_counts', 'IDX_95e72d9710a97567ae282a4d2b'); // userId, date UNIQUE 인덱스

    // 2. date 컬럼 삭제 (minute-based stats로 리팩터링)
    await queryRunner.query(`ALTER TABLE \`safety_counts\` DROP COLUMN \`date\``);

    // 3. 새로운 createdAt 기반 인덱스 추가
    await queryRunner.query(
      `CREATE INDEX \`IDX_833ff1d488b29f2248cac955e7\` ON \`safety_counts\` (\`createdAt\`)`
    );

    // 4. userId와 createdAt 복합 인덱스 추가 (minute-based 조회용)
    await queryRunner.query(
      `CREATE INDEX \`IDX_996e7bc0dcfd1273480843cc40\` ON \`safety_counts\` (\`userId\`, \`createdAt\`)`
    );

    // 5. users, safety_counts 테이블의 id 컬럼 UUID 기본값 설정
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );

    // 참고: 외래키 제약조건은 이미 존재하므로 재생성하지 않음
    // FK_97c1940ffc651b0b3a6aceb0646 (safety_counts → users)
    // FK_472b25323af01488f1f66a06b67 (user_roles → users)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. 새로 추가된 인덱스 삭제
    await safeDropIndex(queryRunner, 'safety_counts', 'IDX_996e7bc0dcfd1273480843cc40');
    await safeDropIndex(queryRunner, 'safety_counts', 'IDX_833ff1d488b29f2248cac955e7');

    // 2. id 컬럼 기본값 되돌리기
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT 'uuid()'`
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT 'uuid()'`
    );

    // 3. date 컬럼 다시 추가
    await queryRunner.query(`ALTER TABLE \`safety_counts\` ADD \`date\` date NOT NULL`);

    // 4. 기존 date 기반 인덱스들 복원
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_95e72d9710a97567ae282a4d2b\` ON \`safety_counts\` (\`userId\`, \`date\`)`
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_5c75c899a30d2e46bf0c2b4140\` ON \`safety_counts\` (\`date\`)`
    );
  }
}
