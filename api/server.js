const http = require('http');
const express = require('./express');

module.exports = http.createServer(express);
