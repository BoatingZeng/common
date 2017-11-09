# 封装了log4js、mysql、mongoose的库

## 用例

这个例子是从实际应用中抽取的

```js
//config.js，部分config
{
    log4js: {
        //配置不同的appenders，供下面使用
        appenders: {
            defaultDailyFile: {
                type: "dateFile",
                filename: path.join(APP_ROOT_DIR, "log"),
                pattern: "/yyyy/MM/dd",
                alwaysIncludePattern: true
            },
            console: {
                type: 'console'
            }
        },
        //不同的category分别配置，一般弄个default就够了
        categories: {
            default: {
                appenders: ["defaultDailyFile"],
                level: "warn"
            }
        },
        //在pm2中使用log4js
        pm2: true
    },
    mysql: {
        //这里的道理跟上面差不多
        dbs: {
            db1: {
                host: 'localhost',
                port: '3306',
                user: 'boating',
                password: 'boating',
                database: 'boating_test'
            }
        }
    }
}
```

```js
//app.js，主程序
var common = require('./lib/common');
common.mount(['log4js', 'sql']);

//因为这个文件本身就要用到logger了，所以先把它初始化了，而且它是不需要异步的
//而且common的内部本来就用了log4js做记录了，所以初始化这个是必须的
common.init_log4js(config.log4js);
var logger = common.log4js.getLogger();

//初始化common，数据库相关的项是异步的
function initCommon(cb){
    async.series({
        mysql: function(cb){
            common.init_sql(config.mysql.dbs, cb);
        }
    }, function(err){
        if(err) logger.error('initCommon出错', err);
        cb(err);
    });
}
```

之后就可以通过common来使用common内部的工具了，后面的代码怎么组织跟common关系不大，但是common只能初始化一次，理论上也不应该在运行途中初始化这些东西，应该在开头就要做。
