export default {
  pg: {
    database: 'errows'
  },
  broker: {
    logger: {
      type: 'Console',
      options: { level: 'error' }
    },
    hotReload: false,
    nodeID: 'errows_test',
    transporter: {
      type: 'TCP',
      options: { udpDiscovery: false, port: 0 },
    }
  },
  mailer: {
    mock: '314159'
  },
  api: {
    port: 0
  },
  assets: {
    uploadPath: '/tmp/errows_test_uploads',
  },
  ai: {
    image: {
      endpoint: 'http://1.1.1.1/image',
      baseUrl: "https://test.example.com/"
    },
    chat: {
      endpoint: 'http://1.1.1.1/chatbot'
    },
    video: {
      endpoint:     'http://1.1.1.1/video',
      video_state:  'http://1.1.1.1/video_state',
      baseUrl: "https://test.example.com/User_Generate/"
    },
    tts: {
      endpoint: 'http://1.1.1.1/voice',
      baseUrl: "https://test.example.com/"
    },
    voiceCall: {
      endpoint: 'http://1.1.1.1/voice/stream',
    }
  }
};