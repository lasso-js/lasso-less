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
    var errString = err.toString();
    expect(errString).to.contain('variable @doesNotExist is undefined');
    expect(errString).to.contain(':4:15');
};