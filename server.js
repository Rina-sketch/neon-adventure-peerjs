const express = require('express');
const { ExpressPeerServer } = require('peer');
const http = require('http');

const app = express();
const port = process.env.PORT || 9000;

const server = http.createServer(app);

const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/myapp'
});

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  res.send('PeerJS сервер для Неоновой Бродилки запущен!');
});

server.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});