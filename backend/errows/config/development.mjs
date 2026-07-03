import path from "node:path";

const __dirname = new URL('.', import.meta.url).pathname;
export default {
  pg: {
    database: 'errows_dev',
  },
  broker: {
    hotReload: true,
  },
  mailer: {
    sender: {
      from: 'hello@errows.ai',
    },
    smtp: {
      host: 'smtp.mailgun.org',
      port: 587,
      secure: false,
      auth: {
        user: 'hello@errows.ai',
        pass: process.env.SMTP_PASSWORD
      }
    }
  },
  assets: {
    uploadPath: path.resolve(__dirname, '..', 'data'),
  },
  ai: {
    // image: {
    //   endpoint: 'http://1.1.1.1',
    // },
    // video: {
    //   endpoint: 'http://1.1.1.1',
    // }
  },
  notion: {
    apiKey: process.env.NOTION_API_KEY,
    databaseId: process.env.NOTION_DATABASE_ID
  }
};