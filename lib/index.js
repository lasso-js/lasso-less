var less = require('less');

module.exports = function(optimizer, config) {
    config.less = config.less || less;
    optimizer.dependencies.registerStyleSheetType('less-renderer', require('./dependency-less-renderer')(config, optimizer));
    optimizer.dependencies.registerPackageType('less', require('./dependency-less')(config, optimizer));
};