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
	this.deck = [];
	this.allCards = cards;
	this.lobby = true;
}

var special = function(number) {
	if (number == 1) {
		return 'A';
	} else if (number == 11) {
		return 'J';
	} else if (number == 12) {
		return 'Q';
	} else if (number == 13) {
		return 'K';
	} else {
		return number;
	}
}

var cards = [];
fs.readFile(__dirname + '/cardData/original.txt', 'utf8', function(err, data) {
	if (err) {
		return console.log(err);
	}
	data = data.split('\r\n');
	for (var i = 0; i < data.length; i++) {
		line = data[i];
		items = line.split(' ');
		name = items[0].slice(0, -1);
		for (var j = 1; j < items.length; j++) {
			number = items[j].slice(0, -1);
			if (number.includes('-')) {
				bounds = number.split('-');
				start = parseInt(bounds[0]);
				end = parseInt(bounds[1]);
				for (var k = start; k <= end; k++) {
					suit = items[j].charAt(items[j].length - 1);
					cards.push(new Card(name, k, suit));
				}
			} else {
				suit = items[j].charAt(items[j].length - 1);
				number = parseInt(number);
				cards.push(new Card(name, number, suit));
			}
		}
	}
});

var getRandomInt = function(max) {
	return Math.floor(Math.random() * max);
} 

var SOCKET_LIST = {};
var GAME_LIST = {};

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
		game.allCards = cards;

		var hostPlayer = new Player(name, socket.id, true);
		game.players[socket.id] = hostPlayer;

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
			var newPlayer = new Player(name, socket.id, false);
			game.players[socket.id] = newPlayer;

			socket.gameId = gameId;
			socket.name = name;
			socket.emit('menuResponse', {'game': game, 'host': false});
		}
	});

	socket.on('start', function(data) {
		var game = GAME_LIST[data];
		game.lobby = false;
		var playerLength = Object.keys(game.players).length;
		if (playerLength < 4) {
			socket.emit('tooFewPlayers');
		} else if (playerLength > 7) {
			socket.emit('tooManyPlayers');
		} else {
			var roles = ['sheriff', 'renegade', 'outlaw', 'outlaw'];
			if (playerLength >= 5) {
				roles.push('vice');
			}
			if (playerLength >= 6) {
				roles.push('outlaw');
			}
			if (playerLength == 7) {
				roles.push('vice');
			}

			var characters = ['bart-cassidy', 'black-jack', 'calamity-janet', 'el-gringo'];
			for (var i in game.players) {
				var player = game.players[i];
				var roleIndex = getRandomInt(roles.length);
				var characterIndex = getRandomInt(characters.length);
				player.role = roles.splice(roleIndex, 1)[0];
				player.character = characters.splice(characterIndex, 1)[0];
				for (var j in SOCKET_LIST) {
					var soc = SOCKET_LIST[j];
					if (player.id === soc.id) {
						soc.emit('startResponse');
					}
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
