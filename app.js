var express = require('express');
var fs = require('fs');
var path = require('path');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 3000);
console.log('Server started.');

function Card(name, number, suit) {
	this.name = name;
	this.number = number;
	this.suit = suit;
};

function Player(name, id, host) {
	this.name = name;
	this.id = id;
	this.host = host;
	this.hand = [];
	this.items = [];
}

function Game(gameId, cards) {
	this.gameId = gameId;
	this.players = {};
	this.playerOrder = [];
	this.deck = [];
	this.lobby = true;
}

var cards = [];
fs.readFile(__dirname + '/cardData/suits/original.txt', 'utf8', function(err, data) {
	if (err) {
		return console.log(err);
	}
	data = data.split('\r\n');
	for (var i = 0; i < data.length; i++) {
		var line = data[i];
		var items = line.split(' ');
		var name = items[0].slice(0, -1);
		for (var j = 1; j < items.length; j++) {
			var number = items[j].slice(0, -1);
			if (number.includes('-')) {
				var bounds = number.split('-');
				var start = parseInt(bounds[0]);
				var end = parseInt(bounds[1]);
				for (var k = start; k <= end; k++) {
					var suit = items[j].charAt(items[j].length - 1);
					cards.push(new Card(name, k, suit));
				}
			} else {
				var suit = items[j].charAt(items[j].length - 1);
				number = parseInt(number);
				cards.push(new Card(name, number, suit));
			}
		}
	}
});

var characters = fs.readdirSync(__dirname + '/client/images/characters/original/');
for (var i in characters) {
	characters[i]= characters[i].slice(0, -4);
}

var lives = {};
fs.readFile(__dirname + '/cardData/lives/original.txt', 'utf8', function(err, data) {
	if (err) {
		return console.log(err);
	}
	data = data.split('\r\n');
	for (var i = 0; i < data.length; i++) {
		var line = data[i];
		var items = line.split(' ');
		var name = items[0];
		var num = items[1];
		lives[name] = num;
	}

	for (var c of characters) {
		if (!(c in lives)) {
			lives[c] = 4;
		}
	}
});

var getRandomInt = function(max) {
	return Math.floor(Math.random() * max);
} 

var shuffle = function(a) {
    var j, x, i;
    for (i = a.length - 1; i > 0; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = a[i];
        a[i] = a[j];
        a[j] = x;
    }
    return a;
}

var SOCKET_LIST = {};
var GAME_LIST = {};
var SOCKET_TO_GAME = {};

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	socket.on('host', function(data) {
		var gameId = getRandomInt(9000) + 1000;
		var name = data;
		while (gameId in GAME_LIST) {
			gameId = getRandomInt(9000) + 1000;
		}

		var game = new Game(gameId);
		GAME_LIST[gameId] = game;
		SOCKET_TO_GAME[socket.id] = game;
		game.allCards = cards;

		var hostPlayer = new Player(name, socket.id, true);
		game.players[socket.id] = hostPlayer;
		game.playerOrder.push(socket.id);

		socket.gameId = gameId;
		socket.name = name;
		socket.emit('menuResponse', {'game': game, 'host': true});
	});

	socket.on('join', function(data) {
		var gameId = data.gameId;
		var name = data.name;
		if (!(gameId in GAME_LIST)) {
			socket.emit('badMenuResponse');
		} else {
			var game = GAME_LIST[gameId];
			SOCKET_TO_GAME[socket.id] = game;
			var newPlayer = new Player(name, socket.id, false);
			game.players[socket.id] = newPlayer;
			game.playerOrder.push(socket.id);

			socket.gameId = gameId;
			socket.name = name;
			socket.emit('menuResponse', {'game': game, 'host': false});
		}
	});

	socket.on('start', function(data) {
		var game = GAME_LIST[data];
		game.lobby = false;
		game.allCards = cards;
		game.deck = shuffle(game.allCards);
		var playerLength = Object.keys(game.players).length;
		if (playerLength < 4) {
			socket.emit('tooFewPlayers');
		} else if (playerLength > 7) {
			socket.emit('tooManyPlayers');
		} else {
			var roles = ['sheriff', 'renegade', 'outlaw', 'outlaw'];
			var allCharacters = characters.slice();
			if (playerLength >= 5) {
				roles.push('vice');
			}
			if (playerLength >= 6) {
				roles.push('outlaw');
			}
			if (playerLength == 7) {
				roles.push('vice');
			}

			for (var i in game.players) {
				var player = game.players[i];
				var roleIndex = getRandomInt(roles.length);
				var characterIndex = getRandomInt(allCharacters.length);
				player.role = roles.splice(roleIndex, 1)[0];
				player.character = allCharacters.splice(characterIndex, 1)[0];
				player.lives = lives[player.character];
				if (player.role == 'sheriff') {
					player.lives++;
				}
				for (var k = 0; k < player.lives; k++) {
					player.hand.push(game.deck.pop());
				}
				for (var j in SOCKET_LIST) {
					var soc = SOCKET_LIST[j];
					if (player.id === soc.id) {
						soc.emit('startResponse');
					}
				}
			}
		}
	});

	socket.on('clickCard', function(data) {
		var x = data[0];
		var y = data[1];
		var game = SOCKET_TO_GAME[socket.id];
		if (game !== undefined) {
			var player = game.players[socket.id];
		
			if (0 <= y && y < height(97.5) * 2) {
				var index = Math.floor(x / 97.5);
				if (y >= height(97.5)) {
					index += 12;
				}
				if (index < player.hand.length) {
					socket.emit('clickCardResponse', player.hand[index]);
				}
			}
		}
	});

	socket.on('clickRole', function(data) {
		var x = data[0];
		var y = data[1];
		var covered = data[2];
		var game = SOCKET_TO_GAME[socket.id];
		if (game !== undefined) {
			var player = game.players[socket.id];
		
			if (0 <= x && x < width(218)) {
				var index = Math.floor(y / 218);
				if (index === 0 && !covered) {
					socket.emit('clickRoleResponse', '/client/images/roles/original/' + player.role + '.png');
				} else {
					socket.emit('clickRoleResponse', '/client/images/characters/original/' + player.character + '.png');
				}
			}
		}
	});

	socket.on('disconnect', function() {
		var game = GAME_LIST[SOCKET_LIST[socket.id].gameId];
		if (game !== undefined) {
			delete SOCKET_LIST[socket.id];
			if (game.lobby) {
				delete game.players[socket.id];
			}
		}
	});
});

var height = function(width) {
	return (389 / 250) * width;
}

var width = function(height) {
	return (250 / 389) * height;
}

setInterval(function() {
	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		if (socket.gameId) {
			var game = GAME_LIST[socket.gameId];
			var player = game.players[socket.id];
			if (game.lobby) {
				socket.emit('lobbyUpdate', {'game': game, 'host': player.host});
			} else {
				socket.emit('gameUpdate', {'game': game, 'player': player});
			}
		}
	}
}, 1000/25);
