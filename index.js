var async = require('async');

var sql = require('./sql');
var mongo = require('./mongo');
var log4js = require('log4js');

var common = module.exports;

common.sql = sql;
common.mongo = mongo;
common.log4js = log4js;

common.init_log4js = function(config){
    common.log4js.configure(config);
};

common.init_sql = function(dbs, cb){
    async.eachOfSeries(dbs, function(value, key, callback){
        common.sql.newSqlStore(key, value, common.log4js.getLogger('mysql-'+key));
        common.sql.getSqlStore(key).testConnect(callback);
    }, function(err){
        cb(err);
    });
};

common.init_mongo = function(dbs, cb){
    async.eachOfSeries(dbs, function(value, key, callback){
        common.mongo.connect(key, value.uri, value.config, callback);
    }, function(err){
        cb(err);
    });
}