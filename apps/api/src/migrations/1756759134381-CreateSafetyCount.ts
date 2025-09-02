import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSafetyCount1756759134381 implements MigrationInterface {
  name = 'CreateSafetyCount1756759134381';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`safety_counts\` (\`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`id\` varchar(36) NOT NULL DEFAULT (UUID()), \`userId\` varchar(36) NOT NULL, \`increment\` int NOT NULL DEFAULT '0', \`decrement\` int NOT NULL DEFAULT '0', \`date\` date NOT NULL, \`version\` int NOT NULL, INDEX \`IDX_97c1940ffc651b0b3a6aceb064\` (\`userId\`), INDEX \`IDX_5c75c899a30d2e46bf0c2b4140\` (\`date\`), UNIQUE INDEX \`IDX_95e72d9710a97567ae282a4d2b\` (\`userId\`, \`date\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL DEFAULT (UUID())`
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
    await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`id\` \`id\` varchar(36) NOT NULL`);
    await queryRunner.query(`DROP INDEX \`IDX_95e72d9710a97567ae282a4d2b\` ON \`safety_counts\``);
    await queryRunner.query(`DROP INDEX \`IDX_5c75c899a30d2e46bf0c2b4140\` ON \`safety_counts\``);
    await queryRunner.query(`DROP INDEX \`IDX_97c1940ffc651b0b3a6aceb064\` ON \`safety_counts\``);
    await queryRunner.query(`DROP TABLE \`safety_counts\``);
  }
}
