var Azure = require('./api/services/Azure'),
		config = require('./config/build');

console.log("\r\n");

Azure.publish(config.build.azure, function (err, result) {
	if (err) console.error(err);
	
	console.log(result);
	console.log("\r\n");
});