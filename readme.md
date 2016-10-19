# work-q [![Build Status](https://travis-ci.org/bendrucker/work-q.svg?branch=master)](https://travis-ci.org/bendrucker/work-q)

> Worker queue interface for [AMQP](https://en.wikipedia.org/wiki/Advanced_Message_Queuing_Protocol)


## Install

```
$ npm install --save work-q
```


## Usage

```js
var workQ = require('work-q')

workQ('input')
//=> output
```

## API

#### `workQ(input, [options])` -> `output`

##### input

*Required*  
Type: `string`

Lorem ipsum.

##### options

###### foo

Type: `boolean`  
Default: `false`

Lorem ipsum.


## License

MIT © [Ben Drucker](http://bendrucker.me)
