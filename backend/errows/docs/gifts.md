# 礼物

## 礼物列表

- URL:  `GET /my/sessions/gifts`
- REQ:  `ERROWS_AUTH_REQ`
- RES:  `ERROWS_RESPONSE<GIFT[]>`

## 赠送礼物

- URL:  `POST /my/sessions/:sid/gifts/:gift_id`
- REQ:
```ts  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      gift_id: string; // 礼物 ID
    }
  }
```
- RES:  `ERROWS_RESPONSE<MESSAGE_REPLY>`

# 管理

## 礼物列表

- URL: `GET /ops/gifts`
- REQ: `ERROWS_AUTH_JSON_REQ<{ page: number; size: number }>`
- RES: `ERROWS_RESPONSE<{ count: number; data: SESSION_GIFT[] }>`

## 添加礼物

- URL: `POST /ops/gifts`
- REQ: `ERROWS_AUTH_JSON_REQ<SESSION_GIFT>`
- RES: `ERROWS_RESPONSE<{ id: string }>`

## 更新礼物

- URL: `PUT /ops/gifts/:gift_id`
- REQ: `ERROWS_AUTH_JSON_REQ<SESSION_GIFT>`
- RES: `HTTP_204_RES`

## 删除礼物

- URL: `DELETE /ops/gifts/:gift_id`
- REQ: `ERROWS_AUTH_REQ`
- RES: `HTTP_204_RES`

# API TOC

[TOC](./readme.md#toc)