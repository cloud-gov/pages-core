import { expect } from 'chai';
import {
  duration,
  timeFrom,
  dateAndTime,
  timestampUTC,
} from '../../../frontend/util/datetime';

const NO_DATE = '-';

describe('datetime', () => {
  const endTime = '2016-02-13T18:35:41.000Z';
  const startTime = '2016-02-13T18:32:01.000Z';

  describe('duration()', () => {
    it('shows a human readable duration when provided two dates', () => {
      expect(duration(startTime, endTime)).to.equal('3 minutes');
    });

    it("works if endTime isn't defined", () => {
      expect(duration(+new Date())).to.equal('0 seconds');
    });

    it("provides a fallback if startTime isn't defined", () => {
      expect(duration()).to.equal(NO_DATE);
    });
  });

  describe('timeFrom()', () => {
    it('shows a human readable elapsed time from end date', () => {
      const testDate = new Date();
      testDate.setSeconds(testDate.getSeconds() - 32);

      expect(timeFrom(testDate)).to.equal('32 seconds ago');
    });

    it('provides a fallback if no initial time is supplied', () => {
      expect(timeFrom()).to.equal(NO_DATE);
    });
  });

  describe('.dateAndTime', () => {
    it('provides a date and time when a valid date is provided', () => {
      expect(dateAndTime(startTime)).to.equal('February 13th 2016, 6:32:01 p.m.');
    });

    it('provides a fallback if no date is provided', () => {
      expect(dateAndTime()).to.equal(NO_DATE);
    });
  });

  describe('.timestampUTC', () => {
    it('provides a UTC timestamp when a valid date is provided', () => {
      expect(timestampUTC(startTime)).to.equal('2016-02-13 18:32:01');

      // make a date with a UTC offset of +5
      const timeInZone = new Date('1984-02-11T16:01:01.000+05:00');

      // UTC time should be 5 hours earlier
      expect(timestampUTC(timeInZone)).to.equal('1984-02-11 11:01:01');
    });

    it('provides a fallback if no date is provided', () => {
      expect(timestampUTC()).to.equal(NO_DATE);
    });
  });
});
