var less = require('less');

module.exports = function(lasso, config) {
    config.less = config.less || less;

    var extensions = config.extensions || ['less'];
    extensions.forEach(function(ext) {
        var type = ext.charAt(0) === '.' ? ext.substring(1) : ext;
        lasso.dependencies.registerStyleSheetType(type, require('./dependency-less')(config, lasso));
    });

    lasso.dependencies.registerPackageType('less-import', require('./dependency-less-import')(config, lasso));
};