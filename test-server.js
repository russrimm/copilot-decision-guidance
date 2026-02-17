import express from 'express';

const app = express();
const PORT = 3001;

console.log('=== Starting test server ===');

app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

app.listen(PORT, () => {
  console.log(`✅ Test server listening on port ${PORT}`);
  console.log(`   Visit: http://localhost:${PORT}/test`);
}).on('error', (err) => {
  console.error('❌ Server error:', err);
});
