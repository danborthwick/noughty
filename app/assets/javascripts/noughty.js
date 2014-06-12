$(document).ready(function() {
	var s = [ "x o", "   ", "oox"];
	renderBoard($('#board'), s);
});

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
	console.log("Cell clicked: " + event.data.row + ", " + event.data.column);
}