// native node modules
var fs = require('fs'),
    nodePath = require('path');


// public modules from npm
var logger = require('raptor-logging').logger(module),
    resolveFrom = require('resolve-from'),
    Q = require('q'),
    FS = require("q-io/fs");

var lessPath = null,
    less;

try {
    lessPath = require.resolve('less');
    // if lessPath is found
    less = require(lessPath);
} catch (e) {
    // do nothing
}

var lessOptimizer = function(optimizer, config) {


    var mixins = {
        properties: {
            path: 'string',
            paths: 'string',
            imports: 'object'
        },
    };

    mixins.init = function(optimizerContext, callback) {

        if (!this.path) {
            return callback(new Error('"path" is required for a less dependency'));
        }

        if (!less) {
            return callback(new Error('Unable to handle Less dependency for path "' + this.path + '". The "less" module was not found. This module should be installed as a top-level application module.'));
        }

        this.path = this.resolvePath(this.path);
        callback();
    };

    mixins.loadDependencies = function(){

        var REQUIRE_PATTERN = 'require:';
            
        var deferred = Q.defer(),
            lessImport = null,
            promises = [],
            lessCode = '';

        //if imports doesn't exist return null.
        if (!this.imports || !this.imports.length) {
            deferred.resolve(lessCode);
            return deferred.promise;
        }

        // loop through all the imports and create array of promises to read the files.
        this.imports.forEach(function(importPath, index){
            var pattern = new RegExp('^' + REQUIRE_PATTERN),
                splittedImport,
                promise;

            importPath = importPath.trim();

            if(pattern.exec(importPath)){
                splittedImport = importPath.split(REQUIRE_PATTERN);

                // no path found after require:
                if( splittedImport.length !== 2){
                    return;
                }

                importPath = splittedImport[1].trim();
            }

            // get full path
            importPath = resolveFrom(this.getParentManifestDir(), importPath);
            
            promise = FS.read(importPath, {
                flags: 'r',
                charset: 'utf-8'
            });
            
            promises.push(promise);

            
        }.bind(this));

        if(promises.length){
            // read all the files in order and concat the results.
            Q.all(promises)
                .spread(function(){
                    var args = [].slice.call(arguments);
                    lessCode = args.join('\n');

                    // return concatinated less code
                    deferred.resolve(lessCode);
                })
                .fail(function(error){
                    deferred.reject(error);
                })

        }else{
            deferred.resolve(null);
        }

        return deferred.promise;
    
    }; // < /  mixins.loadDependencies >


    mixins.read = function(optimizerContext, callback) {

        var path = this.path,
            paths = [
                nodePath.dirname(path)
            ],
            depLessCode = '';

        if (require.main && require.main.paths) {
            paths = paths.concat(require.main.paths);
        }

        if (config.paths) {
            paths = config.paths.concat(paths);
        }

        var depLessCode = '';

        var errorCallback = function(err){
            logger.error(err);
            callback(err);
        };

        var renderCallback = function(err, output) {
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

            logger.info('Finished parsing Less file at path: ' + path);

            // LESS v2+ returns an object with "css" property.
            // Old versions returned just the CSS.
            callback(null, (output.css === null) ? output : output.css);
        };

        var readFileCallback = function(lessCode) {

            lessCode = depLessCode.concat('\n', lessCode);

            var parseConfig = {
                filename: path,
                paths: paths
            };
            
            logger.info('Parsing Less file at path: ' + path);

            less.render(lessCode, parseConfig, renderCallback);
        };

        var dependencyCallback = function(lessCode){
            
            depLessCode = lessCode;

            //read main file
            FS.read(path, {
                flags: 'r',
                charset: 'utf-8'
            })
            .then(readFileCallback)
            .fail(errorCallback);
        };

        this.loadDependencies()
            .then(dependencyCallback.bind(this))
            .fail(errorCallback);

    }; // < /  mixins.load >

    mixins.getSourceFile = function() {
            return this.path;
    };

    mixins.getLastModified = function(optimizerContext, callback) {
            return callback(null, -1);
    };
    
    optimizer.dependencies.registerStyleSheetType('less', mixins);
};

module.exports = lessOptimizer;