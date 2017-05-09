var expect = require('chai').expect;
var fs = require('fs');
var path = require('path');

exports.getLassoConfig = function(lassoLessPlugin) {
    return {
        fingerprintsEnabled: false,
        minify: false,
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
                name: 'common',
                dependencies: [
                    {
                        intersection: [
                            require.resolve('./foo/browser.json')
                        ]
                    }
                ]
            }
        ]
    };
};

exports.getLassoOptions = function() {
    return {
        dependencies: [
            require.resolve('./foo/browser.json')
        ]
    };
};



exports.check = function(lassoPageResult, helpers) {
    var outputFiles = lassoPageResult.getCSSFiles();
    expect(outputFiles.length).to.equal(1);

    function readFile(basename) {
        for (var i=0; i<outputFiles.length; i++) {
            var file = outputFiles[i];
            if (path.basename(file) === basename) {
                return fs.readFileSync(file, { encoding: 'utf8' });
            }
        }
        return `(not found: ${basename})`;
    }

    // helpers.compare(readFile('bundling.css'), '-page.css');
    // helpers.compare(readFile('bundling-async.css'), '-async.css');
    helpers.compare(readFile('common.css'), '-common.css');
};