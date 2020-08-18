/* eslint-disable import/prefer-default-export */
import { format } from 'date-fns';

export const formatDateTime = (date) => {
  try {
    return format(new Date(date), 'yyyy-MM-dd hh:mma');
  } catch (error) {
    return 'N/A';
  }
};

export const formatSha = (commit) => {
  try {
    return commit.slice(1, 7);
  } catch (error) {
    return 'N/A';
  }
};
