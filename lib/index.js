var less = require('less');

module.exports = function(lasso, config) {
    config.less = config.less || less;
    lasso.dependencies.registerStyleSheetType('less', require('./dependency-less')(config, lasso));
    lasso.dependencies.registerPackageType('less-import', require('./dependency-less-import')(config, lasso));
};