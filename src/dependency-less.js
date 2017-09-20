var extend = require('raptor-util/extend');
var nodePath = require('path');
var logger = require('raptor-logging').logger(module);
var loader = require('./util/less-loader');
var unresolvedUrlResolver = require('./util/unresolved-url-resolver');
var defaultUrlResolver = require('./util/default-url-resolver');
var urlRegExp = /^(http:|https:)?\/\//;

module.exports = function create(config, lasso) {
    var less = config.less;

    return {
        properties: {
            path: 'string',
            virtualPath: 'string',
            url: 'string',
            code: 'string',
            external: 'boolean'
        },

        init: function(lassoContext, callback)  {
            var path = this.path;

            if (path && urlRegExp.test(path)) {
                this.url = path;
                path = null;
                delete this.path;
            }

            if (this.url && this.external !== false) {
                // This is an external CSS/Less file and we will
                // just use the external URL and not merge in
                // the code with the rest of the Less code
            } else if (path || this.url || this.code) {
                if (path) {
                    this.path = this.resolvePath(path);
                }

                var self = this;

                this.on('addedToBundle', function(event) {
                    var bundle = event.bundle;
                    var bundleData = bundle.data;

                    var lessDependencies = bundleData.lessDependencies;
                    if (lessDependencies) {
                        lessDependencies.push(self);
                    } else {
                        self._lessDependencies = bundleData.lessDependencies = [self];
                    }
                });
            } else {
                var error = new Error('"path" or "url" is required');
                if (callback) {
                    return callback(error);
                } else {
                    throw error;
                }
            }

            if (callback) callback();
        },

        getDir: function() {
            if (this.dir) {
                return this.dir;
            }

            var path = this.path || this.virtualPath;
            return path ? nodePath.dirname(path) : undefined;
        },

        read: function(lassoContext, callback) {
            var lessDependencies = this._lessDependencies;

            if (!lessDependencies) {
                return null;
            }

            var lessImportDependencies = lassoContext.data.lessImportDependencies;
            // console.log('lessImportDependencies: ', lessImportDependencies);
            if (lessImportDependencies) {
                lessDependencies = lessImportDependencies.concat(lessDependencies);
            }

            var urlResolver = config.urlResolver || defaultUrlResolver;

            var context = {
                lassoContext: lassoContext,
                pluginConfig: config,
                urlResolver: urlResolver,
                lasso: lassoContext.lasso,
                defaultUrlResolver: defaultUrlResolver
            };

            var completed = false;

            function errorCallback(err){
                // logger.error(err);

                if (completed) {
                    return;
                }
                completed = true;
                callback(err);
            }

            loader.load(lessDependencies, context, function(err, result) {
                if (err) {
                    return callback(err);
                }

                var lessCode = result.lessCode;

                function renderCallback(err, output) {
                    if (err) {
                        if (err.line !== null &&  err.column !== null) {
                            var errorIndex = err.index;
                            var errorMessage = '\n' + err.message;
                            var lines = lessCode.split('\n');
                            var badLine = lines[err.line - 1];

                            errorMessage += ':\n' + badLine + '\n'+ new Array(err.column+1).join(" ") + '^';

                            var wrappedError = new Error(errorMessage);
                            wrappedError.index = errorIndex;
                            wrappedError.src = lessCode;
                            wrappedError.code = 'LESS_SYNTAX_ERROR';
                            err = wrappedError;
                        }
                        errorCallback(err);
                        return;
                    }

                    if (completed) {
                        return;
                    }

                    completed = true;

                    logger.info('Finished rendering Less dependencies.');

                    // LESS v2+ returns an object with "css" property.
                    // Old versions returned just the CSS.
                    var css = (output.css === null) ? output : output.css;

                    if (result.hasUnresolvedUrls) {
                        // One more pass to resolve dynamic URLs
                        unresolvedUrlResolver.resolveUrls(css, context, callback);
                    } else {
                        callback(null, css);
                    }
                }

                var parseConfig = {
                    filename: 'lasso.less',
                    paths: [process.cwd()]
                };
                if (config.lessConfig) {
                    extend(parseConfig, config.lessConfig);
                }

                less.render(
                    lessCode,
                    parseConfig,
                    renderCallback);
            });
        },

        calculateKey: function() {
            return 'less:' + (this.code || this.virtualPath || this.path || this.url);
        },

        // Since we are resolving the resource URLs in the CSS files, we set a flag
        // to tell the lasso-resolve-css-urls to not bother transforming the
        // CSS that this dependency produces
        resolveCssUrlsEnabled: false,

        getUnbundledTarget: function() {
            return 'lasso-less';
        },

        isExternalResource: function() {
            return this.url != null && this.external !== false;
        },

        getUrl: function() {
            if (this.external !== false) {
                return this.url;
            }
        }
    };
};
