var nodePath = require('path');
var logger = require('raptor-logging').logger(module);
var loader = require('./util/less-loader');

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

            var completed = false;

            function errorCallback(err){
                // logger.error(err);

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

                logger.info('Finished rendering Less dependencies.');

                // LESS v2+ returns an object with "css" property.
                // Old versions returned just the CSS.
                var css = (output.css === null) ? output : output.css;

                // console.log("CSS OUTPUT: ", css);
                callback(null, css);
            }

            loader.load(lessDependencies, lassoContext, config, function(err, lessCode) {
                if (err) {
                    return callback(err);
                }

                var parseConfig = {
                    filename: 'lasso.less',
                    paths: [process.cwd()]
                };

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
