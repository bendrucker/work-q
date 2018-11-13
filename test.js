'use strict'

const test = require('tape')
const series = require('run-series')
const Worker = require('./')

test('connect and close', function (t) {
  t.plan(2)

  const worker = Worker({
    connection: 'amqp://localhost'
  })

  worker.connect(function (err) {
    if (err) return t.end(err)
    t.pass('connected')
    worker.close(function (err) {
      if (err) return t.end(err)
      t.pass('closed')
    })
  })
})

test('listen', function (t) {
  t.plan(2)

  const worker = Worker({
    connection: 'amqp://localhost'
  })

  series([
    worker.connect.bind(worker),
    worker.listen.bind(worker, 'zone'),
    message,
    (callback) => assertEmpty(worker.channel, 'zone', callback),
    worker.close.bind(worker)
  ], t.end)

  function message (callback) {
    worker.once('data', function (queue, data, done) {
      t.equal(queue, 'zone', 'queue is zone')
      t.deepEqual(data, { danger: true }, 'zone is one of danger')
      done()
      callback()
    })

    worker.channel.sendToQueue('zone', Buffer.from(JSON.stringify({
      danger: true
    })))
  }
})

test('nack', function (t) {
  t.plan(5)

  const worker = Worker({
    connection: 'amqp://localhost'
  })

  series([
    worker.connect.bind(worker),
    worker.listen.bind(worker, 'zone'),
    message,
    (callback) => assertEmpty(worker.channel, 'zone', callback),
    worker.close.bind(worker)
  ], t.end)

  function message (callback) {
    worker.once('data', function (queue, data, done) {
      t.equal(queue, 'zone', 'queue is zone')
      t.deepEqual(data, { danger: true }, 'zone is one of danger')

      worker.once('data', function (queue, data, done) {
        t.pass('re-receives message')
        t.equal(queue, 'zone', 'queue is zone')
        t.deepEqual(data, { danger: true }, 'zone is one of danger')
        done()
        callback()
      })

      done(new Error('nack attack'))
    })

    worker.channel.sendToQueue('zone', Buffer.from(JSON.stringify({
      danger: true
    })))
  }
})

test('unlisten', function (t) {
  t.plan(1)

  const worker = Worker({
    connection: 'amqp://localhost',
    queue: {
      autoDelete: true
    }
  })

  series([
    worker.connect.bind(worker),
    worker.listen.bind(worker, 'zone-with-auto-delete'),
    worker.unlisten.bind(worker, 'zone-with-auto-delete'),
    message,
    (callback) => assertEmpty(worker.channel, 'zone', callback),
    worker.close.bind(worker)
  ], t.end)

  function message (callback) {
    worker.once('data', function (queue, data, done) {
      t.fail('unexpected data')
    })

    worker.channel.sendToQueue('zone-with-auto-delete', Buffer.from(JSON.stringify({
      danger: true
    })))

    t.pass('message sent')

    callback()
  }
})

test('invalid JSON', function (t) {
  t.plan(2)

  const worker = Worker({
    connection: 'amqp://localhost'
  })

  series([
    worker.connect.bind(worker),
    worker.listen.bind(worker, 'zone'),
    message,
    (callback) => assertEmpty(worker.channel, 'zone', callback),
    worker.close.bind(worker)
  ], t.end)

  function message (callback) {
    worker.once('data', function (queue, data, done) {
      t.fail('unexpected data: ' + JSON.stringify(data))
    })

    worker.once('error', function (err) {
      t.ok(err)
      t.equal(err.name, 'SyntaxError')
      worker.channel.ackAll()
      callback()
    })

    worker.channel.sendToQueue('zone', Buffer.from('phrasing'))
  }
})

test('ping', function (t) {
  t.plan(1)

  const worker = Worker({
    connection: 'amqp://localhost'
  })

  series([
    worker.connect.bind(worker),
    worker.listen.bind(worker, 'zone'),
    worker.ping.bind(worker),
    function (callback) {
      t.pass('ping')
      callback()
    },
    worker.close.bind(worker)
  ], t.end)
})

function assertEmpty (channel, queue, callback) {
  channel.checkQueue(queue, function (err, data) {
    if (err) return callback(err)
    if (data.messageCount !== 0) {
      callback(new Error(`${queue} is not empty (${data.messageCount} messages)`))
    }
    callback()
  })
}
