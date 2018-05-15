var socket = io();

/**
MENU SCREEN
**/

var host = document.getElementById('host');

host.onclick = function() {
	var name = document.getElementById('name');
	if (name.value === "") {
		alert('Please Enter a Name');
	} else {
		socket.emit('host', name.value);
	}
};

var join = document.getElementById('join');

join.onclick = function() {
	var name = document.getElementById('name');
	var gameId = document.getElementById('gameId');
	if (name.value === "") {
		alert('Please Enter a Name');
	} else if (gameId.value === "") {
		alert('Please Enter a Game ID');
	} else {
		socket.emit('join', {'gameId': gameId.value, 'name': name.value});
	}
}

socket.on('menuResponse', function(data) {
	var menuDiv = document.getElementById('menuDiv');
	var lobbyDiv = document.getElementById('lobbyDiv');
	menuDiv.style.display = 'none';
	lobbyDiv.style.display = 'inline-block';

	var game = data.game;
	document.getElementById('title').innerHTML = 'Lobby Game ID: ' + game.gameId;

	var players = document.getElementById('players');
	for (var i in game.players) {
		var player = game.players[i];
		players.innerHTML = players.innerHTML + '<li>' + player.name + '</li>';
	}

	if (data.host) {
		lobbyDiv.innerHTML = lobbyDiv.innerHTML + '<button id="start">Start Game</button>';

		var start = document.getElementById('start');
		start.onclick = function() {
			socket.emit('start', game.gameId);
		};
	}
});

socket.on('badMenuResponse', function() {
	alert('Game ID does not exist');
});

/**
LOBBY SCREEN
**/

socket.on('lobbyUpdate', function(data) {
	var game = data.game;

	var players = document.getElementById('players');
	players.innerHTML = "";
	for (var i in game.players) {
		var player = game.players[i];
		players.innerHTML = players.innerHTML + '<li>' + player.name + '</li>';
	}
});

socket.on('startResponse', function(data) {
	var lobbyDiv = document.getElementById('lobbyDiv');
	var gameDiv = document.getElementById('gameDiv');
	lobbyDiv.style.display = 'none';
	gameDiv.style.display = 'inline-block';
	var board = document.getElementById('board').getContext('2d');
	board.beginPath();
	board.moveTo(0, 304);
	board.lineTo(1170, 304);
	board.stroke();
});

socket.on('tooFewPlayers', function() {
	alert('Not Enough Players');
});

socket.on('tooManyPlayers', function() {
	alert('Too Many Players');
});

/**
GAME SCREEN
**/

socket.on('gameUpdate', function(data) {
	var game = data.game;
	var player = data.player;
	var board = document.getElementById('board').getContext('2d');
	var card = document.getElementById('card').getContext('2d');
	var suitC = document.getElementById('suit');
	var suit = suitC.getContext('2d');
	var roles = document.getElementById('roles').getContext('2d');

	var roleImage = new Image();
	roleImage.src = '/client/images/roles/original/' + player.role + '.png';
	roles.drawImage(roleImage, 0, 0, width(218), 218);

	var characterImage = new Image();
	characterImage.src = '/client/images/characters/original/' + player.character + '.png';
	roles.drawImage(characterImage, 0, 218, width(218), 218);

	for (var i = 0; i < player.hand.length; i++) {
		var actualCard = player.hand[i];
		var cardImage = new Image();
		cardImage.src = '/client/images/cards/original/' + actualCard.name + '.png';
		if (i < 12) {
			board.drawImage(cardImage, 97.5 * i, 0, 97.5, height(97.5));
		} else {
			board.drawImage(cardImage, 97.5 * (i - 12), height(97.5), 97.5, height(97.5));
		}
	}
});

var height = function(width) {
	return (389 / 250) * width;
}

var width = function(height) {
	return (250 / 389) * height;
}
var fullSuit = function(l) {
	if (l === 'C') {
		return 'clubs';
	} else if (l === 'D') {
		return 'diamonds';
	} else if (l === 'H') {
		return 'hearts';
	} else if (l === 'S') {
		return 'spades';
	} 
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

var drawCard = function(card, cardCanvas, suitC, suitCanvas) {
	var image = new Image();
	image.src = '/client/images/cards/original/' + card.name + '.png';
	cardCanvas.drawImage(image, 0, 0);

	suitCanvas.fillStyle = "white";
	suitCanvas.fillRect(0, 0, suitC.width, suitC.height);
	if (card.suit === 'D' || card.suit == 'H') {
		suitCanvas.fillStyle = "red";
	} else {
		suitCanvas.fillStyle = "black";
	}
	suitCanvas.font = '30px Arial';
	suitCanvas.fillText(special(card.number), 0, 35);

	var suitImage = new Image();
	suitImage.src = '/client/images/suits/' + fullSuit(card.suit) + '.png';
	suitCanvas.drawImage(suitImage, 32, 10);
}