
# 角色

## 角色创建配置项查询

- URL: `GET /characters/options`
- REQ: `{ }`
- RES: `ERROWS_RESPONSE<{ options: CHARACTER_CREATE_OPTION[] }>`

## 创建角色

- URL: `POST /my/characters`
- REQ: `{ headers: AUTH_HEADER, body: CHARACTER_SETTING }`
- RES: `ERROWS_RESPONSE<{ id: string }, 201>`

## 获取角色设置详情

- URL: `GET /my/characters/:cid/settings`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `ERROWS_RESPONSE<CHARACTER_SETTING>`

## 更新角色设置

- URL: `PUT /my/characters/:cid/settings`
- REQ: `{ headers: AUTH_HEADER, body: CHARACTER_SETTING }`
- RES: `HTTP_204_RES`

## 角色一键重生/重新生成头像

- URL: `POST /my/characters/:cid/avatar`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `HTTP_204_RES`

## 获取和自己相关角色的列表

- URL: `GET /my/characters/:type`
- REQ:
  ```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
       // 获取自己拥有、关注或点赞的角色列表
      type: 'owned' | 'followed' | 'liked' | 'public' | 'deleted'
    },
    URLSearchParams: CHARACTER_LIST_PARAMS_BASE
  }
  ```
- RES: `ERROWS_RESPONSE<{ count: number, characters: CHARACTER[] }>`

## 删除角色

- URL: `DELETE /my/characters/:cid`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `HTTP_204_RES`


## 角色列表

- URL: `GET /characters`
- REQ:
```ts
{
  headers?: AUTH_HEADER;
  URLSearchParams: CHARACTER_LIST_PARAMS & {
    recommended?: boolean; // 是否只获取推荐角色列表
  }
}
```
- RES: `ERROWS_RESPONSE<{ count: number, characters: CHARACTER[] }>`

## 角色详情

- URL: `GET /characters/:cid`
- RES: `ERROWS_RESPONSE<CHARACTER>`

## 给角色点赞

- URL: `POST /characters/:cid/like`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `HTTP_204_RES`

## 角色取消点赞

- URL: `DELETE /characters/:cid/like`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `HTTP_204_RES`

## 关注角色

- URL: `POST /characters/:cid/follow`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `HTTP_204_RES`

## 取消关注角色

- URL: `DELETE /characters/:cid/follow`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `HTTP_204_RES`

# 角色管理

## 运营后台角色列表

- URL: `GET /ops/characters`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  URLSearchParams: CHARACTER_LIST_PARAMS & {
    status?: 'private' | 'public' | 'rejected'; // 角色状态过滤
  }
}
```
- RES: `ERROWS_RESPONSE<{ count: number, data: CHARACTER[] }>`

## 修改角色状态

- URL: `PUT /ops/characters/:cid/status`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  body: {
    status: 'public' | 'rejected'; // 角色新状态
    reason?: string; // 拒绝原因， status 为 rejected 时必填
  }
}
```
- RES: `HTTP_204_RES`

## 修改角色推荐状态

- URL: `PUT /ops/characters/:cid/recommendation`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  body: {
    recommended: boolean; // 是否推荐该角色
  }
}
```
- RES: `HTTP_204_RES`

## 角色生图关键字列表

- URL: `GET /ops/sessions/image/keywords`
- REQ: `ERROWS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<{ keywords: string[] }>`

## 配置生图关键词

- URL: `PUT /ops/sessions/image/keywords`
- REQ: `ERROWS_AUTH_JSON_REQ<{ keywords: string[] }>`
- RES: `HTTP_204_RES`

## 配置聊天中角色默认生图概率

- URL: `PUT /ops/sessions/image/probability/default`
- REQ:
```ts
ERROWS_AUTH_JSON_REQ<{
  turns: number; // 生图关键词生效的对话轮数阈值
  probability: number // 生图关键词触发概率，0-100 之间的整数
}>
```
- RES: `HTTP_204_RES`

## 获取聊天中角色默认生图概率

- URL: `GET /ops/sessions/image/probability/default`
- REQ: `ERROWS_AUTH_REQ`
- RES:
```ts
ERROWS_RESPONSE<{
  turns: number; // 生图关键词生效的对话轮数阈值
  probability: number // 生图关键词触发概率，0-100 之间的整数
}>
```

## 配置聊天中角色生图概率

- URL: `PUT /ops/sessions/image/probability/character/:cid`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
  },
  body: {
    turns: number; // 生图关键词生效的对话轮数阈值
    probability: number // 生图关键词触发概率，0-100 之间的整数
  }
}
```
- RES: `HTTP_204_RES`

## 获取聊天中角色生图概率

- URL: `GET /ops/sessions/image/probability/character/:cid`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
  }
}
```
- RES:
```ts
ERROWS_RESPONSE<{
  turns: number; // 生图关键词生效的对话轮数阈值
  probability: number // 生图关键词触发概率，0-100 之间的整数
}>
```

## 设定角色默认排序值
- URL: `PUT /ops/characters/:cid/order/default`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
  },
  body: {
    default_order: number; // 角色默认排序值，整数，值越小排序越靠前
  }
}
```
- RES: `HTTP_204_RES`

# API 概览

[API TOC](./readme.md#toc)