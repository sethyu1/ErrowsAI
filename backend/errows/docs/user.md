
# USER

## 注册

> [!NOTE]
> 流程：在用户注册后，系统会给用户发送一份验证邮件，用户需要点击邮件中的链接来验证邮箱。
> 链接中包含 uid 和 code 参数。
> 其中链接会是前端提供的一个页面地址，前端页面会从 URL 中提取 uid 和 code，
> 然后调用验证邮箱 API 来登陆。

- URL: `POST /user/register`
- REQ: `{ body: { email: string; password: string; } }`
- RES: `ERROWS_RESPONSE<{ uid: string }>`


## 验证邮箱

- URL: `POST /user/verify`
- REQ: `{ body: { uid: string, code: string } }`
- RES: `{ body: { token: string } }`

## 登录

- URL: `POST /user/login`
- REQ: `{ body: { email: string; password: string; } }`
- RES: `ERROWS_RESPONSE<{ token: string }>`

## Google OAuth code 换登陆token

- URL: `POST /user/login/google`
- REQ: `{ body: { access_token: string; } }`
- RES: `ERROWS_RESPONSE<{ token: string }>`

## 忘记密码邮件发送

> [!NOTE]
> 流程：用户提交邮箱后，系统会发送一封包含重置密码链接的邮件到用户邮箱。
> 用户点击链接后会跳转到前端页面，前端页面会从 URL 中提取 uid 和 code，然后让用户输入新密码，
> 最后调用验证邮箱 API 来登陆

- URL: `POST /user/password/forgot`
- REQ: `{ body: { email: string; } }`
- RES: `HTTP_204_RES`

## 修改密码

- URL: `PUT /user/password`
- REQ: `{ headers: AUTH_HEADER, body: { password: string; } }`
- RES: `HTTP_204_RES`


## 上传头像

- URL: `POST /user/avatar`
- REQ:
```ts
  {
    headers: AUTH_HEADER;
    body: File; // 头像图片 stream
  }
```
- RES: `ERROWS_RESPONSE<{ avatar_url: string }>`

## 获取用户信息

- URL: `GET /user/profile`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `ERROWS_RESPONSE<USER_PROFILE>`

## 更新用户信息

- URL: `PUT /user/profile`
- REQ:
```ts
{
  headers: AUTH_HEADER,
  body: Partial<
    Omit<USER_PROFILE, 'avatar'> & {
      name: string;
    }
  >
}
```
- RES: `HTTP_204_RES`

## 删除用户

- URL: `DELETE /user/account`
- REQ: `{ headers: AUTH_HEADER }`
- RES: `HTTP_204_RES`

## 绑定 pixel

- URL: `PUT /user/pixel`
- REQ: `ERROWS_AUTH_JSON_REQ<USER_PIXEL>`
- RES: `HTTP_204_RES`

# API 概览

[API TOC](./readme.md#toc)