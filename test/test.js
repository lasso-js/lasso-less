'use strict';
var chai = require('chai');
chai.config.includeStack = true;
require('chai').should();
var expect = require('chai').expect;
var nodePath = require('path');
var fs = require('fs');

var lessPlugin = require('../'); // Load this module just to make sure it works
var lasso = require('lasso');

require('raptor-logging').configureLoggers({
    'lasso-less': 'WARN'
});

describe('lasso-less' , function() {

    beforeEach(function(done) {
        for (var k in require.cache) {
            if (require.cache.hasOwnProperty(k)) {
                delete require.cache[k];
            }
        }
        done();
    });

    it('should render a complex less dependency', function(done) {

        var myLasso = lasso.create({
                fingerprintsEnabled: false,
                outputDir: nodePath.join(__dirname, 'static'),
                bundlingEnabled: true,
                plugins: [
                    {
                        plugin: lessPlugin,
                        config: {

                        }
                    }
                ]
            });

        myLasso.lassoPage({
                name: 'testPage',
                dependencies: [
                    nodePath.join(__dirname, 'fixtures/complex.less')
                ]
            },
            function(err, lassoPageResult) {
                if (err) {
                    return done(err);
                }

                var actual = fs.readFileSync(nodePath.join(__dirname, 'static/testPage.css'), {encoding: 'utf8'});
                var expected = fs.readFileSync(nodePath.join(__dirname, 'fixtures/complex.less.expected.css'), {encoding: 'utf8'});
                fs.writeFileSync(nodePath.join(__dirname, 'fixtures/complex.less.actual.css'), actual, {encoding: 'utf8'});
                expect(actual).to.equal(expected);
                done();
            });
    });

    it('should render a node module less dependency', function(done) {

        var myLasso = lasso.create({
                fingerprintsEnabled: false,
                outputDir: nodePath.join(__dirname, 'static'),
                bundlingEnabled: true,
                plugins: [
                    {
                        plugin: lessPlugin,
                        config: {

                        }
                    }
                ]
            });

        myLasso.lassoPage({
                name: 'testPage',
                dependencies: [
                    "require: installed/style.less"
                ],
                from: nodePath.join(__dirname, 'fixtures')
            },
            function(err, lassoPageResult) {
                if (err) {
                    return done(err);
                }

                var actual = fs.readFileSync(nodePath.join(__dirname, 'static/testPage.css'), {encoding: 'utf8'});
                fs.writeFileSync(nodePath.join(__dirname, 'fixtures/installed.less.actual.css'), actual, {encoding: 'utf8'});
                var expected = fs.readFileSync(nodePath.join(__dirname, 'fixtures/installed.less.expected.css'), {encoding: 'utf8'});
                expect(actual).to.equal(expected);
                done();
            });

    });

    it('should handling bundling correctly', function(done) {

        var myLasso = lasso.create({
                fingerprintsEnabled: false,
                outputDir: nodePath.join(__dirname, 'static'),
                bundlingEnabled: true,
                plugins: [
                    {
                        plugin: lessPlugin,
                        config: {

                        }
                    }
                ],
                bundles: [
                    {
                        name: 'baz',
                        dependencies: [
                            nodePath.join(__dirname, 'fixtures/bundling/baz/browser.json')
                        ]
                    }
                ]
            });

        myLasso.lassoPage({
                name: 'testPage',
                dependencies: [
                    nodePath.join(__dirname, 'fixtures/bundling/browser.json')
                ],
                from: nodePath.join(__dirname, 'fixtures')
            },
            function(err, lassoPageResult) {
                if (err) {
                    return done(err);
                }

                var outputFiles = lassoPageResult.getCSSFiles();
                expect(outputFiles.length).to.equal(3);


                var actualPageCSS = fs.readFileSync(nodePath.join(__dirname, 'static/testPage.css'), {encoding: 'utf8'});
                var actualAsyncCSS = fs.readFileSync(nodePath.join(__dirname, 'static/testPage-async.css'), {encoding: 'utf8'});
                var actualBundleCSS = fs.readFileSync(nodePath.join(__dirname, 'static/baz.css'), {encoding: 'utf8'});

                fs.writeFileSync(nodePath.join(__dirname, 'fixtures/bundling.less.testPage.actual.css'), actualPageCSS, {encoding: 'utf8'});
                fs.writeFileSync(nodePath.join(__dirname, 'fixtures/bundling.less.testPage-async.actual.css'), actualAsyncCSS, {encoding: 'utf8'});
                fs.writeFileSync(nodePath.join(__dirname, 'fixtures/bundling.less.baz.actual.css'), actualBundleCSS, {encoding: 'utf8'});


                var expectedPageCSS = fs.readFileSync(nodePath.join(__dirname, 'fixtures/bundling.less.testPage.expected.css'), {encoding: 'utf8'});
                var expectedAsyncCSS = fs.readFileSync(nodePath.join(__dirname, 'fixtures/bundling.less.testPage-async.expected.css'), {encoding: 'utf8'});
                var expectedBundleCSS = fs.readFileSync(nodePath.join(__dirname, 'fixtures/bundling.less.baz.expected.css'), {encoding: 'utf8'});

                expect(actualPageCSS).to.equal(expectedPageCSS);
                expect(actualAsyncCSS).to.equal(expectedAsyncCSS);
                expect(actualBundleCSS).to.equal(expectedBundleCSS);

                done();
            });

    });

    it('should work correctly when bundling is disabled', function(done) {

        var myLasso = lasso.create({
                fingerprintsEnabled: false,
                outputDir: nodePath.join(__dirname, 'static'),
                bundlingEnabled: false,
                plugins: [
                    {
                        plugin: lessPlugin,
                        config: {

                        }
                    }
                ],
                bundles: [
                    {
                        name: 'baz',
                        dependencies: [
                            nodePath.join(__dirname, 'fixtures/bundling/baz/browser.json')
                        ]
                    }
                ]
            });

        myLasso.lassoPage({
                name: 'testPage',
                dependencies: [
                    nodePath.join(__dirname, 'fixtures/bundling/browser.json')
                ],
                from: nodePath.join(__dirname, 'fixtures')
            },
            function(err, lassoPageResult) {
                if (err) {
                    return done(err);
                }

                var outputFiles = lassoPageResult.getCSSFiles();
                expect(outputFiles.length).to.equal(2);


                var actualPageCSS = fs.readFileSync(nodePath.join(__dirname, 'static/testPage.css'), {encoding: 'utf8'});
                var actualAsyncCSS = fs.readFileSync(nodePath.join(__dirname, 'static/testPage-async.css'), {encoding: 'utf8'});

                fs.writeFileSync(nodePath.join(__dirname, 'fixtures/unbundled.less.testPage.actual.css'), actualPageCSS, {encoding: 'utf8'});
                fs.writeFileSync(nodePath.join(__dirname, 'fixtures/unbundled.less.testPage-async.actual.css'), actualAsyncCSS, {encoding: 'utf8'});

                var expectedPageCSS = fs.readFileSync(nodePath.join(__dirname, 'fixtures/unbundled.less.testPage.expected.css'), {encoding: 'utf8'});
                var expectedAsyncCSS = fs.readFileSync(nodePath.join(__dirname, 'fixtures/unbundled.less.testPage-async.expected.css'), {encoding: 'utf8'});

                expect(actualPageCSS).to.equal(expectedPageCSS);
                expect(actualAsyncCSS).to.equal(expectedAsyncCSS);

                done();
            });

    });

    it('should handle errors', function(done) {

        var myLasso = lasso.create({
                fingerprintsEnabled: false,
                outputDir: nodePath.join(__dirname, 'static'),
                bundlingEnabled: true,
                plugins: [
                    {
                        plugin: lessPlugin,
                        config: {

                        }
                    }
                ]
            });

        myLasso.lassoPage({
                name: 'testPage',
                dependencies: [
                    nodePath.join(__dirname, 'fixtures/error.less')
                ]
            },
            function(err, lassoPageResult) {
                expect(!!err).to.equal(true);
                done();
            });
    });

    it('should render a less dependency with images', function(done) {

        var myLasso = lasso.create({
                fingerprintsEnabled: false,
                outputDir: nodePath.join(__dirname, 'static'),
                bundlingEnabled: true,
                plugins: [
                    {
                        plugin: lessPlugin,
                        config: {

                        }
                    }
                ]
            });

        myLasso.lassoPage({
                name: 'testPage',
                dependencies: [
                    nodePath.join(__dirname, 'fixtures/images.less')
                ]
            },
            function(err, lassoPageResult) {
                if (err) {
                    return done(err);
                }

                var actual = fs.readFileSync(nodePath.join(__dirname, 'static/testPage.css'), {encoding: 'utf8'});
                var expected = fs.readFileSync(nodePath.join(__dirname, 'fixtures/images.less.expected.css'), {encoding: 'utf8'});
                fs.writeFileSync(nodePath.join(__dirname, 'fixtures/images.less.actual.css'), actual, {encoding: 'utf8'});
                expect(actual).to.equal(expected);
                done();
            });
    });

});
