/**
 * 用来创建model，会添加一些常用方法
 */

var mongoose = require('mongoose');

/**
 * 创建一个mongoose model
 * @param {object} db - mongoose 的 Connection对象
 * @param {string} name - model的名字
 * @param {object} schema - mongoose 的 Schema对象
 * @param {string} collection - mongodb里的集合名字，最好还是不要用mongoose自动命名的
 * @return {string} 返回mongoose的Model对象
 */
module.exports = function(db, name, schema, collection){
    var model = db.model(name, schema, collection);

    //这里开始给model添加一些常用的方法

    /**
     * 封装mongoose的find方法，并且包含分页和populate
     * @param {object} opts - 参数都放在这个对象里，下面是opts的属性
     * @param {number} [page] - 第几页
     * @param {number} [rows] - 每页多少行
     * @param {object} [conditions] - 参见mongoose的Model.find()
     * @param {object} [fields] -同上，mongoose里叫projection
     * @param {object} [options] - 同上，用分页的时候，就不要设置skip和limit了，用page和rows定义比较直观
     * @param {object} [populations] - populate函数的参数，参见mongoose的Query.populate
     * @param {boolean} [isLean = true] - 默认是调用lean()
     * @param {function} cb - 标准的cb(err, result)。如果不是分页查询result就是mongoose里
     * Model.find()的结果。如果分页，result = { page, total, pages, rows }，第几页，总数，总页数，当前页结果
     */
    model.find2 = function(opts, cb){
        opts = opts || {};
        var self = this;
        var page = opts.page;
        var rows = opts.rows;
        var conditions = opts.conditions;
        var fields = opts.fields;
        var options = opts.options;
        var populations = opts.populations;
        var isLean = opts.isLean === false ? false : true;
        if(opts.page && opts.rows){
            //分页
            options = options || {};
            options.skip = (page-1)*rows;
            options.limit = rows;

            //先数数一个有多少记录
            self.count(conditions, function(err, count){
                if(err) return cb(err);

                var result = {
                    page: page,
                    total: count,
                    pages: Math.ceil(count / rows),
                    rows: []
                };
                if(!count){
                    cb(null, result);
                } else {
                    var q = self.find(conditions, fields, options);
                    if(isLean) q.lean();
                    if(populations) q.populate(populations);
                    q.exec(function(err, doc){
                        if(err) return cb(err);
                        result.rows = doc;
                        cb(null, result);
                    })
                }
            });
        } else {
            //不分页
            var q = self.find(conditions, fields, options);
            if(isLean) q.lean();
            if(populations) q.populate(populations);
            q.exec(cb);
        }
    };

    return model;
};