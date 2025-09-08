import { MigrationInterface, QueryRunner } from 'typeorm';

import { safeDropConstraint, safeAddConstraint } from './utils/migration-helpers';

export class RemoveUpdatedAtFromBoothsAndStages1756576066012 implements MigrationInterface {
  name = 'RemoveUpdatedAtFromBoothsAndStages1756576066012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. 기존 외래키 제약조건 안전하게 삭제
    await safeDropConstraint(queryRunner, 'user_roles', 'FK_user_roles_roleId');
    await safeDropConstraint(queryRunner, 'user_roles', 'FK_user_roles_userId');

    // 2. booths 테이블에서 updatedAt 컬럼 제거
    await queryRunner.query(`ALTER TABLE \`booths\` DROP COLUMN \`updatedAt\``);

    // 3. stages 테이블에서 updatedAt 컬럼 제거
    await queryRunner.query(`ALTER TABLE \`stages\` DROP COLUMN \`updatedAt\``);

    // 4. 테이블 ID 컬럼들 UUID 기본값 설정
    await queryRunner.query(
      `ALTER TABLE \`booths\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );
    await queryRunner.query(
      `ALTER TABLE \`stages\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );
    await queryRunner.query(
      `ALTER TABLE \`roles\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );

    // 5. user_roles 테이블 인덱스 재생성
    await queryRunner.query(
      `CREATE INDEX \`IDX_472b25323af01488f1f66a06b6\` ON \`user_roles\` (\`userId\`)`
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_86033897c009fcca8b6505d6be\` ON \`user_roles\` (\`roleId\`)`
    );

    // 6. 새로운 외래키 제약조건 안전하게 추가
    await safeAddConstraint(
      queryRunner,
      'user_roles',
      'FK_472b25323af01488f1f66a06b67',
      'FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE'
    );
    await safeAddConstraint(
      queryRunner,
      'user_roles',
      'FK_86033897c009fcca8b6505d6be2',
      'FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION'
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. 외래키 제약조건 안전하게 삭제
    await safeDropConstraint(queryRunner, 'user_roles', 'FK_86033897c009fcca8b6505d6be2');
    await safeDropConstraint(queryRunner, 'user_roles', 'FK_472b25323af01488f1f66a06b67');

    // 2. 인덱스 삭제
    await queryRunner.query(`DROP INDEX \`IDX_86033897c009fcca8b6505d6be\` ON \`user_roles\``);
    await queryRunner.query(`DROP INDEX \`IDX_472b25323af01488f1f66a06b6\` ON \`user_roles\``);

    // 3. ID 컬럼들 기본값 되돌리기
    await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`roles\` CHANGE \`id\` \`id\` varchar(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`stages\` CHANGE \`id\` \`id\` varchar(36) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`booths\` CHANGE \`id\` \`id\` varchar(36) NOT NULL`);

    // 4. updatedAt 컬럼들 다시 추가
    await queryRunner.query(
      `ALTER TABLE \`stages\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(
      `ALTER TABLE \`booths\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`
    );

    // 5. 기존 인덱스들 복원
    await queryRunner.query(
      `CREATE INDEX \`IDX_user_roles_userId\` ON \`user_roles\` (\`userId\`)`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_user_roles_unique\` ON \`user_roles\` (\`userId\`, \`roleId\`)`
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_user_roles_roleId\` ON \`user_roles\` (\`roleId\`)`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_1e3d0240b49c40521aaeb953293\` ON \`users\` (\`phoneNumber\`)`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`UQ_648e3f5447f725579d7d4ffdfb7\` ON \`roles\` (\`name\`)`
    );

    // 6. 기존 외래키 제약조건 복원
    await safeAddConstraint(
      queryRunner,
      'user_roles',
      'FK_user_roles_userId',
      'FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION'
    );
    await safeAddConstraint(
      queryRunner,
      'user_roles',
      'FK_user_roles_roleId',
      'FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE CASCADE ON UPDATE NO ACTION'
    );
  }
}
