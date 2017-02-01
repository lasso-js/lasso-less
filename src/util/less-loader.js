var logger = require('raptor-logging').logger(module);

var series = require('async').series;
var parallel = require('async').parallel;
var fs = require('fs');
var nodePath = require('path');
var parser = require('./less-parser');
var ok = require('assert').ok;
var AsyncValue = require('raptor-async/AsyncValue');
var extend = require('raptor-util/extend');
var readURL = require('./readURL');

var separatorChars = ['*', '-', '=', '~'];


function separator(str, c) {
    var len = str.length - 5;
    var result = '';
    for (var i=0; i<len; i++) {
        result += c;
    }

    return '/*' + result + '*/\n';
}

function Loader() {
    this.cache = {};
}

Loader.prototype = {
    parseLessCode: function(lessCode, path) {
        var self = this;

        var parsedLess = parser.parse(lessCode, path);

        // Start pre-loading the imported Less files:
        var parts = parsedLess.getParts();
        for (var i=0, len=parts.length; i<len; i++) {
            var part = parts[i];
            if (part.isImport()) {
                var importPath = part.getImportPath();
                self.loadLessFile(importPath);
            }
        }

        return parsedLess;
    },

    _loadLess: function(reader, path, callback) {
        var self = this;

        var asyncValue = this.cache[path];

        if (!asyncValue) {
            asyncValue = this.cache[path] = new AsyncValue();

            reader(function(err, lessCode) {
                if (err) {
                    asyncValue.reject(err);
                    return;
                }

                var parsedLess = self.parseLessCode(lessCode, path);
                asyncValue.resolve(parsedLess);
            });
        }

        if (callback) {
            asyncValue.done(callback);
        }
    },

    loadLessFile: function(path, callback) {
        this._loadLess(
            function(callback) {
                fs.readFile(path, {encoding: 'utf8'}, callback);
            },
            path,
            callback);
    },

    loadLessURL: function(url, callback) {
        this._loadLess(
            function(callback) {
                readURL(url, callback);
            },
            url,
            callback);
    },

    loadLessCode: function(lessCode, path, callback) {
        var parsedLess = this.parseLessCode(lessCode, path || '(code)');
        callback(null, parsedLess);
    },

    loadLessDependency: function(dependency, callback) {
        if (dependency.url) {
            this.loadLessURL(dependency.url, callback);
        } else if (dependency.code) {
            this.loadLessCode(dependency.code, dependency.path, callback);
        } else if (dependency.path) {
            this.loadLessFile(dependency.path, callback);
        } else {
            callback(new Error('Invalid LESS dependency. "path", "url" or "code" is required'));
        }
    }
};

exports.load = function(lessDependencies, context, callback) {
    var urlResolver = context.urlResolver;
    ok(urlResolver, '"urlResolver" expected');

    if (logger.isDebugEnabled()) {
        var paths = lessDependencies.map(function(d) {
            return d.path;
        });
        logger.debug('Loading:\n- ' + paths.join('\n- ') + '\n');
    }

    var lassoContext = context.lassoContext;

    ok(lassoContext, '"lassoContext" expected');

    var lasso = lassoContext.lasso;
    ok(lasso, '"lasso" expected');

    var loader = new Loader();

    var output = [];

    var foundImports = {};
    var hasUnresolvedUrls = false;

    function processLessFile(parsedLess, depth, callback) {

        var parts = parsedLess.getParts();
        var dirname = parsedLess.getDirname();
        var relativePath = parsedLess.getPath().startsWith('http') ?
            parsedLess.getPath() :
            nodePath.relative(process.cwd(), parsedLess.getPath());

        // console.log('PROCESSING BEGIN: ', relativePath);

        var importTasks = [];
        var urlTasks = [];

        parts.forEach(function(part) {
            if (part.isImport()) {
                var importPath = part.getImportPath();

                importTasks.push(function(callback) {
                    if (foundImports[importPath]) {
                        // Remove the import since it was already handled
                        part.replaceWith('/* @import "' + part.text + '"; (skipped, already imported) */');
                        callback();
                    } else {
                        foundImports[importPath] = true;

                        // console.log('PROCESSING @import "' + importPath + '" in "' + relativePath);
                        loader.loadLessFile(importPath, function(err, parsedLess) {
                            if (err) {
                                return callback(err);
                            }

                            processLessFile(parsedLess, depth+1, function(err, importedLessCode) {
                                if (err) {
                                    return callback(err);
                                }

                                part.replaceWith('/* @import "' + part.text + '"; */\n' + importedLessCode);
                                callback();
                            });
                        });
                    }
                });
            } else if (part.isUrl()) {
                var url = part.getUrl();

                urlTasks.push(function(callback) {
                    if (url.indexOf('@') !== -1) {
                        // The URL is unresolved and has some Less variables. We will instead
                        // try to resolve the URL after the Less code is rendered to CSS
                        hasUnresolvedUrls = true;
                        var unresolvedUrl = 'unresolved://' + parsedLess.getPath() + '$' + url + '$';
                        part.replaceWith(unresolvedUrl);
                        return callback();
                    }

                    var urlResolverContext = extend({}, context);
                    urlResolverContext.dir = dirname;
                    urlResolver(url, urlResolverContext, function(err, url) {
                        if (err) {
                            return callback(err);
                        }

                        part.replaceWith(url);
                        callback();
                    });
                });
            }
        });

        parallel([
                function handleImports(callback) {
                    // Process the imports in series since we must de-dupe
                    // imports if an import was included earlier
                    series(importTasks, callback);
                },
                function handleUrls(callback) {
                    // Process the URLs in parallel since order doesn't matter
                    parallel(urlTasks, callback);
                }
            ],
            function(err) {
                if (err) {
                    return callback(err);
                }

                var depthString = '';
                for (var i=0; i<depth; i++) {
                    depthString += '+';
                }

                if (depthString.length) {
                    depthString += ' ';
                }

                var lessCode = parsedLess.getLessCode();

                var separatorChar = separatorChars[depth % separatorChars.length];

                var prefix = '/* ' + depthString + 'BEGIN "' + relativePath + '" */\n';
                var suffix = '/* ' + depthString + 'END   "' + relativePath + '" */\n';
                prefix = separator(prefix, separatorChar) + prefix;
                suffix = suffix + separator(suffix, separatorChar);

                callback(null, prefix + lessCode + '\n' + suffix);
                // console.log('PROCESSING END: ', relativePath);
            });

    }

    var work = lessDependencies.map(function(lessDependency) {
        return function(callback) {
            var path = lessDependency.path;
            var url = lessDependency.url;
            var key = path || url;

            if (key && foundImports[key]) {
                callback();
            } else {
                if (key) {
                    foundImports[key] = true;
                }

                loader.loadLessDependency(lessDependency, function(err, parsedLess) {
                    if (err) {
                        return callback(err);
                    }

                    processLessFile(parsedLess, 0, function(err, lessCode) {
                        if (err) {
                            return callback(err);
                        }

                        output.push(lessCode);
                        callback();
                    });
                });
            }
        };
    });

    series(work, function(err) {
        if (err) {
            return callback(err);
        }

        var lessCode = output.join('\n');
        lessCode += '\n.x {}'; // HACK: Less is removing trailing comments and this hack
                               // fixes that. .x {} doesn't get rendered since it is empty

        // console.log('LESS OUTPUT: ', lessCode);
        callback(null, {
            lessCode: lessCode,
            hasUnresolvedUrls: hasUnresolvedUrls
        });
    });
};
