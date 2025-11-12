-- postgis_setup.sql
-- 1) 启用 PostGIS 扩展（需要有超级用户权限）
CREATE EXTENSION IF NOT EXISTS postgis;

-- 2) 为 rides 表添加 start_location 和 end_location（如果尚不存在）
ALTER TABLE rides
  ADD COLUMN IF NOT EXISTS start_location geometry(Point, 4326),
  ADD COLUMN IF NOT EXISTS end_location geometry(Point, 4326);

-- 3) 为位置列创建空间索引
CREATE INDEX IF NOT EXISTS idx_rides_start_location ON rides USING GIST (start_location);
CREATE INDEX IF NOT EXISTS idx_rides_end_location ON rides USING GIST (end_location);

-- 4) 一些方便的示例查询，用于分析（仅供参考）
-- 按近 30 天活跃用户数
-- SELECT u.id, u.name, COUNT(r.*) as rides
-- FROM users u JOIN rides r ON u.id = r.user_id
-- WHERE r.start_time >= NOW() - INTERVAL '30 days'
-- GROUP BY u.id, u.name ORDER BY rides DESC;

-- 5) 插入示例用户和骑行数据（仅示例）
-- 注意：请根据实际的 users/vehicles 表结构调整关联 id

-- 示例租客
INSERT INTO users (phone, password_hash, name, role, created_at)
VALUES
('13800000001', '$2b$10$EXAMPLEHASH0000000000000000000000000000000000000000', '租客A', 'TENANT', NOW()),
('13800000002', '$2b$10$EXAMPLEHASH0000000000000000000000000000000000000000', '租客B', 'TENANT', NOW()),
('13800000003', '$2b$10$EXAMPLEHASH0000000000000000000000000000000000000000', '租客C', 'TENANT', NOW())
ON CONFLICT (phone) DO NOTHING;

-- 示例骑行数据（假设 vehicles id 1、2、3 存在）
INSERT INTO rides (user_id, vehicle_id, park_id, start_time, end_time, fee, status, start_location, end_location, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE phone='13800000001' LIMIT 1), 1, NULL, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days' + INTERVAL '15 minutes', 3.0, 'COMPLETED', ST_GeomFromText('POINT(116.397428 39.90923)', 4326), ST_GeomFromText('POINT(116.403875 39.91531)', 4326), NOW(), NOW()),
((SELECT id FROM users WHERE phone='13800000002' LIMIT 1), 2, NULL, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days' + INTERVAL '25 minutes', 5.0, 'COMPLETED', ST_GeomFromText('POINT(116.397500 39.90850)', 4326), ST_GeomFromText('POINT(116.404000 39.91500)', 4326), NOW(), NOW()),
((SELECT id FROM users WHERE phone='13800000001' LIMIT 1), 1, NULL, NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days' + INTERVAL '8 minutes', 1.5, 'COMPLETED', ST_GeomFromText('POINT(116.397428 39.90923)', 4326), ST_GeomFromText('POINT(116.399000 39.91000)', 4326), NOW(), NOW()),
((SELECT id FROM users WHERE phone='13800000003' LIMIT 1), 3, NULL, NOW() - INTERVAL '3 hours', NOW() - INTERVAL '2 hours 45 minutes', 4.0, 'COMPLETED', ST_GeomFromText('POINT(116.380000 39.900000)', 4326), ST_GeomFromText('POINT(116.390000 39.905000)', 4326), NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 6) 示例：创建一个用于快速统计的 materialized view（可选）
DROP MATERIALIZED VIEW IF EXISTS mv_daily_ride_counts;
CREATE MATERIALIZED VIEW mv_daily_ride_counts AS
SELECT date_trunc('day', start_time)::date as day, COUNT(*) as rides
FROM rides
GROUP BY date_trunc('day', start_time)
ORDER BY day DESC;

-- 刷新视图：
-- REFRESH MATERIALIZED VIEW mv_daily_ride_counts;
