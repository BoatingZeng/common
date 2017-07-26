/**
 * 用来管理不同的sql数据库连接，连接都放在dbs里
 */
var SqlStore = require('./SqlStore.js');

var dbs = {};

var sql = module.exports;

/**
 * 创建一个SqlStore实例并且按name储存到dbs里
 * @param {string} name - 数据库名字，作为标识
 * @param {object} options - 参考SqlStore的构造函数
 * @param {object} logger - 参考SqlStore的构造函数
 */
sql.newSqlStore = function(name, options, logger){
    dbs[name] = new SqlStore(options, logger);
}

/**
 * 通过name获取dbs中对应的SqlStore实例
 */
sql.getSqlStore = function(name){
    return dbs[name];
}