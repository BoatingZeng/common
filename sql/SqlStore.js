var mysql = require('mysql');
var async = require('async');

/**
 * 创建一个SqlStore对象
 * @param {object} options - 参考mysql的createPool函数
 * @param {object} [logger] - 用来记录一些内部错误，默认是console
 */
var SqlStore = function(options, logger){
    this.options = options;
    this.pool = mysql.createPool(options);
    this.logger =  logger || console;
};

/**
 * 执行单句sql
 * @param {string} sql - 要执行的语句
 * @param {function} callback - callback(err, rows, fields)，参考mysql的query方法的回调
 */
SqlStore.prototype.query = function(sql, callback){
    var pool = this.pool;
    async.waterfall([
        //获取数据库连接
        function(cb){
            pool.getConnection(function(err, conn){
                cb(err, conn);
            });
        },
        //执行sql
        function(conn, cb){
            conn.query(sql, function(err, rows, fields){
                cb(err, conn, rows, fields);
            });
        }
    ],
    function(err, conn, rows, fields){
        if(conn) conn.release();
        callback(err, rows, fields);
    });
}

/**
 * 在事务里执行一系列sql语句
 * @param {string[]} sqls - sql语句数组
 * @param {function} cb - cb(err, results)，results = [{ rows, fields }]，每个query都会有一个rows,fields结果
 */
SqlStore.prototype.batchQuery = function(sqls, cb){
    var pool = this.pool;
    var logger = this.logger;
    var results = [];
    async.waterfall([
        function(next){
            pool.getConnection(function(err, conn){
                if(err) {
                    logger.error('batchQuery时，getConnection时出错', err);
                    return next(err);
                }
                next(null, conn);
            });
        },
        function(conn, next){
            conn.beginTransaction(function(err){
                if(err) {
                    logger.error('batchQuery时, beginTransaction时出错', err);
                    return next(err);
                }
                next(null, conn);
            });
        },
        function(conn, next){
            async.eachSeries(sqls,
                function(sql, callback){
                    conn.query(sql, function(err, rows, fields){
                        if(err) {
                            logger.error('batchQuery时，doQuery时，执行以下语句时出错：', sql, err);
                            return callback(err);
                        }
                        results.push({rows: rows, fields: fields});
                        callback(null);
                    })
                },
                function(err){
                    next(err, conn);
                });
        }
    ],
    function(err, conn){
        if(!conn) return cb(new Error('batchQuery最后没有获取到conn'));
        if(err){
            conn.rollback();
            conn.release();
            return cb(err);
        }
        conn.commit(function(err){
            if(err){
                logger.error('batchQuery时，最后commit时出错', err);
                conn.rollback();
            }
            conn.release();
            cb(err, results);
        })
    });
}

/**
 * 用来测试连接是否正常建立，通过select 1;因为只是创建pool的话，不进行查询，是不会主动连接的。
 * @parma {function} cb - cb(err)，没有err就认为成功建立连接
 */
SqlStore.prototype.testConnect = function(cb){
    this.query('select 1;', function(err, rows, fields){
        cb(err);
    });
}

module.exports = SqlStore;