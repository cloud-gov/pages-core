/* eslint-disable import/prefer-default-export */
import { format } from 'date-fns';

export const formatDateTime = (date) => format(new Date(date), 'yyyy-MM-dd hh:mma');
