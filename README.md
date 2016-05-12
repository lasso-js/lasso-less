lasso-less
==============

[![Build Status](https://travis-ci.org/lasso-js/lasso-less.svg?branch=master)](https://travis-ci.org/lasso-js/lasso-less)

Lasso.js plugin to support compilation of [Less](http://lesscss.org/) CSS dependencies

# Installation

```sh
npm install lasso-less --save
```

The `lasso-less` plugin will then need to be registered as shown below before you can start adding Less dependencies:

```javascript
require('lasso').configure({
    ...
    plugins: [
        'lasso-less',
        ...
    ]
});
```

Configuration can also be passed to the `lasso-less` plugin if needed:

```javascript
require('lasso').configure({
    ...
    plugins: [
        {
            plugin: 'lasso-less',
            config: { /* see below for config options */ }
        },
        ...
    ]
});
```

# Basic Usage

**browser.json**

```json
{
    "dependencies": [
        "./variables.less",
        "./foo.less",
        "./bar.less"
	]
}
```

The `lasso-less` plugin will concatenate all of the Less dependencies targeted for the same bundle and pass that as input to the Less renderer. Therefore, given the following contents of each file:

_variables.less:_

```css
@foo-color: red;
@bar-color: green;
@logo-image: url(logo.png);
```

_foo.less:_

```css
.foo {
    color: @foo-color;
    background-image: @logo-image;
}
```

_bar.less:_

```css
.bar {
    color: @bar-color;
}
```

The output will be the following:

```css
.foo {
    color: red;
    background-image: url(logo-a0db53.png);
}

.bar {
    color: green;
}
```

# Less Imports

You can use `@import` (e.g., `@import "foo.less";`) inside a Less file to import other Less files, but if you want to provide global imports to all Less files across all bundles then you can use the `less-import` dependency type as shown below:

```json
{
	"dependencies": [
        "less-import: ./variables.less",
        "./foo.less",
        "./bar.less"
	]
}
```

The `lasso-less` plugin also supports resolving Less files using the Node.js module resolver. If you need to include a Less file found in an installed module then you can prefix an import with `require:`. For example, given the following directory structure:

```
./
└── node_modules/
    └── my-module/
        └── foo.less
```

The `foo.less` file that is part of the installed `my-module` can then be added as a dependency using either of the following approaches:

_using `@import`:_

```css
@import "require: my-module/foo.less";
```

_using `browser.json`:_

```json
{
    "dependencies": [
        "require: my-module/foo.less"
    ]
}
```

# URLs

URLs in the form `url(<url>)` inside Less files will automatically be resolved by this plugin. Unless the URL is an absolute URL, this plugin will attempt to resolve the URL to an actual file on the file system. After resolving the URL to a file, the file will then be sent through the Lasso.js pipeline to produce the final URL.

_input.less:_

```css
.foo {
    background-image: url(foo.png);
}
```

_output.css:_

```css
.foo {
    background-image: url(/static/foo-a0db53.png);
}
```

It is recommended to avoid putting variables inside a `url()` part. URLs without variables are resolved relative to where the variable is first introduced. URLs with variables are resolved relative to the Less file that makes use of the variable and this will often not be the correct behavior. If you want to change how URLs are resolved, you can provide a custom URL resolver when registering the `lasso-less` plugin (see next section).

To clarify:


```css
/* Not recommended ☹ */

@logo-image: "logo.png";

.foo {
    background-image: url("@{logo-image}");
}
```

Instead, the following is recommended:

```css
/* GOOD! ☺ */

@logo-image: url(logo.png);

.foo {
    background-image: @logo-image;
}
```

## Custom URL Resolver

A custom URL resolver can be provided when registering the `lasso-less` plugin as shown below:

```javascript
require('lasso').configure({
    ...
    plugins: [
        {
            plugin: 'lasso-less',
            config: {
                urlResolver: function(url, context, callback) {
                    if (/^foo:/.test(url)) {
                        callback(null, url.substring(4).toUpperCase());
                    } else {
                        context.defaultUrlResolver(url, context, callback);
                    }
                }
            }
        },
        ...
    ]
});
```

If provided, all URLs will be resolved using the provided URL resolver. For the default implementation please see: [lib/util/default-url-resolver.js](lib/util/default-url-resolver.js)

The `context` argument will contain the following properties:

- `path` - The file system path of the containing Less file
- `dir` - The parent directory of the containing Less file
- `defaultUrlResolver` (`Function(url, context, callback)`) - The default URL resolver
- `pluginConfig` - The configuration passed to the `lasso-less` plugin when registered
- `lasso` - The Lasso.js instance
- `lassoContext` - The Lasso.js context object

## Configuration

### Example config

```javascript
require('lasso').configure({
    ...
    plugins: [
        {
            plugin: 'lasso-less',
            config: {
                extensions: ['less', 'css'],
                lessConfig: { // P
                    strictMath: true,
                    strictUnits: true
                }
            }
        }
    ]
});
```

### Configuration properties

- ___lessConfig___ - Passthrough config options to the Less render (object)
- ___extensions___ - An array of file extensions to process as Less files (array, defaults to `['less']`)
