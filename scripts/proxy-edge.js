const AWS = require('aws-sdk');
const { saveSites, removeSite, saveSite } = require('../api/services/ProxyDataSync');
const { Site } = require('../api/models');
 
// let site;
Site.findAll({ attributes: ['owner', 'repository', 'awsBucketName', 'awsBucketRegion'] })
	.then(saveSites);
	// .then((sites) => {
	// 	site = sites[0];
	// 	console.log(`\n\nremove site:\t${JSON.stringify(site)}\n\n`)
	// 	return removeSite(site)
	// })
	// .then(() => saveSite(site));