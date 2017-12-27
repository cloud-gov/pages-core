import moment from 'moment';

const NO_TIME = '-';


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
  return moment.duration(moment(baseTime).diff(startTime)).humanize();
};


/**
 * Return a human-readable time since the supplied date
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const timeFrom = date => {
  if (!date) {
    return NO_TIME;
  }

  return moment(date).fromNow();
};

/**
 * Return a human-readable day, months and year (i.e. Monday, Dec. 25th 2020)
 * @param  {String | Date} date format "YYYY-DD-DDT00:00:00.000Z"
 * @return {String}
 */
export const dayAndDate = date => {
  if (!date) {
    return NO_TIME;
  }

  return moment(date).format('dddd, MMM Do YYYY');
};
