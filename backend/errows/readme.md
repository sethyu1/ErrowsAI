# 技术栈

| 技术栈 | 选型 | 版本 |
| --- | --- | --- |
| 系统 | debian | 13 (Trixie) |
| 后端语言/平台 | Javascript/NodeJs | >= 18, 推荐 20 |
| 数据库 | PostgreSQL | 17.6 |
| Web Server | MoleculerJs | - |
| 测试 | Vitest | - |


# 项目 SETUP 说明

> [!NOTE]
> 以下步骤均可在项目根目录下执行

## 数据库

1. 安装数据库
```bash
apt install postgresql
```

2. 测试环境数据库初始化

```bash
# 创建测试用户
sudo -u postgres createuser -P errows

# 创建开发数据库
sudo -u postgres createdb errows_dev -O errows
# 创建测试数据库
sudo -u postgres createdb errows_test -O errows
```

3. 表结构初始化
```bash
pnpm -s errowsctl bootstrap
```

4. 表结构迁移
```bash
pnpm -s errowsctl migration upgrade
```

## 安装项目依赖

```bash
pnpm install
```

## 编译后端依赖

```bash
# 一次性编译
pnpm run -s server build

# 监听编译，开发时使用
pnpm run -s server build --watch
```

## 后端服务

启动后端服务
```bash
pnpm run -s server dev
```


## 后端 API 集成测试

> [!NOTE]
> 跑测试不需要后端服务启动

```bash
pnpm run -s server t --coverage
```

## 部署
部署请参考 [部署文档](./docs/deploy.md)