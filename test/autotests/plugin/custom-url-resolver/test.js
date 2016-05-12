var expect = require('chai').expect;

exports.getLassoConfig = function(lassoLessPlugin) {
    return {
        fingerprintsEnabled: true,
        urlPrefix: '/static',
        plugins: [
            {
                plugin: lassoLessPlugin,
                config: {
                    urlResolver: function(url, context, callback) {
                        if (/^foo:/.test(url)) {
                            callback(null, url.substring(4).toUpperCase());
                        } else {
                            context.defaultUrlResolver(url, context, callback);
                        }
                    }
                }
            }
        ]
    };
};

exports.getLassoOptions = function() {
    return {
        dependencies: [
            require.resolve('./browser.json')
        ]
    };
};