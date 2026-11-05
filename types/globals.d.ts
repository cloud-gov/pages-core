interface Error {
  status?: number | string;
  errors?: any[];
  response?: any;
}

interface Window {
  FRONTEND_CONFIG: any;
  CSRF_TOKEN: string;
}
