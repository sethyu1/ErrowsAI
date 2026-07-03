/**
 * @fileoverview Agora RTC token generation
 * @module services/libs/agora
 * @description Generates RTC tokens for voice call using Agora SDK (声网)
 */

import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';
import config from 'config';
import moleculer from 'moleculer';
import { Character, Member, Session } from '@errows/models';
import { generateSystemMessageForAgora } from './prompts.mjs';
import * as llmDebugStore from './llm-debug-store.mjs';

const require = createRequire(import.meta.url);
const { MoleculerClientError } = moleculer.Errors;
const agoraToken = require('agora-token');

// Extract RtcTokenBuilder and Role from the package
const RtcTokenBuilder = agoraToken.RtcTokenBuilder || agoraToken.default?.RtcTokenBuilder;
const RtcRole = agoraToken.Role || agoraToken.RtcRole || agoraToken.default?.Role;

// Fallback Role constants if not exported
const Role = RtcRole || {
  PUBLISHER: 1,
  SUBSCRIBER: 2,
  ATTENDEE: 0,
  ADMIN: 101
};

if (!RtcTokenBuilder || typeof RtcTokenBuilder.buildTokenWithRtm !== 'function' || typeof RtcTokenBuilder.buildTokenWithUid !== 'function') {
  throw new Error('RtcTokenBuilder.buildTokenWithRtm and buildTokenWithUid are required. Check agora-token package installation.');
}

/** Default token validity: 1 hour */
const DEFAULT_EXPIRATION_SECONDS = 3600;

/** Agent RTC UID for ConvoAI bot (int32) */
const AGENT_RTC_UID = 999999;

/** Fallback voice ID when character doesn't have voice configured */
const FALLBACK_VOICE_ID = 'zhongjihuanjing_test';

/** Max Agora channel name length */
const CHANNEL_NAME_MAX_LEN = 64;

/**
 * Get Agora config (supports both Agora and agora keys for config compatibility)
 */
function getAgoraConfig() {
  // Try both capital and lowercase (Node config may preserve case)
  const cfg = config.agora ?? config.Agora ?? {};
  const appId = cfg.AppID ?? cfg.key ?? cfg.appId;
  const appCertificate = cfg.AppCertificate ?? cfg.secret ?? cfg.appCertificate;
  const convoai = cfg.convoai ?? {};
  return {
    appId,
    appCertificate,
    convoai
  };
}

/**
 * Sanitize string for use in Agora channel name (alphanumeric, _, -, CJK)
 */
function sanitizeChannelPart(str) {
  if (typeof str !== 'string') return 'channel';
  const sanitized = String(str)
    .replace(/[^a-zA-Z0-9_\-\u4e00-\u9fa5]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '') || 'channel';
  return sanitized.slice(0, CHANNEL_NAME_MAX_LEN - 32);
}

/**
 * Session Agora token action
 * Channel = character name + userID (optional override via query).
 * UID = int32 (hashed from userId).
 * GET /my/sessions/:sid/voice/agora-token?channel=xxx&uid=xxx
 */
export default {
  session_agora_token: {
    params: {
      params: {
        type: 'object',
        properties: {
          sid: { type: 'string' }
        }
      },
      channel: { type: 'string', optional: true },
      uid: { type: 'number', integer: true, min: 0, max: 2 ** 32 - 1, optional: true }
    },
    async handler(ctx) {
      const { params: { sid }, channel: channelParam, uid: uidParam } = ctx.params;
      const { user: { uid: userId } } = ctx.meta;
      const uid = uidParam ?? 0;

      this.logger?.info('Agora token request', { sid, userId, channelParam, uidParam });

      const schema = this.buildSchema();
      const memberInfo = await Member.info(this.pool, schema, userId);
      const totalBalance = (memberInfo.coin_free_balance ?? 0) + (memberInfo.coin_purchased_balance ?? 0);
      const minCoins = await ctx.call('payment.get_voice_call_min_coins');
      if (totalBalance < minCoins) {
        throw new MoleculerClientError(`Need at least ${minCoins} coins to start a voice call.`, 402, 'INSUFFICIENT_COINS_FOR_VOICE_CALL');
      }

      // Resolve channel = character name + userID (unless overridden); keep sessionData for character.voice (characters.dialogue.voice)
      let channel;
      let sessionData = null;
      if (channelParam && typeof channelParam === 'string') {
        channel = channelParam;
        this.logger?.debug('Agora token: Using provided channel', { channel });
      } else {
        try {
          sessionData = await ctx.call('errows.session_get', { params: { sid } });
          const characterName = sessionData?.character?.nickname ?? sid;
          const characterId = sessionData?.character?.id;
          const part = sanitizeChannelPart(characterName);
          channel = `${part}_${String(userId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 24)}`;
          if (channel.length > CHANNEL_NAME_MAX_LEN) {
            channel = channel.slice(0, CHANNEL_NAME_MAX_LEN);
          }
          this.logger?.debug('Agora token: Generated channel from session', { 
            sid, 
            characterId, 
            characterName, 
            channel 
          });
        } catch (err) {
          this.logger?.warn('Agora token: session_get failed, using sid as channel', { sid, err: err.message });
          channel = sid;
        }
      }

      const { appId, appCertificate, convoai } = getAgoraConfig();
      if (!appId || !appCertificate) {
        this.logger?.error('Agora config missing', { hasAppId: !!appId, hasAppCertificate: !!appCertificate });
        throw new Error('Agora appId or appCertificate not configured');
      }

      if (!/^[a-f0-9]{32}$/i.test(appId)) {
        this.logger?.error('Invalid Agora App ID format', { appId });
        throw new Error(`Invalid Agora App ID format: ${appId}. Expected 32-character hex string.`);
      }

      const privilegeExpiredTs = Math.floor(Date.now() / 1000) + DEFAULT_EXPIRATION_SECONDS;
      const rtcUid = uid > 0 ? uid : hashUidToNumber(userId);

      this.logger?.debug('Agora token: Generated RTC UID', { 
        userId, 
        providedUid: uid, 
        rtcUid, 
        privilegeExpiredTs 
      });

      if (!channel || typeof channel !== 'string') {
        this.logger?.error('Invalid channel name', { channel });
        throw new Error('Invalid channel name');
      }
      if (typeof rtcUid !== 'number' || rtcUid < 1 || rtcUid > 2 ** 32 - 1) {
        this.logger?.error('Invalid RTC UID', { rtcUid });
        throw new Error(`Invalid uid: ${rtcUid}`);
      }

      // One token = one identity. This token is for the CLIENT only (agent has its own token in buildAgentToken).
      const rtcAccount = String(rtcUid);
      let token;
      try {
        this.logger?.debug('Agora token: Building token with RTC+RTM (client)', { appId: appId.substring(0, 8) + '...', channel, rtcUid, account: rtcAccount });
        token = RtcTokenBuilder.buildTokenWithRtm(
          appId,
          appCertificate,
          channel,
          rtcAccount,
          Role.PUBLISHER,
          privilegeExpiredTs,
          privilegeExpiredTs
        );
        this.logger?.debug('Agora token: Token generated successfully (RTC+RTM)', { tokenLength: token?.length });
      } catch (err) {
        this.logger?.error('Agora token generation error:', { err, channel, rtcUid });
        throw new Error(`Failed to generate Agora token: ${err.message}`);
      }

      if (!token || typeof token !== 'string') {
        this.logger?.error('Agora token: Invalid token result', { token });
        throw new Error('Token generation returned invalid result');
      }

      // Start ConvoAI agent in same channel (fire-and-forget; do not block token response)
      if (convoai?.enabled && convoai?.customerId && convoai?.customerSecret) {
        this.logger?.debug('Agora ConvoAI: Agent enabled, starting agent', { 
          enabled: convoai.enabled, 
          hasCustomerId: !!convoai.customerId,
          hasCustomerSecret: !!convoai.customerSecret 
        });
        
        let character = sessionData?.character ?? null;
        if (!character) {
          try {
            const data = await ctx.call('errows.session_get', { params: { sid } });
            character = data?.character ?? null;
            this.logger?.debug('Agora ConvoAI: Fetched character from session', { 
              sid, 
              characterId: character?.id,
              hasVoice: !!character?.voice 
            });
          } catch (err) {
            this.logger?.warn('Agora ConvoAI: session_get for character failed', { sid, err: err.message });
          }
        } else {
          this.logger?.debug('Agora ConvoAI: Using character from session data', { 
            characterId: character?.id,
            characterName: character?.nickname,
            hasVoice: !!character?.voice 
          });
        }
        const cid = sessionData?.cid ?? sessionData?.character?.id ?? character?.id;
        if (cid) {
          try {
            const schema = this.buildSchema();
            const fullSettings = await Character.getSetting(this.pool, schema, cid);
            character = { ...fullSettings, id: fullSettings.id ?? cid, nickname: fullSettings.nickname ?? character?.nickname, voice: fullSettings.voice ?? character?.voice };
          } catch (_err) {
          }
        }
        // User name for prompt: use session persona name (from session_personas) for voice call
        let sessionForPersona = sessionData;
        if (!sessionForPersona?.persona?.name) {
          try {
            sessionForPersona = await ctx.call('errows.session_get', { params: { sid } });
          } catch (_err) {
          }
        }
        const personaName = sessionForPersona?.persona?.name;
        let user = personaName != null ? { name: personaName } : null;
        if (!user) {
          try {
            const profile = await ctx.call('user.profile', {}, ctx.meta);
            user = { name: profile?.name ?? 'User' };
          } catch (_err) {
            user = { name: 'User' };
          }
        }

        startConvoAIAgent(this, {
          appId,
          appCertificate,
          channel,
          userRtcUid: rtcUid,
          convoai,
          character,
          user,
          sid,
          uid: userId
        }).catch(() => {});
      } else {
        this.logger?.debug('Agora ConvoAI: Agent disabled or missing config', { 
          enabled: convoai?.enabled,
          hasCustomerId: !!convoai?.customerId,
          hasCustomerSecret: !!convoai?.customerSecret 
        });
      }

      this.logger?.info('Agora token: Token generated and returned', { 
        sid, 
        channel, 
        rtcUid,
        tokenLength: token.length,
        token,
      });

      // Create voice call record so hangup endpoint can find it by cid (UUID)
      const callId = randomUUID();
      try {
        await Session.startVoiceCall(this.pool, schema, sid, String(userId), callId);
      } catch (err) {
        this.logger?.warn('Agora token: Failed to create voice call record (hangup may fail)', { sid, err: err?.message });
      }

      return {
        agoraToken: token,
        appId,
        channel,
        uid: rtcUid,
        callId,
        // Max billable seconds = current balance (1 coin/sec). Call must not exceed this; client should disconnect when reached.
        max_duration_seconds: Math.max(0, Math.floor(totalBalance))
      };
    }
  },

  /**
   * Agora voice call billing: charge 1 coin per second. Duration capped by balance (cannot exceed balance seconds).
   */
  session_agora_voice_call_billing: {
    params: {
      params: { type: 'object', properties: { sid: { type: 'string' } } },
      body: { type: 'object', optional: true, properties: { duration_seconds: { type: 'number', min: 0, integer: true, optional: true } } }
    },
    async handler(ctx) {
      this.logger?.info('Agora voice call billing: handler hit', {
        paramKeys: ctx.params ? Object.keys(ctx.params) : [],
        hasParamsParams: !!ctx.params?.params,
        hasParamsBody: !!ctx.params?.body,
      });
      // Support both alias param shape (params.params, params.body) and flat (params.sid, params.duration_seconds)
      const p = ctx.params || {};
      const sid = p.params?.sid ?? p.sid;
      const body = p.body ?? p;
      const duration_seconds = Math.max(0, Math.floor(Number(body?.duration_seconds ?? p.duration_seconds ?? 0)));
      this.logger?.info('Agora voice call billing: request', { sid, duration_seconds, paramKeys: Object.keys(p) });
      const { user: { uid } } = ctx.meta;
      const schema = this.buildSchema();
      const client = this.pool;

      const memberInfo = await Member.info(client, schema, uid);
      const totalBalance = (memberInfo.coin_free_balance ?? 0) + (memberInfo.coin_purchased_balance ?? 0);
      // Cap duration by balance: cannot charge for more seconds than user has coins
      const duration_capped = Math.min(duration_seconds, totalBalance);
      const deductAmount = duration_capped;
      const resourceId = randomUUID();

      if (deductAmount > 0) {
        await ctx.call('payment.deduction_coins', {
          amount: deductAmount,
          resource_id: resourceId,
          reason: 'voice_call'
        }, { meta: ctx.meta });
        this.logger?.info(`Agora voice call billing: ${deductAmount} coins deducted for ${duration_seconds}s (1 coin/sec)`, {
          sid,
          uid,
          duration_seconds,
          coins_deducted: deductAmount,
          balance_before: totalBalance,
          insufficient_coins_during_call: duration_seconds > deductAmount
        });
      } else {
        this.logger?.debug('Agora voice call billing: no deduction', {
          sid,
          uid,
          duration_seconds,
          balance: totalBalance,
          reason: duration_seconds <= 0 ? 'zero_duration' : 'insufficient_balance'
        });
      }

      const insufficient_coins_during_call = duration_seconds > deductAmount;
      return { insufficient_coins_during_call };
    }
  }
};

/**
 * Hash a string uid to a 32-bit unsigned integer for Agora RTC uid
 */
function hashUidToNumber(uid) {
  let h = 0;
  const s = String(uid);
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % (2 ** 32 - 1) + 1;
}

/**
 * Build RTC+RTM token for the ConvoAI agent (same channel, fixed agent UID).
 * RTM is required so the agent can publish transcript when enable_rtm and data_channel "rtm" are set.
 */
function buildAgentToken(appId, appCertificate, channel, privilegeExpiredTs, logger) {
  const agentAccount = String(AGENT_RTC_UID);
  logger?.debug('Agora agent token: Building agent token (RTC+RTM)', {
    channel,
    agentRtcUid: AGENT_RTC_UID,
    privilegeExpiredTs
  });

  const token = RtcTokenBuilder.buildTokenWithRtm(
    appId,
    appCertificate,
    channel,
    agentAccount,
    Role.PUBLISHER,
    privilegeExpiredTs,
    privilegeExpiredTs
  );

  logger?.debug('Agora agent token: Agent token generated (RTC+RTM)', {
    channel,
    agentRtcUid: AGENT_RTC_UID,
    tokenLength: token?.length
  });

  return token;
}

/**
 * Extract speech from message content, removing actions (*...*) and keeping only speech ("...")
 * Based on the same logic as frontend formatMessage function
 * @param {string} message - Raw message content with actions and speech
 * @returns {string} - Message with only speech content (quotes), actions removed
 */
function extractSpeechFromMessage(message) {
  if (!message || typeof message !== 'string') {
    return '';
  }

  const result = [];
  // Split by asterisks to separate actions from text
  const byStar = message.split('*');

  for (let i = 0; i < byStar.length; i++) {
    const segment = byStar[i] ?? '';

    // Odd-indexed segments are actions (*...*) - skip them
    if (i % 2 === 1) {
      continue;
    }

    // Even-indexed segments: extract speech from quotes ("...")
    const byQuote = segment.split('"');
    for (let k = 0; k < byQuote.length; k++) {
      const s = byQuote[k] ?? '';
      if (s.length === 0) continue;

      // Odd-indexed quote segments are speech (between quotes)
      if (k % 2 === 1) {
        // Remove asterisks and content between them from the speech (even inside quotes)
        let cleanedSpeech = s;
        if (cleanedSpeech.includes('*')) {
          // Split by asterisk, keep only even-indexed segments (non-action text)
          // Trim each segment and join with space to preserve word boundaries
          cleanedSpeech = cleanedSpeech.split('*')
            .filter((segment, index) => index % 2 === 0)
            .map(seg => seg.trim()) // Trim each segment
            .filter(seg => seg.length > 0) // Remove empty segments
            .join(' ')
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
            .trim();
        }
        if (cleanedSpeech.length > 0) {
          result.push(cleanedSpeech);
        }
      }
    }
  }

  // Join all speech parts with spaces, or return empty string if no speech found
  return result.length > 0 ? result.join(' ') : '';
}

/**
 * Start ConvoAI agent in the given channel (POST to Agora ConvoAI join API)
 * voice_id from characters.dialogue.voice (per-character)
 */
async function startConvoAIAgent(service, opts) {
  const { appId, appCertificate, channel, userRtcUid, convoai, character, user, sid, uid } = opts;
  const characterVoiceId = character?.voice;
  const characterId = character?.id;
  const characterName = character?.nickname;
  
  // Use fallback voice ID if character doesn't have one configured
  const voiceId = characterVoiceId || FALLBACK_VOICE_ID;
  const usingFallback = !characterVoiceId;
  
  if (usingFallback) {
    service.logger?.warn('ConvoAI agent: Character missing voice ID, using fallback', { 
      characterId, 
      characterName,
      channel,
      fallbackVoiceId: FALLBACK_VOICE_ID
    });
  }
  
  service.logger?.info('ConvoAI agent: Starting agent', { 
    channel, 
    characterId, 
    characterName,
    userRtcUid,
    agentRtcUid: AGENT_RTC_UID,
    voiceId,
    usingFallback,
    originalVoiceId: characterVoiceId || null
  });
  
  // Fetch session messages to check for chat history and greeting
  let chatHistory = null;
  let latestCharacterSpeech = null;
  if (sid && uid) {
    try {
      const sessionData = await service.broker.call(
        'errows.session_get', 
        { params: { sid } },
        { meta: { user: { uid } } }
      );
      const messages = sessionData?.messages || [];
      
      // Check if user has replied (has at least one user message)
      const hasUserReplied = messages.some(m => m.role === 'user');
      
      if (hasUserReplied && messages.length > 0) {
        // Extract last 10 messages
        const last10Messages = messages.slice(-10);
        
        // Format as dialogue: "User: ..." or "{characterName}: ..."
        // For character messages: extract only speech (remove actions between *...* and keep only text between "...")
        // For user messages: keep as-is (they usually don't have actions/quotes)
        const formattedName = characterName || 'Character';
        chatHistory = last10Messages
          .map(m => {
            if (m.role === 'user') {
              // User messages: keep as-is (they're usually plain text without actions)
              const userMessage = m.content?.trim() || '';
              return userMessage ? `User: ${userMessage}` : null;
            } else {
              // Character messages: extract only speech (removes actions, keeps only quoted speech)
              let speech = extractSpeechFromMessage(m.content);
              // Double-check: if speech still contains asterisks (actions), remove them
              if (speech && speech.includes('*')) {
                // Remove everything between asterisks and the asterisks themselves
                // Trim each segment and join with space to preserve word boundaries
                speech = speech.split('*')
                  .filter((segment, index) => index % 2 === 0)
                  .map(seg => seg.trim()) // Trim each segment
                  .filter(seg => seg.length > 0) // Remove empty segments
                  .join(' ')
                  .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                  .trim();
              }
              // If no speech found, skip this character message
              if (!speech || speech.trim().length === 0) {
                return null;
              }
              return `${formattedName}: ${speech}`;
            }
          })
          .filter(msg => msg !== null) // Remove messages with no content
          .join('\n\n');
        
        service.logger?.debug('ConvoAI agent: Using chat history', { 
          sid,
          messageCount: last10Messages.length,
          hasUserReplied: true
        });
      } else {
        service.logger?.debug('ConvoAI agent: No user replies found, using character dialogue', { 
          sid,
          messageCount: messages.length,
          hasUserReplied: false
        });
      }

      // Capture speech from latest character reply for greeting_message (e.g. auto greeting or last reply)
      const lastCharacterMessage = [...messages].reverse().find(m => m.role === 'character');
      if (lastCharacterMessage?.content) {
        let speech = extractSpeechFromMessage(lastCharacterMessage.content);
        if (speech?.trim()) {
          // Double-check: if speech still contains asterisks (actions), remove them
          if (speech.includes('*')) {
            // Remove everything between asterisks and the asterisks themselves
            // Trim each segment and join with space to preserve word boundaries
            speech = speech.split('*')
              .filter((segment, index) => index % 2 === 0)
              .map(seg => seg.trim()) // Trim each segment
              .filter(seg => seg.length > 0) // Remove empty segments
              .join(' ')
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .trim();
          }
          latestCharacterSpeech = speech;
          service.logger?.debug('ConvoAI agent: Using latest character speech as greeting', {
            sid,
            greetingLength: latestCharacterSpeech.length,
            hadAsterisks: lastCharacterMessage.content.includes('*')
          });
        }
      }
    } catch (err) {
      service.logger?.warn('ConvoAI agent: Failed to fetch session history', { 
        sid, 
        err: err.message 
      });
    }
  }
  
  const baseUrl = (convoai.baseUrl || 'https://api.agora.io').replace(/\/$/, '');
  const url = `${baseUrl}/api/conversational-ai-agent/v2/projects/${appId}/join`;
  const credentials = Buffer.from(
    `${convoai.customerId}:${convoai.customerSecret}`,
    'utf8'
  ).toString('base64');
  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + DEFAULT_EXPIRATION_SECONDS;
  
  service.logger?.debug('ConvoAI agent: Building agent token', { 
    channel, 
    agentRtcUid: AGENT_RTC_UID,
    privilegeExpiredTs 
  });
  
  const agentToken = buildAgentToken(appId, appCertificate, channel, privilegeExpiredTs, service.logger);

  const { systemMessages } = generateSystemMessageForAgora(character, user, { chatHistory });
  
  // Debug: Log system messages being sent to ConvoAI agent (for debugging)
  service.logger?.debug('ConvoAI agent: System messages for join', {
    sid,
    characterId,
    characterName,
    systemMessagesCount: systemMessages.length,
    systemMessagePreview: systemMessages[0]?.content?.substring(0, 200) + (systemMessages[0]?.content?.length > 200 ? '...' : ''),
    hasChatHistory: !!chatHistory
  });

  const greetingMessage = (latestCharacterSpeech?.trim() || (convoai.llm?.greetingMessage ?? 'Dear {user}, how can I help you?')).replace(/\{user\}/gi, user?.name ?? 'User');
  console.log('[DEBUG] AGORA_GREETING_MESSAGE:', {
    fromLatestCharacter: !!latestCharacterSpeech?.trim(),
    greetingMessage,
    sid,
    characterName
  });
  
  const body = convoai.joinBody ?? {
    name: `agent_${channel}_${Date.now()}`,
    properties: {
      channel,
      token: agentToken,
      agent_rtc_uid: String(AGENT_RTC_UID),
      remote_rtc_uids: [String(userRtcUid)], 
      enable_string_uid: false,
      idle_timeout: convoai.idle_timeout ?? 120,
      advanced_features: { 
        enable_aivad: true,
        enable_rtm: true,
      },
      parameters: {
        enable_dump: true,
        data_channel: "rtm",
        enable_metrics: true,
        enable_error_message: true,
      },
      llm: {
        url: convoai.llm?.url ?? `${(convoai.llm?.base_url ?? 'https://api.x.ai/v1').replace(/\/$/, '')}/chat/completions`,
        api_key: convoai.llm?.api_key ?? '',
        system_messages: systemMessages,
        greeting_message: greetingMessage,
        failure_message: 'Sorry, I could not answer that.',
        max_history: 32,
        params: {
          model: convoai.llm?.model ?? 'grok-4-1-fast-non-reasoning',
          max_token: convoai.llm?.max_token ?? 500,
          userName: 'User',
          stream: true,
        }
      },
      asr: {
        language: convoai.asr?.language ?? 'en-US',
        vendor: convoai.asr?.vendor ?? 'fengming',
      },
      tts: {
        vendor: 'minimax',
        params: {
          group_id: convoai.tts?.group_id ?? 'xxxx',
          key: convoai.tts?.key ?? 'xxxx',
          model: convoai.tts?.model ?? 'speech-2.8-hd',
          url: convoai.tts?.url ?? 'wss://api-uw.minimax.io/ws/v1/t2a_v2',
          language_boost: convoai.tts?.language_boost ?? 'auto',
          stream: true,
          voice_setting: { 
            voice_id: voiceId, 
            speed: 1.1,
            vol: 1, 
            pitch: 0, 
            emotion: 'happy' 
          },
          audio_setting: { 
            sample_rate: 16000,
            bitrate: 128000,
            channel: 1,
            format: 'mp3'
          }
        }
      }
    }
  };

  service.logger?.debug('ConvoAI agent: Sending join request', { 
    url, 
    appId: appId.substring(0, 8) + '...', 
    channel,
    characterId,
    agentRtcUid: AGENT_RTC_UID,
    userRtcUid,
    agentName: body.name,
    voiceId,
    usingFallback,
    ttsUrl: body.properties?.tts?.params?.url,
    ttsVendor: body.properties?.tts?.vendor,
    asrLanguage: body.properties?.asr?.language,
    asrVendor: body.properties?.asr?.vendor
  });
  
  // Log full body for debugging (sanitize sensitive keys)
  const sanitizedBody = JSON.parse(JSON.stringify(body));
  if (sanitizedBody?.properties?.tts?.params?.key) {
    sanitizedBody.properties.tts.params.key = sanitizedBody.properties.tts.params.key.substring(0, 10) + '...';
  }
  if (sanitizedBody?.properties?.llm?.api_key) {
    sanitizedBody.properties.llm.api_key = sanitizedBody.properties.llm.api_key.substring(0, 10) + '...';
  }
  service.logger?.debug('ConvoAI agent: Join body (sanitized)', { body: sanitizedBody });
  // Push to LLM debug store for console UI: only the body sent to Agora API (for debugging)
  llmDebugStore.pushVoice({
    at: new Date().toISOString(),
    type: 'agora_convoai_join',
    payload: sanitizedBody
  });
  service.logger?.debug('ConvoAI agent: Real-time captions enabled via RTM', {
    data_channel: body?.properties?.parameters?.data_channel,
    enable_rtm: body?.properties?.advanced_features?.enable_rtm,
    channel,
  });
  
  const startTime = Date.now();
  let res;
  let abortController;
  try {
    // Create abort controller for timeout (compatible with older Node.js versions)
    abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 30000); // 30 second timeout
    
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: abortController.signal
      });
      clearTimeout(timeoutId);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      throw fetchErr;
    }
  } catch (fetchError) {
    const duration = Date.now() - startTime;
    const errorDetails = {
      url,
      channel,
      characterId,
      characterName,
      agentRtcUid: AGENT_RTC_UID,
      duration,
      errorName: fetchError?.name,
      errorMessage: fetchError?.message,
      errorCode: fetchError?.code,
      errorCause: fetchError?.cause
    };
    
    // Log network-specific errors
    if (fetchError?.name === 'AbortError' || fetchError?.name === 'TimeoutError') {
      service.logger?.error('ConvoAI agent: Request timeout', errorDetails);
      throw new Error(`ConvoAI join timeout after ${duration}ms: ${fetchError.message}`);
    } else if (fetchError?.code === 'ENOTFOUND' || fetchError?.code === 'ECONNREFUSED') {
      service.logger?.error('ConvoAI agent: Network connection error', errorDetails);
      throw new Error(`ConvoAI join network error: ${fetchError.message} (${fetchError.code})`);
    } else {
      service.logger?.error('ConvoAI agent: Fetch failed', errorDetails);
      throw new Error(`ConvoAI join fetch failed: ${fetchError.message}`);
    }
  }

  const duration = Date.now() - startTime;

  if (!res.ok) {
    let responseText = '';
    try {
      responseText = await res.text();
    } catch (textError) {
      service.logger?.warn('ConvoAI agent: Failed to read error response', { 
        error: textError.message 
      });
    }
    
    service.logger?.error('ConvoAI agent: Join API error', { 
      status: res.status, 
      statusText: res.statusText,
      appId, 
      channel,
      characterId,
      characterName,
      agentRtcUid: AGENT_RTC_UID,
      duration,
      response: responseText,
      responseHeaders: Object.fromEntries(res.headers.entries())
    });
    throw new Error(`ConvoAI join failed: ${res.status} ${res.statusText} - ${responseText}`);
  }
  
  let responseText = '';
  try {
    responseText = await res.text();
  } catch (textError) {
    service.logger?.warn('ConvoAI agent: Failed to read success response', { 
      error: textError.message 
    });
  }
  
  // Debug: Log successful response
  service.logger?.debug('ConvoAI agent: Join API response', {
    url,
    status: res.status,
    statusText: res.statusText,
    duration,
    appId: appId.substring(0, 8) + '...',
    channel,
    characterId,
    agentRtcUid: AGENT_RTC_UID,
    userRtcUid,
    responseHeaders: Object.fromEntries(res.headers.entries()),
    responseBody: responseText ? (responseText.length > 500 ? responseText.substring(0, 500) + '...' : responseText) : '(empty)'
  });
  
  service.logger?.info('ConvoAI agent: Started successfully', { 
    appId, 
    channel,
    characterId,
    characterName,
    agentRtcUid: AGENT_RTC_UID,
    userRtcUid,
    duration,
    responseLength: responseText.length,
    responsePreview: responseText.substring(0, 200), // First 200 chars for debugging
    captions: 'Real-time captions will be delivered to the client via RTM (data_channel: rtm)',
  });
}
