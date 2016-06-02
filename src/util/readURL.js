var nodeUrl = require('url');
var http = require('http');
var https = require('https');

module.exports = function readURL(url, callback) {
    if (url.charAt(0) === '/') {
        url = 'http:' + url;
    }

    var parsedUrl = nodeUrl.parse(url);
    var isSecure = parsedUrl.protocol === 'https:';
    var get = isSecure ? https.get : http.get;

    var options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || (isSecure ? 443 : 80),
        path: parsedUrl.pathname + (parsedUrl.search ? parsedUrl.search : '')
    };

    var code = '';

    var req = get(options, function(res) {
        if (res.statusCode < 200 || res.statusCode >= 300) {
            callback(new Error('Request to ' + url + ' failed with a HTTP status code ' + res.statusCode));
            return;
        }

        res
            .on('end', function() {
                console.log('READING DONE:', options);

                callback(null, code);
            })
            .on('error', function(err) {
                callback(err);
            })
            .on('data', function(data) {
                code += data;
            });
    });

    req.on('error', function(err) {
        callback(new Error('Request to ' + url + ' failed. Error: ' + (err.stack || err)));
    });
};