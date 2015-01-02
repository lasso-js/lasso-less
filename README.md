# Optimizer Less

Optimizer plugin to support compilation of less dependencies

### Installation

```sh
npm install optimizer-less --save
```

### Register to the Optimizer
register the `optimizer-less` plugin to the Optimizer
```sh 
require('optimizer').configure({
   ...
   plugins:
    [{
        plugin: 'optimizer-less',
        config:{
        }
    }]
    ...
});
```
### Basic Usage
**Optimizer.json**
```sh
{
	"dependencies": [
		"./lib/large.less",
		"./lib/medium.less"
	]
}
```

### Advance Usage
To `import ` less files to an existing less file use the technique below.

To import a less file from a node modules use :
   - `require: [NPM_MODULE]/PATH_TO_LESS_FILE.less` you can load npm modules that contain less files.

Dependencies get loaded by order in the `imports` array.

```sh
{
	"dependencies": [
		"./lib/large.less",
		"./lib/medium.less",
	    {
			"path": "./lib/small.less", 
			"imports": [
                "require: slashui-mixins/mixins.less",
                "./lib/common.less"
            ]
		}
	]
}
```
