import { expect } from 'chai';
import { duration, timeFrom } from '../../../../assets/app/util/datetime';

const DURATION = 'a few seconds';
const NO_DURATION = '-';


describe('datetime', function() {
  const endTime = '2016-05-13T18:32:41.000Z';
  const startTime = '2016-05-13T18:32:01.000Z';

  describe('duration()', () => {
    it('shows a human readable duration when provided two dates', () => {
      expect(duration(startTime, endTime)).to.equal(DURATION);
    });

    it('works if endTime isn\'t defined', () => {
      expect(duration(+new Date)).to.equal(DURATION);
    });

    it('provides a fallback if startTime isnt defined', () => {
      expect(duration()).to.equal(NO_DURATION);
    });
  });

  describe('timeFrom()', () => {
    it('shows a human readable elapsed time from end date', () => {
      expect(timeFrom(+new Date)).to.equal(`${DURATION} ago`);
    });

    it('provides a fallback if no initial time is supplied', () => {
      expect(timeFrom()).to.equal(NO_DURATION);
    });
  });
});
