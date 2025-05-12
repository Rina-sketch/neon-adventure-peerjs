let socket = null;
let roomId = null;
let isClientReady = false;

// Initialize Socket.IO for cooperative mode
function initPeer(host) {
  isHost = host;

  // Закрываем старое соединение, если оно существует
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io('https://neon-adventure-peerjs.onrender.com', { // Замените на ваш домен
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('Socket.IO подключено (хост):', socket.id);
    if (isHost) {
      roomId = socket.id; // Используем socket.id как ID комнаты
      peerIdSpan.textContent = roomId;
      peerIdDisplay.style.display = 'block';
      showDialog(["Поделитесь этим ID с другом для совместной игры: " + roomId]);
    }
  });

  socket.on('playerJoined', (playerId) => {
    if (isHost) {
      console.log('Клиент подключился к хосту:', playerId);
      if (playerId === socket.id) {
        console.warn('Хост пытается подключиться сам к себе, игнорируем');
        return; // Игнорируем, если хост сам себя подключил
      }
      isCoopMode = true;
      player2 = {
        x: levels[currentLevel].startPos2.x,
        y: levels[currentLevel].startPos2.y,
        width: 30,
        height: 30,
        speed: 5,
        direction: 'right',
        keys: 0,
        lives: 3,
        hasSword: false,
        invincible: false,
        invincibleTimer: 0,
        color: '#f00',
        hasPotion: false,
        damageMultiplier: 1,
        catEars: false,
        earAngle: 0,
        tailAngle: 0,
        isMoving: false,
        id: 'player2',
        keysPressed: {}
      };
      // Отправляем хосту подтверждение, что он готов
      socket.emit('hostReady', roomId);
    }
  });

  socket.on('clientReady', (clientData) => {
    if (isHost) {
      console.log('Клиент готов, данные получены:', clientData);
      Object.assign(player2, clientData);
      titleScreen.style.display = 'none';
      menuBgm.pause();
      loadLevel(1);
      socket.emit('gameData', roomId, {
        type: 'startGame',
        level: currentLevel,
        state: {
          player: {...player},
          player2: {...player2},
          walls, keys, doors, npcs, enemies, chests, campfires, flowers, boss, gameObjects
        }
      });
      console.log('Игра началась для хоста и клиента');
      gameLoop();
    }
  });

  socket.on('gameData', handlePeerData);

  socket.on('connect_error', (err) => {
    console.error('Socket.IO ошибка (хост):', err);
    showDialog(["Ошибка соединения. Попробуйте снова."]);
  });
}

// Join cooperative game
function joinCoop(peerId) {
  roomId = peerId;

  // Закрываем старое соединение, если оно существует
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  socket = io('https://neon-adventure-peerjs.onrender.com', { // Замените на ваш домен
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5
  });

  socket.on('connect', () => {
    console.log('Socket.IO подключено (клиент):', socket.id);
    console.log('Клиент пытается присоединиться к комнате:', roomId);
    socket.emit('join', roomId);
    isClientReady = false;
  });

  socket.on('hostReady', () => {
    console.log('Хост готов, клиент отправляет своё состояние');
    isClientReady = true;
    const clientState = {
      x: levels[currentLevel].startPos2.x,
      y: levels[currentLevel].startPos2.y,
      width: 30,
      height: 30,
      speed: 5,
      direction: 'right',
      keys: 0,
      lives: 3,
      hasSword: false,
      invincible: false,
      invincibleTimer: 0,
      color: '#f00',
      hasPotion: false,
      damageMultiplier: 1,
      catEars: false,
      earAngle: 0,
      tailAngle: 0,
      isMoving: false,
      id: 'player2',
      keysPressed: {}
    };
    socket.emit('clientReady', clientState);
  });

  socket.on('gameData', (data) => {
    console.log('Клиент получил данные:', data);
    if (data.type === 'startGame' && !isClientReady) {
      isCoopMode = true;
      currentLevel = data.level;
      Object.assign(player, data.state.player2); // Клиент становится player2
      player2 = {...data.state.player}; // Хост становится player1
      player.id = 'player2';
      player.color = '#f00';
      player2.id = 'player1';
      player2.color = '#00f';
      walls = data.state.walls;
      keys = data.state.keys;
      doors = data.state.doors;
      npcs = data.state.npcs;
      enemies = data.state.enemies;
      chests = data.state.chests;
      campfires = data.state.campfires;
      flowers = data.state.flowers;
      boss = data.state.boss;
      gameObjects = data.state.gameObjects;
      levelDisplay.textContent = currentLevel;
      objectiveDisplay.textContent = levels[currentLevel].objective;
      keysDisplay.textContent = player.keys + (player2 ? player2.keys : 0);
      livesDisplay.textContent = player.lives;
      titleScreen.style.display = 'none';
      menuBgm.pause();
      gameLoop();
    } else {
      handlePeerData(data);
    }
  });

  socket.on('connect_error', (err) => {
    console.error('Socket.IO ошибка (клиент):', err);
    showDialog(["Не удалось подключиться. Проверьте ID."]);
  });
}