// 必要なパッケージ: express, cors, body-parser, fs
// インストール: npm install express cors body-parser

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// 単語データ（例文カード）
const path = require('path');
const WORDS_FILE = path.join(__dirname, '単語例文.json');
// 暗記度データ
const STATUS_FILE = path.join(__dirname, 'status.json');

// 単語データ取得
app.get('/api/words', (req, res) => {
  fs.readFile(WORDS_FILE, 'utf8', (err, data) => {
    if (err) return res.status(500).json({ error: 'words file not found' });
    res.json(JSON.parse(data));
  });
});

// 暗記度データ取得
app.get('/api/status', (req, res) => {
  fs.readFile(STATUS_FILE, 'utf8', (err, data) => {
    if (err) return res.json({}); // ファイルがなければ空オブジェクト
    res.json(JSON.parse(data));
  });
});

// 暗記度データ保存
app.post('/api/status', (req, res) => {
  fs.writeFile(STATUS_FILE, JSON.stringify(req.body), (err) => {
    if (err) return res.status(500).json({ error: 'failed to save' });
    res.json({ ok: true });
  });
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
