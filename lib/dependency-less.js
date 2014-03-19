var less = require('less');
var fs = require('fs');
var Parser = less.Parser;
var nodePath = require('path');

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

            this.path = this.resolvePath(this.path);
        },

        read: function(context, callback) {
            var path = this.path;

            fs.readFile(path, {encoding: 'utf8'}, function(err, lessCode) {
                if (err) {
                    return callback(err);
                }

                var parser = new Parser({
                    filename: path,
                    paths: [nodePath.dirname(path)]
                });

                parser.parse(lessCode, function(err, tree) {
                    if (err) {
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
