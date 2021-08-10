require('raptor-polyfill/string/startsWith');

var lassoPackageRoot = require('lasso-package-root');
var nodePath = require('path');
var REQUIRE_PREFIX = /^(?:require\s*:\s*|~)([^?]+?)(\?.*?)\s*$/;
var assert = require('assert');
var absoluteUrlRegExp = /^((http:|https:)?\/\/)|data:/;

module.exports = function urlResolver(url, context, callback) {

    if (absoluteUrlRegExp.test(url)) {
        return callback(null, url);
    }

    var from = context.dir;
    assert(from != null, '"dir" expected');

    var file = null;
    var prefixMatch = null;

    if (url.charAt(0) === '/') {
        var rootDir = lassoPackageRoot.getRootDir(from);
        file = nodePath.join(rootDir, url);
    } else if ((prefixMatch = REQUIRE_PREFIX.exec(url))) {
        file = context.lassoContext.dependency.resolvePath(prefixMatch[1]) + (prefixMatch[2] || "");
    } else {
        // Relative path such as "./foo.png" or "foo.png"
        file = nodePath.resolve(from, url);
    }

    var lasso = context.lasso;
    assert.ok(lasso, '"lasso" expected');
    var lassoContext = context.lassoContext;

    function onDone (err, lassoedResource) {
        if (err) {
            return callback(err);
        }

        if (lassoedResource && lassoedResource.url) {
            callback(null, lassoedResource.url);
        } else {
            callback(new Error('Invalid result for file "' + file + '"'));
        }
    }

    var lassoResourceResult = lasso.lassoResource(file, {lassoContext: lassoContext}, onDone);

    if (lassoResourceResult && lassoResourceResult.then) {
        lassoResourceResult
            .then(function (lassoResource) {
                onDone(null, lassoResource);
            })
            .catch(function (err) {
                onDone(err);
            });
    }
};
