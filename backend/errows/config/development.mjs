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