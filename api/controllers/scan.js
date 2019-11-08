const _ = require('underscore');
const authorizer = require('../authorizers/scan');
const { IncomingForm } = require('formidable');
const { logger } = require('../../winston');
const fs = require('fs');
const AdmZip = require('adm-zip');
const scanHelper = require('../services/ScanHelper');
// const { Scan } = require('../models');

module.exports = {
  create: (req, res) => {
    const { body, user } = req;
    // logger.info(`\nreq:\t${JSON.stringify(req.files.file)}\n`)
    // logger.info(`\nreq.files:\t${JSON.stringify(req.files)}\n`)
    

    const fetchScans = (file) => {
      return new Promise((resolve, reject) => {
        // logger.info(`\n\nfile type:\t${file.type}\n\n`)
        // let zip;
        let scans;
        // if(['application/zip','application/json'].find(fileType => fileType === file.type)) {
          if (file.type === 'application/zip') {
            const zip = new AdmZip(file.path);
            scans = zip.getEntries();
            scans = scans.filter(z => !z.isDirectory && (/\.json$/.test(z.name)) && !(/^\./.test(z.name)));
            if (scans.length === 0) {
              reject('No scans found');
            }
            
            resolve(scans.map(s => JSON.parse(s.getData().toString('utf8'))));
          } else if (file.type === 'application/json') {
            fs.readFile(file.path, (err, data) => {
              if (err) throw err;
                resolve([JSON.parse(data)]);
            });
          }
          else {
            reject('Invalid file type');
          }
      })
    }

    fetchScans(req.files.file)
      .then(scans => Promise.all(scans.map(scan => scanHelper.parse(user, scan))))
      .then(() => {
        res.ok();
      })
      .catch((err) => {
        console.log(`\n\nerr:\t${(err)}\n\n`)
        console.log(`\n\nerr.trace:\t${err.stack}\n\n`)
        res.error(err);
      });
  },
};
