import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBoothNumber1756908894240 implements MigrationInterface {
  name = 'AddBoothNumber1756908894240';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add boothNumber column as nullable first
    await queryRunner.query(`ALTER TABLE \`booths\` ADD \`boothNumber\` varchar(10) NULL`);

    // Update existing booth data to set boothNumber = id as string
    await queryRunner.query(`UPDATE \`booths\` SET \`boothNumber\` = CAST(\`id\` AS CHAR)`);

    // Make boothNumber NOT NULL and add unique constraint
    await queryRunner.query(`ALTER TABLE \`booths\` MODIFY \`boothNumber\` varchar(10) NOT NULL`);

    await queryRunner.query(
      `ALTER TABLE \`booths\` ADD UNIQUE INDEX \`IDX_booth_number\` (\`boothNumber\`)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the unique index
    await queryRunner.query(`ALTER TABLE \`booths\` DROP INDEX \`IDX_booth_number\``);

    // Drop the boothNumber column
    await queryRunner.query(`ALTER TABLE \`booths\` DROP COLUMN \`boothNumber\``);
  }
}
