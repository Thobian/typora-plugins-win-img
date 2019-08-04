(function($){
    //上传地址
    var locked = 'doing';
    var noticeEle = 'image-result-notice';
    //配置信息
    var setting = {
        //图片上传地址
        url: 'https://jiebianjia.com/typora-plugins/upload.html',
        //自定义请求头，做校验，防止其他人随意调接口
        headers: {
            token: 'B40289FC92ED660F433BF0DB01577FDE'
        },
        //上传成功
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
        //上传失败
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
        },
        //上传到服务器
        sendToServer: function(fileData, successCall, failureCall){
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
            xhr.open("POST", setting.url, true);
            for(var key in setting.headers){
                xhr.setRequestHeader(key, setting.headers[key]);
            }
            xhr.send(fileData);
        }
    };
    
    //虽然叫upload函数，其实他会先读取文件为base64，再回调上传函数将文件发到服务器
    var _upload = function(url, object){
        var xhr = new XMLHttpRequest();
        xhr.onload = function() {
            var reader = new FileReader();
            reader.onloadend = function() {
                setting.sendToServer(reader.result, setting.onSuccess, setting.onFailure);
            }
            reader.readAsDataURL(xhr.response);
        };
        xhr.open('GET', url);
        xhr.responseType = 'blob';
        xhr.send();
    }

    $.image = {};
    $.image.init = function(options){
        options = options||{};
        setting.url = options.url||setting.url;
        setting.headers = options.headers||setting.headers;
        
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
                _upload(src);
            }catch(e){console.log(e);};
        });
    };
})(jQuery);

$.image.init();