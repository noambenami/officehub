/**
 * Launch the server.
 */
var app           = require('express')();
var socketServers = require('express-ws')(app);

app.use(function (req, res, next) {
  console.log('middleware');
  req.testing = 'testing';
  return next();
});

app.get('/', function(req, res, next){
  console.log('get route', req.testing);
  res.end();
});

/**
 * Create a new /scheduler server
 */
app.ws('/scheduler', function(ws, req) {

  // When a client connects, we send the full schedule out
  ws.on('open', function () {
    console.log('Connection opened');
    ws.send('Hello', function ack(error) {
      console.log('Error', error);
    });
  });

  // TBD
  ws.on('message', function(msg) {
    ws.send(msg);
    console.log(msg);
  });
  console.log('socket', req.testing);
});

/**
 * To enable broadcast, we get a handle on the socket server:
 */
var wss = socketServers.getWss('/scheduler');

app.listen(3000);