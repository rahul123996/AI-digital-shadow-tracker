const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');

const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.send('AI Digital Shadow Tracker API is running 🚀');
});

const server = app.listen(PORT, () => {
  console.log(`
    🚀 AI Shadow Tracker backend ready at http://localhost:${PORT}
    🟢 Environment: ${process.env.NODE_ENV || 'development'}
  `);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received: closing HTTP server');
  server.close(() => console.log('HTTP server closed'));
});
