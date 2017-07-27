var _ = require('lodash');
var mysql = require('mysql');

var maker = module.exports;

/**
 * 对象转换为[[keys], [values]]
 * @param {object} - obj
 * @return {Array} [[keys], [values]]
 */
function objectToArray(obj){
    if(!obj) return [];
    var keys = [];
    var values = [];
    for(var k in obj){
        if(!obj.hasOwnProperty(k)) continue;
        var v = obj[k];
        if(!_.isUndefined(v)){
            keys.push(k);
            values.push(v);
        }
    }
    return keys.length == 0 ? [] : [keys, values];
}

/**
 * 只做最简单的and逻辑，where的例子：
 * {field1: 'value1', field2: 3} => where field1 = 'value1' and field2 = 3;
 * {field1: 'value1', field2: {$gt: 2, $lt: 10}} => field1 = 'value1' and field2 > 2 and field <10;
 * @param {object} - where
 * @return {string}
 */
function sqlWhere(where){
    if(_.isString(where)) return where;
    var logic = 'and';
    var symble = '=';
    var objArray = objectToArray(where);
    if(objArray.length == 0) return '';

    var sql = [];
    var params = [];
    var fields = objArray[0];
    var values = objArray[1];

    //模仿mongo
    var symbleMap = {
        $gt: '>',
        $lt: '<',
        $gte: '>=',
        $lte: '<='
    };

    for(var i=0; i<fields.length; i++){
        if(_.isObject(values[i])){
            for(var k in values[i]){
                if(!values[i].hasOwnProperty(k)) continue;
                sql.push('??'+symbleMap[k]+'?');
                sql.push(logic);
                params.push(fields[i]);
                params.push(values[i][k]);
            }
        } else {
            sql.push('??'+symble+'?');
            sql.push(logic);
            params.push(fields[i]);
            params.push(values[i]);
        }
    }
    sql.pop(); //去掉最后的logic符号
    return mysql.format(sql.join(' '), params);
}

/**
 *
 * @param {string} table - 表名
 * @param {object} where - where条件，参考sqlWhere函数
 * @param {string[]} fields - 字段名数组
 * @param {object} orderBy - 形式：{field: 'asc'}或{field: 'desc'}
 * @param {number} limit - 查多少个
 */
maker.sqlSelect = function(table, where, fields, orderBy, limit){
    var sql = ['select'];
    var fieldsStr = fields && fields.length > 0 ? fields.join(',') : '*';
    sql.push(fieldsStr);
    sql.push('from');
    sql.push(mysql.escapeId(table));

    if(where){
        where = sqlWhere(where);
        sql.push('where');
        sql.push(where);
    }

    if(orderBy){
        sql.push('order by');
        for(var f in orderBy){
            if(!orderBy.hasOwnProperty(f)) continue;
            sql.push(f);
            sql.push(orderBy[f]);
            sql.push(',');
        }
        sql.pop(); //去掉最后一个逗号
    }

    if(limit){
        sql.push('limit');
        sql.push(limit);
    }
    sql.push(';');
    return sql.join(' ');
};

/**
 * 生成sql insert 语句，插入单个记录，如果要插入多个，就用多条语句好了
 * @param {string} table - 表名
 * @param {object} item - 要插入的项，单个
 * @return {string} sql语句
 */
maker.sqlInsert = function(table, item){
    var tem = 'insert into ?? (??) values (?);';
    var fields = [];
    var values = [];
    for(var field in item){
        if(!item.hasOwnProperty(field)) continue;
        fields.push(field);
        values.push(item[field]);
    }
    return mysql.format(tem, [table, fields, values]);
};


/**
 * 获取update语句
 * @param {string} table - 表名
 * @param {object} item - 要更新的项，单个
 * @param {object} where - where条件，参考sqlWhere函数
 * @return {string} sql语句
 */
maker.sqlUpdate = function(table, item, where){
    var tem = 'update ?? set ? where ';
    return mysql.format(tem, [table, item]) + sqlWhere(where) + ';';
};

/**
 *
 * @param {string} table - 表名
 * @param {object} where - where条件，参考sqlWhere函数
 * @return {string} sql语句
 */
maker.sqlDelete = function(table, where){
    var tem = 'delete from ?? where ';
    return mysql.format(tem, [table]) + sqlWhere(where) + ';';
};