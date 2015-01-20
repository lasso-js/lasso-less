var nodePath = require('path');
var LessContext = require('./LessContext');

module.exports = function create(config, optimizer) {
    var EMPTY_ARRAY = [];

    var rendererDependency = optimizer.dependencies.createDependency({
        type: 'less-renderer'
    }, __dirname);

    return {
        properties: {
            path: 'string'
        },

        init: function(optimizerContext, callback)  {
            if (!this.path) {
                return callback(new Error('"path" is required'));
            }

            this.path = this.resolvePath(this.path);
            callback();
        },

        getDir: function() {
            return nodePath.dirname(this.path);
        },

        getDependencies: function(optimizerContext, callback) {
            var lessContext = LessContext.getLessContext(optimizerContext);
            lessContext.addLessDependency(this);

            if (lessContext.getLessRendererDependencyAdded()) {
                callback(null, EMPTY_ARRAY);
            } else {
                lessContext.setLessRendererDependencyAdded();
                callback(null, [
                    rendererDependency
                ]);
            }
        }
    };
};
