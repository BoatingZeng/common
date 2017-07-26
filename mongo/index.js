var mongo = require('./mongo.js');
var dao = require('./dao.js');

mongo.dao = dao;

module.exports = mongo;