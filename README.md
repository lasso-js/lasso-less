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

URLs in the form `url(path)` inside Less files will automatically be resolved by the lasso. For example:

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

The `lasso-less` plugin resolves resource URLs (e.g. `url(logo.png)`) before the CSS is produced. Therefore, the following is __not allowed__ since Less variables are not allowed in the `url()` function:

```css
/* BAD! ☹ */

@logo-image: "logo.png";

.foo {
    background-image: url("@{logo-image}");
}
```

Instead, you must do the following:

```css
/* GOOD! ☺ */

@logo-image: url(logo.png);

.foo {
    background-image: @logo-image;
}
```
