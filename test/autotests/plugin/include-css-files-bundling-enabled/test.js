exports.getLassoConfig = function(lassoLessPlugin) {
    return {
        bundlingEnabled: true,
        fingerprintsEnabled: true,
        urlPrefix: '/static',
        plugins: [
            {
                plugin: lassoLessPlugin,
                config: {
                    extensions: ['.css', '.less']
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