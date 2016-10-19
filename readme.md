# work-q [![Build Status](https://travis-ci.org/bendrucker/work-q.svg?branch=master)](https://travis-ci.org/bendrucker/work-q)

> Worker queue interface for [AMQP](https://en.wikipedia.org/wiki/Advanced_Message_Queuing_Protocol)


## Install

```
$ npm install --save work-q
```


## Usage

```js
const Worker = require('work-q')
const worker = Worker({
  connection: 'amqp://localhost'  
})

worker.connect(function (err) {
  if (err) return fail(err)

  worker.listen('my-queue', function (err) {
    if (err) return fail(err)
  })
})

worker.on('data', function (queue, data, callback) {
  console.log('new message on ' + queue)
  console.log(JSON.stringify(data))
  callback()
})

function fail (err) {
  console.error(err)
  return process.exit(1)
}
```

## API

#### `Worker(options)` -> `worker`

Constructs a new worker. 

##### options

Options for configuring the worker's behavior.

###### connection

*Required*  
Type: `string`

An AMQP connection string.

###### parse

Type: `function`  
Default: `JSON.parse`

A function used to parsed the inbound messages.

#### `worker.connect(callback)` -> `undefined`

Connects to the AMQP server and establishes a channel. 

##### callback

*Required*  
Type: `function`  
Arguments: `err`

A callback to be called when the connection and channel are established and usable.

#### `worker.close(callback)` -> `undefined`

Closes the worker connection.

##### callback

*Required*  
Type: `function`  
Arguments: `err`

A callback to be called when the connection is closed.

#### `worker.listen(queue, callback)` -> `undefined`

Listens on new messages in a queue.

##### queue 

*Required*  
Type: `string`

The queue to consume.

##### callback

*Required*  
Type: `function`  
Arguments: `err`

A callback to be called when the worker is listening on the queue.

#### `worker.unlisten(queue, callback)` -> `undefined`

Stops listening on new messages in a queue.

##### queue 

*Required*  
Type: `string`

The queue name previously passed to `worker.listen`.

##### callback

*Required*  
Type: `function`  
Arguments: `err`

A callback to be called when the worker is no longer listening on the queue.


#### `worker.ping(callback)` -> `undefined`

Asserts a temporary, auto-deleted queue to verify that the connection is usable.

##### callback

*Required*  
Type: `function`  
Arguments: `err`

A callback to be called when the ping is complete.

#### `worker.on('data', callback)` -> `worker`

Listens on new data on all active queues.

##### callback

*Required*  
Type: `function`  
Arguments: `queue, data, done`

A callback to be called with inbound data. 

###### queue

Type: `string`

The queue that received the message.

###### data

Type: `any`

The parsed message data.

##### done

Type: `callback`
Arguments: `err`

A callback you *must* call to acknowledge the message. If an error is passed, the message will be [`nack`ed](https://www.rabbitmq.com/nack.html) and either placed into the dead-letter queue or re-queued, depending on your configuration.

#### `worker.on('error', callback)` -> `worker`

Emitted when the incoming message cannot be parsed. This event *must* be handled or your process will exit when it's emitted.

## License

MIT © [Ben Drucker](http://bendrucker.me)
