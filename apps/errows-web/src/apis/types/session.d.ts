/// <reference path="./common.d.ts" />

declare namespace API {
  namespace SESSION {
    interface SESSION_PERSONA_BODY {
      name: string; // 聊天身份名称
      description: string; // 聊天身份描述
    }

    interface SESSION_PERSONA extends SESSION_PERSONA_BODY {
      id: string; // 聊天身份 ID
    }

    interface SESSION_SETTING {
      memory: "short" | "default" | "medium" | "long"; // 记忆
      model: "butter v1.0" | "RPMaster"; // 模型
      auto_tts?: boolean; // 自动回复语音
      auto_picture?: boolean; // 自动回复图片
    }

    interface SESSION_CHARACTER {
      id: string; // 角色 ID
      avatar_url: string; // 角色头像 URL
      nickname: string; // 角色昵称
    }

    interface SESSION_SUMMARY {
      id: string; // 会话 ID
      persona: SESSION_PERSONA; // 聊天人设
      character: SESSION_CHARACTER;
      last_message_preview: string; // 最后消息预览
      last_message_at: string; // 最后消息时间
      messages_count: number; // 消息数量
    }

    interface SESSION_MESSAGE {
      id: string; // 消息 ID
      type: "text" | "image" | "voice_call" | "gift"; // 消息类型
      role: "user" | "character"; // 发送者
      reply_to_id: string; // 回复消息 id
      content: string; // 消息内容
      voice_url: string | null; // 语音 URL
      image_url: string | null; // 图片 URL
      sended_at: string; // 发送时间
      edited_at: string; // 更新时间
      feedback: "like" | "dislike" | null; // 反馈
      info?:{
        duration: number; // 语音时长
      }
      status?: "loading" | "success" | "failed"; // 消息状态
    }

    interface SESSION_CHAT_HISTORY {
      id: string; // 会话 ID
      settings: SESSION_SETTING; // 会话设置
      persona: SESSION_PERSONA; // 聊天人设信息
      character: SESSION_CHARACTER;
      messages: SESSION_MESSAGE[];
    }

    interface MESSAGE_REPLY {
      content: string; // 回复内容
      type: "text" | "image" | "voice_call" | "gift"; // 消息类型
      reply_picture_url: string | null; // 回复图片 URL
      reply_message_id: string; // 回复消息 id
      reply_voice_url: string | null; // 回复语音 URL
      send_message_id: string; //消息 id
      send_voice_url: string | null; // 发送语音 URL
      info?:{
        duration: number; // 语音时长
      }
    }

    interface SESSION_GIFT {
      id: string; // 礼物 ID
      name: string; // 礼物名称
      picture_url: string; // 礼物图片 URL
      price: number; // 礼物价格（虚拟币）
      intimacy: number; // 亲密度
    }
  }
}
