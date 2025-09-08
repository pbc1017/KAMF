import { QueryRunner } from 'typeorm';

/**
 * 안전하게 외래키 제약조건을 삭제합니다.
 * 존재하지 않는 제약조건 삭제 시 오류를 방지합니다.
 *
 * @param queryRunner TypeORM QueryRunner
 * @param table 테이블명
 * @param constraintName 제약조건명
 * @returns 삭제 성공 여부
 */
export async function safeDropConstraint(
  queryRunner: QueryRunner,
  table: string,
  constraintName: string
): Promise<boolean> {
  try {
    const constraints = await queryRunner.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${table}' 
        AND CONSTRAINT_NAME = '${constraintName}'
    `);

    if (constraints.length > 0) {
      await queryRunner.query(`ALTER TABLE \`${table}\` DROP FOREIGN KEY \`${constraintName}\``);
      console.log(`✅ Dropped constraint: ${constraintName} from ${table}`);
      return true;
    } else {
      console.log(`ℹ️  Constraint ${constraintName} does not exist in ${table}, skipping`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Error dropping constraint ${constraintName}: ${error.message}`);
    return false;
  }
}

/**
 * 안전하게 외래키 제약조건을 추가합니다.
 * 이미 존재하는 제약조건 추가 시 오류를 방지합니다.
 *
 * @param queryRunner TypeORM QueryRunner
 * @param table 테이블명
 * @param constraintName 제약조건명
 * @param constraintDefinition 제약조건 정의 (FOREIGN KEY (...) REFERENCES ...)
 * @returns 추가 성공 여부
 */
export async function safeAddConstraint(
  queryRunner: QueryRunner,
  table: string,
  constraintName: string,
  constraintDefinition: string
): Promise<boolean> {
  try {
    const existing = await queryRunner.query(`
      SELECT CONSTRAINT_NAME 
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${table}' 
        AND CONSTRAINT_NAME = '${constraintName}'
    `);

    if (existing.length === 0) {
      await queryRunner.query(
        `ALTER TABLE \`${table}\` ADD CONSTRAINT \`${constraintName}\` ${constraintDefinition}`
      );
      console.log(`✅ Added constraint: ${constraintName} to ${table}`);
      return true;
    } else {
      console.log(`ℹ️  Constraint ${constraintName} already exists in ${table}, skipping`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Error adding constraint ${constraintName}: ${error.message}`);
    return false;
  }
}

/**
 * 컬럼명으로 인덱스 이름을 동적으로 찾습니다.
 * 하드코딩된 인덱스명 대신 실제 DB의 인덱스명을 검색합니다.
 *
 * @param queryRunner TypeORM QueryRunner
 * @param table 테이블명
 * @param column 컬럼명
 * @returns 인덱스명 (없으면 null)
 */
export async function findIndexByColumn(
  queryRunner: QueryRunner,
  table: string,
  column: string
): Promise<string | null> {
  try {
    const indexes = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${table}' 
        AND COLUMN_NAME = '${column}'
        AND INDEX_NAME != 'PRIMARY'
      LIMIT 1
    `);

    const indexName = indexes.length > 0 ? indexes[0].INDEX_NAME : null;
    if (indexName) {
      console.log(`🔍 Found index: ${indexName} on ${table}.${column}`);
    } else {
      console.log(`ℹ️  No index found on ${table}.${column}`);
    }

    return indexName;
  } catch (error) {
    console.log(`⚠️  Error finding index on ${table}.${column}: ${error.message}`);
    return null;
  }
}

/**
 * 안전하게 인덱스를 삭제합니다.
 * 존재하지 않는 인덱스 삭제 시 오류를 방지합니다.
 *
 * @param queryRunner TypeORM QueryRunner
 * @param table 테이블명
 * @param indexName 인덱스명
 * @returns 삭제 성공 여부
 */
export async function safeDropIndex(
  queryRunner: QueryRunner,
  table: string,
  indexName: string
): Promise<boolean> {
  try {
    const indexes = await queryRunner.query(`
      SELECT INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${table}' 
        AND INDEX_NAME = '${indexName}'
    `);

    if (indexes.length > 0) {
      await queryRunner.query(`ALTER TABLE \`${table}\` DROP INDEX \`${indexName}\``);
      console.log(`✅ Dropped index: ${indexName} from ${table}`);
      return true;
    } else {
      console.log(`ℹ️  Index ${indexName} does not exist in ${table}, skipping`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  Error dropping index ${indexName}: ${error.message}`);
    return false;
  }
}

/**
 * 제약조건이 존재하는지 확인합니다.
 *
 * @param queryRunner TypeORM QueryRunner
 * @param table 테이블명
 * @param constraintName 제약조건명
 * @returns 존재 여부
 */
export async function constraintExists(
  queryRunner: QueryRunner,
  table: string,
  constraintName: string
): Promise<boolean> {
  try {
    const result = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${table}' 
        AND CONSTRAINT_NAME = '${constraintName}'
    `);

    return result[0].count > 0;
  } catch (error) {
    return false;
  }
}

/**
 * 인덱스가 존재하는지 확인합니다.
 *
 * @param queryRunner TypeORM QueryRunner
 * @param table 테이블명
 * @param indexName 인덱스명
 * @returns 존재 여부
 */
export async function indexExists(
  queryRunner: QueryRunner,
  table: string,
  indexName: string
): Promise<boolean> {
  try {
    const result = await queryRunner.query(`
      SELECT COUNT(*) as count
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = '${table}' 
        AND INDEX_NAME = '${indexName}'
    `);

    return result[0].count > 0;
  } catch (error) {
    return false;
  }
}
