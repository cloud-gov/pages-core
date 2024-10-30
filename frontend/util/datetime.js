import { format, formatDistanceStrict, parseISO } from 'date-fns';

const NO_TIME = '-';

/*
  `date-fns` v2 "format" functions no longer accept string formats. In lieu of
  replacing all of the callers, wrap the existing functions in a helper to
  parse string arguments using the provided parsing utilities.

  see https://github.com/date-fns/date-fns/blob/master/CHANGELOG.md#changed-3
  for more details.
 */
const compat =
  (fn) =>
  (...args) =>
    fn(...args.map((arg) => (typeof arg === 'string' ? parseISO(arg) : arg)));

/**
 * Helper to get the given date or `now` in UTC.
 * @param {String | Date} dateString  date to convert to UTC. Defaults to now.
 * @return {Date}                     date in UTC
 */
function getUTCDate(dateString = Date.now()) {
  const date = new Date(dateString);

  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds(),
  );
}

/**
 * Return a human-readable duration between two date strings
 * @param  {String | Date} endTime    format "YYYY-DD-DDT00:00:00.000Z"
 * @param  {String | Date} startTime  format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}                   human readable duration
 */
export const duration = compat((startTime, endTime) => {
  if (!startTime) {
    return NO_TIME;
  }

  const baseTime = endTime || new Date();
  return formatDistanceStrict(startTime, baseTime, {
    roundingMethod: 'floor',
  });
});

/**
 * Return a human-readable time since the supplied date, like '5 hours ago'
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const timeFrom = compat((date) => {
  if (!date) {
    return NO_TIME;
  }

  return formatDistanceStrict(date, new Date(), {
    addSuffix: true,
    roundingMethod: 'floor',
  });
});

/**
 * Return a human-readable day, months and year (i.e. December 25th 2020 5:22 PM)
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const dateAndTime = compat((date) => {
  if (!date) {
    return NO_TIME;
  }

  return format(date, 'MMMM do yyyy, h:mm:ss aaaa');
});

/**
 * Return a shorter human-readable day, months,
 * year, and hours (Dec 25, 2020 at 5:22 PM (GMT-5))
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const dateAndTimeSimple = compat((date) => {
  if (!date) {
    return NO_TIME;
  }

  return format(date, "MMM d, yyyy 'at' h:mm aa (z)");
});

/**
 * Return a shorter human-readable day, months and year, no hours (i.e. Dec 25, 2020) )
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const dateOnly = compat((date) => {
  if (!date) {
    return NO_TIME;
  }

  return format(date, 'MMM d, yyyy');
});

/**
 * Return a formatted timestamp in UTC (i.e. '2018-02-11 04:22:33')
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const timestampUTC = compat((date) => {
  if (!date) {
    return NO_TIME;
  }

  const utcTimestamp = format(getUTCDate(date), 'yyyy-MM-dd HH:mm:ss');
  return `${utcTimestamp}`;
});
