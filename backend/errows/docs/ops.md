# 运维平台相关 API

## 运营系统权限列表

- URL: `GET /ops/permissions`
- REQ: `ERRORS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<OP_PERMISSION[]>`

## 运营系统角色列表

> [!NOTE]
> 系统自带 "系统管理员" 角色 sysadmin，拥有所有权限，不能修改和删除

- URL: `GET /ops/roles`
- REQ: `ERRORS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<OP_ROLE[]>`

## 添加运营系统角色

- URL: `POST /ops/roles`
- REQ:
```ts
ERROWS_AUTH_JSON_REQ<{
  name: string; // 角色名称
  permissions: string[]; // 角色所拥有的权限列表
}>
```
- RES: `ERROWS_RESPONSE<{ id: string }>`

## 修改运营系统角色

- URL: `PUT /ops/roles/:role_id`
- REQ:
```ts
ERROWS_AUTH_JSON_REQ<{
  name: string; // 角色名称
  permissions: string[]; // 角色所拥有的权限列表
}>
```
- RES: `HTTP_204_RES`

## 删除运营系统角色

- URL: `DELETE /ops/roles/:role_id`
- REQ: `ERROWS_AUTH_REQ`
- RES: `HTTP_204_RES`

## 查询运营用户信息

- URL: `GET /ops/users/profile`
- REQ: `ERROWS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<OP_USER>`

## 查询运营用户列表

- URL: `GET /ops/users`
- REQ: `ERROWS_AUTH_REQ & {
  query?: {
    has_op_role: boolean; // 是否只查询有运营角色的用户, 默认 false
    page: number; // 页码，默认 0
    size: number; // 每页数量，默认 20
    q: string; // 搜索关键词，模糊匹配邮箱
  };
}`
- RES: `ERROWS_RESPONSE<{ count: number, data: OP_USER[] }>`

## 添加用户并分配运营角色

- URL: `POST /ops/users`
- REQ:
```ts
ERROWS_AUTH_JSON_REQ<{
  name: string; // 运营用户名
  email: string; // 运营用户邮箱
  password: string; // 运营用户密码
  roles: string[]; // 运营用户角色 ID
}>
```
- RES: `ERROWS_RESPONSE<{ id: string }>`

## 修改用户运营角色

- URL: `PUT /ops/users/:user_id`
- REQ:
```ts
ERROWS_AUTH_JSON_REQ<{
  roles: string[]; // 运营用户角色 ID
}>
```
- RES: `HTTP_204_RES`

## 上传图片

- URL: `POST /ops/assets/images`
- REQ:
```ts
{
  headers: AUTH_HEADER;
  body: File // 图片 stream
}
```
- RES: `ERROWS_RESPONSE<{ url: string }>`


## 添加 更新 pixel 配置

- URL: `PUT /ops/pixel`
- REQ: `ERROWS_AUTH_JSON_REQ<{ pixel_id: string; access_token; remark: string; }>`
- RES: `HTTP_204_RES`

## 查询 pixel 配置

- URL: `GET /ops/pixel`
- REQ: `ERROWS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<PAGINATION<USER_PIXEL>>`


# API 概览

[API TOC](./readme.md#toc)