var nodePath = require('path');

module.exports = function create(config, lasso) {
    return {
        properties: {
            path: 'string'
        },

        init: function(lassoContext, callback)  {
            if (!this.path) {
                var error = new Error('"path" is required');

                if (callback) return callback(error);
                throw error;
            }

            this.path = this.resolvePath(this.path);

            if (callback) callback();
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

            if (callback) callback();
        },

        calculateKey: function() {
            return this.path;
        }
    };
};
