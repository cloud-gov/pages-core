/* eslint-disable import/prefer-default-export */
import { formatRelative } from 'date-fns';

export const formatDateTime = (date) => {
  try {
    return formatRelative(new Date(date), new Date());
  } catch (error) {
    return 'N/A';
  }
};

export const formatSha = (commit) => {
  try {
    return commit.slice(0, 7);
  } catch (error) {
    return 'N/A';
  }
};
