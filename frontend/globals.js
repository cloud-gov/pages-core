export default {
  APP_HOSTNAME: process.env.APP_HOSTNAME,
  PRODUCT: process.env.PRODUCT,
  APP_NAME: process.env.PRODUCT === 'federalist' ? 'Federalist' : 'Pages',
};
