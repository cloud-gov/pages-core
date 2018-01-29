import { format, distanceInWords, distanceInWordsStrict } from 'date-fns';


const NO_TIME = '-';

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
    date.getUTCSeconds()
  );
}


/**
 * Return a human-readable duration between two date strings
 * @param  {String | Date} endTime    format "YYYY-DD-DDT00:00:00.000Z"
 * @param  {String | Date} startTime  format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}                   human readable duration
 */
export const duration = (startTime, endTime) => {
  if (!startTime) {
    return NO_TIME;
  }

  const baseTime = endTime || new Date();
  return distanceInWords(baseTime, startTime);
};


/**
 * Return a human-readable time since the supplied date, like '5 hours ago'
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const timeFrom = (date) => {
  if (!date) {
    return NO_TIME;
  }

  return distanceInWordsStrict(new Date(), date, { addSuffix: true });
};

/**
 * Return a human-readable day, months and year (i.e. December 25th 2020 5:22 PM)
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const dateAndTime = (date) => {
  if (!date) {
    return NO_TIME;
  }

  return format(date, 'MMMM Do YYYY, h:mm:ss a');
};

/**
 * Return a formatted timestamp in UTC (i.e. '2018-02-11 04:22:33 ')
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const timestampUTC = (date) => {
  if (!date) {
    return NO_TIME;
  }

  const utcTimestamp = format(getUTCDate(date), 'YYYY-MM-DD HH:mm:ss');
  return `${utcTimestamp}`;
};
