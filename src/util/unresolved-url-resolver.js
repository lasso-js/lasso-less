var tokenizerRegExp = /unresolved:\/\/([^$]+)\$([^$]+)\$/g;
var nodePath = require('path');
var series = require('async').series;
var extend = require('raptor-util/extend');

function Parsed(originalCode) {
    this.originalCode = originalCode;
    this.parts = [];
}

Parsed.prototype = {
    getCssCode: function() {
        var code = this.originalCode;

        for (var i = this.parts.length-1; i>=0; i--) {
            var part = this.parts[i];

            var start = part.start;
            var end = part.end;
            var replacement = part.replacement;

            if (replacement != null) {
                code = code.substring(0, start) + replacement + code.substring(end);
            }
        }

        return code;
    }
};

function parse(code) {
    var parsed = new Parsed(code);

    tokenizerRegExp.lastIndex = 0;
    var matches;

    while((matches = tokenizerRegExp.exec(code)) != null) {
        var match = matches[0];
        var path = matches[1];
        var url = matches[2];
        var dir = nodePath.dirname(path);

        parsed.parts.push({
            path: path,
            dir: dir,
            url: url,
            start: matches.index,
            end: matches.index + match.length
        });
    }

    return parsed;
}

var resolvers = [
    function defaultUrlResolver(url, context, callback) {
        context.urlResolver(url, context, callback);
    }
];

function resolveUrl(part, context, callback) {
    var i=0;

    context = extend({}, context);
    context.path = part.path;
    context.dir = part.dir;
    var url = part.url;

    function tryNextResolver() {
        var resolver = resolvers[i];
        resolver(url, context, function(err, result) {
            if (!err && result) {
                callback(null, result);
            } else {
                if (++i < resolvers.length) {
                    // Move to the next resolver
                    process.nextTick(tryNextResolver);
                } else {
                    // All of the resolvers failed...
                    callback(new Error('Unable to resolve URL "' + url + '" found in file "' + context.path + '".'));
                }
            }
        });
    }

    tryNextResolver();
}

exports.resolveUrls = function(css, context, callback) {

    // console.log('CSS: ', css);
    var parsed = parse(css);

    var work = parsed.parts.map(function(part) {
        return function(callback) {
            resolveUrl(part, context, function(err, result) {
                if (err) {
                    return callback(err);
                }

                part.replacement = result;
                callback();
            });
        };
    });


    series(work, function(err) {
        if (err) {
            return callback(err);
        }

        var cssCode = parsed.getCssCode();
        callback(null, cssCode);
    });
};