var LessContext = require('./LessContext');
var loader = require('./loader');
var logger = require('raptor-logging').logger(module);

module.exports = function create(config, optimizer) {
    var less = config.less;

    return {
        cache: false,

        properties: {
            path: 'string'
        },

        resolveCssUrlsEnabled: false,

        init: function(optimizerContext, callback) {
            callback();
        },

        read: function(optimizerContext, callback) {
            var lessContext = LessContext.getLessContext(optimizerContext);
            var lessDependencies = lessContext.getLessDependencies();

            var completed = false;

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

                logger.info('Finished rendering Less dependencies.');

                // LESS v2+ returns an object with "css" property.
                // Old versions returned just the CSS.
                var css = (output.css === null) ? output : output.css;

                // console.log("CSS OUTPUT: ", css);
                callback(null, css);
            }

            loader.load(lessDependencies, lessContext, config, function(err, lessCode) {
                if (err) {
                    return callback(err);
                }

                var parseConfig = {
                    filename: 'optimizer.less',
                    paths: [process.cwd()]
                };

                less.render(
                    lessCode,
                    parseConfig,
                    renderCallback);
            });


        },

        calculateKey: function() {
            return 'less-renderer';
        }
    };
};
