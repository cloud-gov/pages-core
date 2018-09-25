const logger = require("winston")

const app = require("./app")
// app.listen(process.env.PORT || 1337, () => {
//   logger.info("Server running!")
// })

const server = require('http').Server(app);
const io = require('socket.io').listen(server);

server.listen(process.env.PORT || 1337, () => {
  logger.info("Server running!")
});

io.on('connection', function(socket){
  console.log('\n\na user connected\n\n');
  socket.on('disconnect', function(){
    console.log('\n\nuser disconnected\n\n');
  });
});
