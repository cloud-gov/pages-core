const dns = require('dns').promises;

const cloudGovDomain = 'external-domains-production.cloud.gov';
const acmePrefix = '_acme-challenge';

/** @enum {string} */
const DnsRecordType = {
  A: 'A',
  CNAME: 'CNAME',
};

/** @enum {string} */
const DnsRecordPurpose = {
  AcmeChallenge: 'AcmeChallenge',
  Site: 'Site',
};

/** @enum {string} */
const DnsResultState = {
  Error: 'error',
  Pending: 'pending',
  Success: 'success',
};

/**
 * @typedef {object} DnsRecord
 * @prop {DnsRecordType} type The DNS record type
 * @prop {DnsRecordPurpose} purpose The purpose of the record
 * @prop {string} name The domain name
 * @prop {string} target The target domain name
 *
 * @typedef {object} DnsResult
 * @prop {DnsRecord} record The DNS record
 * @prop {DnsResultState} state The current state
 * @prop {string=} message The error message
 */

/**
 * @param {string} domainName The domain name
 */
function isApexDomain(domainName) {
  return domainName.split('.').length === 2;
}

/**
 * @param {string} domainName The domain name
 */
function buildAcmeChallengeDnsRecord(domainName) {
  /** @type DnsRecord */
  const dnsRecord = {
    type: DnsRecordType.CNAME,
    purpose: DnsRecordPurpose.AcmeChallenge,
    name: `${acmePrefix}.${domainName}`,
    target: `${acmePrefix}.${domainName}.${cloudGovDomain}`,
  };

  return dnsRecord;
}

/**
 * @param {string} domainName The domain name
 */
function buildSiteDnsRecord(domainName) {
  /** @type DnsRecord */
  const dnsRecord = {
    type: isApexDomain(domainName) ? DnsRecordType.A : DnsRecordType.CNAME,
    purpose: DnsRecordPurpose.Site,
    name: domainName,
    target: `${domainName}.${cloudGovDomain}`,
  };

  return dnsRecord;
}

/**
 * @param {string} domainName
 */
function buildDnsRecords(domainName) {
  return [
    buildAcmeChallengeDnsRecord(domainName),
    buildSiteDnsRecord(domainName),
  ];
}

/**
 * @param {DnsRecord} dnsRecord
 * @returns {Promise<[DnsResultState, string=]>}
 */
async function resolveDnsRecord(dnsRecord) {
  try {
    // Trying to reduce how long this takes, not sure this actually helps
    const resolver = new dns.Resolver({ timeout: 2000, tries: 2 });
    const values = await resolver.resolve(dnsRecord.name, dnsRecord.type);

    if (values.includes(dnsRecord.target)) {
      return [DnsResultState.Success];
    }

    const message = values.length > 0
      ? `Found [${values.join(', ')}]`
      : 'Record not set';

    return [DnsResultState.Pending, message];
  } catch (error) {
    const { code } = error;
    if (['ENOTFOUND', 'ETIMEOUT'].includes(code)) {
      return [DnsResultState.Pending, 'Record not set'];
    }
    return [DnsResultState.Error, error.message];
  }
}

/**
 * @param {DnsRecord} dnsRecord
 */
async function checkDnsRecord(dnsRecord) {
  // call this function from `module.exports` so it is stubbable in tests
  const [state, message] = await module.exports.resolveDnsRecord(dnsRecord);

  /** @type DnsResult */
  const dnsResult = {
    record: dnsRecord,
    state,
    message,
  };

  return dnsResult;
}

/**
 * @param {string} domainName
 */
function checkDnsRecords(domainName) {
  return Promise.all(
    buildDnsRecords(domainName)
      .map(checkDnsRecord)
  );
}

/**
 * @param {string} domainName
 */
function checkAcmeChallengeDnsRecord(domainName) {
  return checkDnsRecord(buildAcmeChallengeDnsRecord(domainName));
}

/**
 * @param {DnsResult[]} dnsResults
 */
function canProvision(dnsResults) {
  return dnsResults
    .filter(dnsResult => dnsResult.record.purpose === DnsRecordPurpose.AcmeChallenge)
    .every(dnsResult => dnsResult.state === DnsResultState.Success);
}

/**
 * @param {DnsRecord} dnsRecord
 */
function isAcmeChallengeDnsRecord(dnsRecord) {
  return dnsRecord.purpose === DnsRecordPurpose.AcmeChallenge;
}

module.exports.buildAcmeChallengeDnsRecord = buildAcmeChallengeDnsRecord;
module.exports.buildSiteDnsRecord = buildSiteDnsRecord;
module.exports.buildDnsRecords = buildDnsRecords;
module.exports.checkAcmeChallengeDnsRecord = checkAcmeChallengeDnsRecord;
module.exports.checkDnsRecord = checkDnsRecord;
module.exports.checkDnsRecords = checkDnsRecords;
module.exports.canProvision = canProvision;
module.exports.isAcmeChallengeDnsRecord = isAcmeChallengeDnsRecord;
module.exports.resolveDnsRecord = resolveDnsRecord;
