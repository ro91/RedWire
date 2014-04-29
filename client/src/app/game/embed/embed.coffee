# Set the embedded player to the window height
onResize = -> $("#embeddedPlayer").width($(window).width()).height($(window).height())
$(window).on("resize", onResize)
# Call it now as well
$(window).load(onResize)


angular.module('gamEvolve.game.embed', [])

.config ($stateProvider) ->
  $stateProvider.state 'embed',
    url: '/game/:gameId/embed'
    views:
      "main":
        controller: 'EmbedCtrl'
        templateUrl: 'game/embed/embed.tpl.html'
    data:
      pageTitle: 'Embed Game'

.controller 'EmbedCtrl', ($scope, $state, games, gameTime, gameHistory, currentGame, $stateParams) ->
  $scope.isLoading = true

  onUpdateGameHistory = -> 
    if gameHistory.meta.version is 1 
      gameTime.isPlaying = true
      $scope.isLoading = false

  # Bring gameHistory into scope so we can watch it
  $scope.gameHistoryMeta = gameHistory.meta
  $scope.$watch("gameHistoryMeta", onUpdateGameHistory, true)

  games.loadFromId($stateParams.gameId)

  $scope.title = ""
  $scope.author = ""
  onUpdateCurrentGame = -> 
    $scope.title = currentGame.info?.name
    $scope.author = currentGame.creator

  $scope.currentGame = currentGame
  $scope.$watch("currentGame", onUpdateCurrentGame, true)

