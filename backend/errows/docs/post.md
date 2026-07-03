# POST

## post 列表

- URL: `GET /posts`
- REQ:
```ts
  {
    headers?: AUTH_HEADER,
    URLSearchParams: Partial<{
      cid: string; //  角色 ID， 过滤该角色的 post 列表
      page: number; // 页码， 默认 0
      size: number; // 每页数量， 默认 10
    }>
  }
```
- RES: `ERROWS_RESPONSE<{ count: number, posts: POST[] }>`

## 查询 post 详情

- URL: `GET /posts/:pid`
- REQ: `{ headers?: AUTH_HEADER }`
- RES: `ERROWS_RESPONSE<POST>`

## 从本地为角色上传图片

- URL: `POST /my/characters/:cid/post/images`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      cid: string; // 角色 ID
    },
    body: File; // 图片 stream
  }
```
- RES: `ERROWS_RESPONSE<POST_IMAGE>`

## 创建角色 post

- URL: `POST /my/characters/:cid/posts`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      cid: string; // 角色 ID
    },
    body: {
      subject: string; // post 标题
      content: string; // post 内容
      images: string[]; // post 图片 ID 列表
    }
  }
```
- RES: `ERROWS_RESPONSE<{ id: string }>`

## 更新角色 post

- URL: `PUT /my/characters/:cid/posts/:pid`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      cid: string; // 角色 ID
      pid: string; // 角色 post ID
    },
    body: {
      subject: string; // post 标题
      content: string; // post 内容
      images: string[]; // post 图片 ID 列表
    }
  }
```
- RES: `HTTP_204_RES`

## 删除角色 post

- URL: `DELETE /my/characters/:cid/posts/:pid`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      cid: string; // 角色 ID
      pid: string; // 角色 post ID
    }
  }
```
- RES: `HTTP_204_RES`

## post feedback 点赞/点踩

- URL: `POST /posts/:pid/feedback/:feedback`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      pid: string; // 角色 post ID
      feedback: 'like' | 'dislike' // 点赞或点踩
    }
  }
```
- RES: `HTTP_204_RES`

## post 留言

- URL: `POST /posts/:pid/comments`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      pid: string; // 角色 post ID
    },
    body: {
      content: string; // 留言内容
      reply_to_id?: string; // 可选， 回复的留言 ID
    }
  }
```
- RES: `ERROWS_RESPONSE<{ id: string }>`

# API 概览

[API TOC](./readme.md#toc)