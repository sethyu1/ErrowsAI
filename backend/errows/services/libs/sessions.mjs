/**
 * @fileoverview 会话相关操作的 Action 定义
 * @module services/libs/sessions
 * @description 提供会话管理、消息发送、TTS语音合成、图片生成请求等功能
 * 支持与AI角色进行对话交互，管理会话人格(Persona)和会话设置
 */

import { createReadStream, createWriteStream } from 'node:fs';
import fs, { move } from 'fs-extra';
import { randomUUID } from 'node:crypto';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import moleculer from 'moleculer';
import { Session, Character, Media, Gift, Member } from '@errows/models';
import ai, { setLLMDebugSink } from '@errows/ai';
import {
  sessionErrorHandler,
  characterErrorHandler
} from './error.mjs';
import * as llmDebugStore from './llm-debug-store.mjs';
import {
  buildSSEChunk, ensureDir,
  resolveAIImageUrl, resolveAITTtsUrl, resolveUserUploadUrl
} from './utils.mjs';
import { sanitizeText } from './sanitize.mjs';
import { avatarQueue, imageQueue, inChatImageQueue } from './queue.mjs';
import { ai_metrics_constants, member_events } from './constrains.mjs';
import { readCharacterOptions } from './settings.mjs';
import path from 'node:path';
import { mergeWAV } from './ffmpeg.mjs';

const { MoleculerClientError } = moleculer.Errors;
const { SESSION_MESSAGES, MEDIA_IMAGES } = member_events;

setLLMDebugSink((type, payload) => {
  const at = new Date().toISOString();
  if (type === 'chat' || type === 'chat_stream' || type === 'suggest_reply' || type === 'refine_text') {
    llmDebugStore.pushChat({ at, type, payload });
  } else if (type === 'image') {
    llmDebugStore.pushImage({ at, type, payload });
  } else if (type === 'video') {
    llmDebugStore.pushVideo({ at, type, payload });
  } else {
    llmDebugStore.pushVoice({ at, type, payload });
  }
});

function textForTts(content) {
  if (!content || typeof content !== 'string') return content ?? '';
  const byQuote = content.split('"');
  const quoted = [];
  for (let i = 1; i < byQuote.length; i += 2) {
    const s = byQuote[i]?.trim();
    if (s) quoted.push(s);
  }
  if (quoted.length === 0) return content;
  return quoted.join(' ');
}

/**
 * 会话设置验证模式
 * @typedef {Object} SessionSettings
 * @property {'short'|'default'|'medium'|'long'} [memory='default'] - 记忆长度设置
 * @property {'RPMaster'|'Butter v1.0'} [model='Butter v1.0'] - AI模型选择
 * @property {boolean} [auto_tts=false] - 是否自动生成语音
 * @property {boolean} [auto_picture=false] - 是否自动生成图片
 */
const session_settings_validator = {
  type: 'object',
  properties: {
    memory: {
      type: 'string', enum: ['short', 'default', 'medium', 'long'],
      default: 'default',
      optional: true
    },
    model: {
      type: 'string',
      enum: ['RPMaster', 'Butter v1.0'],
      default: 'Butter v1.0',
      optional: true
    },
    auto_tts: { type: 'boolean', default: false, optional: true },
    auto_picture: { type: 'boolean', default: true, optional: true },
  },
};


/**
 * 会话相关操作的 Moleculer Actions
 * @type {Object}
 */
export default {
  /**
   * 创建会话人格(Persona)
   * @action session_persona_create
   * @requires 用户认证
   *
   * @description
   * 创建一个会话人格，用户可以使用不同的人格与角色进行对话
   * 人格代表用户在对话中的角色设定和背景
   *
   */
  session_persona_create: {
    params: {
      body: {
        type: 'object',
        properties: {
          name: 'string',
          description: { type: 'string', optional: true, default: null },
        },
      },
    },
    async handler(ctx) {
      const { body: persona } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      const res = await Session.createSessionPersona(
        this.pool, schema, uid, persona
      );
      return res;
    }
  },
  /**
   * 获取用户的所有会话人格列表
   * @action session_persona_list
   * @requires 用户认证
   *
   * @description
   * 获取当前登录用户创建的所有会话人格
   *
   */
  session_persona_list: {
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      const res = await Session.listSessionPersonas(this.pool, schema, uid);
      return res;
    }
  },
  /**
   * 更新会话人格信息
   * @action session_persona_update
   * @requires 用户认证
   *
   * @description
   * 更新指定的会话人格信息，只能更新自己创建的人格
   *
   */
  session_persona_update: {
    params: {
      params: { type: 'object', properties: { pid: 'uuid' } },
      body: {
        type: 'object',
        properties: {
          name: 'string',
          description: { type: 'string', optional: true, default: null },
        },
      },
    },
    async handler(ctx) {
      const { params: { pid }, body } = ctx.params;
      const { user: { uid } } = ctx.meta;

      ctx.meta.$statusCode = 204;

      const schema = this.buildSchema();
      await Session.updateSessionPersona(this.pool, schema, uid, pid, body);
    }
  },
  /**
   * 删除会话人格
   * @action session_persona_delete
   * @requires 用户认证
   *
   * @description
   * 删除指定的会话人格，只能删除自己创建的人格
   * 注意：删除人格不会删除使用该人格创建的会话
   *
   */
  session_persona_delete: {
    params: {
      params: { type: 'object', properties: { pid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { pid } } = ctx.params;
      const { user: { uid } } = ctx.meta;

      ctx.meta.$statusCode = 204;

      const schema = this.buildSchema();
      await Session.deleteSessionPersona(this.pool, schema, uid, pid);
    }
  },

  /**
   * 创建新会话
   * @action session_create
   * @requires 用户认证
   *
   * @description
   * 创建用户与AI角色之间的对话会话
   * 如果角色有问候语(greeting)，会自动添加为第一条消息
   *
   */
  session_create: {
    params: {
      params: { type: 'object', properties: { pid: 'uuid', cid: 'uuid' } },
      body: session_settings_validator,
    },
    async handler(ctx) {
      const { params: { pid, cid }, body: settings } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      const res = await Session.createSession(
        this.pool, schema, uid, pid, cid, settings
      )
        .then(res => res, sessionErrorHandler);

      const character_setting = await Character
        .getSetting(this.pool, schema, cid)
        .then(res => res, characterErrorHandler);

      const session_id = res.id;
      if (res.is_new && (character_setting.greeting ?? '') !== '') {
        const message_id = randomUUID();
        const greeting = character_setting.greeting;
        let image_url = null;
        if (character_setting.greeting_image?.trim()) {
          image_url = character_setting.greeting_image.trim();
        } else if (character_setting.background_image_files?.trim()) {
          const firstBg = character_setting.background_image_files.split(/[,，]/).map(s => s.trim()).find(Boolean);
          if (firstBg) image_url = firstBg;
        }
        if (image_url === null && character_setting.avatar_url) {
          image_url = character_setting.avatar_url;
        }

        await Session.appendCharacterMessage(
          this.pool, schema, session_id,
          greeting,
          { image_url },
          message_id, null, 'image'
        )
          .then(res => res, sessionErrorHandler);
      }

      return res;
    }
  },
  /**
   * 获取会话详情
   * @action session_get
   * @requires 用户认证
   *
   * @description
   * 获取指定会话的完整信息，包括消息历史、设置等
   * 只能获取自己的会话
   *
   */
  session_get: {
    params: {
      params: { type: 'object', properties: { sid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { sid } } = ctx.params;
      const { user: { uid } } = ctx.meta;

      const schema = this.buildSchema();
      const { cid, ...session } = await Session.getSession(this.pool, schema, sid, uid)
        .then(res => res, sessionErrorHandler);

      const characterMap = await this.lookupCharacter(schema, [cid]);
      const character = characterMap.get(cid);

      const replyMessages = session.messages.reduce(
        (acc, message) => {
          const reply_to_id = message.reply_to_id ?? null;
          if (reply_to_id === null) { return acc; }
          acc.set(reply_to_id, message);
          return acc;
        },
        new Map()
      );

      const rawMessages = session.messages.reduce((acc, message) => {
        const reply_to_id = message.reply_to_id ?? null;
        if (reply_to_id !== null) { return acc; }
        acc.push(message);

        const reply_message = replyMessages.get(message.id) ?? null;
        if (reply_message !== null) {
          acc.push(reply_message);
        }
        return acc;
      }, []);

      const messages = await Promise.all(
        rawMessages.map(async (m) => {
          const message = {
            ...m,
            voice_url: m.voice_url ? resolveAITTtsUrl(m.voice_url) : null,
          };
          if (m.type === 'voice_call') {
            Object.assign(message, { voice_url: resolveUserUploadUrl(m.voice_url) });
            const segments = await Session.listVoiceCallSegments(
              this.pool, schema, m.id
            ).then(res => res, () => []);
            Object.assign(message, { voice_segments: segments });
          }
          if (m.type === 'image' && m.image_url) {
            Object.assign(message, { image_url: resolveAIImageUrl(m.image_url) });
          }
          if (m.type === 'gift') {
            Object.assign(message, { image_url: resolveUserUploadUrl(m.image_url) });
          }
          return message;
        })
      );

      return Object.assign({}, session, { messages, character });
    }
  },

  session_count_by_model: {
    params: {
      sid: 'string'
    },
    async handler(ctx) {
      const client = this.pool;
      const schema = this.buildSchema();
      const { user: { uid } } = ctx.meta;

      return Session.countTextMessageTurns(client, schema, uid);
    }
  },

  /**
   * 在会话中发送文本消息并获取 AI 回复
   * @action session_text_message
   * @requires 用户认证
   *
   * @description
   * 向会话发送用户消息，AI会自动生成回复
   * 支持自动TTS和图片生成(根据会话设置)
   *
   */
  session_text_message: {
    params: {
      params: { type: 'object', properties: { sid: 'uuid' } },
      body: {
        type: 'object',
        properties: {
          content: 'string'
        }
      }
    },
    async handler(ctx) {
      const { params: { sid }, body: { content } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      // Sanitize message content to prevent XSS attacks and any special characters that may casue llm error
      const sanitizedContent = sanitizeText(content);
      if (!sanitizedContent) {
        throw new MoleculerClientError('Message content cannot be empty', 400);
      }

      // 检查聊天次数限额
      const session = await Session.getSession(client, schema, sid, uid);
      await this.checkSessionMessageQuota(ctx, session);

      const reply_message_id = randomUUID();

      if (session.settings.auto_tts) {
        await this.deductCoinsByTTS(ctx, reply_message_id);
      }

      const { id: send_message_id } = await Session.appendUserMessage(
        client, schema, sid, sanitizedContent
      )
        .then(res => res, sessionErrorHandler);

      const character_settings = await Character.getSetting(
        client, schema, session.cid, uid
      );

      const user = await ctx.call('user.profile', {}, ctx.meta);

      const chatConfig = await this.getAIServiceConfig('chat');
      const options = await readCharacterOptions();
      const chatbotTimeend = this.AIRequestTimer(ai_metrics_constants.CHATBOT);
      const { reply } = await ai.chatCompletion(
        options,
        chatConfig,
        user.name,
        character_settings,
        session.messages,
        sanitizedContent
      )
        .then(
          result => {
            chatbotTimeend(true);
            return result;
          },
          error => {
            chatbotTimeend(false);
            throw error;
          }
        );

      const shouldGenImage = await this.shouldGenerateImageInSession(
        ctx, session, sanitizedContent
      );

      if (shouldGenImage) {
        this.generateImageInSession(
          ctx,
          session,
          character_settings,
          reply_message_id,
          reply
        )
          .then(
            (reply_picture_url) => {
              return Session.updatePictureUrlInSessionMessage(
                client, schema, sid,
                reply_message_id,
                reply_picture_url)
            })
          .catch(
            (error) => {
              this.logger.error("gen image in session messsage failed", error)
            })
      }

      const type = shouldGenImage ? 'image' : 'text';

      const result = {
        send_message_id,
        send_voice_url: null,
        reply_message_id,
        reply_voice_url: null,
        reply_picture_url: null,
        content: reply,
        type,
      };

      if (session.settings.auto_tts) {
        const ttsConfig = await this.getAIServiceConfig('tts');
        const ttsTimeend = this.AIRequestTimer(ai_metrics_constants.TTS);
        await ai.tts(ttsConfig, character_settings, textForTts(reply))
          .then(
            ({ voice_url }) => {
              ttsTimeend(true);
              Object.assign(result, { reply_voice_url: resolveAITTtsUrl(voice_url) });;
            },
            error => {
              ttsTimeend(false);
              throw error;
            }
          );
      }

      await Session.appendCharacterMessage(
        client, schema,
        sid, reply,
        {
          voice_url: result.reply_voice_url,
          image_url: result.reply_picture_url
        },
        reply_message_id, send_message_id,
        type
      )
        .then(res => res, sessionErrorHandler);

      Object.assign(result, { reply_message_id });

      ctx.emit(
        'session_message_sent',
        { uid, sid, cid: session.cid, message_id: send_message_id }
      );
      ctx.emit(
        'member_update_stats',
        {
          uid,
          data: [[SESSION_MESSAGES, 1]]
        },
      );

      return result;
    }
  },
  session_text_message_stream: {
    params: {
      params: { type: 'object', properties: { sid: 'uuid' } },
      body: {
        type: 'object',
        properties: {
          content: 'string'
        }
      }
    },
    async handler(ctx) {
      const { params: { sid }, body: { content } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const sanitizedContent = sanitizeText(content);
      if (!sanitizedContent) {
        throw new MoleculerClientError('Message content cannot be empty', 400);
      }

      const session = await Session.getSession(client, schema, sid, uid);
      await this.checkSessionMessageQuota(ctx, session);

      const reply_message_id = randomUUID();

      if (session.settings.auto_tts) {
        await this.deductCoinsByTTS(ctx, reply_message_id);
      }

      const { id: send_message_id } = await Session.appendUserMessage(
        client, schema, sid, sanitizedContent
      )
        .then(res => res, sessionErrorHandler);

      const character_settings = await Character.getSetting(
        client, schema, session.cid, uid
      );

      const user = await ctx.call('user.profile', {}, ctx.meta);

      const streamConfig = await this.getAIServiceConfig('stream');
      const options = await readCharacterOptions();

      const self = this;

      async function* generateStream() {
        let fullReply = '';

        yield buildSSEChunk('start', {
          send_message_id,
          reply_message_id
        });

        try {
          const streamIterator = ai.chatCompletionStream(
            options,
            streamConfig,
            user.name,
            character_settings,
            session.messages,
            sanitizedContent
          );

          for await (const event of streamIterator) {
            if (event.type === 'chunk') {
              yield buildSSEChunk('chunk', event.data);
            } else if (event.type === 'done') {
              fullReply = event.data;
            } else if (event.type === 'error') {
              yield buildSSEChunk('error', { message: event.data });
            }
          }

          const shouldGenImage = await self.shouldGenerateImageInSession(
            ctx, session, sanitizedContent
          );

          if (shouldGenImage) {
            self.generateImageInSession(
              ctx,
              session,
              character_settings,
              reply_message_id,
              fullReply
            )
              .then(
                (reply_picture_url) => {
                  return Session.updatePictureUrlInSessionMessage(
                    client, schema, sid,
                    reply_message_id,
                    reply_picture_url);
                })
              .catch(
                (error) => {
                  self.logger.error("gen image in session messsage failed", error);
                });
          }

          const type = shouldGenImage ? 'image' : 'text';

          await Session.appendCharacterMessage(
            client, schema,
            sid, fullReply,
            { voice_url: null, image_url: null },
            reply_message_id, send_message_id,
            type
          )
            .then(res => res, sessionErrorHandler);

          ctx.emit(
            'session_message_sent',
            { uid, sid, cid: session.cid, message_id: send_message_id }
          );
          ctx.emit(
            'member_update_stats',
            { uid, data: [[SESSION_MESSAGES, 1]] }
          );

          yield buildSSEChunk('done', {
            reply_message_id,
            content: fullReply,
            type,
            reply_voice_url: null,
            reply_picture_url: null
          });

        } catch (error) {
          yield buildSSEChunk('error', { message: error.message });
        }

        yield buildSSEChunk('end');
      }

      const res = Readable.from(generateStream());

      res.on('error', (error) => {
        this.logger.error('Chat Stream Error:', error);
      });

      ctx.meta.$responseType = 'text/event-stream';
      ctx.meta.$responseHeaders = {
        'X-Accel-Buffering': 'no',
        'Cache-Control': 'no-cache'
      };

      return res;
    }
  },
  /**
   * 更新会话中的消息内容
   * @action session_message_update
   * @requires 用户认证
   *
   * @description
   * 更新消息内容，仅允许更新会话中最后一条用户消息
   * 更新后会删除该消息之后的所有消息(包括AI回复)
   *
   */
  session_message_update: {
    params: {
      params: {
        type: 'object',
        properties: {
          sid: 'uuid',
          mid: 'uuid'
        }
      },
      body: {
        type: 'object',
        properties: {
          content: 'string'
        }
      }
    },
    async handler(ctx) {
      const { params: { sid, mid }, body: { content } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      // Sanitize message content to prevent XSS attacks and any special characters that may casue llm error
      const sanitizedContent = sanitizeText(content);
      if (!sanitizedContent) {
        throw new MoleculerClientError('Message content cannot be empty', 400);
      }

      const session = await Session.getSession(this.pool, schema, sid, uid)
        .then(res => res, sessionErrorHandler);

      const lastUserMessage = session.messages.findLast(m => m.role === 'user');
      if (lastUserMessage?.id !== mid) {
        throw new MoleculerClientError(
          'Only the last user message can be updated',
          403
        );
      }

      const reply_message_id = session.messages
        .find(m => m.reply_to_id === mid)?.id ?? null;

      const messages = session.messages
        .map(m => ({
          ...m,
          content: m.id === mid ? sanitizedContent : m.content
        }))
        .slice(0, session.messages.length - 1);

      const character_settings = await Character.getSetting(
        this.pool, schema, session.cid, uid
      );
      const user = await ctx.call('user.profile', {}, ctx.meta);
      const chatConfig = await this.getAIServiceConfig('chat');
      const options = await readCharacterOptions();
      const chatbotTimeend = this.AIRequestTimer(ai_metrics_constants.CHATBOT);

      const { reply } = await ai.chatCompletion(
        options,
        chatConfig,
        user.name,
        character_settings,
        messages,
        sanitizedContent
      )
        .then(
          result => {
            chatbotTimeend(true);
            return result;
          },
          error => {
            chatbotTimeend(false);
            throw error;
          }
        );

      await Session.updateMessageWithReply(
        this.pool, schema, uid, sid,
        mid, sanitizedContent, reply_message_id, reply
      )
        .then(res => res, sessionErrorHandler);

      return {
        send_message_id: mid,
        reply_message_id: reply_message_id,
        content: reply,
        reply_voice_url: null,
        send_voice_url: null,
        reply_picture_url: null,
        type: 'text'
      };
    }
  },
  // 获取会话列表
  session_list: {
    async handler(ctx) {
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      const sessions = await Session.listSessions(this.pool, schema, uid)
        .then(res => res, sessionErrorHandler);

      const characterIds = sessions.map(s => s.cid);
      const characterMap = await this.lookupCharacter(schema, characterIds);

      return sessions.map(({ cid, ...session }) => Object.assign(
        {}, session, { character: characterMap.get(cid) }
      ));
    }
  },
  // 更新会话设置
  session_update: {
    params: {
      params: { type: 'object', properties: { sid: 'uuid' } },
      body: { type: 'object' }
    },
    async handler(ctx) {
      const { params: { sid }, body } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      await Session.updateSession(this.pool, schema, sid, uid, body)
        .then(res => res, sessionErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },
  // 将消息转为语音
  session_message_tts: {
    params: {
      params: {
        type: 'object',
        properties: {
          sid: 'uuid',
          mid: 'uuid'
        }
      }
    },
    async handler(ctx) {
      const { params: { sid, mid } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      await this.deductCoinsByTTS(ctx, mid);

      const message = await Session.getMessage(this.pool, schema, sid, mid, uid)
        .then(res => res, sessionErrorHandler);

      if (message.voice_url) {
        return { voice_url: message.voice_url };
      }

      if (message.role !== 'character') {
        throw new MoleculerClientError(
          'Text-to-Speech is only available for character messages', 400
        );
      }

      const settings = await Character.getSetting(
        this.pool, schema, message.cid
      )
        .then(res => res, characterErrorHandler);

      const ttsConfig = await this.getAIServiceConfig('tts');
      const ttsTimeend = this.AIRequestTimer(ai_metrics_constants.TTS);
      const { voice_url } = await ai.tts(ttsConfig, settings, textForTts(message.content))
        .then(
          result => {
            ttsTimeend(true);
            return result;
          },
          error => {
            ttsTimeend(false);
            throw error;
          }
        );

      const res = await Session.updateMessageVoiceUrl(
        this.pool, schema, sid, mid, uid, voice_url
      )
        .then(res => res, sessionErrorHandler);

      return { voice_url: resolveAITTtsUrl(res.voice_url) };
    }
  },
  // 对消息进行反馈
  session_message_feedback: {
    params: {
      params: {
        type: 'object',
        properties: {
          sid: 'uuid',
          mid: 'uuid',
          feedback: { type: 'string', enum: ['like', 'dislike'] }
        }
      }
    },
    async handler(ctx) {
      const { params: { sid, mid, feedback } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      await Session.updateMessageFeedback(this.pool, schema, sid, mid, uid, feedback)
        .then(res => res, sessionErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },
  // 删除消息
  session_message_delete: {
    params: {
      params: { type: 'object', properties: { sid: 'uuid', mid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { sid, mid } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      const session = await Session.getSession(this.pool, schema, sid, uid)
        .then(res => res, sessionErrorHandler);

      const lastUserMessage = session.messages.findLast(m => m.role === 'user');
      if (lastUserMessage?.id !== mid) {
        throw new MoleculerClientError(
          'You can only delete your last message.',
          403
        );
      }

      await Session.deleteMessage(this.pool, schema, sid, uid, mid)
        .then(res => res, sessionErrorHandler);

      ctx.emit('session_message_deleted', { sid, mid, uid, cid: session.cid });
      ctx.emit(
        'member_update_stats',
        { uid, data: [[SESSION_MESSAGES, -1]] }
      );

      ctx.meta.$statusCode = 204;
    }
  },
  // 删除会话
  session_delete: {
    params: {
      params: { type: 'object', properties: { sid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { sid } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      await Session.deleteSession(this.pool, schema, sid, uid)
        .then(res => res, sessionErrorHandler);

      ctx.meta.$statusCode = 204;
    }
  },
  // 获取消息建议
  session_message_suggest: {
    params: {
      params: { type: 'object', properties: { sid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { sid } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();

      const session = await Session.getSession(this.pool, schema, sid, uid)
        .then(res => res, sessionErrorHandler);
      const user = await ctx.call('user.profile', {}, ctx.meta);

      const character_settings = await Character.getSetting(
        this.pool, schema, session.cid, uid
      );
      const chatConfig = await this.getAIServiceConfig('chat');
      const options = await readCharacterOptions();
      const chatbotTimeend = this.AIRequestTimer(ai_metrics_constants.CHATBOT);

      const messages = session.messages.slice(0, session.messages.length - 1);
      const lastCharacterMessage = session.messages
        .slice()
        .reverse()
        .find(m => m.role === 'character');

      const { reply } = await ai.suggestReplyCompletion(
        options,
        chatConfig,
        user.name,
        character_settings,
        messages,
        lastCharacterMessage.content
      )
        .then(
          result => {
            chatbotTimeend(true);
            return result;
          },
          error => {
            chatbotTimeend(false);
            throw error;
          }
        );

      return { content: reply };
    }
  },
  // 请求生成角色图片
  session_character_image_request: {
    params: {
      params: { type: 'object', properties: { sid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { sid } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const image_id = randomUUID();
      await this.deductCoinsByImageGen(ctx, image_id);

      const session = await Session.getSession(this.pool, schema, sid, uid)
        .then(res => res, sessionErrorHandler);

      const { cid } = session;

      const character_setting = await Character.getSetting(
        this.pool, schema, cid
      )
        .then(res => res, characterErrorHandler);

      const { image_url } = await avatarQueue.append(
        image_id, character_setting
      );
      await Media.saveSessionGeneratedImage(
        this.pool, schema,
        cid, uid, image_id, image_url
      );

      const res = await Session.appendCharacterMessage(
        this.pool, schema,
        sid,
        '',
        { image_url },
        image_id, null, 'image'
      )
        .then(res => res, sessionErrorHandler);

      const reply_message_id = res.id;
      ctx.emit(
        'session_message_sent_image',
        { uid, sid, cid, message_id: reply_message_id, }
      );

      ctx.emit(
        'member_update_stats',
        {
          uid,
          data: [
            [SESSION_MESSAGES, 1],
            [MEDIA_IMAGES, 1]
          ]
        }
      );

      return {
        reply_message_id,
        content: '',
        reply_picture_id: image_id,
        reply_picture_url: resolveAIImageUrl(image_url),
        reply_voice_url: null,
        send_message_id: null,
        send_voice_url: null,
        type: 'image',
      };
    }
  },

  session_voice_call_start: {
    params: {
      params: { type: 'object', properties: { sid: 'uuid' } }
    },
    async handler(ctx) {
      const { params: { sid } } = ctx.params;
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const memberInfo = await Member.info(client, schema, uid);
      const totalBalance = (memberInfo.coin_free_balance ?? 0) + (memberInfo.coin_purchased_balance ?? 0);
      const minCoins = await ctx.call('payment.get_voice_call_min_coins');
      if (totalBalance < minCoins) {
        throw new MoleculerClientError(`Need at least ${minCoins} coins to start a voice call.`, 402, 'INSUFFICIENT_COINS_FOR_VOICE_CALL');
      }

      const id = randomUUID();
      const res = await Session.startVoiceCall(client, schema, sid, uid, id)
        .then(res => res, sessionErrorHandler);

      ctx.meta.$statusCode = 201;

      return res;
    }
  },

  session_voice_call_message: {
    async handler(ctx) {
      const { params: { sid, cid } } = ctx.meta.$params;
      const { user: { uid } } = ctx.meta;
      const client = this.pool;
      const schema = this.buildSchema();

      await Session.getVoiceCall(
        client, schema, sid, cid
      ).then(res => res, sessionErrorHandler);

      const session_dir = await ensureDir(
        path.resolve(this.session_dir, sid)
      );
      const temp_session_dir = await ensureDir(
        path.resolve(this.temp_dir, 'sessions', sid)
      );
      const user_voice_file_path = path.resolve(
        temp_session_dir,
        `${cid}_user.wav`
      );
      await pipeline(ctx.params, createWriteStream(user_voice_file_path));

      const session = await Session.getSession(
        client, schema, sid, uid
      ).then(res => res, sessionErrorHandler);
      const character_settings = await Character.getSetting(
        client, schema, session.cid
      ).then(res => res, characterErrorHandler);
      const voiceCallConfig = await this.getAIServiceConfig('voiceCall');
      const userVoiceStream = createReadStream(user_voice_file_path);

      const voice_response = ai.voiceCall(
        voiceCallConfig,
        character_settings,
        userVoiceStream
      );

      const eventsIterator = handleVoiceCallRecord(
        voice_response,
        session_dir, temp_session_dir,
        user_voice_file_path,
        client, schema, cid
      );
      const res = Readable.from(formatVoiceCallStream(eventsIterator));

      res.on('error', (error) => {
        this.logger.error('Voice Call Stream Error:', error);
      });

      ctx.meta.$responseType = 'text/event-stream';
      ctx.meta.$responseHeaders = {
        'X-Accel-Buffering': 'no',
        'Cache-Control': 'no-cache'
      };
      return res;
    }
  },

  session_voice_call_end: {
    params: {
      params: {
        type: 'object',
        properties: {
          sid: 'uuid',
          cid: 'uuid'
        }
      }
    },
    async handler(ctx) {
      const p = ctx.params || {};
      const sid = p.params?.sid ?? p.sid;
      const cid = p.params?.cid ?? p.cid;
      const segmentsFromBody = Array.isArray(p.segments) ? p.segments : Array.isArray(p.body?.segments) ? p.body.segments : undefined;
      const { user: { uid } } = ctx.meta;
      const client = this.pool;
      const schema = this.buildSchema();

      await Session.getSession(
        client, schema, sid, uid
      ).then(res => res, sessionErrorHandler);

      const voiceCall = await Session.getVoiceCall(
        client, schema, sid, cid
      ).then(res => res, sessionErrorHandler);

      if (voiceCall.status === 'ended') {
        const message = await Session.getMessage(
          client, schema, sid, cid, uid
        ).then(res => res, sessionErrorHandler);
        return {
          reply_message_id: message.id,
          content: message.content,
          reply_voice_url: message.voice_url,
          reply_picture_url: null,
          send_message_id: null,
          send_voice_url: null,
          type: 'voice_call'
        };
      }

      if (segmentsFromBody?.length > 0) {
        await Session.replaceVoiceCallSegments(
          client, schema, cid,
          segmentsFromBody.map(s => ({
            transcript_user: String(s?.transcript_user ?? ''),
            transcript_character: Array.isArray(s?.transcript_character) ? s.transcript_character : undefined
          }))
        ).then(() => {}, sessionErrorHandler);
      }

      const segments = await Session.listVoiceCallSegments(
        client, schema, cid
      ).then(res => res, sessionErrorHandler);

      const summaryLines = segments.flatMap(({ summary, transcript_character, transcript_user }) => {
        const parts = [];
        const userText = (transcript_user && String(transcript_user).trim()) ? String(transcript_user).trim() : null;
        if (userText) parts.push(`User: ${userText}`);
        const charLines = summary ?? transcript_character ?? [];
        if (Array.isArray(charLines) && charLines.length) {
          charLines.forEach((l) => { if (l != null && String(l).trim()) parts.push(`Character: ${String(l).trim()}`); });
        }
        return parts;
      });
      const summary = summaryLines.join('\n').trim();

      const voiceUrlPath = path.posix.join(
        'sessions', sid, `${cid}.wav`
      );
      const voice_url = resolveUserUploadUrl(voiceUrlPath);

      const finishedVoiceCall = await Session.finishVoiceCall(
        client, schema, sid, cid, summary
      ).then(res => res, sessionErrorHandler);

      const durationMs = new Date(finishedVoiceCall.ended_at) - new Date(finishedVoiceCall.start_at);
      const durationSeconds = Math.floor(durationMs / 1000);
      const info = { duration: durationMs };

      const memberInfo = await Member.info(client, schema, uid);
      const totalBalance = (memberInfo.coin_free_balance ?? 0) + (memberInfo.coin_purchased_balance ?? 0);
      const deductAmount = Math.min(totalBalance, Math.max(0, durationSeconds));
      if (deductAmount > 0) {
        await ctx.call('payment.deduction_coins', {
          amount: deductAmount,
          resource_id: cid,
          reason: 'voice_call'
        }, { meta: ctx.meta });
      }
      const insufficient_coins_during_call = durationSeconds > deductAmount;

      const { id: message_id } = await Session.appendUserMessage(
        client, schema,
        sid, summary,
        { voice_url, info },
        cid, null, 'voice_call'
      ).then(res => res, sessionErrorHandler);

      return {
        reply_message_id: message_id,
        content: summary,
        reply_voice_url: voice_url,
        reply_picture_url: null,
        send_message_id: null,
        send_voice_url: null,
        type: 'voice_call',
        info,
        insufficient_coins_during_call
      };
    }
  },

  /**
   * 获取礼物清单
   * @action session_gifts_list
   * @returns {Promise<Array<Object>>} 礼物列表
   *
   * @description
   * 返回所有可用的礼物列表，包含礼物 ID、名称、图片、价格和亲密度信息
   *
   * @example
   * const gifts = await broker.call('errows.session_gifts_list');
   * // 返回: [{id: 'xxx', name: '玫瑰', picture_url: '...', price: 10, intimacy: 5}, ...]
   */
  session_gifts_list: {
    async handler(ctx) {
      const schema = this.buildSchema();
      const client = this.pool;
      const { Gift } = await import('@errows/models');
      const { giftErrorHandler } = await import('./error.mjs');
      const { uid } = ctx.meta.user;

      const gifts = await Gift.listSessionGifts(client, schema, uid)
        .then(res => res, giftErrorHandler);

      // 将图片URL转换为完整路径
      return gifts.map(gift => ({
        ...gift,
        picture_url: resolveUserUploadUrl(gift.picture_url)
      }));
    }
  },

  /**
   * 赠送礼物
   * @action session_gift_send
   * @requires 用户认证
   * @param {Object} ctx.params.params
   * @param {string} ctx.params.params.sid - 会话 ID (UUID)
   * @param {string} ctx.params.params.gift_id - 礼物 ID
   * @returns {Promise<Object>} 消息回复对象
   * @throws {NotFoundError} 会话或礼物不存在时
   *
   * @description
   * 在会话中赠送礼物给角色，会创建两条消息：
   * 1. 用户发送的礼物消息（type: 'gift'）
   * 2. 角色的感谢回复（type: 'text'）
   *
   * @example
   * const reply = await broker.call('errows.session_gift_send', {
   *   params: { sid: 'session-uuid', gift_id: '1' }
   * });
   */
  session_gift_send: {
    params: {
      params: {
        type: 'object',
        properties: {
          sid: 'uuid',
          gift_id: 'uuid'
        }
      }
    },
    async handler(ctx) {
      const { sid, gift_id } = ctx.params.params;
      const { uid } = ctx.meta.user;

      const client = this.pool;
      const schema = this.buildSchema();
      const { giftErrorHandler } = await import('./error.mjs');

      // 获取礼物信息
      const gift = await Gift.getGift(client, schema, gift_id)
        .then(res => res, giftErrorHandler);

      await this.deductCoins(ctx, gift.price, gift_id);

      // 获取会话信息以获取角色信息
      const session = await Session.getSession(client, schema, sid, uid)
        .then(res => res, sessionErrorHandler);

      // 创建用户的礼物消息
      const gift_prompt = gift.prompt;
      const { id: send_message_id } = await Session.appendUserMessage(
        client, schema,
        sid, gift_prompt, { image_url: gift.picture_url },
        null, null, 'gift'
      );

      const user = await ctx.call('user.profile', {}, ctx.meta);
      const chatConfig = await this.getAIServiceConfig('chat');
      const options = await readCharacterOptions();
      const character_settings = await Character
        .getSetting(client, schema, session.cid, uid);

      const chatbotTimeend = this.AIRequestTimer(ai_metrics_constants.CHATBOT);
      const { reply } = await ai.chatCompletion(
        options,
        chatConfig,
        user.name,
        character_settings,
        session.messages,
        gift_prompt
      )
        .then(
          result => {
            chatbotTimeend(true);
            return result;
          },
          error => {
            chatbotTimeend(false);
            throw error;
          }
        );

      const reply_message_id = randomUUID();
      await Session.appendCharacterMessage(
        this.pool, schema,
        sid, reply, {},
        reply_message_id, send_message_id
      )
        .then(res => res, sessionErrorHandler);

      // 触发会员事件（增加消息计数）
      ctx.emit(
        'member_update_stats',
        { uid, data: [[SESSION_MESSAGES, 1]] }
      );

      return {
        content: reply,
        type: 'text',
        reply_message_id,
        reply_voice_url: null,
        reply_picture_url: null,
        send_message_id,
        send_voice_url: null
      };
    }
  }
};

export const methods = {
  /**
   * 检查会话消息配额是否超限
   * @param {Object} ctx - Moleculer context
   * @param {Object} session - 会话对象
   * @throws {MoleculerClientError} 402 - 超出配额限制时抛出错误
   */
  async checkSessionMessageQuota(ctx, session) {
    const model_level = session.settings.model === 'Butter v1.0'
      ? 'basic'
      : 'advanced';

    const turnsByModel = await ctx.call(
      'errows.session_count_by_model',
      { sid: session.id }
    );

    const memberInfo = await ctx.call('user.member_info');
    const session_message_quotas = memberInfo.session_message_quotas;
    const member_message_quota = session_message_quotas[model_level];

    // 无限配额
    if (member_message_quota === -1) {
      return;
    }

    const { cid, messages } = session;

    // 通过 ops service 获取角色的配置
    const config = await ctx.call(
      'ops.configuration_session_config_character_get',
      { cid }
    );

    const quota = member_message_quota ?? config?.turns ?? 0;

    // 统计用户消息数量
    const thisSessionTextMessageTurns = messages
      .filter(m => m.role === 'user' && m.type === 'text')
      .length;

    const totalTurns = turnsByModel.total;
    const userMessageTurns = Math.max(totalTurns, thisSessionTextMessageTurns);

    // 检查是否超出配额
    if (userMessageTurns >= quota) {
      throw new MoleculerClientError(
        'Text message quota exceeded.',
        402,
        "SESSION_MESSAGE_QUOTA_EXCEEDED",
      );
    }
  },

  async generateImageInSession(
    ctx,
    session,
    character_settings,
    reply_message_id,
    reply
  ) {

    const auto_gen_prompt_params = {
      message_to_gen_prompt: reply
    };

    try {
      const result = await inChatImageQueue.append(
        reply_message_id,
        {
          character: character_settings,
          auto_gen_prompt_params
        }
      );
      // 确保 image_url 是字符串或 null，不会是 undefined
      const image_url = (result && typeof result.image_url === 'string') ? result.image_url : null;

      // 只有在成功生成图片后才扣除金币
      if (image_url) {
        await this.deductCoinsByImageGen(ctx, reply_message_id);
      }

      return image_url;
    } catch (error) {
      this.logger.error(
        'Failed to generate image in session',
        { session_id: session.id, reply_message_id, error }
      );
      // 图片生成失败时返回 null，继续保存文字消息（不扣除金币）
      return null;
    }
  },

  async shouldGenerateImageInSession(
    ctx, session, content
  ) {
    const { cid, settings } = session;
    const actionKeywords = await ctx.call(
      'ops.configuration_session_image_keywords_get'
    );

    const triggerByKeyword = actionKeywords
      .some(keyword => content.includes(keyword));

    if (triggerByKeyword === true) {
      return true;
    }

    if ((settings.auto_picture ?? false) === false) {
      return false;
    }

    // 通过 ops service 获取角色的配置
    const config = await ctx.call(
      'ops.configuration_session_config_character_get',
      { cid }
    );

    return Math.floor(Math.random() * 100) <= config.probability;
  }
};

async function* formatVoiceCallStream(ai) {
  try {
    for await (const item of ai) {
      const { event } = item;
      if (event === 'stt') {
        const { text } = item.data;
        yield buildSSEChunk('stt', text);
      }

      if (event === 'tts_sentence') {
        const { text, wav_base64 } = item.data;
        yield buildSSEChunk('response_text', text);
        yield buildSSEChunk('response_sentence', wav_base64);
      }
      if (event === 'error') {
        const data = item.data;
        yield buildSSEChunk('error', data);
      }
    }
  } catch (error) {
    yield buildSSEChunk('error', { message: error.message });
  }
  yield buildSSEChunk('end');
}

async function* handleVoiceCallRecord(
  voiceCallIterator,
  session_dir, temp_session_dir,
  user_voice_file_path,
  client, schema, call_id
) {
  const call_voice_path = path.resolve(session_dir, `${call_id}.wav`);

  let call_segment_id = null;
  const character_transcript = [];

  for await (const item of voiceCallIterator) {
    yield item;
    const { event } = item;

    const data = item.data;
    if (event === 'connected') {
      call_segment_id = data.session_id;
    }

    // 用户 voice 转语音，表示拥护语音已经被处理
    if (event === 'stt') {
      if (!call_segment_id) {
        throw new Error('Call segment ID is missing for STT event');
      }
      const { text } = data;
      await Session.appendVoiceCallSegment(
        client, schema,
        call_id, call_segment_id, text
      );

      const user_voice_path = path.resolve(
        temp_session_dir, `${call_segment_id}_user.wav`
      );

      const call_voice_file_exists = await fs.exists(call_voice_path);

      if (call_voice_file_exists) {
        await appendWAVContent(call_voice_path, user_voice_path);
      } else {
        await move(user_voice_file_path, call_voice_path, { overwrite: true });
      }
    }

    if (event == 'tts_sentence') {
      const { text } = data;
      character_transcript.push(text);
    }

    // 保存角色完整语音
    if (event === 'done') {
      if (!call_segment_id) {
        throw new Error('Call segment ID is missing for DONE event');
      }
      const { audio_wav_base64, audio_chunks_count } = data;
      if (audio_chunks_count === 0) {
        continue;
      }

      const character_voice_path = await saveTTSWavFile(
        temp_session_dir,
        `${call_segment_id}_full`,
        audio_wav_base64
      );

      await appendWAVContent(call_voice_path, character_voice_path);

      const summary = data.texts ?? [];
      await Session.updateVoiceCallSegment(
        client, schema,
        call_id, call_segment_id,
        character_transcript, summary
      );
    }
  }
}

async function saveTTSWavFile(dir_path, name, wav_base64) {
  const wav_buffer = Buffer.from(wav_base64, 'base64');
  const wav_path = path.resolve(dir_path, `${name}.wav`);
  await fs.writeFile(wav_path, wav_buffer);
  return wav_path;
}

async function appendWAVContent(origin_file_path, append_file_path) {
  const temp_call_voice_path = await mergeWAV([origin_file_path, append_file_path])
    .catch(error => {
      console.error(error);
      throw error;
    });
  await move(temp_call_voice_path, origin_file_path, { overwrite: true });
  await fs.unlink(append_file_path);
}