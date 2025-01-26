export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  database: {
    connectionString: process.env.MONGO_URL,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  email: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },
  model: {
    model: process.env.PYTHON_MODEL_URL,
  },
});