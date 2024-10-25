import { format, formatRelative } from 'date-fns';

export const formatDateTime = (date, relative = false) => {
  try {
    return relative
      ? formatRelative(new Date(date), new Date())
      : format(new Date(date), 'yyyy-MM-dd hh:mma');
  } catch (_) {
    return 'N/A';
  }
};

export const formatSha = (commit) => {
  try {
    return commit.slice(0, 7);
  } catch (_) {
    return 'N/A';
  }
};
