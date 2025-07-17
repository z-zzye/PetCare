-- Board 테이블의 content 컬럼을 LONGTEXT로 변경하는 SQL 쿼리
-- 실행 전 주의사항: 데이터베이스 백업을 권장합니다

-- Board 테이블의 content 컬럼을 LONGTEXT로 변경
ALTER TABLE board MODIFY COLUMN content LONGTEXT NOT NULL;

-- Board 테이블의 original_content 컬럼을 LONGTEXT로 변경
ALTER TABLE board MODIFY COLUMN original_content LONGTEXT;

-- Comment 테이블의 content 컬럼을 LONGTEXT로 변경
ALTER TABLE comment MODIFY COLUMN content LONGTEXT NOT NULL;

-- Comment 테이블의 original_content 컬럼을 LONGTEXT로 변경
ALTER TABLE comment MODIFY COLUMN original_content LONGTEXT;

-- 변경 확인 쿼리
-- SHOW CREATE TABLE board;
-- SHOW CREATE TABLE comment; 