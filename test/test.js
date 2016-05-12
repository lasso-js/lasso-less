'use strict';
var nodePath = require('path');
require('chai').config.includeStack = true;

var rmdirRecursive = require('./util').rmdirRecursive;
var buildDir = nodePath.join(__dirname, 'build');

var lasso = require('lasso');
var lassoLessPlugin = require('../');
var fs = require('fs');

describe('lasso-less/plugin' , function() {
    require('./autotest').scanDir(
        nodePath.join(__dirname, 'autotests/plugin'),
        function (dir, helpers, done) {

            var main = require(nodePath.join(dir, 'test.js'));
            var testName = nodePath.basename(dir);
            var pageName = testName;

            var lassoConfig = main.getLassoConfig && main.getLassoConfig(lassoLessPlugin);
            if (!lassoConfig) {
                lassoConfig = {
                    fingerprintsEnabled: true,
                    urlPrefix: '/static',
                    plugins: [
                        {
                            plugin: lassoLessPlugin,
                            config: {}
                        }
                    ]
                };
            }

            if (!lassoConfig.outputDir) {
                lassoConfig.outputDir = nodePath.join(buildDir, pageName);
            }

            rmdirRecursive(lassoConfig.outputDir);

            var myLasso = lasso.create(lassoConfig, dir);

            var inputs;

            let lassoOptions = main.getLassoOptions(dir) || {};


            let check = main.check;

            inputs = [
                {
                    lassoOptions,
                    check
                }
            ];

            var checkError = main.checkError;

            if (!lassoOptions.pageName) {
                lassoOptions.pageName = pageName;
            }

            if (!lassoOptions.from) {
                lassoOptions.from = dir;
            }

            myLasso.lassoPage(lassoOptions)
                .then((lassoPageResult) => {
                    if (checkError) {
                        return done('Error expected');
                    }

                    if (main.check) {
                        main.check(lassoPageResult, helpers);
                    } else {
                        var css = fs.readFileSync(lassoPageResult.getCSSFiles()[0], { encoding: 'utf8' });
                        helpers.compare(css, '.css');
                    }

                    lasso.flushAllCaches(done);
                })
                .catch((err) => {
                    if (checkError) {
                        checkError(err);
                        done();
                    } else {
                        throw err;
                    }
                })
                .catch(done);
        });
});