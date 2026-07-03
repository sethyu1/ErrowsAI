export const MEMBER_PLANS = [
  'free',
  'star',
  'luna',
  'galaxy',
] as const;

export const PAYMENT_TRANSACTION_ACTIONS = {
  INIT_FREE_MEMBER: 'init_free_member',
} as const;

export const CHARACTER_IMAGES_SOURCES = {
  AVATAR_GENERATION: 'avatar_generation',
  AVATAR_REBUILD: 'avatar_rebuild',
  POST_USER_UPLOAD: 'post_user_upload',
  GENERATION: 'generation',
  SESSION_IMAGE: 'session_image',
} as const;