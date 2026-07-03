const CHARACTERS_PRIVATE = 'characters_private';
const CHARACTERS_DELETED = 'characters_deleted';
const CHARACTERS_LIKED = 'characters_liked';
const CHARACTERS_FOLLOWED = 'characters_followed';

const SESSION_MESSAGES = 'session_messages';
const POSTS = 'posts';

const MEDIA_IMAGES = 'media_images';
const MEDIA_VIDEOS = 'media_videos';

export const member_events = {
  CHARACTERS_PRIVATE,
  CHARACTERS_DELETED,
  CHARACTERS_LIKED,
  CHARACTERS_FOLLOWED,

  SESSION_MESSAGES,
  POSTS,

  MEDIA_IMAGES,
  MEDIA_VIDEOS,
};

/** Minimum coins required to start a voice call. Billing: 1 coin per second (after AI starts talking). */
export const VOICE_CALL_MIN_COINS = 60;

export const payment_transition_reasons = {
  CDKEY_REDEEM: 'cdkey_redeem',
  COIN_PURCHASE: 'coin_purchase',
  TASK_COMPLETION: 'task_completion',
  SUBSCRIPTION_PURCHASE: 'subscription_purchase',
  SUBSCRIPTION_BONUS: 'subscription_bonus',
};

export const ai_metrics_constants = {
  CHATBOT: 'chatbot',
  IMAGE: 'image',
  VIDEO: 'video',
  TTS: 'tts',
};

/**
 * 配置作用域
 */
export const CONFIGURATION_SCOPE = {
  MEDIA: 'media',
  LEGAL: 'legal',
  PIXEL: 'pixel',
  R_PIXEL: 'r_pixel',
  X_PIXEL: 'x_pixel'
};