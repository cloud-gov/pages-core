const { json } = require('express');

const parseJson = json({
  limit: '2mb',
});

module.exports = parseJson;
