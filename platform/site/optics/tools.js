({
  //returns a copy of 'tab' without the element at position 'index'
  pureRemove: function(index, tab)
  {
    var length = tab.length;
    var res = tab.slice(0, index).concat(tab.slice(index+1, length+1));
    return res;
  },

  //converts a pixel coordinate to a board coordinate
  //assumes that the board is made out of squares
  toBoardCoordinate: function(pixelCoordinate, upperLeftBoardMargin, cellSize)
  {
    var res = Math.floor((pixelCoordinate - upperLeftBoardMargin)/cellSize);
    return res;
  },

  //does the opposite of toBoardCoordinate
  toPixelCoordinate: function(boardCoordinate, upperLeftBoardMargin, cellSize)
  {
    return (boardCoordinate + 0.5)*(cellSize-1) + upperLeftBoardMargin;
  },

  //returns the piece at position 'square' on the board, or null if there is none
  findGridElement: function(square, pieces)
  {
    for(var i in pieces)
    {
      var piece = pieces[i];
      if(piece.col == square[0] && piece.row == square[1]) {
        return piece;
      } 
    }
    return null;
  },

  isMovable: function(piece, unmovablePieces)
  {
    return (piece && unmovablePieces.indexOf(piece.type) == -1);
  },

  //moves a piece from the board or the box to a square on the board
  //@piece: if on board has attributes "type", "col", "row" and "rotation"; if in box: has attributes "type" and "index"
  //@pieces: pieces on board
  //@boxedPieces: pieces outside of the board, in the so-called box
  //which is determined by examining the attributes of "piece"
  //
  //returns {piece, pieces, boxedPiece}
  //piece is the updated piece
  //pieces is the update table of board pieces
  //boxedPieces is the update table of boxed pieces
  movePieceTo: function(piece, newSquare, pieces, boxedPieces, gridSize)
  {
    var newPiece = null;
    var newPieces = {};
    var newBoxedPieces = {};

    if(this.isMovable(piece)) {
      if (this.isInGrid(newSquare, gridSize)) { //defensive code
        if ((piece.col !== undefined) && (piece.row !== undefined)) { //the piece was on the board, let's change its coordinates
          console.log("movePieceTo the piece was on the board, let's change its coordinates");
          //var movedPiece = findGridElement([piece.col, piece.row], pieces);
          //movedPiece.col = newSquare[0];
          //movedPiece.row = newSquare[1];
          newPiece.col = newSquare[0];
          newPiece.row = newSquare[1];

        } else { //the piece was in the box, let's put it on the board
          console.log("movePieceTo the piece was in the box, let's put it on the board");
          //remove the piece from the "boxedPieces"
          newBoxedPieces = takePieceOutOfBox(piece.type, boxedPieces);

          //add it to the "pieces" with the appropriate coordinates
          newPiece = {
            "col": newSquare[0],
            "row": newSquare[1],
            "type": piece.type,
            "rotation": 0
          };
          newPieces = pieces.concat([newPiece]);
        }
      } else {
        //the new square position is outside of the board: let's box the piece
        console.log("movePieceTo the new square position is outside of the board: let's box the piece");
        var put = putPieceIntoBox(piece, pieces, boxedPieces);
        newPiece = put.newPiece;
        newPieces = put.newPieces;
        newBoxedPieces = put.newBoxedPieces;
      }
      //console.log("finished movePieceTo(piece="+pieceToString(piece)+", newSquare="+coordinatesToString(newSquare)+", pieces="+piecesToString(pieces)+", boxedPieces="+piecesToString(boxedPieces)+")");
    } else {
      //console.log("finished movePieceTo(piece="+pieceToString(piece)+", newSquare="+coordinatesToString(newSquare)+", pieces="+piecesToString(pieces)+", boxedPieces="+piecesToString(boxedPieces)+") - piece is not movable");
    }

    var toReturn = {};
    toReturn.piece = newPiece;
    toReturn.pieces = newPieces;
    toReturn.boxedPieces = newBoxedPieces;

    return toReturn;
  },

  //returns boxedPieces minus a piece of type "pieceType"
  //besides, boxedPieces is still sorted afterwards
  takePieceOutOfBox: function(pieceType, boxedPieces)
  {
    //console.log("takePieceOutOfBox(pieceType="+pieceType+", boxedPieces="+piecesToString(boxedPieces)+")");
    for(var i in boxedPieces)
    {
      var piece = boxedPieces[i];
      if(piece.type == pieceType) {
        var res = this.pureRemove(i, boxedPieces);
        //console.log("finished takePieceOutOfBox(pieceType="+pieceType+", boxedPieces="+piecesToString(boxedPieces)+")");
        console.log("takePieceOutOfBox("+pieceType+", "+this.piecesToString(boxedPieces)+")="+this.piecesToString(res));
        return res;
      }
    }
    //console.log("failed takePieceOutOfBox(pieceType="+pieceType+", boxedPieces="+piecesToString(boxedPieces)+")");
  },

  //takes a piece 'piece' from the board, i.e. 'pieces', and puts it into the box, i.e. 'boxedPieces'
  //@piece: the piece to be moved
  //@pieces: pieces on board
  //@boxedPieces: pieces outside of the board, in the so-called box
  //returns {newBoxedPiece, newPieces, newBoxedPieces}
  putPieceIntoBox: function(piece, pieces, boxedPieces)
  {
    console.log("putPieceIntoBox(piece="+pieceToString(piece)+", pieces="+piecesToString(pieces)+", boxedPieces="+piecesToString(boxedPieces)+")");

    var res = {};

    if(piece.index === null) { //source of movement isn't the box
      console.log("putPieceIntoBox: source of movement isn't the box");
      var newIndex = boxedPieces.length;
      res.newBoxedPiece = {
        "type": piece.type,
        "index": newIndex
      };
      //put at the right place
      //boxedPieces.splice(newIndex, 0, boxedPiece);
      res.newBoxedPieces = boxedPieces.concat(boxedPiece);

      for(var i in pieces)
      {
        var somePiece = pieces[i];
        if((piece.col == somePiece.col) &&(piece.row == somePiece.row)) {
          res.newPieces = this.pureRemove(i, pieces);
          console.log("finished putPieceIntoBox: res={newBoxedPiece="+pieceToString(res.newBoxedPiece)+", newPieces="+piecesToString(res.newPieces)+", newBoxedPieces="+piecesToString(res.newBoxedPieces)+"}");
          return res;
        }
      }
    } else { //the piece was moved from the box
      console.log("putPieceIntoBox: the piece was moved from the box");
      //console.log("finished putPieceIntoBox(piece="+pieceToString(piece)+", pieces="+piecesToString(pieces)+", boxedPieces="+piecesToString(boxedPieces)+") - did nothing");
    }

    res.newBoxedPiece = piece;
    res.newPieces = pieces;
    res.newBoxedPieces = boxedPieces;

    return res;
  },

  //returns the coordinates of the square that was clicked on in the box, or null if outside of the box
  //@position: array of coordinates in pixels
  //@position: warning: needed attributes are not checked!
  getIndexInBox: function(position, boxLeft, boxTop, boxCellSize, boxRowsCount, boxColumnsCount)
  {
    //tests whether is in box or not
    var relativeX = position[0] - boxLeft;
    var relativeY = position[1] - boxTop;

    var col = Math.floor(relativeX/boxCellSize[0]);
    var row = Math.floor(relativeY/boxCellSize[1]);

    if((0 <= col) && (boxColumnsCount > col) && (0 <= row) && (boxRowsCount > row)) {
      var index = 2*row+col;

      //console.log("getIndexInBox returns "+index);
      return index;
    }
    //console.log("getIndexInBox: out of box");
    return null;
  },

  //2D coordinates
  coordinatesToString: function(coordinates) {
    var x = coordinates[0] || coordinates.x;
    var y = coordinates[1] || coordinates.y;
    return "["+x+", "+y+"]";
  },

  pieceToString: function(piece) {
    if(piece) return "{col:"+piece.col+", row:"+piece.row+", type:"+piece.type+"}";
    else return piece;
  },

  piecesToString: function(pieces) {
    var printed = "{";
    for(var i in pieces)
    {
      var piece = pieces[i];
      if(printed !== "{") {
        printed += ", ";
      }
      printed += this.pieceToString(piece);
    }
    printed += "}";
    return printed;
  },

  //@params: must have attributes "selectedPiece" and "draggedPiece"
  paramsToString: function(params) {
    if (params)
      return "params={selectedPiece="+this.pieceToString(params.selectedPiece)+", draggedPiece="+this.pieceToString(params.draggedPiece)+")";
    else
      return params;
  },

  distance: function(point1, point2) {
    var point1x = point1[0] || point1.x;
    var point1y = point1[1] || point1.y;
    var point2x = point2[0] || point2.x;
    var point2y = point2[1] || point2.y;
    var diffX = point1x - point2x;
    var diffY = point1y - point2y;
    return Math.sqrt(diffX*diffX + diffY*diffY);        
  },

  areSamePiece: function(piece1, piece2) {
    return (piece1 && piece2 && (piece1.col == piece2.col) && (piece1.row == piece2.row))
  },

  //returns a drawable object that represents a device of type 'assetName' on the board, at position [col, row]
  getDrawableObject: function(layer, assetName, scale, assetSize, col, row, cellSize, upperLeftBoardMargin, rotation) {
    return {
      type: "image",
      layer: layer,
      asset: assetName,
      scale: scale,
      position: [-assetSize/2, -assetSize/2],
      translation: [(col+0.5) * cellSize + upperLeftBoardMargin, 
                    (row+0.5) * cellSize + upperLeftBoardMargin],
      rotation: rotation // In degrees 
    };
  },

  //tests whether a given position is inside the board or not
  //@positionOnBoard: array of coordinates as column and row position
  isInGrid: function(point, gridSize)
  {
    return (point[0] >= 0) && (point[0] < gridSize[0]) && (point[1] >= 0) && (point[1] < gridSize[1]);        
  },

  // Attempts to find intersection with the given lines and returns it.
  // Else returns null.
  findIntersection: function(origin, dest, lines, extendLinesFactor)
  {
    var closestIntersection = null;
    var distanceToClosestIntersection = Infinity;
    for(var i = 0; i < lines.length; i++)
    {
      // extend lines slightly
      var a = Vector.create(lines[i][0]);
      var b = Vector.create(lines[i][1]);
      var aToB = b.subtract(a);
      var midpoint = a.add(aToB.multiply(0.5));
      var newLength = (1 + extendLinesFactor) * aToB.modulus();
      var unit = aToB.toUnitVector();
      var aExtend = midpoint.add(unit.multiply(-0.5 * newLength));
      var bExtend = midpoint.add(unit.multiply(0.5 * newLength));

      var intersection = Line.Segment.create(origin, dest).intersectionWith(Line.Segment.create(aExtend, bExtend));
      if(intersection) 
      {
        // the intersection will be in 3D, so we need to cast the origin to 3D as well or distance calculation will fail (returns null)
        var distanceToIntersection = Vector.create(origin).to3D().distanceFrom(intersection);
        if(distanceToIntersection < distanceToClosestIntersection) 
        {
          closestIntersection = intersection;
          distanceToClosestIntersection = distanceToIntersection;
        }
      }
    }

    return closestIntersection === null ? null : closestIntersection.elements.slice(0, 2); // return only 2D part
  },

  // Returns an intersection point with walls, or null otherwise
  intersectsBoundaries: function(origin, dest, gridSize, extendLinesFactor)
  {
    var boundaries = 
    [
      [[0, 0], [gridSize[0], 0]], // top
      [[gridSize[0], 0], [gridSize[0], gridSize[1]]], // right
      [[gridSize[0], gridSize[1]], [0, gridSize[1]]], // bottom
      [[0, gridSize[1]], [0, 0]] // left
    ];

    return this.findIntersection(origin, dest, boundaries, extendLinesFactor);
  },

  // Returns an intersection point with walls, or null otherwise
  intersectsCell: function(origin, dest, cellPos, extendLinesFactor)
  {
    var boundaries = 
    [
      [[cellPos[0], cellPos[1]], [cellPos[0], cellPos[1] + 1]], // top
      [[cellPos[0], cellPos[1] + 1], [cellPos[0] + 1, cellPos[1] + 1]], // right
      [[cellPos[0] + 1, cellPos[1] + 1], [cellPos[0] + 1, cellPos[1]]], // bottom
      [[cellPos[0] + 1, cellPos[1]], [cellPos[0], cellPos[1]]] // left
    ];

    return this.findIntersection(origin, dest, boundaries, extendLinesFactor);
  },

  isRotatable: function(piece, unrotatablePieces)
  {
    return (piece && unrotatablePieces.indexOf(piece.type) == -1)
  },

  getBoxedPiece: function(index, boxedPieces) {
    return index === null ? null : boxedPieces[index];
  }
})