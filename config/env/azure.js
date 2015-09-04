/**
 * Azure environment settings
 *
 */

module.exports = {
  grunt: {
    _hookTimeout: 240 * 1000
  },
  
  port: process.env.PORT
};