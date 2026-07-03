export interface SESSION_PERSONA_BODY {
  name: string; // 聊天身份名称
  description: string; // 聊天身份描述
}

export interface SESSION_PERSONA extends SESSION_PERSONA_BODY {
  id: string; // 聊天身份 ID
}

export interface SESSION_SETTING {
  memory: 'short' | 'default' | 'medium' | 'long' // 记忆
  model: 'butter v1.0' | 'RPMaster' // 模型
  auto_tts: boolean // 自动回复语音
  auto_picture: boolean // 自动回复图片
}

export interface SESSION_CHARACTER {
  id: string; // 角色 ID
  avatar_url: string; // 角色头像 URL
  nickname: string; // 角色昵称
}

export interface SESSION_SUMMARY {
  id: string; // 会话 ID
  persona: SESSION_PERSONA; // 聊天人设
  character: SESSION_CHARACTER;
  last_message_preview: string; // 最后消息预览
  last_message_at: string; // 最后消息时间
  messages_count: number; // 消息数量
}

export type SESSION_MESSAGE = {
  id: string; // 消息 ID
  role: 'user' | 'character'; // 发送者
  reply_to_id: string // 回复消息 id
  content: string; // 消息内容
  sended_at: string; // 发送时间
  edited_at: string; // 更新时间
  feedback: 'like' | 'dislike' | null; // 反馈
} & (
| { type: 'text', voice_url: string }
| { type: 'image'; picture_url: string; }
| { type: 'gift';  picture_url: string; }
| {
  type: 'voice_call';
  voice_url: string; // 语音 URL
  info: {
    duration: number; // 通话时长，单位：毫秒
  };
})

export interface SESSION_CHAT_HISTORY {
  id: string; // 会话 ID
  settings: SESSION_SETTING; // 会话设置
  persona:  SESSION_PERSONA; // 聊天人设信息
  character: SESSION_CHARACTER
  messages: SESSION_MESSAGE[]
}

export type MESSAGE_REPLY = {
  content: string, // 回复内容
  reply_message_id: string; // 回复消息 id
  send_message_id: string, //消息 id
} & (
| {
  type: 'text';
  reply_voice_url: string | null; // 回复语音 URL
  reply_picture_url: string | null; // 回复图片 URL
}
| { type: 'image'; reply_picture_url: string; }
| {
    type: 'voice_call';
    reply_voice_url: string;
    info: {
      duration: number; // 通话时长，单位：毫秒
    };
})

export interface SESSION_GIFT {
  id: string; // 礼物 ID
  name: string; // 礼物名称
  picture_url: string; // 礼物图片 URL
  price: number; // 礼物价格（虚拟币）
  intimacy: number; // 亲密度
  prompt: string; // 赠送提示语
  reply_types: ('text' | 'image')[]; // 回复类型

  need_claim: boolean; // 是否需要领取, 用于活动礼物
  valid_days: number | null; // 有效时间，单位：天， null 表示永久有效
}