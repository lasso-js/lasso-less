var expect = require('chai').expect;
var fs = require('fs');

exports.getLassoConfig = function(lassoLessPlugin) {
    return {
        fingerprintsEnabled: true,
        urlPrefix: '/static',
        plugins: [
            {
                plugin: lassoLessPlugin,
                config: {
                    extensions: ['less', 'css', 'config']
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

exports.check = function(lassoPageResult, helpers) {
    var cssFile = lassoPageResult.getCSSFiles()[0];
    var css;
    if (cssFile) {
        css = fs.readFileSync(cssFile, { encoding: 'utf8' });
    } else {
        css = '';
    }

    helpers.compare(css, '.css');
};