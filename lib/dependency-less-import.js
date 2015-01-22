var nodePath = require('path');

module.exports = function create(config, optimizer) {
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
            var data = optimizerContext.data;
            var lessImportDependencies = data.lessImportDependencies;
            if (lessImportDependencies) {
                lessImportDependencies.push(this);
            } else {
                data.lessImportDependencies = [this];
            }

            callback();
        },

        calculateKey: function() {
            return this.path;
        }
    };
};
