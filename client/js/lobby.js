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
	var suit = document.getElementById('suit').getContext('2d');

	var roleImage = new Image(20, 20);
	roleImage.src = '/client/images/roles/original/' + player.role + '.png';
	board.drawImage(roleImage, 0, 0);

	var characterImage = new Image(50, 50);
	characterImage.src = '/client/images/characters/original/' + player.character + '.png';
	board.drawImage(characterImage, 400, 0);

	var image = new Image();
	image.src = '/client/images/cards/original/bang.png';
	card.drawImage(image, 0, 0);

	suit.fillStyle = "blue";
	suit.fill();
	suit.fillText("10", 35, 20);
});