import { expect } from 'chai';
import { duration, timeFrom, dayAndDate } from '../../../frontend/util/datetime';

const DURATION = 'a few seconds';
const NO_DATE = '-';

describe('datetime', () => {
  const endTime = '2016-05-13T18:32:41.000Z';
  const startTime = '2016-05-13T18:32:01.000Z';

  describe('duration()', () => {
    it('shows a human readable duration when provided two dates', () => {
      expect(duration(startTime, endTime)).to.equal(DURATION);
    });

    it('works if endTime isn\'t defined', () => {
      expect(duration(+new Date())).to.equal(DURATION);
    });

    it('provides a fallback if startTime isnt defined', () => {
      expect(duration()).to.equal(NO_DATE);
    });
  });

  describe('timeFrom()', () => {
    it('shows a human readable elapsed time from end date', () => {
      expect(timeFrom(+new Date())).to.equal(`${DURATION} ago`);
    });

    it('provides a fallback if no initial time is supplied', () => {
      expect(timeFrom()).to.equal(NO_DATE);
    });
  });

  describe('.dayAndDate', () => {
    it('provides a day and date when a valid date is provided', () => {
      expect(dayAndDate(startTime)).to.equal('Friday, May 13th 2016');
    });

    it('provides a fallback if no date is provided', () => {
      expect(dayAndDate()).to.equal(NO_DATE);
    });
  });
});
