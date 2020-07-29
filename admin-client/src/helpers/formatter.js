import { format } from "date-fns";

export const formatDateTime = (date) =>
  format(new Date(date), "yyyy-dd-MM H:m z");
