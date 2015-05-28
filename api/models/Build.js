/**
* Build.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
    completedAt: 'datetime',
    error: 'string',
    branch: 'string',
    site: {
      model: 'site',
      required: true
    },
    user: {
      model: 'user',
      required: true
    }
  },

  afterCreate: function(model, done) {
    this.runBuild(model, done);
  },

  runBuild: function(model, done) {
    // launch build in separate process
    // log error or update completedAt when finished
  }

};
