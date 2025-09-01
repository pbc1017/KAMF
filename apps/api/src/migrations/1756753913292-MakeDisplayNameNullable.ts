import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeDisplayNameNullable1756753913292 implements MigrationInterface {
  name = 'MakeDisplayNameNullable1756753913292';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`displayName\` \`displayName\` varchar(255) NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`displayName\` \`displayName\` varchar(255) NOT NULL`
    );
  }
}
