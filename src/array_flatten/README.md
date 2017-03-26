# 多维数组扁平化方法


### 1.传统的方法
```html
function flatten(arr){
   var result = [];
   for(var i = 0,length=arr.length;i<length;i++){
    if(typeof arr[i] !== 'object'){
      result.push(arr[i]);
    }else{
      result = result.concat(flatten(arr[i]));
    }
   }
   return result ;
}
```
优点：方法简单易懂。

缺点：代码较多，方法传统。

### 2.使用数组的concat方法
```html
function flatten(arr){
    return Array.prototype.concat.apply([],arr);
}
```
优点：代码简约，能灵活使用原生数组的concat方法。

缺点：只能降最多二维的数组,降更多维的数组需要定制化函数。


### 3.使用数组的reduce方法
```html
function flatten(arr){
    return arr.reduce(function(acc,val){
           return acc.concat(Array.isArray(val)?flatten(val):val);
    },[])
}
```
优点：代码简约，能灵活使用原声数组reduce方法。

缺点：硬要说缺点则是必须是在支持es5的浏览器。

### 4.使用Object的toString方法
```html
function flatten(arr){
   return arr.toString().split(',');
}
```
优点：代码简约，灵活使用toString方法，能兼容版本低的浏览器。

缺点：数组每个单元均转成string类型。


### 性能测试
测试数据：
```html
var array = [1,2,[3,4,[5,6,[7,8,[9,[10]]]]]];
```
测试方法：
```html
console.time();flatten(array);console.timeEnd()
```
### 测试结果（时间都是测试几次得来的平均值）

第一种时间：default: 0.0220ms

第二种时间：default: 0.0200ms（多维解析失败，数据作为参考）

第三种时间：default: 0.0310ms

第四种时间：default: 0.0403ms

### 测试总结

从以上的测试结果，差别不大，第四种方法消耗时间比较多。不过在日常开发当中可以忽略该差别，在忽略性能之外别差，我们可以从代码可维护性角度去看待，代码量比较小的，可以减少客户端下载量，那么第三和第四种是不错选择。如果要兼容ie8浏览器的，要么用babel的polyfill兼容reduce方法，不然只能用第四种。
