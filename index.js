'use strict'

const assert = require('assert')
const EventEmitter = require('events')
const amqp = require('amqplib/callback_api')

module.exports = Worker

function Worker (options) {
  if (!(this instanceof Worker)) {
    return new Worker(options)
  }

  assert(options && options.connection, 'connection is required')

  EventEmitter.call(this)

  this.parse = JSON.parse || options.parse

  this.options = options
  this.connection = null
  this.channel = null
  this.listeners = {}
}

Worker.prototype = Object.create(EventEmitter.prototype)

Worker.prototype.connect = function connect (callback) {
  assert(!this.connection, 'already connected')

  amqp.connect(this.options.connection, (err, connection) => {
    if (err) return callback(err)

    this.connection = connection
    connection.createChannel((err, channel) => {
      if (err) return callback(err)
      this.channel = channel
      callback(null)
    })
  })
}

Worker.prototype.close = function close (callback) {
  return this.connection.close(callback)
}

Worker.prototype.listen = function listen (queue, callback) {
  assert(this.connection, 'connection is required')
  assert(!this.listeners[queue], 'already listening on ' + queue)

  this.channel.assertQueue(queue, this.options.queue, (err, data) => {
    if (err) return callback(err)
    this.emit('queue', data)
    this.channel.consume(queue, onMessage.bind(this, queue), null, (err, data) => {
      if (err) return callback(err)
      this.listeners[queue] = data.consumerTag
      callback()
    })
  })
}

Worker.prototype.unlisten = function unlisten (queue, callback) {
  assert(this.listeners[queue], 'no listener for ' + queue)

  this.channel.cancel(this.listeners[queue], callback)
}

Worker.prototype.ping = function ping (callback) {
  assert(this.connection, 'connection is required')

  this.channel.assertQueue(null, {
    exclusive: true,
    durable: false,
    autoDelete: true
  }, callback)
}

function onMessage (queue, message) {
  this.emit('message', message)

  try {
    this.emit('data', queue, this.parse(message.content), done.bind(this))
  } catch (err) {
    this.emit('error', err)
  }

  function done (err) {
    acknowledge.call(this, err, message)
  }

  function acknowledge (err, message) {
    if (err) return this.channel.nack(message)
    this.channel.ack(message)
  }
}
