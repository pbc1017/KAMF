import { MigrationInterface, QueryRunner } from 'typeorm';

export class UseDbUuidGeneration1756754249828 implements MigrationInterface {
  name = 'UseDbUuidGeneration1756754249828';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`users\` MODIFY \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`users\` MODIFY \`id\` varchar(36) NOT NULL`);
  }
}
