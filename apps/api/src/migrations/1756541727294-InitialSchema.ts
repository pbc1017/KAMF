import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1756541727294 implements MigrationInterface {
  name = 'InitialSchema1756541727294';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`users\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`username\` varchar(255) NOT NULL, \`firstName\` varchar(255) NULL, \`lastName\` varchar(255) NULL, \`isActive\` tinyint NOT NULL DEFAULT 1, \`role\` enum ('admin', 'user', 'moderator') NOT NULL DEFAULT 'user', \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), UNIQUE INDEX \`IDX_fe0bb3f6520ee0469504521e71\` (\`username\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`booths\` (\`id\` int NOT NULL AUTO_INCREMENT, \`titleKo\` varchar(255) NOT NULL, \`titleEn\` varchar(255) NOT NULL, \`zone\` enum ('booth', 'info', 'foodTruck', 'hof') NOT NULL, \`descriptionKo\` text NOT NULL, \`descriptionEn\` text NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
    await queryRunner.query(
      `CREATE TABLE \`stages\` (\`id\` int NOT NULL AUTO_INCREMENT, \`titleKo\` varchar(255) NOT NULL, \`titleEn\` varchar(255) NOT NULL, \`startTime\` varchar(5) NOT NULL, \`endTime\` varchar(5) NOT NULL, \`descriptionKo\` text NOT NULL, \`descriptionEn\` text NOT NULL, \`day\` enum ('SAT', 'SUN') NOT NULL, \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE \`stages\``);
    await queryRunner.query(`DROP TABLE \`booths\``);
    await queryRunner.query(`DROP INDEX \`IDX_fe0bb3f6520ee0469504521e71\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
    await queryRunner.query(`DROP TABLE \`users\``);
  }
}
