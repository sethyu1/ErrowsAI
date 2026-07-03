# 每日任务

## 每日任务列表

- URL: `GET /tasks`
- REQ: `ERROWS_AUTH_REQ`
- RES: `ERROWS_RESPONSE<DAILY_TASK[]>`

## 领取每日任务奖励

- URL: `POST /tasks/:task_id/claim`
- REQ:
```ts
{
  headers: ERROWS_AUTH_HEADERS;
  params: {
    task_id: string;
  };
}
```
- RES: `HTTP_204_RES`

# API 概览

[API TOC](./readme.md#toc)