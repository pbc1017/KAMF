import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddStageTypeToStages1757020000000 implements MigrationInterface {
  name = 'AddStageTypeToStages1757020000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add stageType enum column to stages table
    await queryRunner.query(
      `ALTER TABLE \`stages\` ADD \`stageType\` enum('OPEN_STAGE', 'MAIN_STAGE') NOT NULL DEFAULT 'OPEN_STAGE'`
    );

    // Update existing data to OPEN_STAGE (already set by DEFAULT, but being explicit)
    await queryRunner.query(
      `UPDATE \`stages\` SET \`stageType\` = 'OPEN_STAGE' WHERE \`stageType\` IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove stageType column
    await queryRunner.query(`ALTER TABLE \`stages\` DROP COLUMN \`stageType\``);
  }
}
