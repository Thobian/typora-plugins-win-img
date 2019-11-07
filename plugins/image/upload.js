(function($){
    // 配置信息
    var setting = {
        //==============重要说明==============
        //文件上传到哪里，取值有：self/tencent
        //self指自建的服务器、tencent指腾讯云的COS
        target:'tencent',
        
        //target=self 时涉及的配置参数
        self: {
            url: 'http://tools.jiebianjia.com/typora/upload.html',
            //自定义请求头，做校验，防止其他人随意调接口
            headers: {
                token: 'B40289FC92ED660F433BF0DB01577FDE'
            }
        },
        //target=tencent 时涉及的配置参数
        tencent : {
            // 关于腾讯云COS的介绍文档：https://cloud.tencent.com/document/product/436
            // 下面的 SecretId、SecretKey 强烈不建议用你腾讯云主账号的key ，创建一个子用户仅授予API的cos权限
            // 添加子用户链接：https://console.cloud.tencent.com/cam
            // 更多关于腾讯云子用户的介绍：https://cloud.tencent.com/document/product/598/13665
            
            // 必须参数，如果你有自己的腾讯云COS改成自己的配置
            Bucket: 'jiebianjia-1252439934',                    // 对象存储->存储桶列表(存储桶名称就是Bucket)
            SecretId: 'AKID5IFPK30gjWxzkFr6jCTUIq7G3Z4fIsb3',   // 访问控制->用户->用户列表->用户详情->API密钥 下查看
            SecretKey: 'KRUGmjPodVZMxrXxA6mNvGK8gxx97oGR',      // 访问控制->用户->用户列表->用户详情->API密钥 下查看
            Region: 'ap-guangzhou',                             // 对象存储->存储桶列表(所属地域中的英文就是Region)
            folder: 'typora',                                   // 可以把上传的图片都放到这个指定的文件夹下

            // 可选参数
            FileParallelLimit: 3,                               // 控制文件上传并发数
            ChunkParallelLimit: 3,                              // 控制单个文件下分片上传并发数
            ChunkSize: 1024 * 1024,                             // 控制分片大小，单位 B
            ProgressInterval: 1,                                // 控制 onProgress 回调的间隔
            ChunkRetryTimes: 3,                                 // 控制文件切片后单片上传失败后重试次数
            UploadCheckContentMd5: true,                        // 上传过程计算 Content-MD5
        },
        
        //==============回调函数==============
        // 上传成功
        onSuccess: function(url){
            //替换图片位置
            setting.element.removeAttr(locked).attr('src', url);
            setting.element.
                parent('span[md-inline="image"]').
                data('src', url).
                find('.md-image-src-span').
                html(url);
            //提醒
            var text = '图片上传成功：'+ url;
            $('#'+noticeEle).
            css({
                'background':'rgba(0,166,90,0.7)',
            }).
            html(text).
            show().
            delay(5000).
            fadeOut();
        },
        // 上传失败
        onFailure: function(text){
            setting.element.removeAttr(locked);
            $('#'+noticeEle).
            css({
                'background':'rgba(255,0,0,0.7)'
            }).
            html(text).
            show().
            delay(10000).
            fadeOut();
        }
    };
    
    var helper = {
        // 将base64转文件流
        base64ToBlob: function(base64) {
            var arr = base64.split(',');
            var mime = arr[0].match(/:(.*?);/)[1] || 'image/png';
            // 去掉url的头，并转化为byte
            var bytes = window.atob(arr[1]);
            // 处理异常,将ascii码小于0的转换为大于0
            var ab = new ArrayBuffer(bytes.length);
            // 生成视图（直接针对内存）：8位无符号整数，长度1个字节
            var ia = new Uint8Array(ab);
            
            for (var i = 0; i < bytes.length; i++) {
                ia[i] = bytes.charCodeAt(i);
            }

            return new Blob([ab], {
                type: mime
            });
        },
        // 根据base64获取文件扩展名
        extension: function(base64){
            var ext = base64.split(',')[0].match(/data:image\/(.*?);base64/)[1] || 'png';
            console.log("the file ext is: "+ext);
            return ext;
        },
        // 时间格式化函数
        dateFormat: function (date, fmt) {
            var o = {
                "M+": date.getMonth() + 1, //月份
                "d+": date.getDate(), //日
                "H+": date.getHours(), //小时
                "m+": date.getMinutes(), //分
                "s+": date.getSeconds(), //秒
                "q+": Math.floor((date.getMonth() + 3) / 3), //季度
                "S": date.getMilliseconds() //毫秒
            };
            if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + "").substr(4 - RegExp.$1.length));
            for (var k in o)
            if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
            return fmt;
        }
    };
    
    var init = {
        // 上传到自己服务时的初始化方法
        self: function(){
            
        },
        // 上传到腾讯云COS时的初始化方法
        tencent: function(){
            $.getScript( "./plugins/image/cos-js-sdk-v5.min.js" );
        }
    };
    
    // 上传文件的方法
    var upload = {
        // 自建服务器存储时，适用的上传方法
        self : function(fileData, successCall, failureCall){
            var xhr = new XMLHttpRequest();
            // 文件上传成功或是失败
            xhr.onreadystatechange = function(e) {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        console.log(xhr.responseText);
                        try{
                            var json = JSON.parse(xhr.responseText);
                            if(json.code){
                                var error = json.message+'('+json.code+')';
                                failureCall(error);
                            }else{
                                var url = json.data.url;
                                successCall(url);
                            }
                        }catch(e){
                            var error = '服务响应解析失败，错误：'+e.message+'(code:98)';
                            failureCall(error);
                            console.log(e);
                        }
                    } else {
                        var error = '网络错误，请重试。(code:99)<br />'+xhr.responseText;
                        failureCall(error);
                        console.log(xhr.responseText);
                    }
                }
            };
            // 开始上传
            xhr.open("POST", setting.self.url, true);
            for(var key in setting.self.headers){
                xhr.setRequestHeader(key, setting.self.headers[key]);
            }
            xhr.send(fileData);
        },
        
        // 使用腾讯云存储时，适用的上传方法
        tencent : function(fileData, successCall, failureCall){
            // 初始化COS
            var cos = new COS({
                SecretId: setting.tencent.SecretId,
                SecretKey: setting.tencent.SecretKey,
                // 可选参数
                FileParallelLimit: setting.tencent.FileParallelLimit,
                ChunkParallelLimit: setting.tencent.ChunkParallelLimit,
                ChunkSize: setting.tencent.ChunkSize,
                ProgressInterval: setting.tencent.ProgressInterval,
                ChunkRetryTimes: setting.tencent.ChunkRetryTimes,
                UploadCheckContentMd5: setting.tencent.UploadCheckContentMd5,
            });
            // 转化
            var filename = setting.tencent.folder+'/'+helper.dateFormat((new Date()),'yyyyMMddHHmmss-')+Math.floor(Math.random() * Math.floor(999999))+'.'+helper.extension(fileData);
            var fileData = helper.base64ToBlob(fileData);
            cos.sliceUploadFile({
                Bucket: setting.tencent.Bucket,
                Region: setting.tencent.Region,
                Key: filename,
                Body: fileData,
                onTaskReady: function (taskId) {
                    TaskId = taskId;
                },
                onProgress: function (info) {
                    lastPercent = info.percent;
                }
            }, function (err, data) {
                console.log(err);
                console.log(data);
                // 出现错误，打印错误信息
                if(err){
                    failureCall('服务返回异常，错误：'+err.error);
                    console.log(err);
                    return false;
                }
                try{
                    successCall('https://'+data.Location);
                }catch(e){
                    // 出现非预期结果，打印错误
                    failureCall('服务响应解析失败，错误：'+e.message);
                    console.log(e);
                    return false;
                }
            });
        }
    };
    
    
    //读取文件为base64，再回调上传函数将文件发到服务器
    var loadImgAndSend = function(url, object){
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                switch (setting.target) {
                    case 'self':
                        upload.self(reader.result, setting.onSuccess, setting.onFailure);
                        break;
                    case 'tencent':
                        upload.tencent(reader.result, setting.onSuccess, setting.onFailure);
                        break;
                    default:
                        failureCall('配置错误，不支持的图片上传方式，可选方式：self/tencent');
                } 
            }
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    }

    // 核心方法
    var locked = 'doing';
    var noticeEle = 'image-result-notice';    
    $.image = {};
    $.image.init = function(options){
        options = options||{};
        setting.target = options.target||setting.target;
        setting.self = options.self||setting.self;
        setting.tencent = options.tencent||setting.tencent;
        
        // 根据不同的文件存储位置，初始化不同的环境
        switch (setting.target) {
            case 'self':
                init.self();
                break;
            case 'tencent':
                init.tencent();
                break;
            default:
                failureCall('配置错误，不支持的图片上传方式，可选方式：self/tencent');
        }
        
        // 监听鼠标事件
        $('#write').on('mouseleave click', 'img', function(e){
            try{
                var src = e.target.src;
                if( /^(https?:)?\/\//i.test(src) ){
                    console.log('The image already upload to server, url:' + src);
                    return false;
                }
                setting.element = element = $(e.target);
                var doing = element.attr(locked)=='1';
                if( doing ){
                    console.log('uploading...');
                    return false;
                }else{
                    element.attr(locked, '1');
                }
                $('content').prepend('<div id="'+noticeEle+'" style="position:fixed;height:40px;line-height:40px;padding:0 15px;overflow-y:auto;overflow-x:hidden;z-index:10;color:#fff;width:100%;display:none;"></div>');
                //上传
                loadImgAndSend(src);
            }catch(e){console.log(e);};
        });
    };
})(jQuery);

$.image.init({target:'self'});