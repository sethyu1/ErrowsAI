# 聊天

## 创建聊天人设

- URL:  `POST /my/sessions/personas`
- REQ:  `{ headers: AUTH_HEADER, body: SESSION_PERSONA_BODY }`
- RES:  `ERROWS_RESPONSE<{ id: string }, 201>`

## 获取聊天人设列表

- URL:  `GET /my/sessions/personas`
- REQ:  `{ headers: AUTH_HEADER }`
- RES:  `ERROWS_RESPONSE<SESSION_PERSONA[]>`

## 更新聊天人设

- URL:  `PUT /my/sessions/personas/:pid`
- REQ:  `{ headers: AUTH_HEADER, body: SESSION_PERSONA_BODY }`
- RES:  `HTTP_204_RES`

## 删除聊天人设

- URL:  `DELETE /my/sessions/personas/:pid`
- REQ:  `{ headers: AUTH_HEADER }`
- RES:  `HTTP_204_RES`

## 创建会话

- URL:  `POST /my/sessions/personas/:pid/characters/:cid`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      cid: string; // 角色 ID
      pid: string; // 聊天人设 ID
    },
    body: SESSION_SETTING
  }
```
- RES:  `ERROWS_RESPONSE<{ id: string }, 201>`

## 更新会话设置

- URL:  `PUT /my/sessions/:sid`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
    },
    body: SESSION_SETTING
  }
```
- RES:  `HTTP_204_RES`


## 会话列表

- URL:  `GET /my/sessions`
- REQ:  `{ headers: AUTH_HEADER }`
- RES: `ERROWS_RESPONSE<SESSION_SUMMARY[]>`

## 删除会话

- URL:  `DELETE /my/sessions/:sid`
- REQ: `{ headers: AUTH_HEADER }`
- RES:  `HTTP_204_RES`

## 会话详情 & 聊天记录

- URL:  `POST /my/sessions/:sid/messages/voice`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
    },
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API
    body: VoiceStream
  }
```
- RES: `ERROWS_RESPONSE<MESSAGE_REPLY>`


## 回复消息手动转语音

- URL:  `POST /my/sessions/:sid/messages/:mid/tts`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      mid: string; // 消息 ID
    }
  }
```
- RES: `ERROWS_RESPONSE<{ tts_url: string }>`

## 回复消息点赞/点踩

- URL:  `POST /my/sessions/:sid/messages/:mid/feedback/:feedback`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      mid: string; // 消息 ID
      feedback: 'like' | 'dislike' // 点赞或点踩
    }
  }
```
- RES: `HTTP_204_RES`

## 修改最后一条用户消息

- URL:  `PUT /my/sessions/:sid/messages/:mid`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      mid: string; // 消息 ID
    },
    body: {
      content: string; // 新的消息内容
    }
  }
```
- RES: `ERROWS_RESPONSE<MESSAGE_REPLY>`

## 删除最后一条用户消息

- URL:  `DELETE /my/sessions/:sid/messages/:mid`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      mid: string; // 消息 ID
    }
  }
```
- RES: `HTTP_204_RES`

## 生成建议回复

- URL:  `GET /my/sessions/:sid/messages/suggest`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
    }
  }
```
- RES: `ERROWS_RESPONSE<{ content: string }>`


## 文字聊天

- URL:  `POST /my/sessions/:sid`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
    },
    body: {
      content: string; // 用户消息内容
    }
  }
```
- RES: `ERROWS_RESPONSE<MESSAGE_REPLY>`

## 发送语音消息

- URL:  `POST /my/sessions/:sid/voice`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
    },
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API
    body: VoiceStream
  }
```
- RES: `ERROWS_RESPONSE<MESSAGE_REPLY>`


## 回复消息手动转语音

- URL:  `POST /my/sessions/:sid/messages/:mid/tts`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      mid: string; // 消息 ID
    }
  }
```
- RES: `ERROWS_RESPONSE<{ tts_url: string }>`

## 回复消息点赞/点踩

- URL:  `POST /my/sessions/:sid/messages/:mid/feedback/:feedback`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      mid: string; // 消息 ID
      feedback: 'like' | 'dislike' // 点赞或点踩
    }
  }
```
- RES: `HTTP_204_RES`

## 修改最后一条用户消息

- URL:  `PUT /my/sessions/:sid/messages/:mid`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      mid: string; // 消息 ID
    },
    body: {
      content: string; // 新的消息内容
    }
  }
```
- RES: `ERROWS_RESPONSE<MESSAGE_REPLY>`

## 删除最后一条用户消息

- URL:  `DELETE /my/sessions/:sid/messages/:mid`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      mid: string; // 消息 ID
    }
  }
```
- RES: `HTTP_204_RES`

## 生成建议回复

- URL:  `GET /my/sessions/:sid/messages/suggest`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
    }
  }
```
- RES: `ERROWS_RESPONSE<{ content: string }>`

## 生成角色图片

- URL:  `POST /my/sessions/:sid/messages/character/images`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
    }
  }
```
- RES: `ERROWS_RESPONSE<MESSAGE_REPLY>`

## 创建语音聊天

- URL: `POST /my/sessions/:sid/call`
- REQ: `HTTP_REQUEST<AUTH_HEADER>`
- RES: `ERROWS_RESPONSE<{ id: string }, 201>`

## 语音聊天

- URL:  `POST /my/sessions/:sid/call/:call_id`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      call_id: string // 通话 ID
    },
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaStream_Recording_API/Using_the_MediaStream_Recording_API
    body: VoiceStream
  }
```
- RES:
```ts
interface VOICE_CALL_INFO {
  voice_call_segment_id: string; // 语音通话片段 ID
}

// base64编码的WAV音频数据
type RESPONSE_SENTENCE = string;

interface SESSION_CALL_ERROR {
  code: number;
  message: string;
}

interface VOICE_CALL_COST {
  call_duration: number; // 通话时长，单位：秒
  available_duration: number; // 剩余可用通话时长，单位：秒
  cost: number; // 已消耗费用，单位：coin
}

HTTPS_SSE_RES<
  | SSE_EVENT<'voice_call_info', VOICE_CALL_INFO>
  | SSE_EVENT<'response_sentence', RESPONSE_SENTENCE>
  | SSE_EVENT<'error', SESSION_CALL_ERROR>
  | SSE_EVENT<'cost', VOICE_CALL_COST>
  | SSE_EVENT<'heartbeat', void>
  | SSE_EVENT<'end', void>
>
```

## 挂断语音聊天

- URL:  `POST /my/sessions/:sid/call/:call_id/hangup`
- REQ:
```ts
  {
    headers: AUTH_HEADER,
    // 路由参数
    params: {
      sid: string; // 聊天会话 ID
      call_id: string // 通话 ID
    }
  }
```
- RES: `ERROWS_RESPONSE<MESSAGE_REPLY>`


# API 概览

[API TOC](./readme.md#toc)
