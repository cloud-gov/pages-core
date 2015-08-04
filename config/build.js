/*
 * Settings the build process
 */
module.exports.build = {
  tempDir: process.env.FEDERALIST_TEMP_DIR || './.tmp',
  publishDir: process.env.FEDERALIST_PUBLISH_DIR || './assets',
  s3Bucket: process.env.FEDERALIST_S3_BUCKET,
  azure: {
    subscriptionId: process.env.FEDERALIST_AZURE_SUBSCRIPTION_ID,
    authorityUrl: "https://login.microsoftonline.com/" + process.env.FEDERALIST_AZURE_TENANT_ID,
    username: process.env.FEDERALIST_AZURE_USERNAME,
    password: process.env.FEDERALIST_AZURE_PASSWORD,
    clientId: process.env.FEDERALIST_AZURE_CLIENT_ID,
    resourceGroup: {
      name: process.env.FEDERALIST_AZURE_RG_NAME,
      region: process.env.FEDERALIST_AZURE_REGION,
      templatePath: process.env.FEDERALIST_AZURE_RG_TEMPLATE_PATH,
      deploymentName: process.env.FEDERALIST_AZURE_RG_DEPLOYMENT_NAME,
      templateParams: {
        siteName: process.env.FEDERALIST_AZURE_WEBAPP_NAME,
        hostingPlanName: process.env.FEDERALIST_AZURE_APPHOSTINGPLAN_NAME,
        siteLocation: process.env.FEDERALIST_AZURE_REGION
      }
    },
    tempPublishDir: process.env.FEDERALIST_AZURE_LOCAL_SITE_DIRECTORY
  }
};
