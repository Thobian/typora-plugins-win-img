# typora-plugins-win-img
### 介绍

解决Windows下，typora不支持粘贴自动上传图片到服务的问题。

### 背景

经常在Windows用typora的小伙一定遇到过一个问题：不管是用截图工具截图后直接粘贴，还是通过选择文件夹选择图片的方式，在typora下都会是图片的本地链接，并不会给你上传到远程服务器。

这样就会导致个尴尬的问题，你辛辛苦苦写的图文并茂内容发送给其他小伙伴时，对方却完全看不到那些图片。然后得找个地方把图片上传上去后，一张张替换成网络图片，实在麻烦。

> PS：其实还有种解决方式，就是设置typora插入图片时使用相对位置，并把它copy到指定的目录下，这样发送给别人的时候连带图片文件一起发送过去，对方也能愉快的浏览

作为码农，实在没法忍受这样的事情，所以尝试自己去写个typora“插件”（typora并不支持插件功能，实际做法是强行加代码）解决这个问题。

![演示截图](https://static.jiebianjia.com/typora/typora.gif)

### 使用

typora-plugins-win-img 插件在编辑时，跟之前没有任何差别。不论是直接粘贴QQ、微信等工具的截图，还是通过“编辑->图片工具->插入本地图片”，都会自动帮你将图片上传到网络服务器，并替换文件中的图片地址为网络图片地址。

注意的小细节：

1. 如图片原本就是网络图片地址，插件将保持原链接不处理（正则匹配：`/^(https?:)?\/\//i`）；
2. 如发现图片链接还是本地文件地址，没有被正常上传，可以点击下对应的图片将再次触发上传操作；
3. 不论图片上传成功或者失败，编辑器顶部都会有提醒；

### 安装

**安装教程环境说明：**

- typora版本：0.9.68 (Windows x86) （[去下载](https://typora.io/windows/typora-update-ia32-0320.exe)）
- typora安装目录：`C:\Program Files (x86)\Typora` ，可以安装在其他目录

**安装步骤：**

覆盖安装的方式在某些特定版本下会触发bug，建议按照这个 [issue](https://github.com/Thobian/typora-plugins-win-img/issues/5#issuecomment-565031864) 中的方法修改 `window.html` 文件而不是直接覆盖它，`plugins` 是新增目录不存在覆盖的问题。

1. 下载插件代码；
2. 复制插件相关代码文件：`window.html`、`plugins`；
3. 将复制的插件代码文件，粘贴到typora安装目录下的 `resources\app` 文件夹下；
4. 安装完成，重启typora

### 插件配置

插件默认会将图片上传到个人站点上（[街边价](https://jiebianjia.com/?ref=github)），不能保证一直给大家提供服务，所以按照好插件后，强烈建议你换成自己的图片上传服务器。

更换图片上传接口地址，打开 `plugins/image/upload.js` 文件，拉到最下面 将最后一行的 `$.image.init();` 按照下面的说明进行配置：

**上传到Github——推荐**

```javascript
//注册token的尽量不要跟其他应用共用，同时授予最小权限
//免费+无需自己搭建服务器，是一种不错的方式
$.image.init({
    target:'github',
    github:{
        Token : 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // 添加一个仅给typora使用的token 授予最小的权限（repo.public_repo） ，添加token：https://github.com/settings/tokens
        CommitterName : 'nickname',                         // 提交人昵称，写你github的昵称
        CommitterEmail : 'email@mail.com',                  // 提交人邮箱，写你github的邮箱
        Repository : 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',      // github项目名，比如你的项目地址是：https://github.com/Thobian/typora-plugins-win-img  那就是后面的“Thobian/typora-plugins-win-img”
        Filepath : 'typora',                                // 图片在项目中的保存目录，可以不用提前创建目录，github提交时发现没有会自动创建
        // 【注意：开启CDN后会将原github的文件地址换成 jsDelivr 的地址，如出现镜像出现国内无法访问，或者不再继续运营你的图片也将不能访问到，请谨慎开启该功能】
        jsDelivrCND : false,                                // 是否开启GitHub图片走镜像，国内有时候访问不太方便,如要打开设置为：true
    }
});
```


**上传到自建服务器**

```javascript
//将图片上传地址换成你自己的后端接口，由于调用时不带登录态，请注意接口安全别被坏人利用
//为了防止坏人利用你服务器接口，插件支持设置请求头，可一定程度避免被利用
//接口协议：
//请求方式：POST
//请求参数：data:image/png;base64,xxxxxx （图片原转换成base64后的值）
//成功响应：{'code':0, 'message':'成功', 'data':{'url'=>'imageURL'}} 
//失败响应：{'code':x, 'message':'错误原因', 'data':null} 失败时，code必须未非0
//后端接口代码可以参考代码文件：`upload.php`
$.image.init({
    target:'self',
    self:{
        //默认上传地址 https://jiebianjia.com/typora-plugins/upload.html
        url:"https://you-server/the-image-upload-path",
        headers:{
            //默认: token:B40289FC92ED660F433BF0DB01577FDE
            token:"value"  //自己定义好，并在接口里面检查避免坏人利用你接口
        }
    }
});
```

**上传到腾讯云COS**

```javascript
//为了你腾讯云的安全，强烈建议你为这个操作添加一个单独的子账号，并只开启API访问权限
//添加子账号：https://console.cloud.tencent.com/cam
//更多关于腾讯云子账号（CAM）说明：https://cloud.tencent.com/document/product/598/13665
$.image.init({
    target:'tencent',
    tencent : {
        Bucket: 'bucket-name',  // 对象存储->存储桶列表(存储桶名称就是Bucket)
        SecretId: 'SecretId',   // 访问控制->用户->用户列表->用户详情->API密钥 下查看
        SecretKey: 'SecretKey', // 访问控制->用户->用户列表->用户详情->API密钥 下查看
        Region: 'Region',       // 对象存储->存储桶列表(所属地域中的英文就是Region)
        folder: 'typora',       // 可以把上传的图片都放到这个指定的文件夹下
    },
});
```

**上传到阿里云OSS**

```javascript
//为了你阿里云账号的安全，强烈建议你为这个操作添加一个单独的子账号，并只开启API访问权限
//添加子账号：https://ram.console.aliyun.com/users
//给子账号授权：https://ram.console.aliyun.com/permissions
//更多关于阿里云子账号（RAM）说明：https://help.aliyun.com/product/28625.html
//SecretId 就是阿里云的：AccessKey ID
//SecretKey 就是阿里云的：AccessKey Secret，这个值只能在你创建 AccessKey 时看到，所以要保管好，否则只能重新生成
$.image.init({
    target:'aliyun',
    aliyun : {
        // 个人觉得阿里云的这个 AccessKey 没有腾讯云的好用
        SecretId: 'xxxx',                 // 需要先创建 RAM 用户，同时访问方式选择“编程访问”
        SecretKey: 'xxxx',        		  // 最好是子账号的key，仅授予oss读写权限（不包括删除）
        Folder: 'typora',                 // 可以把上传的图片都放到这个指定的文件夹下
        BucketDomain : 'http://xxx.com/', // 存储空间下有个：Bucket 域名 挑一个就好了
    }
});
```

**上传到七牛云**

```javascript
//“密钥管理”页面地址：https://portal.qiniu.com/user/key
$.image.init({
    target:'qiniu',
    qiniu: {
        UploadDomain: 'https://xxx.com',  // 上传地址，需要根据你存储空间所在位置选择对应“客户端上传”地址 详细说明：https://developer.qiniu.com/kodo/manual/1671/region-endpoint
        AccessDomain: 'http://xxx.com/', // 上传后默认只会返回相对访问路径，需要设置好存储空间的访问地址。进入“文件管理”下面可以看到个“外链域名”就是你的地址了，复制过来替换掉 xxx 就可以了。
        AccessKey : 'xxxx',              // AK通过“密钥管理”页面可以获取到
        SecretKey: 'xxxx',               // SK通过“密钥管理”页面可以获取到
        Folder: 'typora',                // 可以把上传的图片都放到这个指定的文件夹下
            
        policyText: {
            scope: "xxx",                // 对象存储->空间名称，访问控制记得设置成公开
            deadline: 225093916800,      // 写死了：9102-12-12日，动态的好像偶尔会签名要不过
        },
    }
});
```

**上传到码云**

```javascript
$.image.init({
    target:'gitee',
    gitee: {
        message: "From:https://github.com/Thobian",     // 必须参数,提交消息
        branch: "master",                               // 要提交到的分支（默认为：master）
        token: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",   // token  
        userName: "userName",                           // 用户名
        repositorie: "repositorie",                     // 仓库名
        Folder: "image",                                // 可以把上传的图片都放到这个指定的文件夹下
        BucketDomain: "https://gitee.com/api/v5/repos/",
    }
});
```

### 注意事项：

1. 本插件是基于typora：`0.9.68` 版本编写的，其他版本尚未测试过；
2. ~~`window.html` 代码文件，为typora自带文件，复制过去会替换源安装文件，以防万一可以先对它进行**备份**；~~ 目前有网友反馈直接覆盖在某些版本（比如：0.9.81）下会出现**无法打开 偏好设置 的bug**，建议参考这个 [issue](https://github.com/Thobian/typora-plugins-win-img/issues/5#issuecomment-565031864) 中的方式进行操作。
3. Windows 系统盘默认会保护起来，可能需要系统管理才能操作这些文件，如粘贴失败注意看是否权限问题；
4. 默认本地图片，将会被上传到 [街边价](https://jiebianjia.com) 这个网站，本着方便使用的原则提供了默认图片地址，但本站点属于个人站点，如使用人太多会限制使用（包括但不限于不允许上传、清理已上传文件等）；【！！重要！！】
5. 由于`第4点`，强烈建议你按照 `插件配置` 设置你自己的图片空间；