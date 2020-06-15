const router = require('express').Router();
const { verifyRepos } = require('../services/RepositoryVerifier');
const { audit18F } = require('../services/FederalistUsersHelper');
const { auditAllSites } = require('../services/SiteUserAuditor');
const { nightlyBuilds } = require('../services/ScheduledBuildHelper');

router.post('/jobs/verify-repos', (req, res) => {
  verifyRepos();
});

module.exports = router;
