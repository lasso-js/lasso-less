module.exports = function(optimizer, config) {
    optimizer.dependencies.registerStyleSheetType(
        'less',
        require('./dependency-less').create(config));
};