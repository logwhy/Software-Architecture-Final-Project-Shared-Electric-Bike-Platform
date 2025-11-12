# 软件架构

#### 介绍
崔书豪、王舒睿与贾学成的小组仓库

#### 软件架构
软件架构说明


#### 安装教程

1.  xxxx
2.  xxxx

#### 使用说明

1.  xxxx
2.  xxxx
3.  xxxx

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)

```
2025.11.6
第一次提交，初始化前后端并添加用户登录注册模块
这里使用了postgreSQL，需要登录或者替换的话看后端.env文件
数据库名：shared_bike
-- Step 1: 创建通用函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Step 2: 创建 users 表
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(15) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(100),
  role VARCHAR(20) NOT NULL CHECK (role IN ('TENANT', 'OPERATOR', 'MAINTAINER', 'PARK_ADMIN')),
  status VARCHAR(10) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: 创建触发器
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 4: 创建 parks 表
CREATE TABLE IF NOT EXISTS parks (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  geo_boundary JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_parks_updated_at
    BEFORE UPDATE ON parks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 投诉表，使用 PostGIS 地理位置
CREATE TABLE IF NOT EXISTS complaints (
    id SERIAL PRIMARY KEY,
    type VARCHAR(32) NOT NULL,
    description TEXT NOT NULL,
    photo_url VARCHAR(255),
    location geometry(Point, 4326) NOT NULL,
    status VARCHAR(16) DEFAULT '未处理',
    created_at TIMESTAMP DEFAULT NOW(),
    handled_at TIMESTAMP,
    handler VARCHAR(64)
);

CREATE TABLE user_parks (
  user_id INT NOT NULL,
  park_id INT NOT NULL,
  PRIMARY KEY (user_id, park_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (park_id) REFERENCES parks(id) ON DELETE CASCADE
);

-- 为 parks 表添加经纬度字段
ALTER TABLE parks ADD COLUMN center_lng DECIMAL(10, 6);
ALTER TABLE parks ADD COLUMN center_lat DECIMAL(10, 6);
ALTER TABLE parks ADD COLUMN boundary_coordinates JSON;

-- 更新现有园区的经纬度（示例数据，请根据实际情况修改）
UPDATE parks SET 
  center_lng = 116.31,
  center_lat = 39.91,
  boundary_coordinates = '[[116.305, 39.905], [116.315, 39.905], [116.315, 39.915], [116.305, 39.915], [116.305, 39.905]]'
WHERE id = 1;

-- 插入新的园区
INSERT INTO parks (name, location, center_lng, center_lat, boundary_coordinates) VALUES 
('上海科技园区', '上海市浦东新区', 121.47, 31.23, '[[121.46, 31.22], [121.48, 31.22], [121.48, 31.24], [121.46, 31.24], [121.46, 31.22]]');
```
