require('raptor-polyfill/string/startsWith');

var lassoPackageRoot = require('lasso-package-root');
var nodePath = require('path');
var REQUIRE_PREFIX = 'require:';
var resolveFrom = require('resolve-from');
var assert = require('assert');
var absoluteUrlRegExp = /^((http:|https:)?\/\/)|data:/;

module.exports = function urlResolver(url, context, callback) {

    if (absoluteUrlRegExp.test(url)) {
        return callback(null, url);
    }

    var from = context.dir;
    assert(from != null, '"dir" expected');

    var file = null;

    if (url.charAt(0) === '/' && url.charAt(1) !== '/') {
        var rootDir = lassoPackageRoot.getRootDir(from);
        file = nodePath.join(rootDir, url);
    } else if (url.startsWith(REQUIRE_PREFIX)) {
        var requirePath = url.substring(REQUIRE_PREFIX.length).trim();

        var query;
        var pos = requirePath.indexOf('?');
        if (pos !== -1) {
            query = requirePath.substring(pos + 1);
            requirePath = requirePath = requirePath.substring(0, pos);
        }

        requirePath = resolveFrom(from, requirePath);

        if (query) {
            requirePath += '?' + query;
        }

        file = requirePath;
    } else {
        // Relative path such as "./foo.png" or "foo.png"
        file = nodePath.resolve(from, url);
    }

    var lasso = context.lasso;
    assert.ok(lasso, '"lasso" expected');
    var lassoContext = context.lassoContext;

    lasso.lassoResource(file, {lassoContext: lassoContext}, function(err, lassoedResource) {
        if (err) {
            return callback(err);
        }

        if (lassoedResource && lassoedResource.url) {
            callback(null, lassoedResource.url);
        } else {
            callback(new Error('Invalid result for file "' + file + '"'));
        }
    });
};
