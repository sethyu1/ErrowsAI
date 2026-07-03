# 媒体库

## 角色生图配置项

- URL: `GET /characters/images/options`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `ERROWS_RESPONSE<CHARACTER_IMAGE_GEN_STEP[]>`

## 创建角色生图任务

- URL: `POST /characters/:cid/images/tasks`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  params: {
    cid: string; // 角色 ID
  }
  body: CHARACTER_IMAGE_GEN_SETTING; // 角色生图配置项
}
```
- RES: `ERROWS_RESPONSE<{ id: string }>`

## 查询用户相关角色未完成的生图任务状态

- URL: `GET /characters/:cid/images/tasks`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
    task_id: string; // 任务 ID
  }
}
```
- RES: `ERROWS_RESPONSE<ASSET_IMAGE_GEN_TASK_NOT_COMPLETE[]>`

## 查询单个角色生图任务状态

- URL: `GET /characters/:cid/images/tasks/:tid`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
    tid: string; // 任务 ID
  }
}
```
- RES: `ERROWS_RESPONSE<ASSET_IMAGE_GEN_TASK>`



## 创建角色图生视频任务

- URL: `POST /characters/:cid/images/:aid/videos/task`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
    aid: string; // 图片 ID
  }
}
```
- RES: `ERROWS_RESPONSE<{ id: string }>`

## 查询用户相关角色未完成的视频任务状态

- REQ:
- URL: `GET /characters/:cid/videos/tasks`
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
  }
}
```
- RES: `ERROWS_RESPONSE<ASSET_VIDEO_GEN_TASK_NOT_COMPLETE[]>`

## 查询单个角色视频任务状态

- URL: `GET /characters/:cid/videos/tasks/:tid`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
    tid: string; // 任务 ID
  }
}
```
- RES: `ERROWS_RESPONSE<ASSET_VIDEO_GEN_TASK>`

## 查询用户图片媒体库

- URL: `GET /my/characters/images`
- REQ:
```ts
{
  headers: AUTH_HEADER
  URLSearchParams: LIST_ASSETS_PARAMS
}
```
- RES: `ERROWS_RESPONSE<ASSET_IMAGE_SUMMARY[]> `

## 查询用户视频媒体库

- URL: `GET /my/characters/videos`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  URLSearchParams: LIST_ASSETS_PARAMS
}
```
- RES: `ERROWS_RESPONSE<ASSET_VIDEO_SUMMARY[]> `

## 查询用户-具体角色图片列表

- URL: `GET /my/characters/:cid/images`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
    URLSearchParams: { sort: 'created_at', order: 'asc' | 'desc' }
  }
}
```
- RES: `ERROWS_RESPONSE<{ count: number; data: ASSET_IMAGE[] }> `

## 删除用户角色图片

- URL: `DELETE /my/characters/:cid/images/:aid`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
    aid: string; // 媒体 ID
  }
}
```
- RES: `HTTP_RESPONSE_204`


## 查询用户-具体角色视频库列表

- URL: `GET /my/characters/:cid/videos`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
    URLSearchParams: { sort: 'created_at', order: 'asc' | 'desc' }
  }
}
```
- RES: `ERROWS_RESPONSE<{ count: number; data: ASSET_VIDEO[] }>`

## 删除用户角色视频

- URL: `DELETE /my/characters/:cid/videos/:aid`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  // 路由参数
  params: {
    cid: string; // 角色 ID
    aid: string; // 媒体 ID
  }
}
```
- RES: `HTTP_RESPONSE_204`

# 会员

## 使用统计接口

- URL: `GET /members/stats`
- REQ:
```ts
{
  headers: AUTH_HEADER
}
```
- RES: `ERROWS_RESPONSE<MEMBER_STATS>`

## 查询当前会员信息/状态

- URL: `GET /members/info`
- REQ:
```ts
{
  headers: AUTH_HEADER
}
```
- RES: `ERROWS_RESPONSE<MEMBER_INFO>`


# 支付

## CD-key 兑换

- URL: `POST /payment/cdkey/redeem`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  body: {
    key: string; // CD-key 字符串
  }
}
```

# API 概览

[API TOC](./readme.md#toc)