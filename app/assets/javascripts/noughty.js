var boardState;
var playerSide;
var computerSide;
var winState = null;
var isPlayerMove = false;
var debug = false;

const cCellX = "x";
const cCellO = "o";
const cCellEmpty = " ";

const cBitMasks = {
		" " : 0,
		"x" : 1,
		"o" : 2,
}

$(document).ready(function() {
	restart();
	$('.restart').click(restart);
	$(document).keypress(keyPressed);
});

function restart()
{
	boardState = newBoardState();
	winState = null;
	showMessage("");
	console.log("New Game ------------------------------");
	setupSides();
	update();
}

function keyPressed(event)
{
	if (event.charCode == "r".charCodeAt(0)) {
		restart();
	}
}

function setupSides()
{
	isPlayerMove = debug ? false : Math.random() < 0.5;
	playerSide = isPlayerMove ? cCellX : cCellO;
	computerSide = isPlayerMove ? cCellO : cCellX;
	
	$('.playerSide').html(playerSide);
	$('.computerSide').html(computerSide);
	
	if (!isPlayerMove) {
		computerFirstMove();
	}
}

function newBoardState()
{
	return [ [cCellEmpty, cCellEmpty, cCellEmpty], 
	         [cCellEmpty, cCellEmpty, cCellEmpty], 
	         [cCellEmpty, cCellEmpty, cCellEmpty]];
}

function update()
{
	winState = findWinner(boardState);
	if (winState) {
		showMessage(winState);
		isPlayerMove = false;
	}
	renderBoard($('.board'), boardState, isPlayerMove);
}

function renderBoard(board, state, interactive)
{
	board.empty();
	var pre = $("<pre>");
	for (var row=0; row<3; row++) {
		for (var col=0; col<3; col++) {
			var cellType = state[row][col];
			var cellContents = cellType;
			if (cellType == cCellEmpty) {
				cellContents = $('<a class="boardCell"> </a>');
				if (interactive) {
					cellContents.click({ row: row, column: col }, cellClicked);
				}
			}
			pre.append(cellContents);
			if (col < 2) {
				pre.append("|");
			}
		}
		if (row < 2) {
			pre.append("<br>-----<br>");
		}
	}
	board.append(pre);
}

function cellClicked(event)
{
	var x = event.data.row;
	var y = event.data.column;
	playerMove(x, y);
}

//-------------- Gameplay -------------------------------

function playerMove(x, y)
{
	console.log("Player: " + x + ", " + y);
	
	var hashBefore = hashBoardState(boardState);
	boardState[x][y] = playerSide;
	isPlayerMove = false;
	
	update();

	computerMove(hashBefore);	
}

function computerMove(hashBefore)
{	
	var hashAfter = hashBoardState(boardState);
	console.log("Hash: " + hashBoardState(boardState));

	$.ajax({
		type: "POST",
		url: "move",
		data: {
			from_state: hashBefore.hash,
			to_state: hashAfter.hash,
			transform: hashAfter.transform
		}
	}).done(function(response) {
		console.log(response);
		if (winState == null) {
			if (response.to_state >= 0) {
				boardState = stateAfterMoveWithHash(response.to_state, boardState);
				isPlayerMove = true;
				showMessage("Noughty understands");
				update();
			}
			else {
				showMessage("Noughty guessed");
				computerRandomMove();
			}
		}
	});
}

function computerFirstMove()
{
	var hashBefore = hashBoardState(boardState);
	$.ajax({
		type: "GET",
		url: "move",
		data: {
			from_state: hashBefore.hash,
			transform: randomTransformId()
		}
	}).done(function(response) {
		console.log(response);
		if (response.to_state >= 0) {
			boardState = stateAfterMoveWithHash(response.to_state, boardState);
			isPlayerMove = true;
			update();
		}
		else {
			computerRandomMove();
		}
	});	
}

function computerRandomMove()
{
	console.log("Random move");
	while (true)
	{
		var x = Math.floor(Math.random() * 3);
		var y = Math.floor(Math.random() * 3);
		if (boardState[y][x] == cCellEmpty) {
			boardState[y][x] = computerSide;
			break;
		}
	}
	isPlayerMove = true;
	update();
}

//-------------- Win condition -------------------------------

function findWinner(state)
{
	const cWinLines = [
	                   // Horizontals
	                   { start: 0, step: 1 },
	                   { start: 3, step: 1 },
	                   { start: 6, step: 1 },
	                   // Verticals
	                   { start: 0, step: 3 },
	                   { start: 1, step: 3 },
	                   { start: 2, step: 3 },
	                   // Diagonals
	                   { start: 0, step: 4 },
	                   { start: 2, step: 2 }
	                   ];
	
	var winner = null;
	for (var winLineIndex in cWinLines) {
		winner = findWinnerOnLine(cWinLines[winLineIndex], state);
		if (winner != null) {
			break;
		}
	}
	if ((winner == null) && boardIsFull(state)) {
		winner = "Drawn game";
	}
	return winner;
}

function findWinnerOnLine(line, state)
{
	if (lineMatches(line, playerSide, state)) {
		return "Player wins!";
	}
	else if (lineMatches(line, computerSide, state)) {
		return "Noughty wins!"
	}
	return null;
}

function lineMatches(line, cellContent, state) 
{
	var result = true;
	for (var i=0; i < 3; i++) {
		var cellIndex = line.start + (line.step * i);
		result &= (state[Math.floor(cellIndex / 3)][cellIndex % 3] == cellContent);
	}
	return result;
}

function boardIsFull(state)
{
	var isFull = true;
	for (var y=0; y<3; y++) {
		for (var x=0; x<3; x++) {
			isFull &= (state[y][x] != cCellEmpty); 
		}
	}
	return isFull;
}

//-------------- Hashing -------------------------------

function hashBoardState(state)
{
	var result = {
			hash: 0x0fffffff,
			transform: -1
	};
	
	for (var transformIndex in cTransforms) {
		var hashCandidate = hashBoardStateWithTransform(state, cTransforms[transformIndex]);
		if (hashCandidate < result.hash) {
			result.hash = hashCandidate;
			result.transform = transformIndex;
		}
	}
	
	return result;
}

function hashBoardStateWithTransform(state, transform)
{
	var hash = 0;
	var point = { x: 0, y: 0 };
	
	for (point.y = 0; point.y < 3; point.y++) {
		for (point.x = 0; point.x < 3; point.x++) {
			var pointTransformed = transformPoint(point, transform);
			var cellValue = state[pointTransformed.y][pointTransformed.x];
			var bitMask = cBitMasks[cellValue] << bitMaskPositionForCell(point.x, point.y);
			hash |= bitMask;
		}
	}
	
	return hash;
}

function stateAfterMoveWithHash(hash, previousState)
{
	var nextState = null;
	
	for (var transformId in cTransforms) {
		var candidateState = boardStateFromHash(hash, cTransforms[transformId]);
		if (isSuccessorState(previousState, candidateState)) {
			nextState = candidateState;
			break;
		}
	}
	
	return nextState;
}

function boardStateFromHash(hash, transform)
{
	var point = { x: 0, y: 0 };

	var state = newBoardState();
	for (point.y = 0; point.y < 3; point.y++) {
		for (point.x = 0; point.x < 3; point.x++) {
			var maskPosition = bitMaskPositionForCell(point.x, point.y)
			bitMask = (hash & (0x3 << maskPosition)) >> maskPosition;
			var pointTransformed = transformPoint(point, transform);
			state[pointTransformed.y][pointTransformed.x] = cellForBitMask(bitMask);
		}
	}
	return state;
}

function isSuccessorState(firstState, secondState)
{
	var movesFound = 0;
	var result = true;

	for (var y = 0; y < 3; y++) {
		for (var x = 0; x < 3; x++) {
			if (firstState[y][x] != secondState[y][x]) {
				if (firstState[y][x] == cCellEmpty) {
					movesFound++;
				}
				else {
					result = false;
					break;
				}
			}
		}
	}
	
	result &= (movesFound == 1);
	return result;
}

function bitMaskPositionForCell(x, y)
{
	return ((3 * y) + x) * 2;
}

function cellForBitMask(mask)
{
	for (var cell in cBitMasks) {
		if (cBitMasks[cell] == mask) {
			return cell;
		}
	}
	return cCellEmpty;
}

//-------------- Transforms -------------------------------

function transformPoint(point, transform)
{
	return {
		x : (point.x * transform[0][0]) + (point.y * transform[0][1]) + transform[0][2],
		y : (point.x * transform[1][0]) + (point.y * transform[1][1]) + transform[1][2]
	};
}

function randomTransformId()
{
	if (debug) {
		return 'rotate270';
	}
	var randomIndex = Math.floor(Math.random() * 8);
	console.log("randomIndex: " + randomIndex);
	var transformIndex = 0;
	for (var transformId in cTransforms) {
		if (transformIndex == randomIndex) {
			return transformId;
		}
		transformIndex++;
	}
}

const cTransforms = {
                     identity:	[	[ 1,  0,  0 ],
                              	 	[ 0,  1,  0 ] ],
                     	
                     rotate90:	[	[ 0, -1,  2 ],
                              	 	[ 1,  0,  0 ] ],
                     	
                     rotate180:	[	[ -1, 0,  2 ],
                               	 	[ 0, -1,  2 ] ],
                     	
                     rotate270:	[	[ 0,  1,  0 ],
                               	 	[ -1, 0,  2 ] ],
                     	
                     flipX:		[	[-1,  0,  2 ],
                           		 	[ 0,  1,  0 ] ],
                     	
                     flipY:		[	[ 1,  0,  0 ],
                           		 	[ 0, -1,  2 ] ],
                     	
                     diagonal1:	[	[ 0,  1,  0 ],
                               	 	[ 1,  0,  0 ] ],
                     	
                     diagonal2:	[	[ 0, -1,  2 ],
                               	 	[-1,  0,  2 ] ],
};

function showMessage(message)
{
	message = message || "&nbsp;";
	$(".message").html(message);
}
