// NOTES:
// 
// - Need to document
// - May want to extract config object in to Global variable
//   and do some refactoring

var fs = require('fs'),
  zlib = require('zlib'),
  mime = require('mime'),
  path = require('path'),
  url = require('url'),
  FTPClient = require('ftp'),
  c = new FTPClient(),
    
  // Azure dependencies
  AuthenticationContext = require('adal-node').AuthenticationContext,
  common = require('azure-common'),
  resourceManagement = require('azure-arm-resource'),
  resourceManagementClient,
  webSiteManagement = require('azure-asm-website'),
  webSiteManagementClient,
  tokenCreds,
  
  // FTP
  ftpHost,
  ftpUser,
  ftpPass,
  ftpFiles = [],
  ftpDirs = [],
  tempPublishDir;

module.exports = {
  publish: function (config, done) {

    // Execute Azure deployment operation in series
    async.series([setToken, checkResources, getPublishingCredentials, uploadContent], function (err, results) {
      if (err) return done(err);
      done(null, results);
    });
        
    // Retrieve Azure AD token based on config credentials
    function setToken(callback) {
      
      // Sails logging placeholder
      console.log("Setting token...");

      var authorityUrl = config.authorityUrl,
        service = new AuthenticationContext(authorityUrl),
        username = config.username,
        password = config.password,
        clientId = config.clientId,
        subscriptionId = config.subscriptionId;

      service.acquireTokenWithUsernamePassword('https://management.core.windows.net/', username, password, clientId, function (err, tokenResponse) {
        if (err) return callback(err);

        tokenCreds = new common.TokenCloudCredentials({
          subscriptionId: subscriptionId,
          token: tokenResponse.accessToken
        });

        resourceManagementClient = resourceManagement.createResourceManagementClient(tokenCreds);
        webSiteManagementClient = webSiteManagement.createWebSiteManagementClient(tokenCreds);
            
        // Sails logging placeholder
        console.log("Token set");

        callback(null, 'Token set');
      });
    }
    
    // TODO: This code is a bit hacky, need to cleanup
    // 
    // Check existence of Azure resources in specified resource group
    function checkResources(callback) {
      
      // Sails logging placeholder
      console.log("Determining whether or not Web App already exists");

      var webSpace = config.resourceGroup.name + '-' + config.resourceGroup.region.replace(/ /g, '') + 'webspace';
      var siteName = config.resourceGroup.templateParams.siteName;

      webSiteManagementClient.webSpaces.get(webSpace, function (err, result) {

        if (err && err.code === 'NotFound') {
          // Sails logging placeholder
          console.log("Web Space does not exist\r\nProvisioning new Resource Group");

          deployResourceGroup(config, function (err, result) {
            if (err) return callback(err);
            callback(null, 'Resource Group deployed');
          });
        } else if (err) {
          return callback(err);
        }

        if (result) {
          webSiteManagementClient.webSites.get(webSpace, siteName, function (err, result) {
            if (err && err.code === 'NotFound') {
              // Sails logging placeholder
              console.log("Web App '" + siteName + "' does not exist in Web Space '" + webSpace);

              deployResourceGroup(config, function (err, result) {
                if (err) return callback(err);
                callback(null, 'Resource Group deployed');
              });
            } else if (err) {
              return callback(err);
            }

            if (result) {
              // Sails logging placeholder
              console.log("Web App already exists");

              callback(null, "Web App already exists");
            }
          });
        }
      });
    }
    
    // Get Web App publishing credentials
    function getPublishingCredentials(callback) {
      var webSpace = config.resourceGroup.name + '-' + config.resourceGroup.region.replace(/ /g, '') + 'webspace';
      var siteName = config.resourceGroup.templateParams.siteName

      webSiteManagementClient.webSites.getPublishProfile(webSpace, siteName, function (err, result) {
        if (err) return callback(err);
        for (var i = 0; i < result.publishProfiles.length; i++) {
          if (result.publishProfiles[i].publishMethod === 'FTP') {
            var profile = result.publishProfiles[i];
            var publishUrl = url.parse(profile.publishUrl);
            ftpHost = publishUrl.hostname;
            ftpUser = profile.userName;
            ftpPass = profile.userPassword;
            
            // Sails logging placeholder
            console.log("Publish profile retrieved");

            return callback(null, 'Publish Profile retrieved');
          }
        }
      });
    }
    
    // Publish site content via FTPS
    //
    // NOTE: May want to rework for Git publishing instead of FTPS
    // NOTE: Requires Node 0.10.x due to bug in TLS module as
    // described here: https://github.com/joyent/node/issues/9272
    function uploadContent(callback) {
      
      tempPublishDir = config.tempPublishDir;

      c.on('ready', function () {
        // Will replace with build token destination path
        ftpWalk(tempPublishDir, function (err) {

          if (err) return callback(err);

          async.series([createFTPDirectories, uploadFTPFiles], function (err, results) {
            c.end();

            if (err) return callback(err);
            console.log("\r\n");
            callback(null, 'Files uploaded successfully');
          });
        });
      });

      c.connect({
        host: ftpHost,
        secure: true,
        user: ftpUser || process.env.FEDERALIST_AZURE_WEBAPP_DEPLOYMENT_USER,
        password: ftpPass || process.env.FEDERALIST_AZURE_WEBAPP_DEPLOYMENT_PASSWORD
      });
    }
    
    // Create new Resource Group and execute template deployment
    function deployResourceGroup(config, done) {

      checkRGExistence(config, function (err, exists, result) {
        if (err) return done(err);

        if (!exists) {
          async.series([createResourceGroup, deployTemplate, checkDeploymentStatus], function (err, results) {
            if (err) return done(err);
            done(null, results);
          });
        } else {
          done(null, result);
        }
      });
    }

    // Check existence of Resource Group
    function checkRGExistence(config, done) {

      var rgName = config.resourceGroup.name;

      resourceManagementClient.resourceGroups.checkExistence(rgName, function (err, result) {
        // Bug in checkExistence() function that returns an error
        // instead of result.exists = false
        if (err && err.statusCode === 404 && err.code === 'NotFound') {
          return done(null, false, result);
        } else if (err) {
          return done(err);
        }

        done(null, true, result);
      });
    }

    // Create new Resource Group
    function createResourceGroup(callback) {

      var rgName = config.resourceGroup.name,
        params = {
          location: config.resourceGroup.region
        };

      resourceManagementClient.resourceGroups.createOrUpdate(rgName, params, function (err, result) {
        if (err) return callback(err);
        callback(null, result);
      });
    }

    // Deploy generated template to Resource Group
    function deployTemplate(callback) {
  
      // Will replace with hosted template
      var templatePath = config.resourceGroup.templatePath
      var template;
      try {
        template = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
      } catch (err) {
        return callback(err);
      }

      var rgName = config.resourceGroup.name,
        deploymentName = config.resourceGroup.deploymentName;

      // May decide to dynamically populate these parameters based on template JSON
      var params = {
        "properties": {
          "template": template,
          "mode": "Incremental",
          "parameters": {
            "siteName": {
              "value": config.resourceGroup.templateParams.siteName
            },
            "hostingPlanName": {
              "value": config.resourceGroup.templateParams.hostingPlanName
            },
            "siteLocation": {
              "value": config.resourceGroup.templateParams.siteLocation
            }
          }
        }
      };

      resourceManagementClient.deployments.createOrUpdate(rgName, deploymentName, params, function (err, result) {
        if (err) return callback(err);

        // sails.log.verbose(result);
        callback(null, result);
      });
    }

    // Check deployment dstatus
    function checkDeploymentStatus(callback) {

      function getStatus(retry, results) {

        var rgName = config.resourceGroup.name,
          deploymentName = config.resourceGroup.deploymentName;

        resourceManagementClient.deployments.get(rgName, deploymentName, function (err, result) {
          if (err) return retry(err);

          if (result && result.deployment.properties.provisioningState === 'Succeeded') {
            return retry(null, true);
          } else if (result && result.deployment.properties.provisioningState === 'Failed') {
            return retry(null, false);
          } else {
            retry(new Error("Incomplete deployment \r\n"));
          }
        });
      }

      async.retry({ times: 6, interval: 10000 }, getStatus, function (err, results) {
        if (err) return callback(err);

        if (!results) {
          // Need to implement in a separate function
          var rgName = config.resourceGroup.name,
            deploymentName = config.resourceGroup.deploymentName;

          resourceManagementClient.deploymentOperations.list(rgName, deploymentName, null, function (err, result) {
            if (err) return callback(err);
            return callback("Template deployment failed due to following error \r\n" + JSON.stringify(result.operations[0].properties.statusMessage));
          });
        } else {
          callback(null, results);
        }
      });
    }

    // Walk static site directory structure and copy paths
    // to global arrays
    //
    // NOTE: may need to adjust path references
    function ftpWalk(dir, done) {

      fs.readdir(dir, function (err, list) {
        if (err) return done(err);
        var pending = list.length;
        if (!pending) return done();
        list.forEach(function (file) {
          file = path.join(dir, file);
          fs.stat(file, function (err, stat) {
            if (stat && stat.isDirectory()) {
              ftpDirs.push(dir, file);
              ftpWalk(file, function (err, res) {
                if (!--pending) done();
              });
            } else {
              ftpFiles.push(file);
              if (!--pending) done();
            }
          });
        });
      });
    }

    // Create FTP directories
    function createFTPDirectories(callback) {

      async.each(ftpDirs, createDir, function (err) {
        if (err) return callback(err);

        console.log("\r\n");
        callback();
      });
    }

    function createDir(dir, callback) {

      var ftpDir = path.join('/site/wwwroot/', path.relative(tempPublishDir, dir));
      ftpDir = ftpDir.replace(/\\/g, "/")

      c.mkdir(ftpDir, true, function (err) {
        if (err) return callback(err);
        
        // Sails logging placeholder
        console.log("FTP directory '" + ftpDir + "' created")

        callback();
      });
    }

    // Upload files via FTP
    function uploadFTPFiles(callback) {

      async.each(ftpFiles, uploadFile, function (err) {
        if (err) return callback(err);
        callback();
      });
    }

    function uploadFile(file, callback) {
  
      // Relative/absolute path normalization for Azure
      var localFile = path.join(process.cwd(), file);
      var ftpFile = path.join('/site/wwwroot/', path.relative(tempPublishDir, file));
      ftpFile = ftpFile.replace(/\\/g, "/");

      c.put(localFile, ftpFile, function (err) {
        if (err) return callback(err);
        
        // Sails logging placeholder
        console.log("File '" + localFile + "' uploaded successfully");

        callback();
      });
    }


    // NOTE: Cleanup stubs for Resource Group provisioning failure
    //
    // Remove Resource Group and cleanup attempted
    // deployment operation
    function cleanup(config, done) {
  
      // Delete Resource Group
      var rgName = config.resourceGroup.name;

      resourceManagementClient.resourceGroups.deleteMethod(rgName, function (err, result) {
        if (err) return done(err);

        // sails.log.verbose(result);
        done(null, result);
      });
    }
  }
};