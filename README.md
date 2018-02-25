# imageManage
移动端图片压缩

h5上传图片，当图片过大时，会出现上传需要很长时间，用户体验很差，所以需要将图片压缩再上传。

核心api：canvas的drawImage和toDataURL。

压缩的思路

1.用FileReader读取原图的base64码，new一个Image，将读取到的base64赋值给Image的src。

2.用canvas把Image绘制出来，再用toDataURL压缩并得到压缩后图像的base64码。(这里的难点是分片绘制)

3.把base64转为Blob类型，塞进FormData，提交。(此步骤非必需，也可直接提交base64。选择转为Blob，是因为对后端更友好)

用法：

参照项目中的 imageManageTest.html

compressImg函数有两个参数，img代表图像源，options代表处理信息，有两个参数 orientation 和 quality。
参数 orientation 代表图像的旋转度，为了解决部分ios手机图像旋转的bug。具体数值需要借用 exif-js 获取。默认值为 0
参数 quality 代表图像的压缩比，取值范围为 0-1。默认值为 0.3

    compressImg(img, {    
        orientation: 6,        
        quality：0.5    
    });
   
注意：

ios拍照上传，可能会出现照片旋转的情况，此时需要借助 exif-js 获取图像的orientation，用来矫正图像旋转。

关于 exif-js 的用法，demo中有已注释的代码展示，详细用法请查看api文档。

参考资料：

https://github.com/stomita/ios-imagefile-megapixel/blob/master/src/megapix-image.js

https://github.com/whxaxes/node-test/blob/master/server/upload/index_2.html
