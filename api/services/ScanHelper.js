const url = require('url');
const { Site, Scan } = require('../models');
const { logger } = require('../../winston');


module.exports = {

  parse: (user, scanData) => {
    console.log(`\n\nscanData:\t${(scanData['Target']['Url'].toString())}\n\n`)
    return Promise.resolve(url.parse(scanData['Target']['Url']))
      .then(scanUrl => {
        console.log(`\n\nscanUrl:\t${JSON.stringify(scanUrl)}\n\n`)
        return Site.findOne({
          where: {
            domain: `${scanUrl.protocol}//${scanUrl.host}`,
          },
        });
      })
      .then((site) => {
        console.log(`\n\nsite:\t${JSON.stringify(site)}\n\n`)
        if (site) {
          const vulnerabilities = (scanData['Vulnerabilities'] || []).filter(v => (['Medium', 'High', 'Critical'].find(s => s === v['Severity'])));
          console.log(`\n\nvulnerabilties:${JSON.stringify(vulnerabilities)}\n\n`)
          if (vulnerabilities.length > 0) {
            return Scan.create({
              data: scanData,
              scannedAt: new Date(scanData['Generated']),
              user: user.id,
              site: site.id,
            })
          }
        }
      })
      .catch(logger.error)
  },
};
