var extend = require('raptor-util/extend');
var nodePath = require('path');
var logger = require('raptor-logging').logger(module);
var loader = require('./util/less-loader');
var unresolvedUrlResolver = require('./util/unresolved-url-resolver');
var defaultUrlResolver = require('./util/default-url-resolver');

module.exports = function create(config, lasso) {
    var less = config.less;

    return {
        properties: {
            path: 'string'
        },

        init: function(lassoContext, callback)  {
            if (!this.path) {
                return callback(new Error('"path" is required'));
            }

            this.path = this.resolvePath(this.path);

            var _this = this;

            this.on('addedToBundle', function(event) {
                var bundle = event.bundle;
                var bundleData = bundle.data;

                var lessDependencies = bundleData.lessDependencies;
                if (lessDependencies) {
                    lessDependencies.push(_this);
                } else {
                    _this._lessDependencies = bundleData.lessDependencies = [_this];
                }
            });

            callback();
        },

        getDir: function() {
            return nodePath.dirname(this.path);
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

                var lessCode = result.lessCode;

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
            return this.path;
        },

        // Since we are resolving the resource URLs in the CSS files, we set a flag
        // to tell the lasso-resolve-css-urls to not bother transforming the
        // CSS that this dependency produces
        resolveCssUrlsEnabled: false
    };
};
