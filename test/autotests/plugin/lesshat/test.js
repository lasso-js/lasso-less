var expect = require('chai').expect;

exports.getLassoConfig = function(lassoLessPlugin) {
    return {
        fingerprintsEnabled: true,
        urlPrefix: '/static',
        plugins: [
            {
                plugin: lassoLessPlugin,
                config: {
                    lessConfig: {
                        strictMath: true,
                        javascriptEnabled: true
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
