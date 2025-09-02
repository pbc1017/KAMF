import { MigrationInterface, QueryRunner } from 'typeorm';

export class RefactorSafetyCountForMinuteStats1756801588779 implements MigrationInterface {
  name = 'RefactorSafetyCountForMinuteStats1756801588779';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX \`IDX_5c75c899a30d2e46bf0c2b4140\` ON \`safety_counts\``);
    await queryRunner.query(`DROP INDEX \`IDX_95e72d9710a97567ae282a4d2b\` ON \`safety_counts\``);
    await queryRunner.query(`ALTER TABLE \`safety_counts\` DROP COLUMN \`date\``);
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
      `CREATE INDEX \`IDX_833ff1d488b29f2248cac955e7\` ON \`safety_counts\` (\`createdAt\`)`
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_996e7bc0dcfd1273480843cc40\` ON \`safety_counts\` (\`userId\`, \`createdAt\`)`
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
    await queryRunner.query(`DROP INDEX \`IDX_996e7bc0dcfd1273480843cc40\` ON \`safety_counts\``);
    await queryRunner.query(`DROP INDEX \`IDX_833ff1d488b29f2248cac955e7\` ON \`safety_counts\``);
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
    await queryRunner.query(`ALTER TABLE \`safety_counts\` ADD \`date\` date NOT NULL`);
    await queryRunner.query(
      `CREATE UNIQUE INDEX \`IDX_95e72d9710a97567ae282a4d2b\` ON \`safety_counts\` (\`userId\`, \`date\`)`
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_5c75c899a30d2e46bf0c2b4140\` ON \`safety_counts\` (\`date\`)`
    );
  }
}
