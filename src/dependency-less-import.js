var nodePath = require('path');

module.exports = function create(config, lasso) {
    return {
        properties: {
            path: 'string'
        },

        init: function(lassoContext, callback)  {
            if (!this.path) {
                return callback(new Error('"path" is required'));
            }

            this.path = this.resolvePath(this.path);
            callback();
        },

        getDir: function() {
            return nodePath.dirname(this.path);
        },

        getDependencies: function(lassoContext, callback) {
            var data = lassoContext.data;
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
