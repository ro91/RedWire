# These properties need to be converted from JSON strings to objects upon loading, and back to JSON for saving
JSON_PROPERTIES = [
  'memory'
  'board'
  'io'
  'processors'
  'switches'
  'transformers'
  'assets'
]

angular.module('gamEvolve.util.gameConverter', [])

.factory "gameConverter", ->
  convertGameVersionFromEmbeddedJson: (gameVersionJson) ->
    gameVersion = 
      id: gameVersionJson.id
      gameId: gameVersionJson.gameId
      versionNumber: gameVersionJson.versionNumber
    for propertyName in JSON_PROPERTIES
      gameVersion[propertyName] = JSON.parse(gameVersionJson[propertyName])
    return gameVersion

  convertGameVersionToEmbeddedJson: (gameVersion) ->
    gameVersionJson = 
      id: gameVersion.id
      gameId: gameVersion.gameId
      versionNumber: gameVersion.versionNumber
    for propertyName in JSON_PROPERTIES
      gameVersionJson[propertyName] = JSON.stringify(gameVersion[propertyName], null, 2)
    return gameVersionJson

  convertGameVersionFromJson: (gameVersionJson) ->
    return JSON.parse(gameVersionJson)

  convertGameVersionToJson: (gameVersion) ->
    filteredObject = _.pick(gameVersion, JSON_PROPERTIES...)
    return JSON.stringify(filteredObject, null, 2)