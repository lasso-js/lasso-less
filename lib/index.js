var less = require('less');

module.exports = function(optimizer, config) {
    config.less = config.less || less;
    optimizer.dependencies.registerStyleSheetType('less', require('./dependency-less')(config, optimizer));
    optimizer.dependencies.registerPackageType('less-import', require('./dependency-less-import')(config, optimizer));
};