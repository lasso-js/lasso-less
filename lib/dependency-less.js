var less;
var lessPath;
var LessParser;

try {
    lessPath = require.resolve('less');
} catch(e) {
    lessPath = null;
}

if (lessPath) {
    less = require(lessPath);
    LessParser = less.Parser;
}

var fs = require('fs');

var nodePath = require('path');
var logger = require('raptor-logging').logger(module);

exports.create = function(options) {
    return {
        properties: {
            'path': 'string',
            'paths': 'string'
        },

        init: function() {
            if (!this.path) {
                throw new Error('"path" is required for a less dependency');
            }

            if (!LessParser) {
                throw new Error('Unable to handle Less dependency for path "' + this.path + '". The "less" module was not found. This module should be installed as a top-level application module.') ;
            }

            this.path = this.resolvePath(this.path);
        },

        read: function(context, callback) {


            var path = this.path;

            fs.readFile(path, {encoding: 'utf8'}, function(err, lessCode) {
                if (err) {
                    return callback(err);
                }

                var paths = [nodePath.dirname(path)];
                if (require.main && require.main.paths) {
                    paths = paths.concat(require.main.paths);
                }
                var parser = new LessParser({
                    filename: path,
                    paths: paths
                });

                parser.parse(lessCode, function(err, tree) {
                    if (err) {
                        logger.error('Error building LESS file ' + path, err);

                        if (err.hasOwnProperty('line')) {
                            callback(
                                new Error('Error compiling LESS file (' +
                                    err.filename + ':' + err.line + ':' + err.column + ') - ' +
                                    err.message));
                        } else {
                            callback(err);
                        }
                        return;
                    }

                    callback(null, tree.toCSS(options));
                });
            });

        },

        getSourceFile: function() {
            return this.path;
        },

        lastModified: function() {
            return -1; // Always recompile Less files because we can't know which other files are imported without recompiling
        }
    };
};
