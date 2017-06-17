
// queue.js
function DateUtil() {}
// 获取格式化数据
DateUtil.getTime = function (format) {
    var date = new Date();
    return format.replace("year", date.getFullYear())
    .replace("month", date.getMonth())
    .replace("day", date.getDay())
    .replace("hour", date.getHours())
    .replace("minute", date.getMinutes())
    .replace("second", date.getSeconds());
}

// 定义对象池, 构造可以随意跨作用域访问的类
function ObjectPool(){}

// 添加对象
ObjectPool.addObject = function(name, value)
{
    if (!name || !value)
    {
        return false;
    }
    if (ObjectPool[name])
    {
        return false;
    }
    ObjectPool[name] = value;
}

// 删除元素
ObjectPool.delObject = function(name)
{
    ObjectPool[name] = undefined;
    // 或者
    // delete ObjectPool[name];
}

// 获取对象
ObjectPool.getObject = function(name)
{
    if (!name)
    {
        return undefined;
    }
    return ObjectPool[name];
}

// 表格操作类
function TableOp() {}

TableOp.cache = {};

// 后台交互添加一条数据
TableOp.addition = function(queueName, createTime)
{
    $.ajax(
    {
        url: "EM/data/addition",
        type: "POST",
        // 默认不能从缓存中获取数据
        cache: false,
        dataType: "json",
        // json类型为{status:"success|error", res:"{}"}
        data: {queueName: queueName, createTime: createTime}
    }).done(function(data)
    {
        ObjectPool.addObject("addition", data);
    });
    var res = ObjectPool.getObject("addition");
    // 用完之后就删掉
    ObjectPool.delObject("addition");
    return !res ? false : res['status'] == "success";
}

// 后台交互删除一条数据
TableOp.deletion = function(queueName)
{
    $.ajax(
    {
        url: "EM/data/deletion",
        type: "POST",
        // 默认不能从缓存中获取数据
        cache: false,
        dataType: "json",
        // json类型为{status:"success|error", res:"{}"}
        data: {queueName: queueName}
    }).done(function(data)
    {
        ObjectPool.addObject("deletion", data);
    });
    var res = ObjectPool.getObject("deletion");
    ObjectPool.delObject("deletion");
    return !res ? false : res['status'] == "success";
}

// 后台交互查看一条数据详细
TableOp.queueDetail = function(queueName)
{
    $.ajax(
    {
        url: "EM/data/queueDetail",
        type: "POST",
        // 默认不能从缓存中获取数据
        cache: false,
        dataType: "json",
        // json类型为{status:"success|error", res:"{}"}
        data: {queueName: queueName}
    }).done(function(data)
    {
        ObjectPool.addObject("queueDetail", data);
    });
    var res = ObjectPool.getObject("queueDetail");
    ObjectPool.delObject("queueDetail");
    return res;
}

// 后台交互加载数据
TableOp.initialization = function()
{
    $.ajax(
    {
        url: "EM/data/initialization",
        type: "GET",
        // 默认不能从缓存中获取数据
        cache: false,
        // json类型为{status:"success|error", res:"{}"}
        dataType: "json",
    }).done(function(data)
    {
        ObjectPool.addObject("initialization", data);
    });
    var res = ObjectPool.getObject("initialization");
    if (!res || res['res'] != 'success')
    {
        alert("加载表格数据失败");
        return;
    }
    for (var i = 0; i<res['res'].length; i++)
    {
        TableOp.addRowData(res['res'][i]);
    }
}

// 删除一行
TableOp.delRow = function (obj) {
    var text = $(obj).attr("queue");
    if (!TableOp.deletion(text))
    {
        alert("删除数据失败:" + text);
        return;
    }
    // 获取到tr层次
    $(obj).parent() // div
        .parent() // td
        .parent() // tr
        .remove(); // remove all
   this.cache[text] = false;
}

// 添加表格数据
TableOp.addRowData = function(data)
{
    TableOp.cache[data.queueName] = true;
    // 给表格添加一行数据
    var html = "<tr><td>" + data.queueName + "</th><td>" + data.sedNums 
        + "</th><td>" + data.recNums + "</th><td>" + data.createTime +
        "</th><td><div class='btn-group'><button class='btn btn-default'\
        onclick='TableOp.delRow(this)' queue='" + data.queueName + "'>\
        <span class='glyphicon glyphicon-trash'></span>\
        </button><button class='btn btn-default' onclick='table_detail(" + text + ",true)'>\
        <span class='glyphicon glyphicon-list-alt'></span>\
        </button></div></th></tr>"
    $("#em-table-bd").append(html);
}

// 添加一行
TableOp.addRow = function () 
{
    // 获取输入数据
    var text = $("#em-queue-name").val();
    if (TableOp.cache[text])
    {
        alert("队列名称已存在，请重新输入");
        return;
    }
    
    // 调用后台添加数据
    var createTime = DateUtil.getTime("year-month-day hour-minute-second");
    if (!TableOp.addition(text, createTime))
    {
        alert("添加数据失败:" + text);
        return;
    }
    
    TableOp.cache[text] = true;
    // 给表格添加一行数据
    var html = "<tr><td>" + text + "</th><td>0</th><td>0</th><td>"
         + createTime + "</th><td><div class='btn-group'><button class='btn btn-default'\
        onclick='TableOp.delRow(this)' queue='" + text + "'>\
        <span class='glyphicon glyphicon-trash'></span>\
        </button><button class='btn btn-default' onclick='table_detail(" + text + ",true)'>\
        <span class='glyphicon glyphicon-list-alt'></span>\
        </button></div></th></tr>"
    $("#em-table-bd").append(html);
}

function table_detail(queueName, flag)
{
    var res = TableOp.queueDetail(queueName);
    if (res['status'] != "success")
    {
        alert("查询数据失败:" + queueName);
        return;
    }
    $("#em-table").css("display", flag ? "none" : "block");
    $("#em-input-text").css("display", flag ? "none" : "table");
    $("#em-queue-detail").css("display", flag ? "block" : "none");
    $("#em-queue-name-1").text(res['res'].queueName);
    $("#em-con-num-1").text(res['res'].connectionNums);
    var textTmp = res['res'].sedMsg;
    textTmp.replace(";", "<br>");
    $("#em-sed-meg").text(textTmp);
    textTmp = res['res'].recMsg;
    textTmp.replace(";", "<br>");
    $("#em-rec-meg").text(textTmp);
}
