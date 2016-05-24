var expect = require('chai').expect;

exports.getLassoConfig = function(lassoLessPlugin) {
    return {
        fingerprintsEnabled: true,
        urlPrefix: '/static',
        plugins: [
            {
                plugin: lassoLessPlugin,
                config: {}
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

exports.checkError = function(err) {
    expect(err.message).to.contain("missing semi-colon or unrecognised media features on import");
    expect(err.message).to.contain("\n@import \"import2.less;\n^");
};