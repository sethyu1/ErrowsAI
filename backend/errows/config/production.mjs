const host = process.env.HOST_ORIGIN || 'https://example.com';

// Secrets are NOT stored here. Provide them via environment variables or a
// git-ignored `local-production.mjs` next to this file (merged automatically
// by the `config` package).
export default {
	pg: {
		database: 'errows',
		password: process.env.PG_PASSWORD
	},
	host: {
		origin: host,
	},
	jwt: {
		secret: process.env.JWT_SECRET
	},
	mailer: {
		smtp: {
			auth: {
				pass: process.env.SMTP_PASSWORD
			}
		}
	},
	assets: {
		uploadPath: '/mnt/data/assets',
		baseUrl: `${host}/cdn/`,
	},
	ai: {
		apiKey: process.env.AI_API_KEY
	},
	stripe: {
		apiKey: process.env.STRIPE_API_KEY,
		webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
		successUrl: `${host}/stripe/success?session_id={CHECKOUT_SESSION_ID}`
	}
}
