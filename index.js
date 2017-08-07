var async = require('async');

var common = module.exports;

/**
 * @param {string[]} [toolList] - 要使用的插件，不传就全部都用
 * @return {object} - 返回common对象
 */
common.mount = function(toolList){
    if(!toolList || toolList.indexOf('log4js') !== -1){
        var log4js = require('log4js');
        common.log4js = log4js;
        common.init_log4js = function(config){
            common.log4js.configure(config);
        };
    }

    if(!toolList || toolList.indexOf('sql') !== -1){
        var sql = require('./sql');
        common.sql = sql;
        common.init_sql = function(dbs, cb){
            async.eachOfSeries(dbs, function(value, key, callback){
                common.sql.newSqlStore(key, value, common.log4js.getLogger('mysql-'+key));
                common.sql.getSqlStore(key).testConnect(callback);
            }, function(err){
                cb(err);
            });
        };
    }

    if(!toolList || toolList.indexOf('mongo') !== -1){
        var mongo = require('./mongo');
        common.mongo = mongo;
        common.init_mongo = function(dbs, cb){
            async.eachOfSeries(dbs, function(value, key, callback){
                common.mongo.connect(key, value.uri, value.config, callback);
            }, function(err){
                cb(err);
            });
        }
    }
}