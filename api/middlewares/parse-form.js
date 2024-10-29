const { urlencoded } = require('express');

const parseForm = urlencoded({
  extended: false,
  limit: '1kb',
});

module.exports = parseForm;
