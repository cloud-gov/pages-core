// use dynamodb helper to write items to dynamodb
const { DynamoDBDocumentHelper } = require('./DynamoDBDocumentHelper');
const config = require('../../config');
const tableName = config.app.proxySiteTable; //for now only 1 table
const siteKey = 'owner_repository';
const getSiteKey = (site) => [site.owner, site.repository].join('/');

const removeSite = (site) => {
	
	const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
	const key = {
	    owner_repository: getSiteKey(site),
	};
	// console.log(`\n\ndelete site\t=>\t${JSON.stringify(key)}\n\n`);
	return docClient.delete(tableName, key);
};

const saveSite = (site) => {
	const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
	const item = siteToItem(site);
	// console.log(`\n\nsave site\t=>\t${JSON.stringify(item)}\n\n`);
	return docClient.put(tableName, item);
};

const saveSites = (sites) => {
	const docClient = new DynamoDBDocumentHelper(config.dynamoDB);
	const items = sites.map(site => ({ PutRequest: { Item: siteToItem(site) } }));
	// console.log(`\n\nsave sites\t=>\t${JSON.stringify(items)}\n\n`);
	return docClient.batchWrite(tableName, items);
};

const siteToItem = (site) => {
	console.log(`\n\nsite:\t${JSON.stringify(site)}\n\n`);
	const item = {
		owner_repository: getSiteKey(site),		
		settings: {
			bucket_name: site.awsBucketName,
			bucket_region: site.awsBucketRegion,
		},
	};

	if (site.id % 2) { // test - set for odd ids
		item.settings.basic_auth = {
			user: site.owner.toLowerCase(),
			password: site.repository.toLowerCase(),
		};
	}

	item[siteKey] = getSiteKey(site);
	return item;
}

module.exports = { saveSite, saveSites, removeSite };
