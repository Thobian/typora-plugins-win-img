<?php
define('MY_HOST_NAME', $_SERVER['HTTP_HOST']);
define('MY_HTTPS',
    isset($_SERVER['HTTPS']) && (strcasecmp($_SERVER['HTTPS'], 'on') === 0 || $_SERVER['HTTPS'] == 1) ||
    isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && strcasecmp($_SERVER['HTTP_X_FORWARDED_PROTO'], 'https') === 0
);

//header头安全检查
if( !isset($_SERVER['HTTP_TOKEN'])){
    echo json_encode(['code'=>130, 'message'=>'非法请求', 'data'=>null]);
    return null;
}

$theInput = file_get_contents('php://input');

if(empty($theInput)){
    echo json_encode(['code'=>100, 'message'=>'上传文件不存在', 'data'=>null]);
    return null;
}

//格式检查
if( !preg_match('/data:image\/(.*?);base64,/', $theInput, $match) ){
    echo json_encode(['code'=>110, 'message'=>'非法图片文件', 'data'=>null]);
    return null;
}

$ext = $match[1];
$filename = md5($theInput).'.'.$ext;
$filePath = __DIR__.'/'.$filename;

$relationPath = substr($_SERVER['REQUEST_URI'] ,0 ,strpos($_SERVER['REQUEST_URI'], basename(__FILE__)));
$returnURL = (MY_HTTPS?'https':'http').'://'.MY_HOST_NAME.$relationPath.$filename;
if( file_exists($filePath) ){
    echo json_encode(['code'=>0, 'message'=>'成功', 'data'=>['url'=>$returnURL]]);
    return null;
}

$content = base64_decode(substr($theInput, strlen($match[0])));
$bool = file_put_contents($filePath, $content);
if($bool){
    echo json_encode(['code'=>0, 'message'=>'成功', 'data'=>['url'=>$returnURL]]);
    return null;
}else{
    echo json_encode(['code'=>500, 'message'=>'上传失败，请稍后再试', 'data'=>null]);
    return null;
}
