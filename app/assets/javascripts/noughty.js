var boardState;
var playerSide;
var computerSide;

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
});

function restart()
{
	boardState = newBoardState();
	setupSides();
	redraw();
}

function setupSides()
{
	var playerStarts = Math.random() < 0.5;
	playerSide = playerStarts ? cCellX : cCellO;
	computerSide = playerStarts ? cCellO : cCellX;
	
	$('.playerSide').html(playerSide);
	$('.computerSide').html(computerSide);
	
	if (!playerStarts) {
		computerFirstMove();
	}
}

function newBoardState()
{
	return [ [cCellEmpty, cCellEmpty, cCellEmpty], [cCellEmpty, cCellEmpty, cCellEmpty], [cCellEmpty, cCellEmpty, cCellEmpty]];
}

function redraw()
{
	renderBoard($('.board'), boardState);
}

function renderBoard(board, state)
{
	board.empty();
	var pre = $("<pre>");
	for (var row=0; row<3; row++) {
		for (var col=0; col<3; col++) {
			var cellType = state[row][col];
			var cellContents = cellType;
			if (cellType == cCellEmpty) {
				cellContents = $('<a> </a>').click({ row: row, column: col }, cellClicked);
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

function playerMove(x, y)
{
	console.log("Player: " + x + ", " + y);
	
	var hashBefore = hashBoardState(boardState);
	boardState[x][y] = playerSide;
	
	redraw();
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
			from_state: hashBefore,
			to_state: hashAfter
		}
	}).done(function(response) {
		console.log(response);
		if (response.to_state >= 0) {
			boardState = boardStateFromHash(response.to_state);
			redraw();
		}
		else {
			computerRandomMove();
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
			from_state: hashBefore
		}
	}).done(function(response) {
		console.log(response);
		if (response.to_state >= 0) {
			boardState = boardStateFromHash(response.to_state);
			redraw();
		}
	});	
}

function computerRandomMove()
{
	while (true)
	{
		var x = Math.floor(Math.random() * 3);
		var y = Math.floor(Math.random() * 3);
		if (boardState[y][x] == cCellEmpty) {
			boardState[y][x] = computerSide;
			break;
		}
	}
	redraw();
}


function hashBoardState(state)
{
	var hash = 0x0fffffff;
	for (var transformIndex in cTransforms) {
		hash = Math.min(hash, hashBoardStateWithTransform(state, cTransforms[transformIndex]));
	}
	return hash;
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

function boardStateFromHash(hash)
{
	var state = newBoardState();
	for (y = 0; y < 3; y++) {
		for (x = 0; x < 3; x++) {
			var maskPosition = bitMaskPositionForCell(x, y)
			bitMask = (hash & (0x3 << maskPosition)) >> maskPosition;
			state[y][x] = cellForBitMask(bitMask);
		}
	}
	return state;
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

function transformPoint(point, transform)
{
	return {
		x : (point.x * transform[0][0]) + (point.y * transform[0][1]) + transform[0][2],
		y : (point.x * transform[1][0]) + (point.y * transform[1][1]) + transform[1][2]
	};
}

const cTransforms = [
                     [	[ 1,  0,  0 ],		// Identity
                     	[ 0,  1,  0 ] ],
                     	
                     [	[ 0, -1,  2 ],		// Rotate 90
                     	[ 1,  0,  0 ] ],
                     	
                     [	[ -1, 0,  2 ],		// Rotate 180
                     	[ 0, -1,  2 ] ],
                     	
                     [	[ 0,  1,  0 ],		// Rotate 270
                     	[ -1, 0,  2 ] ],
                     	
                     [	[-1,  0,  2 ],		// Flip X
                     	[ 0,  1,  0 ] ],
                     	
                     [	[ 1,  0,  0 ],		// Flip Y
                     	[ 0, -1,  2 ] ],
                     	
                     [	[ 0,  1,  0 ],		// Mirror diagonal 1
                     	[ 1,  0,  0 ] ],
                     	
                     [	[ 0, -1,  2 ],		// Mirror diagonal 2
                     	[-1,  0,  2 ] ],
                     ];
