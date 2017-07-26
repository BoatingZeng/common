/**
 * 用来管理mongodb的连接(数据库)，把连接(数据库)储存到connections里，通过getConnection来获取响应连接
 */

var mongoose = require('mongoose');

//官方建议说不要用mongoose的Promise，所以这里用nodejs默认的
mongoose.Promise = Promise;

var mongo = module.exports;
var connections = {};

/**
 * 连接到数据库，并且记录这个连接到connections，用mongoose的createConnection函数，没有做校验参数的操作
 * @param {string} name - 数据库的名字，用来作为标识，就是config中dbs的key
 * @param {string} uri - mongodb的uri，如：mongodb://boating:boating@localhost:27017/test
 * @param {object} config - mongoose的createConnection函数所有设置都放在这里，格式待定
 * @param {function} cb - cb(err, con)，con是刚刚建立的连接
 */
mongo.connect = function(name, uri, config, cb){
    config.useMongoClient = true;
    var promise = mongoose.createConnection(uri, config);
    promise.then(function(con){
        connections[name] = con;
        cb(null, con);
    }, function(err){
        cb(err);
    })
}

/**
 * 关闭对应连接
 * @param {string} name - 数据库的名字，用来作为标识，就是config中dbs的key
 */
mongo.disConnect = function(name){
    connections[name].close();
    delete connections[name];
}

/**
 * 用数据库的名字获取对应的连接，就是存在connections中的值
 * @param {string} name - 数据库的名字，用来作为标识，就是config中dbs的key
 * @return {object} 返回mongoose的Connection对象
 */
mongo.getConnection = function(name){
    return connections[name];
}