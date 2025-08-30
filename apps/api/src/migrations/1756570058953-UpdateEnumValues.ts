import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateEnumValues1756570058953 implements MigrationInterface {
  name = 'UpdateEnumValues1756570058953';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Update existing data in booths table (hof -> nightMarket)
    await queryRunner.query(
      `UPDATE \`booths\` SET \`zone\` = 'nightMarket' WHERE \`zone\` = 'hof'`
    );

    // Step 2: Update existing data in stages table (SUN -> FRI)
    await queryRunner.query(`UPDATE \`stages\` SET \`day\` = 'FRI' WHERE \`day\` = 'SUN'`);

    // Step 3: Alter booth table zone enum to replace 'hof' with 'nightMarket'
    await queryRunner.query(
      `ALTER TABLE \`booths\` MODIFY COLUMN \`zone\` enum('booth', 'info', 'foodTruck', 'nightMarket') NOT NULL`
    );

    // Step 4: Alter stage table day enum to replace 'SUN' with 'FRI'
    await queryRunner.query(
      `ALTER TABLE \`stages\` MODIFY COLUMN \`day\` enum('FRI', 'SAT') NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Update existing data in stages table (FRI -> SUN)
    await queryRunner.query(`UPDATE \`stages\` SET \`day\` = 'SUN' WHERE \`day\` = 'FRI'`);

    // Step 2: Update existing data in booths table (nightMarket -> hof)
    await queryRunner.query(
      `UPDATE \`booths\` SET \`zone\` = 'hof' WHERE \`zone\` = 'nightMarket'`
    );

    // Step 3: Revert stage table day enum to original values
    await queryRunner.query(
      `ALTER TABLE \`stages\` MODIFY COLUMN \`day\` enum('SAT', 'SUN') NOT NULL`
    );

    // Step 4: Revert booth table zone enum to original values
    await queryRunner.query(
      `ALTER TABLE \`booths\` MODIFY COLUMN \`zone\` enum('booth', 'info', 'foodTruck', 'hof') NOT NULL`
    );
  }
}
