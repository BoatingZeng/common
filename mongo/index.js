var mongo = require('./mongo.js');
var createModel = require('./createModel.js');

mongo.createModel = createModel;

module.exports = mongo;