//修复ios拍照上传后图片旋转
//code from https://github.com/stomita/ios-imagefile-megapixel/blob/master/src/megapix-image.js line 115
//Orientation value is from EXIF tag
//Orientation 值需要借用 exif-js https://github.com/exif-js/exif-js/
//thank author
function transformCoordinate(canvas, ctx, width, height, orientation) {
    switch (orientation) {
        case 5:
        case 6:
        case 7:
        case 8:
            canvas.width = height;
            canvas.height = width;
            break;
        default:
            canvas.width = width;
            canvas.height = height;
    }

    switch (orientation) {
        case 2:
            // horizontal flip
            ctx.translate(width, 0);
            ctx.scale(-1, 1);
            break;
        case 3:
            // 180 rotate left
            ctx.translate(width, height);
            ctx.rotate(Math.PI);
            break;
        case 4:
            // vertical flip
            ctx.translate(0, height);
            ctx.scale(1, -1);
            break;
        case 5:
            // vertical flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.scale(1, -1);
            break;
        case 6:
            // 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(0, -height);
            break;
        case 7:
            // horizontal flip + 90 rotate right
            ctx.rotate(0.5 * Math.PI);
            ctx.translate(width, -height);
            ctx.scale(-1, 1);
            break;
        case 8:
            // 90 rotate left
            ctx.rotate(-0.5 * Math.PI);
            ctx.translate(-width, 0);
            break;
        default:
            break;
    }
}

//压缩图片
//code from https://github.com/whxaxes/node-test/blob/master/server/upload/index_2.html line 119
//thank author
function compressImg(img, options){
    //用于压缩图片的canvas
    var canvas = document.createElement('canvas'),
        ctx = canvas.getContext('2d');

    //用于分片绘制的canvas
    var tempCanvas = document.createElement('canvas'),
        tempCtx = tempCanvas.getContext('2d');

    var format = 'image/jpeg',   //全部转为jpeg
        width = img.width,
        height = img.height,
        imgSize = width * height;

    var orientation = 0,
        quality = 0.3;
    options = options || {};    
    orientation = options.orientation || orientation,
    quality = options.quality || quality;

    //ios 中canvas的大小有限制，如果canvas的大小大于大概五百万像素（即宽高乘积）的时候，不仅图片画不出来，其他什么东西也都是画不出来的      
    //我们这里把最大像素值设置为400万                 
    var  CANVAS_MAX_SIZE = 2000 * 2000;
    var ratio = imgSize / CANVAS_MAX_SIZE; 
    if( ratio > 1){     //如果大于400万像素，就等比缩放至400万像素以下
        ratio = Math.sqrt( ratio );
        width /= ratio;
        height /= ratio;
    } else {
        ratio = 1;
    }
    
    width = Math.floor(width);
    height = Math.floor(height);
    //设置canvas的宽高以及是否需要旋转
    transformCoordinate(canvas, ctx, width, height, orientation);

    //铺一层白色底色
    //因为canvas的toDataURL只能压缩jpg
    //如果是png转jpg，绘制到canvas上的时候，canvas存在透明区域的话，当转成jpg的时候透明区域会变成黑色
    //canvas的透明像素默认为rgba(0,0,0,0)，所以转成jpg就变成rgba(0,0,0,1)了，也就是透明背景会变成了黑色
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);

    //判断是否需要分片绘制
    //ios 中 如果图片的大小超过两百万像素，图片无法绘制到canvas上, 我们这里把最大像素值设置为100万           
    var  IMG_MAX_SIZE = 1000 * 1000;
    var count = imgSize / IMG_MAX_SIZE;
    if(count > 1){
        count = Math.ceil(Math.sqrt(count));
        //console.log(width)
        //分片，用canvas的宽高除以 count, 向下取整，可能会少几像素
        var newW = Math.floor(width / count);
        var newH = Math.floor(height / count);

        tempCanvas.width = newW;
        tempCanvas.height = newH;

        //防止部分手机，绘制图像时因为小数的原因出现缝隙。
        var actualW = Math.floor(newW * ratio);
        var actualH = Math.floor(newH * ratio);
        //计算因为向下取整而遗漏的像素       
        var canvasDiffW = width - newW * count;
        var canvasDiffH = height - newH * count;

        for(var i = 0; i < count; i++){
            for( var j = 0; j < count; j++){
                tempCtx.drawImage(img, i * actualW, j * actualH, actualW, actualH, 0, 0, newW, newH);

                ctx.drawImage(tempCanvas, i * newW, j * newH, 
                    newW + (i === count - 1 ? canvasDiffW : 0), 
                    newH + (j === count - 1 ? canvasDiffH : 0));
            }
        }                
    } else {
        ctx.drawImage(img, 0, 0, width, height);
    }

    //将canvas内容转为base64，并压缩
    var newData = canvas.toDataURL(format, quality);                
    canvas = ctx = tempCanvas = tempCtx = null;

    return newData;
}

//base64转为blob
function dataURLtoBlob(dataURI){
    var format = 'image/jpeg',
        code = window.atob(dataURI.split(',')[1]),                                               
        codeLen = code.length,
        arrayBuffer = new ArrayBuffer(codeLen),
        intArray = new Uint8Array(arrayBuffer);
    for(var i = 0; i < codeLen; i++){
        intArray[i] = code.charCodeAt(i);
    }
    try{
        return new Blob([intArray], {type: format});
    } catch(e) {
        var BlobBuilder = window.BlobBuilder || window.WebkitBlobBuilder;                            
        var bb = new BlobBuilder();
        bb.append(arrayBuffer);
        return bb.getBlob(format);
    }
}