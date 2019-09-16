var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

exports.getLassoConfig = function(lassoLessPlugin) {
    return {
        fingerprintsEnabled: false,
        bundlingEnabled: false,
        urlPrefix: '/static',
        plugins: [
            {
                plugin: lassoLessPlugin,
                config: {}
            }
        ],
        bundles: [
            {
                name: 'baz',
                dependencies: [
                    require.resolve('./baz/browser.json')
                ]
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



exports.check = function(lassoPageResult, helpers) {
    var outputFiles = lassoPageResult.getCSSFiles();
    expect(outputFiles.length).to.equal(2);

    helpers.compare(fs.readFileSync(outputFiles[0], { encoding: 'utf8' }), '-async.css');
    helpers.compare(fs.readFileSync(outputFiles[1], { encoding: 'utf8' }), '-page.css');
};