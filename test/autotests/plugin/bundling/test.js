var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

exports.getLassoConfig = function(lassoLessPlugin) {
    return {
        fingerprintsEnabled: false,
        bundlingEnabled: true,
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
    expect(outputFiles.length).to.equal(3);

    function readFile(basename) {
        for (var i=0; i<outputFiles.length; i++) {
            var file = outputFiles[i];
            if (path.basename(file) === basename) {
                return fs.readFileSync(file, { encoding: 'utf8' });
            }
        }
        return `(not found: ${basename})`;
    }

    helpers.compare(readFile('bundling.css'), '-page.css');
    helpers.compare(readFile('bundling-async.css'), '-async.css');
    helpers.compare(readFile('baz.css'), '-baz.css');
};