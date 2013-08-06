// Generated by CoffeeScript 1.6.3
/* 
  The algorithm is as follows:
    1. Get a static view of the model at the current time, and keep track of it
    2. Go though the layout from the top-down, recursively. For each:
      1. Check validity and error out otherwise
      2. Switch on block type:
        * If bind, execute query and store param bindings for lower items
        * If set, package with model bindings and add to execution list
        * If call, package with model bindings and add to execution list
        * If action: 
          1. Package with model bindings and add to execution list
          2. Run calculateActiveChildren() and continue with those recursively 
    3. For each active bound block:
      1. Run and gather output and error/success status
        * In case of error: Store error signal
        * In case of success: 
          1. Merge model changes with others. If conflict, nothing passes
          2. If DONE is signaled, store it
    4. Starting at parents of active leaf blocks:
      1. If signals are stored for children, call handleSignals() with them
      2. If more signals are created, store them for parents
*/


(function() {
  var GE, globals,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    __hasProp = {}.hasOwnProperty,
    __slice = [].slice;

  globals = this;

  GE = globals.GE;

  GE.Model = (function() {
    function _Class(data, previous) {
      if (data == null) {
        data = {};
      }
      this.previous = previous != null ? previous : null;
      this.data = GE.cloneFrozen(data);
      this.version = this.previous != null ? this.previous.version + 1 : 0;
    }

    _Class.prototype.setData = function(data) {
      return new GE.Model(data, this);
    };

    _Class.prototype.clonedData = function() {
      return GE.cloneData(this.data);
    };

    _Class.prototype.atVersion = function(version) {
      var m;
      if (version > version) {
        throw new Error("Version not found");
      }
      m = this;
      while (m.version > version) {
        m = m.previous;
      }
      return m;
    };

    _Class.prototype.makePatches = function(newData) {
      return GE.makePatches(this.data, newData);
    };

    _Class.prototype.applyPatches = function(patches) {
      var newData;
      if (patches.length === 0) {
        return this;
      }
      if (GE.doPatchesConflict(patches)) {
        throw new Error("Patches conflict");
      }
      newData = GE.applyPatches(patches, this.data);
      return new GE.Model(newData, this);
    };

    return _Class;

  })();

  GE.logToConsole = function(type, message) {
    return window.console[type.toLowerCase()](message);
  };

  GE.NodeVisitorConstants = (function() {
    function _Class(options) {
      _.defaults(this, options, {
        modelData: {},
        serviceData: {},
        assets: {},
        actions: {},
        tools: {},
        evaluator: null,
        log: GE.logToConsole
      });
    }

    return _Class;

  })();

  GE.NodeVisitorResult = (function() {
    function _Class(result, modelPatches, servicePatches) {
      this.result = result != null ? result : null;
      this.modelPatches = modelPatches != null ? modelPatches : [];
      this.servicePatches = servicePatches != null ? servicePatches : [];
    }

    _Class.prototype.appendWith = function(other) {
      var newModelPatches, newServicePatches;
      newModelPatches = GE.concatenate(this.modelPatches, other.modelPatches);
      newServicePatches = GE.concatenate(this.servicePatches, other.servicePatches);
      return new GE.NodeVisitorResult(this.result, newModelPatches, newServicePatches);
    };

    return _Class;

  })();

  GE.BindingReference = (function() {
    function _Class(ref) {
      this.ref = ref;
    }

    return _Class;

  })();

  GE.EvaluationContext = (function() {
    function _Class(constants, bindings) {
      this.constants = constants;
      this.model = GE.cloneData(this.constants.modelData);
      this.services = GE.cloneData(this.constants.serviceData);
      this.bindings = {};
      this.setupBindings(bindings);
    }

    _Class.prototype.setupBindings = function(bindings) {
      var bindingName, bindingValue, key, parent, _ref, _results;
      _results = [];
      for (bindingName in bindings) {
        bindingValue = bindings[bindingName];
        if (bindingValue instanceof GE.BindingReference) {
          _ref = GE.getParentAndKey(this, bindingValue.ref.split(".")), parent = _ref[0], key = _ref[1];
          _results.push(this.bindings[bindingName] = parent[key]);
        } else {
          _results.push(this.bindings[bindingName] = bindingValue);
        }
      }
      return _results;
    };

    _Class.prototype.compileExpression = function(expression) {
      return GE.compileExpression(expression, this.constants.evaluator);
    };

    _Class.prototype.evaluateFunction = function(f, params) {
      return f(this.model, this.services, this.constants.assets, this.constants.tools, this.bindings, params);
    };

    _Class.prototype.evaluateExpression = function(expression, params) {
      return this.evaluateFunction(this.compileExpression(expression), params);
    };

    return _Class;

  })();

  GE.extensions = {
    IMAGE: ["png", "gif", "jpeg", "jpg"],
    JS: ["js"],
    CSS: ["css"]
  };

  GE.isOnlyObject = function(o) {
    return _.isObject(o) && !_.isArray(o);
  };

  GE.getParentAndKey = function(parent, pathParts) {
    if (pathParts.length === 0) {
      return [parent, null];
    }
    if (pathParts.length === 1) {
      return [parent, pathParts[0]];
    }
    return GE.getParentAndKey(parent[pathParts[0]], _.rest(pathParts));
  };

  GE.deepSet = function(root, pathParts, value) {
    if (pathParts.length === 0) {
      throw new Exception("Path is empty");
    } else if (pathParts.length === 1) {
      root[pathParts[0]] = value;
    } else {
      if (root[pathParts[0]] == null) {
        root[pathParts[0]] = {};
      }
      GE.deepSet(root[pathParts[0]], _.rest(pathParts));
    }
    return root;
  };

  GE.makePatches = function(oldValue, newValue, prefix, patches) {
    var key, keys, _i, _len;
    if (prefix == null) {
      prefix = "";
    }
    if (patches == null) {
      patches = [];
    }
    if (_.isEqual(newValue, oldValue)) {
      return patches;
    }
    if (oldValue === void 0) {
      patches.push({
        add: prefix,
        value: GE.cloneData(newValue)
      });
    } else if (newValue === void 0) {
      patches.push({
        remove: prefix
      });
    } else if (!_.isObject(newValue) || !_.isObject(oldValue) || typeof oldValue !== typeof newValue) {
      patches.push({
        replace: prefix,
        value: GE.cloneData(newValue)
      });
    } else if (_.isArray(oldValue) && oldValue.length !== newValue.length) {
      patches.push({
        replace: prefix,
        value: GE.cloneData(newValue)
      });
    } else {
      keys = _.union(_.keys(oldValue), _.keys(newValue));
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        GE.makePatches(oldValue[key], newValue[key], "" + prefix + "/" + key, patches);
      }
    }
    return patches;
  };

  GE.applyPatches = function(patches, oldValue, prefix) {
    var key, parent, patch, splitPath, value, _i, _len, _ref, _ref1, _ref2;
    if (prefix == null) {
      prefix = "";
    }
    splitPath = function(path) {
      return _.rest(path.split("/"));
    };
    value = GE.cloneData(oldValue);
    for (_i = 0, _len = patches.length; _i < _len; _i++) {
      patch = patches[_i];
      if ("remove" in patch) {
        _ref = GE.getParentAndKey(value, splitPath(patch.remove)), parent = _ref[0], key = _ref[1];
        delete parent[key];
      } else if ("add" in patch) {
        _ref1 = GE.getParentAndKey(value, splitPath(patch.add)), parent = _ref1[0], key = _ref1[1];
        if (_.isArray(parent)) {
          parent.splice(key, 0, patch.value);
        } else {
          parent[key] = patch.value;
        }
      } else if ("replace" in patch) {
        _ref2 = GE.getParentAndKey(value, splitPath(patch.replace)), parent = _ref2[0], key = _ref2[1];
        if (!(key in parent)) {
          throw new Error("No existing value to replace for patch " + patch);
        }
        parent[key] = patch.value;
      }
    }
    return value;
  };

  GE.doPatchesConflict = function(patches) {
    var affectedKeys, parent, patch, path, pathPart, pathParts, _i, _j, _len, _len1, _ref;
    affectedKeys = {};
    for (_i = 0, _len = patches.length; _i < _len; _i++) {
      patch = patches[_i];
      path = patch.remove || patch.add || patch.replace;
      pathParts = _.rest(path.split("/"));
      parent = affectedKeys;
      _ref = _.initial(pathParts);
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        pathPart = _ref[_j];
        if (pathPart in parent) {
          if (parent[pathPart] === "FINAL") {
            return true;
          }
        } else {
          parent[pathPart] = {};
        }
        parent = parent[pathPart];
      }
      if (_.last(pathParts) in parent) {
        return true;
      }
      parent[_.last(pathParts)] = "FINAL";
    }
    return false;
  };

  GE.sandboxActionCall = function(node, constants, bindings, methodName, signals) {
    var action, child, childNames, e, error, evaluatedParams, evaluationContext, index, key, locals, methodResult, outParams, outputValue, paramName, paramOptions, paramValue, parent, result, _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _ref9;
    if (signals == null) {
      signals = {};
    }
    action = constants.actions[node.action];
    childNames = (function() {
      var _ref, _ref1, _results;
      if (node.children != null) {
        _ref = node.children;
        _results = [];
        for (index in _ref) {
          child = _ref[index];
          _results.push((_ref1 = child.name) != null ? _ref1 : index.toString());
        }
        return _results;
      } else {
        return [];
      }
    })();
    evaluationContext = new GE.EvaluationContext(constants, bindings);
    for (paramName in action.paramDefs) {
      if (action.paramDefs[paramName] == null) {
        action.paramDefs[paramName] = {};
      }
      _.defaults(action.paramDefs[paramName], {
        direction: "in"
      });
    }
    evaluatedParams = {};
    _ref = action.paramDefs;
    for (paramName in _ref) {
      paramOptions = _ref[paramName];
      if (((_ref1 = paramOptions.direction) === "in" || _ref1 === "inout") && ((_ref2 = node.params) != null ? (_ref3 = _ref2["in"]) != null ? _ref3[paramName] : void 0 : void 0)) {
        paramValue = node.params["in"][paramName];
      } else if (((_ref4 = paramOptions.direction) === "out" || _ref4 === "inout") && ((_ref5 = node.params) != null ? (_ref6 = _ref5.out) != null ? _ref6[paramName] : void 0 : void 0)) {
        paramValue = node.params.out[paramName];
      } else if (paramOptions["default"] != null) {
        paramValue = paramOptions["default"];
      } else if ((_ref7 = paramOptions.direction) === "in" || _ref7 === "inout") {
        throw new Error("Missing input parameter value for action: " + node.action);
      }
      try {
        evaluatedParams[paramName] = evaluationContext.evaluateExpression(paramValue);
      } catch (_error) {
        error = _error;
        throw new Error("Error evaluating the input parameter expression '" + paramValue + "' for node '" + node.action + "':\n" + error.stack);
      }
    }
    locals = {
      params: evaluatedParams,
      children: childNames,
      signals: signals,
      assets: constants.assets,
      tools: constants.tools,
      log: constants.log
    };
    try {
      methodResult = action[methodName].apply(locals);
    } catch (_error) {
      e = _error;
      constants.log(GE.logLevels.ERROR, "Calling action " + node.action + "." + methodName + " raised an exception " + e + ". Input params were " + (JSON.stringify(locals.params)) + ". Children are " + (JSON.stringify(locals.children)) + ".\n" + e.stack);
    }
    result = new GE.NodeVisitorResult(methodResult);
    outParams = _.pick(evaluatedParams, (function() {
      var _ref8, _ref9, _results;
      _ref8 = action.paramDefs;
      _results = [];
      for (paramName in _ref8) {
        paramOptions = _ref8[paramName];
        if ((_ref9 = paramOptions.direction) === "out" || _ref9 === "inout") {
          _results.push(paramName);
        }
      }
      return _results;
    })());
    _ref8 = node.params.out;
    for (paramName in _ref8) {
      paramValue = _ref8[paramName];
      try {
        outputValue = evaluationContext.evaluateExpression(paramValue, outParams);
      } catch (_error) {
        error = _error;
        throw new Error("Error evaluating the output parameter value expression '" + paramValue + "' for node '" + node.action + "':\n" + error.stack + "\nOutput params were " + (JSON.stringify(outputParams)) + ".");
      }
      _ref9 = GE.getParentAndKey(evaluationContext, paramName.split(".")), parent = _ref9[0], key = _ref9[1];
      parent[key] = outputValue;
    }
    result.modelPatches = GE.makePatches(constants.modelData, evaluationContext.model);
    result.servicePatches = GE.makePatches(constants.serviceData, evaluationContext.services);
    return result;
  };

  GE.calculateBindingSet = function(node, constants, oldBindings) {
    var bindingSet, boundValue, error, evaluationContext, inputContext, key, newBindings, parent, value, _ref, _ref1;
    bindingSet = [];
    if (_.isObject(node.foreach.from)) {
      _ref = node.foreach.from;
      for (key in _ref) {
        value = _ref[key];
        newBindings = Object.create(oldBindings);
        newBindings[node.foreach.bindTo] = value;
        if (node.foreach.index != null) {
          newBindings["" + node.foreach.index] = key;
        }
        if (node.foreach.where != null) {
          evaluationContext = new GE.EvaluationContext(constants, newBindings);
          try {
            if (evaluationContext.evaluateExpression(node.foreach.where)) {
              bindingSet.push(newBindings);
            }
          } catch (_error) {
            error = _error;
            throw new Error("Error evaluating the where expression '" + node.foreach.where + "' for foreach node '" + node + "':\n" + error.stack);
          }
        } else {
          bindingSet.push(newBindings);
        }
      }
    } else if (_.isString(node.foreach.from)) {
      inputContext = {
        model: GE.cloneData(constants.modelData),
        services: GE.cloneData(constants.serviceData)
      };
      _ref1 = GE.getParentAndKey(inputContext, node.foreach.from.split(".")), parent = _ref1[0], key = _ref1[1];
      boundValue = parent[key];
      for (key in boundValue) {
        newBindings = Object.create(oldBindings);
        newBindings[node.foreach.bindTo] = new GE.BindingReference("" + node.foreach.from + "." + key);
        if (node.foreach.index != null) {
          newBindings["" + node.foreach.index] = key;
        }
        if (node.foreach.where != null) {
          evaluationContext = new GE.EvaluationContext(constants, newBindings);
          try {
            if (evaluationContext.evaluateExpression(node.foreach.where)) {
              bindingSet.push(newBindings);
            }
          } catch (_error) {
            error = _error;
            throw new Error("Error evaluating the where expression '" + node.foreach.where + "' for foreach node '" + node + "':\n" + error.stack);
          }
        } else {
          bindingSet.push(newBindings);
        }
      }
    } else {
      throw new Error("Foreach 'from' must be string or a JSON object");
    }
    return bindingSet;
  };

  GE.visitActionNode = function(node, constants, bindings) {
    var activeChildren, activeChildrenResult, childIndex, childResult, childSignals, errorResult, result, _i, _j, _len, _ref, _results;
    if (!(node.action in constants.actions)) {
      throw new Error("Cannot find action '" + node.action + "'");
    }
    if ("update" in constants.actions[node.action]) {
      result = GE.sandboxActionCall(node, constants, bindings, "update");
    } else {
      result = new GE.NodeVisitorResult();
    }
    if (node.children != null) {
      if ("listActiveChildren" in constants.actions[node.action]) {
        activeChildrenResult = GE.sandboxActionCall(node, constants, bindings, "listActiveChildren");
        activeChildren = activeChildrenResult.result;
        if (!_.isArray(activeChildren)) {
          throw new Error("Calling listActiveChildren() on node '" + node.action + "' did not return an array");
        }
      } else {
        activeChildren = (function() {
          _results = [];
          for (var _i = 0, _ref = node.children.length - 1; 0 <= _ref ? _i <= _ref : _i >= _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
      }
      childSignals = new Array(node.children.length);
      for (_j = 0, _len = activeChildren.length; _j < _len; _j++) {
        childIndex = activeChildren[_j];
        childResult = GE.visitNode(node.children[childIndex], constants, bindings);
        childSignals[childIndex] = childResult.result;
        result = result.appendWith(childResult);
      }
      if ("handleSignals" in constants.actions[node.action]) {
        errorResult = GE.sandboxActionCall(node, constants, bindings, "handleSignals", childSignals);
        result = result.appendWith(errorResult);
        result.result = errorResult;
      }
    }
    return result;
  };

  GE.visitForeachNode = function(node, constants, oldBindings) {
    var bindingSet, child, childResult, newBindings, result, _i, _j, _len, _len1, _ref;
    bindingSet = GE.calculateBindingSet(node, constants, oldBindings);
    result = new GE.NodeVisitorResult();
    for (_i = 0, _len = bindingSet.length; _i < _len; _i++) {
      newBindings = bindingSet[_i];
      _ref = node.children || [];
      for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
        child = _ref[_j];
        childResult = GE.visitNode(child, constants, newBindings);
        result = result.appendWith(childResult);
      }
    }
    return result;
  };

  GE.visitSendNode = function(node, constants, bindings) {
    var dest, error, evaluationContext, key, modelPatches, outputValue, parent, servicePatches, src, _ref, _ref1;
    modelPatches = [];
    servicePatches = [];
    _ref = node.send;
    for (dest in _ref) {
      src = _ref[dest];
      evaluationContext = new GE.EvaluationContext(constants, bindings);
      try {
        outputValue = evaluationContext.evaluateExpression(src);
      } catch (_error) {
        error = _error;
        throw new Error("Error evaluating the output parameter value expression '" + src + "' for send node:\n" + error.stack);
      }
      _ref1 = GE.getParentAndKey(evaluationContext, dest.split(".")), parent = _ref1[0], key = _ref1[1];
      parent[key] = outputValue;
      modelPatches = GE.concatenate(modelPatches, GE.makePatches(constants.modelData, evaluationContext.model));
      servicePatches = GE.concatenate(servicePatches, GE.makePatches(constants.serviceData, evaluationContext.services));
    }
    return new GE.NodeVisitorResult(GE.signals.DONE, modelPatches, servicePatches);
  };

  GE.nodeVisitors = {
    "action": GE.visitActionNode,
    "foreach": GE.visitForeachNode,
    "send": GE.visitSendNode
  };

  GE.visitNode = function(node, constants, bindings) {
    var nodeType, visitor, _ref;
    if (bindings == null) {
      bindings = {};
    }
    _ref = GE.nodeVisitors;
    for (nodeType in _ref) {
      visitor = _ref[nodeType];
      if (nodeType in node) {
        return visitor(node, constants, bindings);
      }
    }
    constants.log(GE.logLevels.ERROR, "Layout item '" + (JSON.stringify(node)) + "' is not understood");
    return new GE.NodeVisitorResult();
  };

  GE.stepLoop = function(options) {
    var modelPatches, result, service, serviceName, _ref, _ref1;
    _.defaults(options, {
      node: null,
      modelData: {},
      assets: {},
      actions: {},
      log: null,
      inputServiceData: null,
      outputServiceData: null
    });
    if (options.outputServiceData !== null) {
      modelPatches = [];
    } else {
      if (options.inputServiceData === null) {
        options.inputServiceData = {};
        _ref = options.services;
        for (serviceName in _ref) {
          service = _ref[serviceName];
          options.inputServiceData[serviceName] = service.provideData(options.assets);
        }
      }
      result = GE.visitNode(options.node, new GE.NodeVisitorConstants({
        modelData: options.modelData,
        serviceData: options.inputServiceData,
        assets: options.assets,
        actions: options.actions,
        tools: options.tools,
        evaluator: options.evaluator,
        log: options.log
      }));
      if (GE.doPatchesConflict(result.modelPatches)) {
        throw new Error("Model patches conflict: " + (JSON.stringify(result.modelPatches)));
      }
      modelPatches = result.modelPatches;
      if (GE.doPatchesConflict(result.servicePatches)) {
        throw new Error("Service patches conflict: " + (JSON.stringify(result.servicePatches)));
      }
      options.outputServiceData = GE.applyPatches(result.servicePatches, options.inputServiceData);
    }
    _ref1 = options.services;
    for (serviceName in _ref1) {
      service = _ref1[serviceName];
      service.establishData(options.outputServiceData[serviceName], options.assets);
    }
    return modelPatches;
  };

  GE.compileExpression = function(expressionText, evaluator) {
    var expressionFunc, functionText;
    functionText = "(function(model, services, assets, tools, bindings, params) { return " + expressionText + "; })";
    expressionFunc = evaluator(functionText);
    if (typeof expressionFunc !== "function") {
      throw new Error("Expression does not evaluate as a function");
    }
    return expressionFunc;
  };

  GE.determineAssetType = function(url) {
    var extension, extensions, type, _ref;
    extension = url.slice(url.lastIndexOf(".") + 1);
    _ref = GE.extensions;
    for (type in _ref) {
      extensions = _ref[type];
      if (__indexOf.call(extensions, extension) >= 0) {
        return type;
      }
    }
    return null;
  };

  GE.loadAssets = function(assets, callback) {
    var loadedCount, name, onError, onLoad, results, url, _results;
    results = {};
    loadedCount = 0;
    onLoad = function() {
      if (++loadedCount === _.size(assets)) {
        return callback(null, results);
      }
    };
    onError = function(text) {
      return callback(new Error(text));
    };
    _results = [];
    for (name in assets) {
      url = assets[name];
      _results.push((function(name, url) {
        switch (GE.determineAssetType(url)) {
          case "IMAGE":
            results[name] = new Image();
            results[name].onload = onLoad;
            results[name].onabort = onError;
            results[name].onerror = function() {
              return onError("Cannot load image '" + name + "'");
            };
            return results[name].src = url + ("?_=" + (new Date().getTime()));
          case "JS":
            return $.ajax({
              url: url,
              dataType: "text",
              cache: false,
              error: function() {
                return onError("Cannot load JavaScript '" + name + "'");
              },
              success: function(text) {
                results[name] = text;
                return onLoad();
              }
            });
          case "CSS":
            return $.ajax({
              url: url,
              dataType: "text",
              cache: false,
              error: function() {
                return onError("Cannot load CSS '" + name + "'");
              },
              success: function(css) {
                $('<style type="text/css"></style>').html(css).appendTo("head");
                return onLoad();
              }
            });
          default:
            return callback(new Error("Do not know how to load " + url + " for asset " + name));
        }
      })(name, url));
    }
    return _results;
  };

  GE.doLater = function(f) {
    return setTimeout(f, 0);
  };

  GE.deepFreeze = function(o) {
    var key, prop;
    Object.freeze(o);
    for (key in o) {
      if (!__hasProp.call(o, key)) continue;
      prop = o[key];
      if (_.isObject(prop) && !Object.isFrozen(prop)) {
        GE.deepFreeze(prop);
      }
    }
    return o;
  };

  GE.cloneFrozen = function(o) {
    return GE.deepFreeze(GE.cloneData(o));
  };

  GE.addUnique = function(obj, value) {
    return obj[_.uniqueId()] = value;
  };

  GE.makeEvaluator = function() {
    var evaluator, sandboxFrame, script, scriptsToRun, _i, _len;
    scriptsToRun = 1 <= arguments.length ? __slice.call(arguments, 0) : [];
    sandboxFrame = $("<iframe width='0' height='0' />").css({
      visibility: 'hidden'
    }).appendTo("body");
    evaluator = sandboxFrame[0].contentWindow["eval"];
    sandboxFrame.remove();
    for (_i = 0, _len = scriptsToRun.length; _i < _len; _i++) {
      script = scriptsToRun[_i];
      evaluator(script);
    }
    return evaluator;
  };

  globals.GE = GE;

}).call(this);
