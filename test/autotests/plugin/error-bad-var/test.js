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
    expect(err.message).to.contain("variable @WRONG is undefined");
    expect(err.message).to.contain("background-color: @WRONG;\n                      ^");
};