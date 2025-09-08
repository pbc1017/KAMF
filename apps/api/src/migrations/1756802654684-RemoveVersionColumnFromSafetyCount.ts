import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveVersionColumnFromSafetyCount1756802654684 implements MigrationInterface {
  name = 'RemoveVersionColumnFromSafetyCount1756802654684';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`safety_counts\` DROP COLUMN \`version\``);
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` DROP FOREIGN KEY \`FK_97c1940ffc651b0b3a6aceb0646\``
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_472b25323af01488f1f66a06b67\``
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
    );
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` ADD CONSTRAINT \`FK_97c1940ffc651b0b3a6aceb0646\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_472b25323af01488f1f66a06b67\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_472b25323af01488f1f66a06b67\``
    );
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` DROP FOREIGN KEY \`FK_97c1940ffc651b0b3a6aceb0646\``
    );
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT 'uuid()'`
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT 'uuid()'`
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_472b25323af01488f1f66a06b67\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE \`safety_counts\` ADD CONSTRAINT \`FK_97c1940ffc651b0b3a6aceb0646\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(`ALTER TABLE \`safety_counts\` ADD \`version\` int NOT NULL`);
  }
}
