# Support API 文档

## 提交 support 请求

- URL: `POST /supports`
- REQ:
```ts
ERROWS_AUTH_JSON_REQ<SUPPORT>
```
- RES: `ERROWS_RESPONSE<{ id: string }>`

## 查询 support 请求列表

- URL: `GET /ops/supports`
- REQ: `ERROWS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<PAGINATION<SUPPORT>>`

# API 概览

[API TOC](./readme.md#toc)