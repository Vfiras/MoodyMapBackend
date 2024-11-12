export default () => ({
  jwt: {
    secret: process.env.JWT_SECRET,
  },
  database: {
    connectionString: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/projet-pdm',
  },
});
