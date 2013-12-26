PROPERTY_NAMES =   [
  'actions'
  'assets'
  'layout'
  'model'
  'processes'
  'services'
  'tools'
]

angular.module('gamEvolve.game.player', [])
.controller "PlayerCtrl", ($scope, games, currentGame, gameTime) -> 
  # Bring services into the scope
  $scope.currentGame = currentGame
  $scope.gameTime = gameTime

  # TODO: take out this "global" message handler?
  window.addEventListener 'message', (e) -> 
    # Sandboxed iframes which lack the 'allow-same-origin' header have "null" rather than a valid origin. 
    if e.origin is "null" && e.source is $("#gamePlayer")[0].contentWindow
      switch e.data.type
        when "error"
          console.log("Puppet reported error", e.data.error)
        when "success" 
          console.log("Puppet reported success", e.data.value)
        else
          throw new Error("Unknown message from puppet", e.data)

  sendMessage = (operation, value) ->  
    # Note that we're sending the message to "*", rather than some specific origin. 
    # Sandboxed iframes which lack the 'allow-same-origin' header don't have an origin which you can target: you'll have to send to any origin, which might alow some esoteric attacks. 
    $('#gamePlayer')[0].contentWindow.postMessage({operation: operation, value: value}, '*')

  # TODO: remove this
  window.sendMessage = sendMessage

  gameCode = null
  $scope.$watch 'currentGame.version', (code) ->
    gameCode = code
    if gameCode
      # TODO: have the game model be already parsed, rather than doing it here
      for propertyName in PROPERTY_NAMES
        gameCode[propertyName] = JSON.parse(gameCode[propertyName])

      console.log("Game code changed to", gameCode)
      sendMessage("loadGameCode", gameCode)

  onUpdateFrame = (frame) ->
    console.log("Changed frame to", frame)
    sendMessage("stepLoop", { model: gameCode.model })

  $scope.$watch('gameTime.currentFrame', onUpdateFrame, true)


