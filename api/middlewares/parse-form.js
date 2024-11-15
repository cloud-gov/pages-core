const { urlencoded } = require('express');

const parseForm = urlencoded({
  limit: '1kb',
});

module.exports = parseForm;
