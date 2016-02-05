/**
 * HomePage
 *
 * An API to interact with the Federalist Home Page.
 */

var BaseFederalistPage = require('./baseFederalist.page');

function HomePage () {
  BaseFederalistPage.apply(this, arguments);
};

HomePage.prototype = Object.create(BaseFederalistPage.prototype);

module.exports = HomePage;
