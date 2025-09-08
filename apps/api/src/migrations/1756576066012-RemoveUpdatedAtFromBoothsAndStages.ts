import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUpdatedAtFromBoothsAndStages1756576066012 implements MigrationInterface {
  name = 'RemoveUpdatedAtFromBoothsAndStages1756576066012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_user_roles_roleId\``);
    await queryRunner.query(`ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_user_roles_userId\``);
    await queryRunner.query(`DROP INDEX \`UQ_648e3f5447f725579d7d4ffdfb7\` ON \`roles\``);
    await queryRunner.query(`DROP INDEX \`UQ_1e3d0240b49c40521aaeb953293\` ON \`users\``);
    await queryRunner.query(`DROP INDEX \`IDX_user_roles_roleId\` ON \`user_roles\``);
    await queryRunner.query(`DROP INDEX \`IDX_user_roles_unique\` ON \`user_roles\``);
    await queryRunner.query(`DROP INDEX \`IDX_user_roles_userId\` ON \`user_roles\``);
    await queryRunner.query(`ALTER TABLE \`stages\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(`ALTER TABLE \`booths\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(`ALTER TABLE \`user_roles\` ADD PRIMARY KEY (\`userId\`, \`roleId\`)`);
    await queryRunner.query(
      `ALTER TABLE \`stages\` CHANGE \`day\` \`day\` enum ('FRI', 'SAT') NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`booths\` CHANGE \`zone\` \`zone\` enum ('booth', 'info', 'foodTruck', 'nightMarket') NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE \`roles\` DROP COLUMN \`createdAt\``);
    await queryRunner.query(
      `ALTER TABLE \`roles\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(
      `ALTER TABLE \`roles\` ADD UNIQUE INDEX \`IDX_648e3f5447f725579d7d4ffdfb\` (\`name\`)`
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`createdAt\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`phoneNumber\``);
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`phoneNumber\` varchar(255) NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_1e3d0240b49c40521aaeb95329\` (\`phoneNumber\`)`
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`displayName\``);
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`displayName\` varchar(255) NOT NULL`);
    await queryRunner.query(
      `CREATE INDEX \`IDX_472b25323af01488f1f66a06b6\` ON \`user_roles\` (\`userId\`)`
    );
    await queryRunner.query(
      `CREATE INDEX \`IDX_86033897c009fcca8b6505d6be\` ON \`user_roles\` (\`roleId\`)`
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_472b25323af01488f1f66a06b67\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_86033897c009fcca8b6505d6be2\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_86033897c009fcca8b6505d6be2\``
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` DROP FOREIGN KEY \`FK_472b25323af01488f1f66a06b67\``
    );
    await queryRunner.query(`DROP INDEX \`IDX_86033897c009fcca8b6505d6be\` ON \`user_roles\``);
    await queryRunner.query(`DROP INDEX \`IDX_472b25323af01488f1f66a06b6\` ON \`user_roles\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`displayName\``);
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`displayName\` varchar(100) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_1e3d0240b49c40521aaeb95329\``);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`phoneNumber\``);
    await queryRunner.query(`ALTER TABLE \`users\` ADD \`phoneNumber\` varchar(20) NOT NULL`);
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`updatedAt\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`updatedAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`
    );
    await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`createdAt\``);
    await queryRunner.query(
      `ALTER TABLE \`users\` ADD \`createdAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`
    );
    await queryRunner.query(`ALTER TABLE \`roles\` DROP INDEX \`IDX_648e3f5447f725579d7d4ffdfb\``);
    await queryRunner.query(`ALTER TABLE \`roles\` DROP COLUMN \`createdAt\``);
    await queryRunner.query(
      `ALTER TABLE \`roles\` ADD \`createdAt\` timestamp(0) NOT NULL DEFAULT CURRENT_TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE \`booths\` CHANGE \`zone\` \`zone\` enum ('booth', 'info', 'foodTruck', 'hof') NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE \`stages\` CHANGE \`day\` \`day\` enum ('SAT', 'SUN') NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE \`user_roles\` DROP PRIMARY KEY`);
    await queryRunner.query(
      `ALTER TABLE \`booths\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`
    );
    await queryRunner.query(
      `ALTER TABLE \`stages\` ADD \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)`
    );
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
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_user_roles_userId\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE \`user_roles\` ADD CONSTRAINT \`FK_user_roles_roleId\` FOREIGN KEY (\`roleId\`) REFERENCES \`roles\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
