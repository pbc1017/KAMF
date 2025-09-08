import { MigrationInterface, QueryRunner } from 'typeorm';

import { safeAddConstraint, safeDropConstraint } from './utils/migration-helpers';

export class CreateSafetyCount1756759134381 implements MigrationInterface {
  name = 'CreateSafetyCount1756759134381';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. safety_counts 테이블 생성
    await queryRunner.query(
      `CREATE TABLE \`safety_counts\` (
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), 
        \`id\` varchar(36) NOT NULL DEFAULT (UUID()), 
        \`userId\` varchar(36) NOT NULL, 
        \`increment\` int NOT NULL DEFAULT '0', 
        \`decrement\` int NOT NULL DEFAULT '0', 
        \`date\` date NOT NULL, 
        \`version\` int NOT NULL, 
        INDEX \`IDX_97c1940ffc651b0b3a6aceb064\` (\`userId\`), 
        INDEX \`IDX_5c75c899a30d2e46bf0c2b4140\` (\`date\`), 
        UNIQUE INDEX \`IDX_95e72d9710a97567ae282a4d2b\` (\`userId\`, \`date\`), 
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`
    );

    // 2. users 테이블 id 컬럼 수정 (UUID 기본값)
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );

    // 3. safety_counts → users 외래키 추가 (안전한 방식)
    await safeAddConstraint(
      queryRunner,
      'safety_counts',
      'FK_97c1940ffc651b0b3a6aceb0646',
      'FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
    );

    // 4. user_roles → users 외래키 추가 (안전한 방식, 중복 제거)
    // 이미 존재할 수 있으므로 안전하게 추가
    await safeAddConstraint(
      queryRunner,
      'user_roles',
      'FK_472b25323af01488f1f66a06b67',
      'FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. 외래키 제약조건 삭제 (안전한 방식)
    await safeDropConstraint(queryRunner, 'user_roles', 'FK_472b25323af01488f1f66a06b67');
    await safeDropConstraint(queryRunner, 'safety_counts', 'FK_97c1940ffc651b0b3a6aceb0646');

    // 2. users 테이블 id 컬럼 되돌리기
    await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL`);

    // 3. safety_counts 테이블의 인덱스들 삭제
    await queryRunner.query(`DROP INDEX \`IDX_95e72d9710a97567ae282a4d2b\` ON \`safety_counts\``);
    await queryRunner.query(`DROP INDEX \`IDX_5c75c899a30d2e46bf0c2b4140\` ON \`safety_counts\``);
    await queryRunner.query(`DROP INDEX \`IDX_97c1940ffc651b0b3a6aceb064\` ON \`safety_counts\``);

    // 4. safety_counts 테이블 삭제
    await queryRunner.query(`DROP TABLE \`safety_counts\``);
  }
}
