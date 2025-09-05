import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddVisitorAnalytics1757867600000 implements MigrationInterface {
  name = 'AddVisitorAnalytics1757867600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`visitor_analytics\` (
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), 
        \`id\` varchar(36) NOT NULL DEFAULT (UUID()), 
        \`landingPage\` varchar(255) NOT NULL, 
        \`userAgent\` text NULL, 
        \`visitedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP, 
        \`userId\` varchar(36) NULL, 
        INDEX \`IDX_visitor_analytics_landingPage\` (\`landingPage\`), 
        INDEX \`IDX_visitor_analytics_visitedAt\` (\`visitedAt\`), 
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB`
    );

    await queryRunner.query(
      `ALTER TABLE \`visitor_analytics\` 
       ADD CONSTRAINT \`FK_visitor_analytics_userId\` 
       FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE \`visitor_analytics\` DROP FOREIGN KEY \`FK_visitor_analytics_userId\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_visitor_analytics_visitedAt\` ON \`visitor_analytics\``
    );
    await queryRunner.query(
      `DROP INDEX \`IDX_visitor_analytics_landingPage\` ON \`visitor_analytics\``
    );
    await queryRunner.query(`DROP TABLE \`visitor_analytics\``);
  }
}
