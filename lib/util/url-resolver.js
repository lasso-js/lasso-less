require('raptor-polyfill/string/startsWith');

var raptorModulesUtil = require('raptor-modules/util');
var nodePath = require('path');
var REQUIRE_PREFIX = 'require:';
var resolveFrom = require('resolve-from');

module.exports = function urlResolver(url, from, lassoContext, callback) {
    if (url.charAt(0) === '/' && url.charAt(1) !== '/') {
        var rootDir = raptorModulesUtil.getProjectRootDir();
        return callback(null, nodePath.join(rootDir, url));
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

        return callback(null, requirePath);
    } else {
        // Relative path such as "./foo.png" or "foo.png"
        return callback(null, nodePath.resolve(from, url));
    }

    callback(null, url);
};