export default {
  scope: 'errows',
  pg: {
    user: 'errows',
    password: 'errows',
    database: 'errows',
    host: 'localhost'
  },
  broker: {
    logger: true,
    hotReload: false,
    nodeID: 'errows',
    transporter: {
      type: 'TCP',
      options: {
        udpDiscovery: false,
        port: 50001,
        urls: [
          // '127.0.0.1:50002/commander'
        ]
      },
    },
  },
  commander: {
    nodeID: 'commander',
    transporter: {
      type: 'TCP',
      options: {
        udpDiscovery: false,
        port: 50002,
        urls: [
          '127.0.0.1:50001/errows'
        ]
      },
    }
  },
  metrics: {
    enabled: true,
    reporter: [
      {
        type: "Prometheus",
        options: {
          // HTTP port
          port: 3030,
          // HTTP URL path
          path: "/metrics",
          // Default labels which are appended to all metrics labels
          defaultLabels: registry => ({
            namespace: registry.broker.namespace,
            nodeID: registry.broker.nodeID
          })
        }
      }
    ]
  },
  api: {
    port: 5003
  },
  jwt: {
    secret: 'errows_default_jwt_secret',
    options: {
      expiresIn: '7d',
      issuer: 'errows',
      audience: 'errows'
    }
  },
  host: {
    origin: process.env.HOST_ORIGIN || 'https://example.com',
  },
  mailer: {
    sender: {
      from: process.env.MAIL_FROM || 'hello@example.com',
    },
    smtp: {
      host: process.env.SMTP_HOST || 'smtp.example.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'hello@example.com',
        pass: process.env.SMTP_PASSWORD
      }
    }
  },
  assets: {
    uploadPath: '/srv/services/errows/uploads',
    baseUrl: process.env.ASSETS_BASE_URL || 'https://assets.example.com/cdn/',
  },
  aws: {
    s3: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      bucket: process.env.AWS_S3_BUCKET || 'my-bucket',
      region: process.env.AWS_S3_REGION || 'us-east-1',
      prefix: process.env.AWS_S3_PREFIX || 'errows/app',
      baseUrl: process.env.AWS_S3_BASE_URL || 'https://my-bucket.s3.amazonaws.com',
    },
  },
  // AI backend endpoints are internal infrastructure — set them via
  // environment variables or a git-ignored `local-*.mjs` config override.
  ai: {
    apiKey: process.env.AI_API_KEY,
    image: {
      endpoint: process.env.AI_IMAGE_ENDPOINT,
      baseUrl: process.env.AWS_S3_BASE_URL || 'https://my-bucket.s3.amazonaws.com'
    },
    chat: {
      endpoint: process.env.AI_CHAT_ENDPOINT,
    },
    stream: {
      endpoint: process.env.AI_STREAM_ENDPOINT,
    },
    video: {
      endpoint: process.env.AI_VIDEO_ENDPOINT,
      video_state: process.env.AI_VIDEO_STATE_ENDPOINT,
      baseUrl: `${process.env.AWS_S3_BASE_URL || 'https://my-bucket.s3.amazonaws.com'}/User_Generate/`
    },
    tts: {
      endpoint: process.env.AI_TTS_ENDPOINT,
      baseUrl: `${process.env.AWS_S3_BASE_URL || 'https://my-bucket.s3.amazonaws.com'}/`
    },
    voiceCall: {
      endpoint: process.env.AI_VOICE_CALL_ENDPOINT
    },
    // Character refine only – not merged with DB; used only by POST /my/character/refine → refine_character_text
    'character/refine': {
      endpoint: 'https://api.x.ai/v1/chat/completions',
      api_key: process.env.XAI_API_KEY,
      model: 'grok-4-1-fast-non-reasoning',
      max_token: 500,
    },
  },
  oauth: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI || 'https://example.com/oauth/google'
    }
  },
  member: {
    coin_free_balance: 50
  },
  stripe: {
    apiKey: process.env.STRIPE_API_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    /**
     * Optional second Stripe account (e.g. legacy) webhook signing secret (`whsec_...`).
     * Set on the server only: `STRIPE_WEBHOOK_SECRET_FALLBACK` — do not commit real values.
     */
    webhookSecretFallback: process.env.STRIPE_WEBHOOK_SECRET_FALLBACK,
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY,
    databaseId: process.env.NOTION_DATABASE_ID
  },
  agora: {
    AppID: 'faf8121d020448caa2dd38a08baefe1b', // public app id (visible to clients)
    AppCertificate: process.env.AGORA_APP_CERTIFICATE,
    // ConvoAI: start conversational AI agent in same channel when user gets token
    convoai: {
      enabled: true,
      baseUrl: 'https://api.agora.io',
      customerId: process.env.AGORA_CUSTOMER_ID, // ConvoAI Customer ID (Basic auth)
      customerSecret: process.env.AGORA_CUSTOMER_SECRET, // ConvoAI Customer Secret
      idle_timeout: 120,
      // LLM: xAI Grok (OpenAI-compatible)
      llm: {
        base_url: 'https://api.x.ai/v1',
        api_key: process.env.XAI_API_KEY,
        model: 'grok-4-1-fast-non-reasoning',
        max_token: 500,
      },
      // ASR: language and vendor for ConvoAI agent
      asr: {
        language: 'en-US',
        vendor: 'fengming',
      },
      // TTS: Minimax; voice_id from character. url is required for WebSocket (Agora docs).
      tts: {
        model: 'speech-02-turbo',
        group_id: process.env.MINIMAX_GROUP_ID,
        key: process.env.MINIMAX_TTS_KEY,
        url: 'wss://api-uw.minimax.io/ws/v1/t2a_v2',
      },
      // Optional overrides for join body: full joinBody
    },
  },
  sms: {
    account: process.env.SMS_ACCOUNT || 'sms-account',
    password: process.env.SMS_PASSWORD,
    apiUrl: process.env.SMS_API_URL || 'https://sms.example.com/api/send',
    sid: process.env.SMS_SID || 'sms-provider'
  }
};
