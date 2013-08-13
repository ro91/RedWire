({
  // Add a shape to be drawn to graphics
  drawShape: function(shape, oldShapes) 
  {
    var shapes = oldShapes || {};
    shapes[_.uniqueId()] = shape;
    return shapes; 
  },

  // Checks if a point intersects a shape.
  // Currently does not take rotation into account, and only supports circles and rectangles.
  // Requires Sylvester.js
  pointIntersectsShape: function(point, shape)
  {
    if(!shape.fillStyle && !shape.strokeStyle) return false;

    switch(shape.type)
    {
      case "circle":
        var center = Vector.create(shape.center);
        if(shape.translation) center = center.add(shape.translation);
        var lineWidth = shape.lineWidth || 1;
        var scale = shape.scale || 1;
        var minDistance = shape.fillStyle ? 0 : shape.radius - lineWidth;
        var maxDistance = shape.strokeStyle ? shape.radius + lineWidth : shape.radius;
        var distance = center.distanceFrom(Vector.create(point));
        return distance >= minDistance * scale && distance <= maxDistance * scale;

      case "rectangle":
        // Move the point to the frame of the shape
        var pointInShapeFrame = Vector.create(point);
        if(shape.translation) pointInShapeFrame = pointInShapeFrame.subtract(shape.translation);
        return pointInShapeFrame.elements[0] >= shape.position[0] && pointInShapeFrame.elements[0] <= shape.position[0] + shape.size[0] &&
          pointInShapeFrame.elements[1] >= shape.position[1] && pointInShapeFrame.elements[1] <= shape.position[1] + shape.size[1];

      default:
        throw new Error("Shape type '" + shape.type + "' is not supported");
    }
  },

  //returns a copy of 'tab' without the element at position 'index'
  removeElement: function(tab, index)
  {
    // By all logic, this should work. But after days of testing it, I give up...
    //   return tab.slice(0, index).concat(tab.slice(index + 1));
    // Here's the slow but foolproof way
    var newArray = [];
    for(var i = 0; i < tab.length; i++) {
      if(i != index) newArray.push(tab[i]);
    }
    return newArray;
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

  //tests whether a given position is inside the board or not
  //@positionOnBoard: array of coordinates as column and row position
  isInGrid: function(point, gridSize)
  {
    return (point[0] >= 0) && (point[0] < gridSize[0]) && (point[1] >= 0) && (point[1] < gridSize[1]);        
  },

  gridCellAtPoint: function(grid, point) {
    if(point === null) return null;

    var gridPos = [
      Math.floor((point[0] - grid.upperLeft[0]) / grid.cellSize[0]),
      Math.floor((point[1] - grid.upperLeft[1]) / grid.cellSize[1])
    ];

    if(gridPos[0] < 0 || gridPos[0] > grid.gridSize[0] || gridPos[1] < 0 || gridPos[1] > grid.gridSize[1]) 
      return null;
    else
      return gridPos;
  },

  gridCellToPoint: function(grid, cell, proportions) {
    return [
      (cell[0] + proportions[0]) * grid.cellSize[0] + grid.upperLeft[0], 
      (cell[1] + proportions[1]) * grid.cellSize[1] + grid.upperLeft[1]
    ];
  },

  gridCellUpperLeft: function(grid, cell) { return this.gridCellToPoint(grid, cell, [0, 0]); },

  gridCellCenter: function(grid, cell) { return this.gridCellToPoint(grid, cell, [0.5, 0.5]); },

  // the meta is optional
  gridCellRectangle: function(grid, cell, meta) {
    return {
      type: "rectangle",
      position: this.gridCellUpperLeft(grid, cell),
      size: grid.cellSize,
      meta: meta
    };
  },

  gridSizeInPixels: function(grid) {
    return [grid.cellSize[0] * grid.gridSize[0], grid.cellSize[1] * grid.gridSize[1]];
  },


  calculateRotationAngle: function (center, mousePosition) {
    var h = [mousePosition[0] - center[0], mousePosition[1] - center[1]];
    var omDistance = Math.sqrt(h[0]*h[0] + h[1]*h[1]);
    var ratio = -h[1]/omDistance;
    var angle = 0;
    if(omDistance !== 0) {
      var absValueAngle = Math.acos(ratio)*180/Math.PI;
      if(h[0] <= 0) {
        angle = -absValueAngle;
      } else {
        angle = absValueAngle;
      }
    }
    return angle;
  },

  calculateRotationOffset: function(rotation, center, mousePosition) {
    return rotation - this.calculateRotationAngle(center, mousePosition);
  },

  calculateRotation: function(rotationOffset, center, mousePosition) {
    return this.calculateRotationAngle(center, mousePosition) + rotationOffset;
  },

  // Returns an array containing the index of the first child that is equal to the correct value, or an empty array
  childByName: function(children, value) {
    var childIndex = GE.indexOfEquals(children, value);
    return childIndex != -1 ? [childIndex] : []; 
  },

  makeFilledRectangle: function(grid, cell, meta) {
    return _.extend(this.gridCellRectangle(grid, cell, meta), {
      strokeStyle: "white",
      fillStyle: "white"
    });
  },

  makeBlockShapes: function(grid, blocks, blockColor, blockSize) {
    var that = this;
    return _.map(blocks, function(block) { 
      return _.extend(that.gridCellRectangle(grid, block, block), { 
        layer: 'blocks', 
        fillStyle: blockColor,
        size: blockSize
      });
    });
  },

  makeMovableBlockShapes: function(grid, blocks, blockColor, blockSize) {
    var that = this;
    var movableBlocks = _.filter(blocks, function(block) { return that.canMoveBlock(blocks, block); });
    return _.map(movableBlocks, function(block) { 
      return _.extend(that.gridCellRectangle(grid, block, block), { 
        layer: 'blocks', 
        fillStyle: blockColor,
        size: blockSize
      });
    });
  },

  makeDraggedShape: function(size, color, mousePosition) {
    return { 
      layer: 'drag', 
      type: "rectangle",
      position: [mousePosition[0] - size[0] / 2, mousePosition[1] - size[1] / 2],
      size: size,
      fillStyle: color 
    };
  },

  drawShapes: function(shapes) 
  {
    var that = this;
    return _.reduce(shapes, function(memo, shape) { return that.drawShape(shape, memo); }, {});
  },

  moveBlock: function(grid, blocks, blockToMove, mousePosition) {
    // Find the block in the list
    var index = GE.indexOfEquals(blocks, blockToMove);
    // Change it to the new coordinate and return it
    blocks[index] = this.gridCellAtPoint(grid, mousePosition);
    return blocks;
  },

  blocksAreNeighbors: function(a, b) {
    // Find the difference between the two block coordinates
    var diff = [Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1])];
    return diff[0] == 1 && diff[1] == 0 || diff[0] == 0 && diff[1] == 1; 
  },

  makeAdjacencyList: function(blocks) {
    // Pre-allocate array of empty arrays
    var adjList = _.map(blocks, function() { return []; });

    // Enumerate every pair of blocks
    for(var i = 0; i < blocks.length - 1; i++) {
      for(var j = i + 1; j < blocks.length; j++) {
        if(this.blocksAreNeighbors(blocks[i], blocks[j])) {
          adjList[i].push(j);
          adjList[j].push(i);
        }
      }
    }

    return adjList;
  },

  visitBlocks: function(adjList, startingIndices) {
    var visited = [startingIndices];
    // Loop until return call
    while(true) {
      // add all neighbors to 'toVisit'
      var toVisit = _.reduce(visited[visited.length - 1], function(memo, visitingIndex) { return memo.concat(adjList[visitingIndex]); }, []);
      // remove duplicates
      toVisit = _.uniq(toVisit);
      // take out previously visited ones
      toVisit = _.difference.apply(_, [toVisit].concat(visited));

      if(toVisit.length > 0) {
        visited.push(toVisit);
      }
      else
      {
        return visited;
      }
    }
  },

  canMoveBlock: function(blocks, block) {
    // The block can be moved if all other blocks are connected without the block in question
    var blocksWithout = this.removeElement(blocks, GE.indexOfEquals(blocks, block));
    var adjList = this.makeAdjacencyList(blocksWithout);
    var visited = this.visitBlocks(adjList, [0]);
    return _.flatten(visited).length == blocksWithout.length; 
  }
})