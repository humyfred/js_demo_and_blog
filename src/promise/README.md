# 手写一款 Promise

Promise 对象是用来处理异步操作,解决开发者对多层回调的烦恼,而笔者此次按照Promise／A＋ 的规范要求，自己尝试做了一款Promise。

# 开发步骤

我们可以每一步按照Promsie／A＋层层的规范要求编写Promise，以便理解Promise处理过程。

开发过程会使用浏览器的控制台做测试，为了避免与浏览器中的Promise函数冲突，此次用Defer代替Promise:

```html
function Defer(){

}
```

## 1.参数
当executor


当创建新的Promise对象时候，Promise对象

```html
function Defer(executor){

}

Defer.prototype = {
  constructor ： Defer,
  resolve : function(){

  },
  reject : function(){

  },
  notify : function(){

  }
}
```

## 2.状态

按照规范，Promise有三种状态：

pending: 初始状态, 初始状态，未完成或拒绝。
fulfilled: 意味着操作成功完成。
rejected: 意味着操作失败。

为了记录当前Promise状态我们需要用一个属性缓存起来：

```html
function Defer（executor){
  this.status = 'pending';

}
```

而相应的resolve，reject方法内部要修改当前proimse状态：

```html
Defer.prototype = {
  constructor ： Defer,
  resolve : function(){
    this.status = 'fulfilled';
  },
  reject : function(){
    this.status = 'rejected';
  },
  notify : function(){

  }
}
```


## 3.then(onFulfilled, onRejected)重要部分

### 3.1简要

promise／A＋ 规范提出需提供then方法访问当前值，终值，最后函数返回当前promise对象。
所以Defer函数需加上then函数：

```html
...
then : function(){

},
...
```


### 函数的参数：

onFulfilled：可选参数，如果不是函数则必须忽略;
onRejected：可选参数，如果不是函数则必须忽略

```html
...
then : function(onFulfilled, onRejected){
  if(typeof onFulfilled === 'function'){
    ...
  }
  if(typeof onRejected === 'function'){
    ...
  }
},
...
```

### 3.2函数参数调用时期和要求：
onFulfilled 和 onRejected必须作为纯函数调用并且promise内部executor函数执行完返回promise对象后才可执行。
这里包含两个点:
第一两个函数必须作为纯函数调用，所谓纯函数调用我认为是函数调用时，不通过OOP思想封装成Object并调用Object里函数方法，不用call、apply、bind改变this指向，而是单纯调用函数并且this的值是undefined（严格模式才会如此，非严格模式this指向window）；
第二等待executor函数执行完毕才可调用then函数的参数，我们知道executor内部很多情况下是异步操作，而我们使用promise对象的then方法是与创建promise对象在同一个“执行环境栈”中，所以then方法不可能直接执行其内部参数，而通过promise内容缓存系统存储onFulfilled 和 onRejected，并在executor异步操作完毕再执行。

```html
...
then : function (onFulfilled, onRejected){
 this.thenCache.push({onFulfilled:onFulfilled,onRejected:onRejected});
},
...
```

### 3.3then多次调用：
then可以被同一个promise对象多次调用，为了达到效果，then方法最后必须返回当前promise对象:

```html
 ...
 then : function (onFulfilled, onRejected){
  this.thenCache.push({onFulfilled:onFulfilled,onRejected:onRejected});
  return this;
 },
 ...
```

### 3.4代码合并

```html
Defer.prototype = {
  constructor ： Defer,
  resolve : function(){
    this.status = 'fulfilled';
  },
  reject : function(){
    this.status = 'rejected';
  },
  notify : function(){

  },
  then : function(onFulfilled, onRejected){
    this.thenCache.push({onFulfilled:onFulfilled,onRejected:onRejected});
    return this;
  }
}
```

## 使用


### 参考文献

MDN：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise

图灵社区：http://www.ituring.com.cn/article/66566
