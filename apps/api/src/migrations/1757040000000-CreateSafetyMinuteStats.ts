import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSafetyMinuteStats1757040000000 implements MigrationInterface {
  name = 'CreateSafetyMinuteStats1757040000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // safety_minute_stats 테이블 생성
    await queryRunner.query(`
      CREATE TABLE \`safety_minute_stats\` (
        \`id\` varchar(36) NOT NULL DEFAULT (UUID()),
        \`createdAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updatedAt\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`minute\` datetime NOT NULL,
        \`currentInside\` int NOT NULL DEFAULT '0',
        \`incrementCount\` int NOT NULL DEFAULT '0',
        \`decrementCount\` int NOT NULL DEFAULT '0',
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_safety_minute_stats_minute\` (\`minute\`),
        KEY \`IDX_safety_minute_stats_minute_currentInside\` (\`minute\`, \`currentInside\`)
      ) ENGINE=InnoDB
    `);

    // 인덱스 추가 설명 주석
    await queryRunner.query(`
      ALTER TABLE \`safety_minute_stats\` 
      COMMENT = '분단위 안전 통계 사전 계산 테이블 - DB 성능 최적화용'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // safety_minute_stats 테이블 삭제
    await queryRunner.query(`DROP TABLE \`safety_minute_stats\``);
  }
}
