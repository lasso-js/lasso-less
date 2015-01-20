var tokenizerRegExp = /\@import\s+"([^"]*)"\s*;|url\(\s*"([^\)]*)"\s*\)|url\(\s*'([^\)]*)'\s*\)|url\(([^\)]*)\)|\/\*|\*\/|\/\/|\n|\r|\\\\|\\"|"/g;
var nodePath = require('path');
var requireRegExp = /^require\s*:\s*(.+)$/;
var resolveFrom = require('resolve-from');

function Part(parsedLess, type, text, start, end) {
    this.parsedLess = parsedLess;
    this.type = type;
    this.text = text;
    this.start = start;
    this.end = end;
    this.replacement = null;

    this.importPath = null;
}

Part.prototype = {
    replaceWith: function(value) {
        this.replacement = value;
    },

    isImport: function() {
        return this.type === 'import';
    },

    isUrl: function() {
        return this.type === 'url';
    },

    getImportPath: function() {
        if (this.importPath == null) {
            var importPath = this.text;

            var dirname = this.parsedLess.dirname;

            var requireMatches = requireRegExp.exec(importPath);

            if (requireMatches){
                importPath = requireMatches[1].trim();
                importPath = resolveFrom(dirname, importPath);
            } else {
                importPath = nodePath.resolve(dirname, importPath);
            }

            this.importPath = importPath;
        }

        return this.importPath;
    },

    getUrl: function() {
        return this.text;
    },

    getDirname: function() {
        return this.parsedLess.dirname;
    }
};

function ParsedLess(originalCode, path) {
    this.originalCode = originalCode;
    this.path = path;
    this.dirname = nodePath.dirname(path);
    this.parts = [];
}

ParsedLess.prototype = {
    _addPart: function(type, text, start, end) {
        this.pendingCount++;
        this.parts.push(new Part(this, type, text, start, end));
    },

    getParts: function() {
        return this.parts;
    },

    getDirname: function() {
        return this.dirname;
    },

    getPath: function() {
        return this.path;
    },

    getLessCode: function() {
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

module.exports = {
    parse: function(code, path) {
        var parsed = new ParsedLess(code, path);

        var matches;
        var inMultiLineComment = false;
        var inSingleLineComment = false;
        var inString = false;

        while((matches = tokenizerRegExp.exec(code)) != null) {
            var importPath;
            var url;
            var match = matches[0];

            if (inSingleLineComment) {
                if (match === '\n' || match === '\r') {
                    inSingleLineComment = false;
                }
            } else if (inMultiLineComment) {
                if (match === '*/') {
                    inMultiLineComment = false;
                }
            } else if (inString) {
                if (match === '"') {
                    inString = false;
                }
            } else if (match === '\\*') {
                inMultiLineComment = true;
            } else if (match === '//') {
                inSingleLineComment = true;
            }  else if (match === '"') {
                inString = true;
            } else if ((importPath = matches[1])) {

                parsed._addPart(
                    'import',
                    importPath.trim(),
                    matches.index,
                    matches.index + match.length);
            } else if ((url = (matches[2] || matches[3] || matches[4]))) {
                parsed._addPart(
                    'url',
                    url.trim(),
                    matches.index + match.indexOf('(')+1,
                    matches.index + match.lastIndexOf(')'));
            }
        }

        return parsed;
    }
};