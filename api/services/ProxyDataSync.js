// use dynamodb helper to write items to dynamodb
const { DynamoDBDocumentClient } = require('./DynamoDBDocumentHelper');
const config = require('../../config');
const TableName = config.app.proxySiteTable; //for now only 1 table
const siteKey = 'owner_repository';
const getSiteKey = (site) => [site.owner, site.repository].join('/');

const removeSite = (site) => {
	
	const docClient = new DynamoDBDocumentClient(config.dynamoDB);
	var params = {
	  TableName,
	  Key: {
	    owner_repository: getSiteKey(site),
	  }
	};
	console.log(`\n\nparams\n=>\n${JSON.stringify(params)}\n\n`)
	return docClient.delete(params);
};

const saveSite = (site) => {
	const docClient = new DynamoDBDocumentClient(config.dynamoDB);
	const params = {
		TableName,
		Item: siteToItem(site),
	};
	return docClient.put(params, siteKey);
};

const saveSites = (sites) => {
	const docClient = new DynamoDBDocumentClient(config.dynamoDB);
	const items = sites.map(site => ({ PutRequest: { Item: siteToItem(site) } }));
	const RequestItems = {}
	RequestItems[TableName] = items;
	const params = { RequestItems };
	// console.log(`\n\nparams\n=>\n${JSON.stringify(params)}\n\n`)
	return docClient.batchWrite(params);
	// return Promise.resolve(params);
};

const siteToItem = (site) => {
	const item = {
		owner_repository: getSiteKey(site),		
		settings: {
			bucket_name: site.awsBucketName,
			bucket_region: site.awsBucketRegion,
			basic_auth: {
				user: site.owner.toLowerCase(),
				password: site.repository.toLowerCase(),
			},
		},
	};
	item[siteKey] = getSiteKey(site);
	return item;
}

module.exports = { saveSite, saveSites, removeSite };
