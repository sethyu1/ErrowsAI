> [!NOTE]
> 所有 type 类型定义在 packages/types/api.ts，方便代码直接使用

# CHANGELOG

## 2026-01-13 删除角色图片和视频图片、角色默认排序字段

### 新增接口

- [x] [删除用户角色图片](./media.md#删除用户角色图片)
- [x] [删除用户角色视频](./media.md#删除用户角色视频)
- [x] 角色添加默认排序字段

<details>
<summary> 2025-12-31 支付产品接口调整 </summary>

## 2025-12-31 支付产品接口调整

### 更新接口/类型

代币和订阅产品统一使用 price_id 字段和支付平台对接，避免 name 字段在订阅产品上有冲突

- [x] [更新代币产品信息](./payment.md#更新代币产品信息) 接口，移除 name 字段，添加 price_id 字段
- [x] [更新订阅产品信息](./payment.md#更新订阅产品信息) 接口，添加 price_id 字段

</details>

<details>
<summary> 2025-12-29 支付接口、礼物 </summary>

## 2025-12-29 支付接口调整，礼物添加回复类型

### 支付接口调整

- [x] 购买代币接口调整为返回结账 URL，前端跳转到支付页面完成支付流程
- [x] 购买订阅接口调整为返回结账 URL，前端跳转到支付页面完成支付流程

### 礼物添加回复类型

- [x] 礼物添加回复消息类型，支持用户在收到礼物后回复文字或图片类型消息

</details>

<details>
<summary> 2025-12-25 角色配置等 </summary>

## 2025-12-26 推荐角色 / pixel 追踪

### 新增接口/类型

#### 角色

- [x] [修改角色推荐状态](./character.md#修改角色推荐状态)

#### PIXEL 追踪

- [x] [添加/更新 pixel 配置](./ops.md#添加-更新-pixel-配置)
- [x] [查询 pixel 配置](./ops.md#查询-pixel-配置)
- [x] [绑定 pixel](./user.md#绑定-pixel)

### 更新接口/类型

- [x] 用户 profile 添加 pixel 追踪字段

</details>

<details>
<summary> 2025-12-25 角色配置等 </summary>

## 2025-12-25 角色配置等

### 新增接口/类型

- [x] [角色生图关键字列表](./character.md#角色生图关键字列表)
- [x] [获取聊天中角色默认生图概率](./character.md#获取聊天中角色默认生图概率)
- [x] [获取聊天中角色生图概率](./character.md#获取聊天中角色生图概率)

## 更新接口/类型

- [x] 角色配置接口移动到 character.md 文档中
- [x] 角色审核接口限制 status 为 public、rejected。添加 reason 字段

</details>

<details>
<summary> 2025-12-24 角色与法律条款等 </summary>

## 2025-12-24 角色与法律条款等

### 角色

- [x] [配置生图关键词](./character.md#配置生图关键词)
- [x] [配置聊天中角色生图概率](./character.md#配置角色生图概率)
- [x] [配置聊天中角色默认生图概率](./character.md#配置角色默认生图概率)
- [x] [运营后台角色列表](./character.md#运营后台角色列表)
- [x] [修改角色状态](./character.md#修改角色状态)
- [x] 创建角色, 复用现有接口
- [x] [获取首页角色推荐列表](./character.md#角色列表) 复用 character list 接口，添加推荐筛选项

### 礼物

- [x] [礼物列表](./gifts.md#礼物列表)
- [x] [添加礼物](./gifts.md#添加礼物)
- [x] [更新礼物](./gifts.md#更新礼物)
- [x] [删除礼物](./gifts.md#删除礼物)
- [x] [ops 上传图片](./ops.md#上传图片)

### 法律条款

- [x] [获取法律条款](./legal.md#获取法律条款)
- [x] [更新法律条款](./legal.md#更新法律条款)

</details>

<details>
<summary> 2025-12-22 每日任务 </summary>

## 2025-12-22 每日任务

### 新增接口

- [x] [每日任务列表](./tasks.md#每日任务列表)
- [x] [领取每日任务奖励](./tasks.md#领取每日任务奖励)

</details>

<details>
<summary> 2025-12-21 支付 </summary>

## 2025-12-21 支付

### 更新接口/类型

- [x] 更新代币产品和订阅产品字段，添加 `title` 字段，用于显示产品名称， name 字段用来和支付平台对接
- [x] 更新代币产品和订阅产品接口路由， 添加 /ops 前缀，并且检查运营系统权限

## 2025-12-20 support

### 新增接口

- [x] [提交 support 请求](./support.md#提交-support-请求)
- [x] [查询 support 请求列表](./support.md#查询-support-请求列表)

</details>

<details>
<summary> 2025-12-19 礼物相关接口 </summary>

## 2025-12-19 礼物相关接口

### 新增接口

#### 聊天

- [x] [礼物列表](./session.md#礼物列表)
- [x] [赠送礼物](./session.md#赠送礼物)

</details>

<details>
<summary> 2025-12-17 支付相关接口 </summary>

## 2025-12-17 支付相关接口

### 新增接口

#### Payment

- [x] [获取代币产品列表](./payment.md#获取代币产品列表)
- [x] [获取订阅套餐列表](./payment.md#获取订阅套餐列表)
- [x] [购买代币](./payment.md#购买代币)
- [x] [购买订阅](./payment.md#购买订阅)
- [x] [查询付款状态](./payment.md#查询付款状态)
- [x] [更新订阅产品信息](./payment.md#更新订阅产品信息)
- [x] [更新代币产品信息](./payment.md#更新代币产品信息)
- [x] [支付接口回调](./payment.md#支付接口回调)

#### 运营系统

- [x] [运营系统权限列表](./ops.md#运营系统权限列表)
- [x] [运营系统角色列表](./ops.md#运营系统角色列表)
- [x] [添加运营系统角色](./ops.md#添加运营系统角色)
- [x] [修改运营系统角色](./ops.md#修改运营系统角色)
- [x] [删除运营系统角色](./ops.md#删除运营系统角色)
- [x] [查询运营用户列表](./ops.md#查询运营用户列表)
- [x] [添加用户并分配运营角色](./ops.md#添加用户并分配运营角色)
- [x] [修改用户运营角色](./ops.md#修改用户运营角色)

</details>

<details>
<summary> 2025-12-12 语音聊天挂断接口 </summary>

## 2025-12-12 语音聊天挂断接口

### 新增接口

- [x] [挂断语音聊天](./session.md#挂断语音聊天)

### 更新接口/类型

- [x] 聊天消息添加类型信息，区分普通消息、图片消息、语音聊天消息、礼物消息
- [x] MESSAGE_REPLY 类型添加 type 字段，区分普通消息、图片消息、语音聊天消息

</details>

<details>
<summary> 2025-12-12 语音聊天接口 </summary>

## 2025-12-12 添加语音聊天接口

### 新增接口

- [x] [创建语音聊天](./session.md#创建语音聊天)
- [x] [语音聊天](./session.md#语音聊天)

### 更新接口/类型

- [x] 更新 ERROWS API 相关类型定义，添加语音聊天相关类型

</details>

<details>
<summary> 2025-11-21 多媒体列表筛选排序增强</summary>

## 2025-11-21

### 更新接口/类型

- [x] 用户角色图片列表接口添加分页参数、搜索、筛选、排序参数
- [x] 用户角色视频列表接口添加分页参数、搜索、筛选、排序参数
- [x] 用户具体角色图片列表接口添加排序参数
- [x] 用户具体角色视频列表接口添加排序参数

</details>

<details>
<summary> 2025-11-20 未完成任务查询与路由调整 </summary>

## 2025-11-20

### 新增接口

- [x] 查询用户相关角色未完成的生图任务状态
- [x] 查询用户相关角色未完成的视频任务状态

### 更新接口/类型

- [x] 更新创建角色图生视频任务接口路由
- [x] 更新查询单个角色生图任务状态接口路由
- [x] 更新查询单个角色视频任务状态接口路由

</details>

<details>
<summary> 2025-11-17 会员统计与兑换能力 </summary>

## 2025-11-17

### 新增接口

- [x] 会员使用统计接口， 媒体库、角色、聊天，post、会员等统计信息
- [x] CD-key 兑换 coin、 套餐
- [x] 查询会员信息/状态

### 更新接口/类型

- [x] 从用户 profile 中移除统计信息

</details>

<details>
<summary> 2025-11-16 用户视频媒体库查询 </summary>

## 2025-11-16

### 新增接口

- [x] 查询用户视频媒体库

</details>

<details>
<summary> 2025-11-13 媒体库与账号管理接口 </summary>

## 2025-11-13

### 新增接口

#### 媒体库

- [x] 角色生图配置项
- [x] 创建角色生图任务
- [x] 查询角色生图任务状态
- [x] 创建角色图生视频任务
- [x] 查询角色图生视频任务状态
- [x] 查询用户图片媒体库
- [x] 查询用户-具体角色图片列表
- [x] 查询用户-具体角色视频库列表


#### 个人账号管理

- [x] google auth code 换登陆 token
- [x] 头像编辑
- [x] 个人信息编辑
- [x] 忘记密码邮件发送
- [x] 修改密码
- [x] 删除账号

### 更新接口/类型

- [x] 个人信息添加头像 URL、性别

</details>

<details>
<summary> 2025-11-10 对话索图与角色字段扩展 </summary>

## 2025-11-10

### 新增接口

- [x] 在对话中索要角色图片

### 更新接口/类型

- [x] 角色详情/列表项添加 liked 字段，表示当前用户是否点赞该角色
- [x] 角色详情/列表项添加 followed 字段，表示当前用户是否关注该角色
- [x] POST 中角色信息补充性别字段
- [x] 角色创建选项中， voice 选项添加 title 字段，用来显示 voice 的名称
- [x] 修正角色创建选项中颜色提取规则，现在 color 为 hex 值， value 为颜色名称

</details>

<details>
<summary> 2025-11-09 角色点赞关注接口 </summary>

## 2025-11-09

### 新增接口

- [x] 给角色点赞
- [x] 角色取消点赞
- [x] 关注角色
- [x] 取消关注角色

### 更新接口/类型

- [x] 更新 POST_SUMMARY 类型

</details>

<details>
<summary> 2025-11-07 角色 Post 与媒体上传 </summary>

## 2025-11-07

### 新增接口

- [x] post 列表
- [x] 查询 post 详情
- [x] 从本地为角色上传图片
- [x] 创建角色 post
- [x] 删除角色 post
- [x] post feedback 点赞/点踩
- [x] post 留言

### 更新接口/类型

- [x] 角色详情显示创建者信息

</details>

<details>
<summary> 2025-11-06 角色创建配置与类型调整 </summary>

## 2025-11-06

### 新增接口
- [x] 角色创建配置项查询

### 更新接口/类型
- [x] 所有 type 类型移动到 packages/types/api.ts， 方便代码直接使用
- [x] CHARACTER_SETTING 类型更新， 合并 identity, style, dialogue 字段到顶层
- [x] 创建角色接口参数更新
- [x] 获取角色设置详情接口返回值更新

</details>

<details>
<summary> 2025-11-02 会话设置与语音图片增强 </summary>

## 2025-11-02

### 新增接口：

- [x] 会话设置更新
- [x] 回复消息转语音
- [x] 回复信息点赞/点踩
- [x] 修改最后一条用户消息
- [x] 删除最后一条用户消息
- [x] 生成建议回复
- [ ] 发送语音消息

### 更新接口/类型：

- [x] 更新 “一键重生” 接口 URL 为 `/my/characters/:cid/avatar`
- [x] 会话设置添加 auto_tts 字段
- [x] 会话设置添加 auto_picture 字段
- [x] `SESSION_MESSAGE` 添加 voice_url 字段
- [x] `SESSION_MESSAGE` 添加 picture_url 字段
- [x] `MESSAGE_REPLY` 更名字段 reply 为 content
- [x] `MESSAGE_REPLY` 添加 reply_voice_url 字段
- [x] `MESSAGE_REPLY` 添加 send_voice_url 字段
- [x] `MESSAGE_REPLY` 添加 reply_picture_url 字段

</details>

</br>

# HOST

- 测试： https://testing.errows.io
- 演示： https://staging.errows.io


> [!NOTE]
> 调用 API 时需要在路径前加上 `/api` 前缀，同时建议前端用相对路径调用 API，例如 `/api/user/login`。下面文档中不再加


# TOC

- [用户](./user.md)
- [角色](./character.md)
- [聊天](./session.md)
- [朋友圈](./post.md)
- [多媒体](./media.md)
- [支付](./payment.md)
- [运营系统](./ops.md)
- [Support](./support.md)
- [每日任务](./tasks.md)
- [配置](./configuration.md)
- [礼物](./gifts.md)
- [法律条款](./legal.md)