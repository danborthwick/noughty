var boardState;

$(document).ready(function() {
	restart();
	redraw();
	$('.restart').click(restart);
});

function restart()
{
	boardState = [ [" ", " ", " "], [" ", " ", " "], [" ", " ", " "]];
	redraw();
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
			if (cellType == " ") {
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
	var row = event.data.row;
	var column = event.data.column;
	console.log("Cell clicked: " + row + ", " + column);

	boardState[row][column] = "x";
	console.log("Hash: " + hashBoardState(boardState));
	
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
			const bitMasks = {
					" " : 0,
					"x" : 1,
					"o" : 2,
			}
			var maskPosition = (3 * point.y) + point.x;
			var bitMask = bitMasks[cellValue] << (2 * maskPosition);
			hash |= bitMask;
		}
	}
	
	return hash;
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
