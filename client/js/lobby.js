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
	board.moveTo(0, 305);
	board.lineTo(1170, 305);
	board.stroke();

	/* TO SEE LINE PLACEMENT
	board.beginPath();
	board.moveTo(0, 305 + 530/4);
	board.lineTo(1170, 305 + 530/4);
	board.stroke();

	board.beginPath();
	board.moveTo(0, 305 + (530/4)*2);
	board.lineTo(1170, 305 + (530/4)*2);
	board.stroke();

	board.beginPath();
	board.moveTo(0, 305 + (530/4)*3);
	board.lineTo(1170, 305 + (530/4)*3);
	board.stroke(); */
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

var covered = false;

socket.on('gameUpdate', function(data) {
	var game = data.game;
	var player = data.player;
	var board = document.getElementById('board').getContext('2d');
	var card = document.getElementById('card').getContext('2d');
	var suitC = document.getElementById('suit');
	var suit = suitC.getContext('2d');
	var roles = document.getElementById('roles').getContext('2d');
	var numPlayers = Object.keys(game.players).length

	var roleImage = new Image();
	if (covered) {
		roleImage.src = '/client/images/roles/back.png';
	} else {
		roleImage.src = '/client/images/roles/original/' + player.role + '.png';
	}
	roleImage.onload = function() {
		roles.drawImage(roleImage, 0, 0, width(218), 218);
	}

	var characterImage = new Image();
	characterImage.src = '/client/images/characters/original/' + player.character + '.png';
	characterImage.onload = function() {
		roles.drawImage(characterImage, 0, 218, width(218), 218);
	}

	/*for (var i = 0; i < player.hand.length; i++) {
		var actualCard = player.hand[i];
		var cardImage = new Image();
		cardImage.src = '/client/images/cards/original/' + actualCard.name + '.png';
		if (i < 12) {
			cardImage.onload = function() {
				board.drawImage(cardImage, 97.5 * i, 0, 97.5, height(97.5));
			}
		} else {
			cardImage.onload = function() {
				board.drawImage(cardImage, 97.5 * (i - 12), height(97.5), 97.5, height(97.5));
			}
		}
	}*/
	var urls = getURLS(player.hand);
	var images = loadImages(urls);
	for (var i = 0; i < images.length; i++) {
		var cardImage = images[i];
		if (i < 12) {
			board.drawImage(cardImage, 97.5 * i, 0, 97.5, height(97.5));
		} else {
			board.drawImage(cardImage, 97.5 * (i - 12), height(97.5), 97.5, height(97.5));
		}
	}

	if (numPlayers === 4) {
		drawPlayer(player, 1170 / 2, 305 + (520 / 3) * 2 + (530 / 3) / 4, width((520 / 3) / 2), (520 / 3) / 2);
		var index = game.playerOrder.indexOf(player.id);
		
		var player1 = game.players[game.playerOrder[(index + 1) % 4]];
		drawPlayer(player1, 1170 / 4, 305 + 520 / 3 + (520 / 3) / 4, width((520 / 3) / 2), (520 / 3) / 2);

		var player2 = game.players[game.playerOrder[(index + 2) % 4]];
		drawPlayer(player2, 1170 / 2, 305 + (520 / 3) / 4, width((520 / 3) / 2), (520 / 3) / 2);

		var player3 = game.players[game.playerOrder[(index + 3) % 4]];
		drawPlayer(player3, (1170 / 4) * 3, 305 + 520 / 3 + (520 / 3) / 4, width((520 / 3) / 2), (520 / 3) / 2);
	} else if (numPlayers === 5) {
		drawPlayer(player, 1170 / 2, 305 + (520 / 3) * 2 + (530 / 3) / 4, width((520 / 3) / 2), (520 / 3) / 2);
		var index = game.playerOrder.indexOf(player.id);
		
		var player1 = game.players[game.playerOrder[(index + 1) % 5]];
		drawPlayer(player1, 1170 / 4, 305 + 520 / 3 + (520 / 3) / 4, width((520 / 3) / 2), (520 / 3) / 2);

		var player2 = game.players[game.playerOrder[(index + 2) % 5]];
		drawPlayer(player2, (1170 / 8) * 3, 305 + (520 / 3) / 4, width((520 / 3) / 2), (520 / 3) / 2);

		var player3 = game.players[game.playerOrder[(index + 3) % 5]];
		drawPlayer(player3, (1170 / 8) * 5, 305 + (520 / 3) / 4, width((520 / 3) / 2), (520 / 3) / 2);

		var player4 = game.players[game.playerOrder[(index + 4) % 5]];
		drawPlayer(player4, (1170 / 4) * 3, 305 + 520 / 3 + (520 / 3) / 4, width((520 / 3) / 2), (520 / 3) / 2);
	} else if (numPlayers === 6) {
		drawPlayer(player, 1170 / 2, 305 + (520 / 4) * 3 + (530 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);
		var index = game.playerOrder.indexOf(player.id);
		
		var player1 = game.players[game.playerOrder[(index + 1) % 6]];
		drawPlayer(player1, 1170 / 4, 305 + (520 / 4) * 2 + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);

		var player2 = game.players[game.playerOrder[(index + 2) % 6]];
		drawPlayer(player2, 1170 / 4, 305 + (520 / 4) + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);

		var player3 = game.players[game.playerOrder[(index + 3) % 6]];
		drawPlayer(player3, (1170 / 8) * 3, 305 + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);

		var player4 = game.players[game.playerOrder[(index + 4) % 6]];
		drawPlayer(player4, (1170 / 8) * 5, 305 + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);

		var player5 = game.players[game.playerOrder[(index + 5) % 6]];
		drawPlayer(player5, (1170 / 4) * 3, 305 + 520 / 4 + (520 / 4) * (3 / 4), width((520 / 4) / 2), (520 / 4) / 2);
	} else if (numPlayers === 7) {
		drawPlayer(player, 1170 / 2, 305 + (520 / 4) * 3 + (530 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);
		var index = game.playerOrder.indexOf(player.id);
		
		var player1 = game.players[game.playerOrder[(index + 1) % 7]];
		drawPlayer(player1, 1170 / 4, 305 + (520 / 4) * 2 + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);

		var player2 = game.players[game.playerOrder[(index + 2) % 7]];
		drawPlayer(player2, 1170 / 4, 305 + (520 / 4) + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);

		var player3 = game.players[game.playerOrder[(index + 3) % 7]];
		drawPlayer(player3, (1170 / 8) * 3, 305 + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);

		var player4 = game.players[game.playerOrder[(index + 4) % 7]];
		drawPlayer(player4, (1170 / 8) * 5, 305 + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);

		var player5 = game.players[game.playerOrder[(index + 5) % 7]];
		drawPlayer(player5, (1170 / 4) * 3, 305 + (520 / 4) + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);

		var player6 = game.players[game.playerOrder[(index + 6) % 7]];
		drawPlayer(player1, (1170 / 4) * 3, 305 + (520 / 4) * 2 + (520 / 4) / 4, width((520 / 4) / 2), (520 / 4) / 2);
	}
});

var loadcount = 0;
var loadtotal = 0;
var preloaded = false;
 
// Load images
function loadImages(imagefiles) {
    // Initialize variables
    loadcount = 0;
    loadtotal = imagefiles.length;
    preloaded = false;
 
    // Load the images
    var loadedimages = [];
    for (var i=0; i<imagefiles.length; i++) {
        // Create the image object
        var image = new Image();
 
        // Add onload event handler
        image.onload = function () {
            loadcount++;
            if (loadcount == loadtotal) {
                // Done loading
                preloaded = true;
            }
        };
 
        // Set the source url of the image
        image.src = imagefiles[i];
 
        // Save to the image array
        loadedimages[i] = image;
    }
 
    // Return an array of images
    return loadedimages;
}

var getURLS = function(cards) {
	var urls = [];
	for (var i = 0; i < cards.length; i++) {
		urls.push('/client/images/cards/original/' + cards[i].name + '.png')
	}
	return urls;
}

var drawPlayer = function(player, x, y, width, height) {
	var board = document.getElementById('board').getContext('2d');
	var boardRoleImage = new Image();
	if (player.role === 'sheriff') {
		boardRoleImage.src = '/client/images/roles/original/sheriff.png';	
	} else {
		boardRoleImage.src = '/client/images/roles/back.png';
	}
	boardRoleImage.onload = function() {
		board.drawImage(boardRoleImage, x - width, y, width, height);	
	}

	var boardCharacterImage = new Image();
	boardCharacterImage.src = '/client/images/characters/original/' + player.character + '.png';
	boardCharacterImage.onload = function() {
		board.drawImage(boardCharacterImage, x, y, width, height);
	}
}

var floorMod = function(num, div) {
	return ((num % div) + div) % div;
}

document.getElementById('board').addEventListener('click', function(event) {
	var rect = event.target.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;

	socket.emit('clickCard', [x, y]);
});

document.getElementById('roles').addEventListener('click', function(event) {
	var rect = event.target.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;

	socket.emit('clickRole', [x, y, covered]);
});

document.getElementById('roles').addEventListener('dblclick', function(event) {
	var rect = event.target.getBoundingClientRect();
	var x = event.clientX - rect.left;
	var y = event.clientY - rect.top;

	if (0 <= x && x < width(218) && 0 <= y && y < 218) {
		covered = !covered;
	}
})

socket.on('clickCardResponse', function(data) {
	var card = document.getElementById('card').getContext('2d');
	var suitC = document.getElementById('suit');
	var suit = suitC.getContext('2d');
	drawCard(data, card, suitC, suit);
	console.log('drawnn');
	console.log(data);
});

socket.on('clickRoleResponse', function(data) {
	var suitC = document.getElementById('suit');
	var suit = suitC.getContext('2d');
	var card = document.getElementById('card').getContext('2d');
	var image = new Image();
	suit.clearRect(0, 0, suitC.width, suitC.height);
	image.src = data;
	image.onload = function() {
		card.drawImage(image, 0, 0);
	}
});

var height = function(width) {
	return (389 / 250) * width;
};

var width = function(height) {
	return (250 / 389) * height;
};

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
	image.onload = function() {
		cardCanvas.drawImage(image, 0, 0);
	}
	console.log(image.src);
	console.log('actuallylla drawnnn');
	suitCanvas.fillStyle = "white";
	suitCanvas.fillRect(0, 0, suitC.width, suitC.height);
	if (card.suit === 'D' || card.suit == 'H') {
		suitCanvas.fillStyle = "red";
	} else {
		suitCanvas.fillStyle = "black";
	}
	suitCanvas.font = '30px Arial';
	suitCanvas.fillText(special(card.number), 0, 32);

	var suitImage = new Image();
	suitImage.src = '/client/images/suits/' + fullSuit(card.suit) + '.png';
	suitImage.onload = function() {
		suitCanvas.drawImage(suitImage, 32, 7);
	}
}