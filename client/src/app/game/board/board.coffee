angular.module('gamEvolve.game.boardTree', [
  'ui.bootstrap'
  'gamEvolve.game.board.editEmitterDialog'
  'gamEvolve.game.board.editProcessorDialog'
  'gamEvolve.game.board.editSplitterDialog'
])


.controller 'BoardTreeCtrl', ($scope, $dialog, currentGame, gameHistory, gameTime) ->

  $scope.currentGame = currentGame

  $scope.edit = (chip) ->
    switch $scope.getChipType(chip) # Type of dialog depends on type of chip
      when "switch"
        showDialog 'game/board/editBoardProcessorDialog.tpl.html', 'EditBoardProcessorDialogCtrl', chip, (model) ->
          _.extend(chip, model)
      when "processor"
        showDialog 'game/board/editBoardProcessorDialog.tpl.html', 'EditBoardProcessorDialogCtrl', chip, (model) ->
          _.extend(chip, model)
      when "emitter"
        showDialog 'game/board/editBoardEmitterDialog.tpl.html', 'EditBoardEmitterDialogCtrl', chip, (model) ->
          _.extend(chip, model)
      when "splitter"
        showDialog 'game/board/editBoardSplitterDialog.tpl.html', 'EditBoardSplitterDialogCtrl', chip, (model) ->
          _.extend(chip, model)

  $scope.getChipType = (chip) ->
    return "null" unless chip
    if "switch" of chip then "switch"
    else if "processor" of chip then "processor"
    else if "emitter" of chip then "emitter"
    else if "splitter" of chip then "splitter"
    else "unknown"

  showDialog = (templateUrl, controller, model, onDone) ->
    dialog = $dialog.dialog
      backdrop: true
      dialogFade: true
      backdropFade: true
      backdropClick: false
      templateUrl: templateUrl
      controller: controller
      dialogClass: "large-modal"
      resolve:
      # This object will be provided to the dialog as a dependency, and serves to communicate between the two
        liaison: ->
          {
          model: RW.cloneData(model)
          done: (newModel) ->
            onDone(newModel)
            dialog.close()
          cancel: ->
            dialog.close()
          }
    dialog.open()

  $scope.remove = (node, parent) ->
    if window.confirm("Are you sure you want to delete this chip?")
      index = parent.children.indexOf node
      parent.children.splice(index, 1) # Remove that child

  $scope.drop = (source, target, sourceParent, targetParent) ->
#    console.log 'Drop'
#    console.log 'Source', source
#    console.log 'Target', target
#    console.log 'Source Parent', sourceParent
    return if source is currentGame.version.board # Ignore Main node DnD
    if $scope.acceptsChildren(target)
      moveInsideTarget(source, target, sourceParent)
    else
      moveBeforeTarget(source, target, sourceParent, targetParent)

  $scope.acceptsChildren = (node) ->
    return false unless node
    if node.switch or node.processor or node.splitter
      if not node.children
        node.children = []
      true
    else
      false

  moveInsideTarget = (source, target, sourceParent) ->
    removeSourceFromParent(source, sourceParent)
    target.children.push source # TODO push or unshift ?
    target.collapsed = false # Make sure user can see added node

  removeSourceFromParent = (source, parent) ->
    if parent
      for child, i in parent.children
        if child is source
          parent.children.splice i, 1
          break

  moveBeforeTarget = (source, target, sourceParent, targetParent) ->
    removeSourceFromParent(source, sourceParent)
    targetIndex = targetParent.children.indexOf(target)
    targetParent.children.splice targetIndex, 0, source

  $scope.getChipDescription = (chip) ->
    switch $scope.getChipType(chip)
      when "switch" then chip.switch
      when "processor" then chip.processor
      when "emitter" then "Emitter"
      when "splitter" then "Splitter"
      else "Unknown Type"

  # TODO Remove or move to right place
  # Update from gameHistory
  onUpdateGameHistory = ->
    if not gameHistory.data.frames[gameTime.currentFrameNumber]? then return
    newMemory = gameHistory.data.frames[gameTime.currentFrameNumber].memory
    if not _.isEqual($scope.memory, newMemory)
      $scope.memory = newMemory
  $scope.$watch('gameHistoryMeta', onUpdateGameHistory, true)


# TODO Use this to keep info on collapsed and/or muted nodes ?
.factory 'nodes', ->
  nodes = []
  states = [0] # Root tree is open by default

  registerRoot: (newRoot) ->
    if nodes.length is 0 or nodes[0] isnt newRoot
      # Reset nodes
      nodes = [newRoot]
      states = [0] # Root tree is open by default
    0

  register: (node) ->
    # nodeId is actually the index in the nodes array
    for registeredNode, index in nodes
      if registeredNode is node then return index
    # Not registered yet
    nodes.push node

  find: (id) ->
    node = nodes[id]
    if not node then console.log "No node found for ID #{id}"
    node

  open: (nodeId) ->
    states[nodeId] = 'open'

  close: (nodeId) ->
    states[nodeId] = 'closed'

  findState: (nodeId) ->
    if nodeId is 0 then 'open' else states[nodeId]
