(function($){
    // 配置信息
    var setting = {
        //==============重要说明==============
        //文件上传到哪里，取值有：self/tencent/aliyun/upyun/qiniu
        //self指自建的服务器
        //tencent指腾讯云的COS
        //aliyun指阿里云OSS
        //upyun指又拍云（目前暂不支持，sdk弄了半天没好）
        //qiniu指七牛云
        target:'qiniu',
        
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
            Folder: 'typora',                                   // 可以把上传的图片都放到这个指定的文件夹下

            // 可选参数
            FileParallelLimit: 3,                               // 控制文件上传并发数
            ChunkParallelLimit: 3,                              // 控制单个文件下分片上传并发数
            ChunkSize: 1024 * 1024,                             // 控制分片大小，单位 B
            ProgressInterval: 1,                                // 控制 onProgress 回调的间隔
            ChunkRetryTimes: 3,                                 // 控制文件切片后单片上传失败后重试次数
            UploadCheckContentMd5: true,                        // 上传过程计算 Content-MD5
        },
        //target=aliyun 时涉及的配置参数
        aliyun : {
            // 必须参数，如果你有自己的阿里云OSS改成自己的配置
            SecretId: 'LTAI4FfAi5d9Bd6bT6bc9LYL',               // 需要先创建 RAM 用户，同时访问方式选择“编程访问”，详细帮助文档：https://help.aliyun.com/document_detail/28637.html
            SecretKey: 'D4ApnTuIO3caXQhHHM59THysdoCAc7',        // 只想说阿里的这个RAM做的还真的有点难以理解和使用
            Folder: 'typora',                                   // 可以把上传的图片都放到这个指定的文件夹下
            BucketDomain : 'http://jiebianjia.oss-cn-shenzhen.aliyuncs.com/', // 存储空间下有个：Bucket 域名 挑一个就好了
            
            policyText: {
                "expiration": "9021-01-01T12:00:00.000Z",       //设置该Policy的失效时间，超过这个失效时间之后，就没有办法上传文件了
                "conditions": [
                    ["content-length-range", 0, 524288]         // 设置上传文件的大小限制 512kb，可以根据自己的需要调整
                ]
            },
        },
        //target=upyun 时涉及的配置参数
        upyun : {
            // 必须参数，如果你有自己的阿里云OSS改成自己的配置
            Username: 'typora',                              // 用户名
            Password: '8sCz8tfHcho2JOFcB174jrDEkKi3MuaB',    // 密码
            Folder: 'typora',                                // 可以把上传的图片都放到这个指定的文件夹下
            Bucket : 'jiebianjia',                           // 存储桶 或者又叫服务名称
            Domain : 'http://v0.api.upyun.com/',             // 智能选路（官方推荐，一般不用改）
        },
        //target=qiniu 时涉及的配置参数
        qiniu : {
            UploadDomain: 'https://upload-z2.qiniup.com',               // 上传地址，需要根据你存储空间所在位置选择对应“客户端上传”地址 详细说明：https://developer.qiniu.com/kodo/manual/1671/region-endpoint
            AccessDomain: 'http://q1701tver.bkt.clouddn.com/',          // 上传后默认只会返回相对访问路径，需要设置好存储空间的访问地址。进入“文件管理”下面可以看到个“外链域名”就是你的地址了。注意保留前面的：http://，以及后面的：/
            AccessKey : 'SesGGZ8LCt3q8F0OwBk6Pqjk6pBN630Aj3s59toX',     // AK通过“密钥管理”页面可以获取到，地址：https://portal.qiniu.com/user/key
            SecretKey: 'w2O1xiZ26q-sv-4tQkxERPwcbTPGt6vi4PSw_q2S',      // SK通过“密钥管理”页面可以获取到，地址：https://portal.qiniu.com/user/key
            Folder: 'typora',                                           // 可以把上传的图片都放到这个指定的文件夹下
            
            policyText: {
                scope: "jiebianjia",                                    // 对象存储->空间名称，访问控制记得设置成公开
                deadline: 225093916800,                                 // 写死了：9102-12-12日，动态的好像偶尔会签名要不过
            },
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
        mine: function(base64){
            var arr  = base64.split(',');
            var mime = arr[0].match(/:(.*?);/)[1] || 'image/png';
            console.log("the file mime is: "+mime);
            return mime;
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
        },
        // 上传到阿里云OSS时的初始化方法
        aliyun: function(){
            $.getScript( "./plugins/image/crypto/crypto/crypto.js", function(){
                $.getScript( "./plugins/image/crypto/hmac/hmac.js" );
                $.getScript( "./plugins/image/crypto/sha1/sha1.js" );
                $.getScript( "./plugins/image/crypto/base64.js" );
            });
        },
        // 上传到又拍云时的初始化方法
        upyun: function(){
            $.getScript( "./plugins/image/crypto/crypto/crypto.js", function(){
                $.getScript( "./plugins/image/crypto/hmac/hmac.js" );
                $.getScript( "./plugins/image/crypto/sha1/sha1.js" );
                $.getScript( "./plugins/image/crypto/md5/md5.js" );
                $.getScript( "./plugins/image/crypto/base64.js" );
            });
        },
        // 上传到七牛云时的初始化方法
        qiniu: function(){
            $.getScript( "./plugins/image/crypto/crypto/crypto.js", function(){
                $.getScript( "./plugins/image/crypto/hmac/hmac.js" );
                $.getScript( "./plugins/image/crypto/sha1/sha1.js" );
                $.getScript( "./plugins/image/crypto/base64.js" );
            });
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
                                return failureCall(json.message+'('+json.code+')');
                            }else{
                                var url = json.data.url;
                                successCall(url);
                            }
                        }catch(err){
                            console.log(err);
                            return failureCall('服务响应解析失败，错误：'+err.message);
                        }
                    } else {
                        console.log(xhr.responseText);
                        var error = '网络错误，请重试。<br />'+xhr.responseText;
                        return failureCall(error);
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
            var client = new COS({
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
            var filename = setting.tencent.Folder+'/'+helper.dateFormat((new Date()),'yyyyMMddHHmmss-')+Math.floor(Math.random() * Math.floor(999999))+'.'+helper.extension(fileData);
            var fileData = helper.base64ToBlob(fileData);
            client.sliceUploadFile({
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
                    return failureCall('服务返回异常，错误：'+err.error);
                }
                try{
                    successCall('https://'+data.Location);
                }catch(err){
                    console.log(err);
                    // 出现非预期结果，打印错误
                    return failureCall('服务响应解析失败，错误：'+err.message);
                }
            });
        },
        
        // 使用阿里云存储时，适用的上传方法
        aliyun: function(fileData, successCall, failureCall){
            var filename = helper.dateFormat((new Date()),'yyyyMMddHHmmss-')+Math.floor(Math.random() * Math.floor(999999))+'.'+helper.extension(fileData);
            var filepath = setting.aliyun.Folder+'/'+filename;
            var policyBase64 = Base64.encode(JSON.stringify(setting.aliyun.policyText));
            var bytes = Crypto.HMAC(Crypto.SHA1, policyBase64, setting.aliyun.SecretKey, { asBytes: true }) ;
            var signature = Crypto.util.bytesToBase64(bytes);
            
            var fileData = helper.base64ToBlob(fileData);
            var formData = new FormData();
            formData.append('name', filename);
            formData.append('key', filepath);
            formData.append('policy', policyBase64);
            formData.append('OSSAccessKeyId', setting.aliyun.SecretId);
            formData.append('success_action_status', 200);
            formData.append('signature', signature);
            formData.append('file', fileData);
            $.ajax({
                type: "POST",
                url: setting.aliyun.BucketDomain,
                processData:false,
                data:formData,
                contentType: false,
                success: function(result) {
                    //奇葩的阿里云，响应内容为空
                    console.log(result);
                    successCall(setting.aliyun.BucketDomain+filepath);
                },
                error:function(result){
                    console.log(result);
                    failureCall('服务响应解析失败，请稍后再试');
                }
            });
        },
        
        // 使用又拍云存储时，适用的上传方法
        upyun: function(fileData, successCall, failureCall){
            var filename = helper.dateFormat((new Date()),'yyyyMMddHHmmss-')+Math.floor(Math.random() * Math.floor(999999))+'.'+helper.extension(fileData);
            var filepath = '/'+setting.upyun.Folder+'/'+filename;
            var fileData = helper.base64ToBlob(fileData);
            
            var authorization = 'Basic '+window.btoa(setting.upyun.Username+':'+setting.upyun.Password);
            
            
            var formData = new FormData();
            formData.append('bucket', setting.upyun.Bucket);
            formData.append('save-key', filepath);
            formData.append('expiration', Math.floor(new Date().getTime() / 1000) + 600);
            formData.append('file', fileData);
            $.ajax({
                type: "POST",
                url: setting.upyun.Domain+setting.upyun.Bucket,
                processData:false,
                data:formData,
                contentType: false,
                beforeSend:function(request){
                    request.setRequestHeader("Authorization", authorization);
                },
                success: function(result) {
                    console.log(result);
                    //successCall(setting.aliyun.BucketDomain+filepath);
                },
                error:function(result){
                    console.log(result);
                    failureCall('服务响应解析失败，请稍后再试');
                }
            });
        },
        
        // 使用七牛云存储时，适用的上传方法
        qiniu: function(fileData, successCall, failureCall){
            var filename = helper.dateFormat((new Date()),'yyyyMMddHHmmss-')+Math.floor(Math.random() * Math.floor(999999))+'.'+helper.extension(fileData);
            var filepath = setting.qiniu.Folder+'/'+filename;
            
            var policyBase64 = Base64.encode(JSON.stringify(setting.qiniu.policyText));
            var bytes = Crypto.HMAC(Crypto.SHA1, policyBase64, setting.qiniu.SecretKey, { asBytes: true }) ;
            var encodedSign = Crypto.util.bytesToBase64(bytes);
            var uploadToken = setting.qiniu.AccessKey + ':' + encodedSign + ':' + policyBase64;
            
            var fileData = helper.base64ToBlob(fileData);
            var formData = new FormData();
            formData.append('name', filename);
            formData.append('key', filepath);
            formData.append('token', uploadToken);
            formData.append('file', fileData);
            $.ajax({
                type: "POST",
                url: setting.qiniu.UploadDomain,
                processData:false,
                data:formData,
                contentType: false,
                success: function(result) {
                    console.log(result);
                    successCall(setting.qiniu.AccessDomain+filepath);
                },
                error:function(result){
                    console.log(result);
                    failureCall('服务响应解析失败，请稍后再试');
                }
            });
        }
    };
    
    
    //读取文件为base64，再回调上传函数将文件发到服务器
    var loadImgAndSend = function(url){
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
                    case 'aliyun':
                        upload.aliyun(reader.result, setting.onSuccess, setting.onFailure);
                        break;
                    case 'upyun':
                        upload.upyun(reader.result, setting.onSuccess, setting.onFailure);
                        break;
                    case 'qiniu':
                        upload.qiniu(reader.result, setting.onSuccess, setting.onFailure);
                        break;
                    default:
                        setting.onFailure('配置错误，不支持的图片上传方式，可选方式：self/tencent/aliyun/upyun');
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
        
        // 根据不同的文件存储位置，初始化不同的环境
        switch (setting.target) {
            case 'self':
                init.self();
                break;
            case 'tencent':
                init.tencent();
                break;
            case 'aliyun':
                init.aliyun();
            case 'upyun':
                init.upyun();
                break;
            case 'qiniu':
                init.qiniu();
                break;
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
                //转换成普通的图片地址
                //src = src.substring(8, src.indexOf('?last'));
                loadImgAndSend(src);
            }catch(e){console.log(e);};
        });
    };
})(jQuery);

$.image.init();