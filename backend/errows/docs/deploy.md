# 部署文档

## 环境准备

@TODO

- NODEJS
- npm, corepack, pnpm
- PostgreSQL
- ffmpeg
- nginx


## 项目部署脚本

部署前确保有相应机器的 errows 用户的访问权限

1. 部署到测试环境

```bash
./backend/errows/deploy-dev.sh errows@<testing-server>
```

2. 部署到生产环境

```bash
./backend/errows/deploy.pro.sh errows@<production-server>
```
