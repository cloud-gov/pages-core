const { expect } = require('chai');
const { it } = require('mocha');
const sinon = require('sinon');
const DnsService = require('../../../../api/services/Dns');

describe('Dns Service', () => {
  describe('.buildAcmeChallengeDnsRecord()', () => {
    it('returns an "acme challenge" dns record', () => {
      const domainName = 'www.agency.gov';

      const result = DnsService.buildAcmeChallengeDnsRecord(domainName);

      expect(result).to.deep.equal({
        type: 'CNAME',
        purpose: 'AcmeChallenge',
        name: `_acme-challenge.${domainName}`,
        target: `_acme-challenge.${domainName}.external-domains-production.cloud.gov`,
      });
    });
  });

  describe('.buildSiteDnsRecord()', () => {
    it('returns an "site" dns record', () => {
      const domainName = 'agency.gov';

      const result = DnsService.buildSiteDnsRecord(domainName);

      expect(result).to.deep.equal({
        type: 'A',
        purpose: 'Site',
        name: domainName,
        target: `${domainName}.external-domains-production.cloud.gov`,
      });
    });
  });

  describe('.buildDnsRecords()', () => {
    it('returns an array with a site and acme challenge dns records', () => {
      const domainName = 'www.agency.gov';

      const result = DnsService.buildDnsRecords(domainName);

      expect(result).to.deep.have.members([
        DnsService.buildAcmeChallengeDnsRecord(domainName),
        DnsService.buildSiteDnsRecord(domainName),
      ]);
    });
  });

  describe('.checkDnsRecord()', () => {
    it('resolves the dns record and returns a DnsResult with results', async () => {
      const domainName = 'www.agency.gov';
      const dnsRecord = DnsService.buildSiteDnsRecord(domainName);
      const resolveResult = ['success'];

      sinon.stub(DnsService, 'resolveDnsRecord').resolves(resolveResult);

      const result = await DnsService.checkDnsRecord(dnsRecord);

      sinon.assert.calledOnceWithExactly(DnsService.resolveDnsRecord, dnsRecord);
      expect(result).to.deep.eq({
        record: dnsRecord,
        state: resolveResult[0],
        message: resolveResult[1],
      });

      sinon.restore();
    });
  });

  describe('.checkAcmeChallengeDnsRecord()', () => {
    it('calls `checkDnsRecord` with an "Acme Challenge" dns record and returns the result', async () => {
      const domainName = 'www.agency.gov';
      const resolveResult = ['error', 'message'];

      sinon.stub(DnsService, 'resolveDnsRecord').resolves(resolveResult);

      const result = await DnsService.checkAcmeChallengeDnsRecord(domainName);

      sinon.assert.calledOnce(DnsService.resolveDnsRecord);
      expect(result).to.deep.eq({
        record: DnsService.buildAcmeChallengeDnsRecord(domainName),
        state: resolveResult[0],
        message: resolveResult[1],
      });

      sinon.restore();
    });
  });

  describe('.checkDnsRecords()', () => {
    it('calls and returns result from calling `checkDnsRecord` for each result from `buildDnsRecords`', async () => {
      const domainName = 'www.agency.gov';
      const resolveResult1 = ['error', 'message'];
      const resolveResult2 = ['error', 'message'];

      sinon.stub(DnsService, 'resolveDnsRecord')
        .onFirstCall()
        .resolves(resolveResult1)
        .onSecondCall()
        .resolves(resolveResult2);

      const result = await DnsService.checkDnsRecords(domainName);

      sinon.assert.calledTwice(DnsService.resolveDnsRecord);
      expect(result).to.deep.have.members([
        {
          record: DnsService.buildAcmeChallengeDnsRecord(domainName),
          state: resolveResult1[0],
          message: resolveResult1[1],
        },
        {
          record: DnsService.buildSiteDnsRecord(domainName),
          state: resolveResult2[0],
          message: resolveResult2[1],
        },
      ]);
    });
  });

  describe('.canProvision()', () => {
    it('returns true if all provided AcmeChallenge DnsResults are successful', () => {
      const domainName = 'www.agency.gov';

      const dnsResults = [
        {
          record: DnsService.buildAcmeChallengeDnsRecord(domainName),
          state: 'success',
        },
        {
          record: DnsService.buildAcmeChallengeDnsRecord(domainName),
          state: 'success',
        },
        {
          record: DnsService.buildSiteDnsRecord(domainName),
          state: 'error',
        },
      ];

      const result = DnsService.canProvision(dnsResults);

      expect(result).to.be.true;
    });

    it('returns false if NOT all provided AcmeChallenge DnsResults are successful', () => {
      const domainName = 'www.agency.gov';

      const dnsResults = [
        {
          record: DnsService.buildAcmeChallengeDnsRecord(domainName),
          state: 'success',
        },
        {
          record: DnsService.buildAcmeChallengeDnsRecord(domainName),
          state: 'error',
        },
        {
          record: DnsService.buildSiteDnsRecord(domainName),
          state: 'error',
        },
      ];

      const result = DnsService.canProvision(dnsResults);

      expect(result).to.be.false;
    });
  });
});
