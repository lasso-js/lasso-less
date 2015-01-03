// native node modules
var nodePath = require('path');
var fs = require('fs');

// public modules from npm
var async = require('async');
var logger = require('raptor-logging').logger(module);
var resolveFrom = require('resolve-from');
var requireRegExp = /^require\s*:\s*(.+)$/; // Hack: {2,} is used because Windows file system paths start with "c:\"


var lessPath = null;
var less;

try {
    lessPath = require.resolve('less');
    // if lessPath is found
    less = require(lessPath);
} catch (e) {
    // do nothing
}

var lessOptimizer = function(optimizer, config) {

    optimizer.dependencies.registerStyleSheetType('less', {
        properties: {
            path: 'string',
            paths: 'string',
            imports: 'object'
        },

        init: function(optimizerContext, callback) {

            if (!this.path) {
                return callback(new Error('"path" is required for a less dependency'));
            }

            if (!less) {
                return callback(new Error('Unable to handle Less dependency for path "' + this.path + '". The "less" module was not found. This module should be installed as a top-level application module.'));
            }

            this.path = this.resolvePath(this.path);
            callback();
        },

        read: function(optimizerContext, callback) {
            var _this = this;
            var path = this.path;
            var paths = [nodePath.dirname(path)];
            var imports = this.imports;
            var completed = false;

            if (require.main && require.main.paths) {
                paths = paths.concat(require.main.paths);
            }

            if (config.paths) {
                paths = config.paths.concat(paths);
            }

            function errorCallback(err){
                logger.error(err);

                if (completed) {
                    return;
                }
                completed = true;
                callback(err);
            }

            function renderCallback(err, output) {
                if (err) {
                    if (err.line !== null) {
                        err = new Error('Error compiling Less file (' +
                            err.filename +
                            ':' +
                            err.line +
                            ':' +
                            err.column +
                            ') - ' +
                            err.message);
                    }
                    errorCallback(err);
                    return;
                }

                if (completed) {
                    return;
                }

                completed = true;

                logger.info('Finished parsing Less file at path: ' + path);

                // LESS v2+ returns an object with "css" property.
                // Old versions returned just the CSS.
                callback(null, (output.css === null) ? output : output.css);
            }

            function readImports(callback){
                //if imports doesn't exist return null.
                if (!imports || !imports.length) {
                    return callback(null, '');
                }

                async.map(
                    imports,
                    function(importPath, callback) {
                        importPath = importPath.trim();

                        var requireMatches = requireRegExp.exec(importPath);
                        var isRequire = false;

                        if (requireMatches){
                            isRequire = true;
                            importPath = requireMatches[1].trim();
                            importPath = resolveFrom(_this.getParentManifestDir(), importPath);
                        } else {
                            importPath = _this.resolvePath(importPath);
                        }

                        fs.readFile(importPath, 'utf8', callback);
                    },
                    function(err, results) {
                        if (err) {
                            return callback(err);
                        }
                        callback(null, results.join('\n'));
                    });
            }

            function readFile(callback) {
                fs.readFile(path, {encoding: 'utf8'}, callback);
            }

            async.parallel(
                [
                    readImports,
                    readFile
                ],
                function(err, results) {
                    if (err) {
                        return callback(err);
                    }

                    var importedCode = results[0];
                    var lessCode = results[1];

                    if (importedCode) {
                        lessCode = importedCode + '\n' + lessCode;
                    }

                    var parseConfig = {
                        filename: path,
                        paths: paths
                    };

                    logger.info('Parsing Less file at path: ' + path);

                    less.render(lessCode, parseConfig, renderCallback);
                });
        }, // < /  load >

        getSourceFile: function() {
            return this.path;
        },

        getLastModified: function(optimizerContext, callback) {
            return callback(null, -1);
        }
    });
};

module.exports = lessOptimizer;