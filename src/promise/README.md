# 手写一款 Promise

Promise 对象是用来处理异步操作的工具,解决开发者对异步回调的烦恼。可以说Promise是个代理对象，在设计模式来讲就是代理模式，它代理了一个值，并且设置了几个状态让用户知道当前代理值解析的结果。而笔者此次按照Promise/A＋ 的规范要求，自己尝试做了一款Promise。

# 开发步骤

我们每一步按照Promsie/A＋层层的规范编写Promise，以便理解Promise处理过程。

为了避免与浏览器中的Promise函数冲突，此次用Defer代替Promise:
```html
function Defer(){

}
```

## 1.Promise 参数 executor
当新建一个promise必会自带一个executor函数，其形参包含Promise传递的resolve，reject两个方法，分别表示代理的值解析成功并传递值，代理的值解析失败并传失败原因。代码如下：
```html
function Defer(executor){
  if(!(this instanceof Defer)){
    throw 'constructor Defer should use "new" keyword';
  }
  if(typeof executor !== 'function'){
    throw 'Defer params should be a function';
  }
  try{
    executor.call(this, this.resolve.bind(this), this.reject.bind(this));
  }catch(e){
    this.reject('executor error');
  }
}

Defer.prototype = {
  constructor ： Defer,
  resolve : function(value){
    this.value = value;//缓存代理的值
  },
  reject : function(reason){
    this.rejectReason = reason;//缓存失败原因
  }
}
```

## 2.Promise 状态

按照规范，Promise有三种状态：

pending: 初始状态,未完成或拒绝，可改变状态。
fulfilled（resolved）: 操作成功完成,不可改变状态,拥有不可变的终值。
rejected: 操作失败,不可改变状态,拥有不可变的拒因。

为了记录当前Promise状态我们需要用一个属性缓存起来：

```html
function Defer(executor){
  this.status = 'pending';
  ...省略...
  ...省略...
}
```

而相应的resolve，reject方法内部要修改当前proimse状态：

```html
Defer.prototype = {
  constructor ： Defer,
  resolve : function(value){
    this.value = value;//缓存代理的值
    this.status = 'resolved';
  },
  reject : function(reason){
    this.rejectReason = reason;//缓存失败原因
    this.status = 'rejected';
  }
}
```

## 3.then(onFulfilled, onRejected)重要部分

### 3.1简要

promise/A＋规范提出通过then方法访问当前Promise的代理值，并且可被同一个promise调用多次，最后函数返回promise对象。
所以Defer函数需加上then函数：

```html
...
then : function(){
  return this;
},
...
```


### 3.2函数的参数：

onFulfilled(onResolved)：可选参数，如果不是函数则必须忽略;
onRejected：可选参数，如果不是函数则必须忽略

```html
...
then : function(onResolved, onRejected){
  if(typeof onResolved === 'function'){
    ...
  }
  if(typeof onRejected === 'function'){
    ...
  }
},
...
```

### 3.3函数参数调用时期和要求：
onFulfilled 和 onRejected必须作为纯函数调用并且promise内部executor函数执行完返回promise对象后才可执行then方法。这里包含两个点:

第一，两个函数必须作为纯函数调用。所谓纯函数调用我认为是函数调用时，不通过OOP思想封装成Object并调用Object里函数方法，不用call、apply、bind改变this指向，而是单纯调用函数并且this的值是undefined（严格模式才会如此，非严格模式this指向window）；

第二，等待executor函数执行完毕才可调用then函数的参数。我们知道executor内部很多情况下会有异步操作，而我们调用then方法与创建promise对象在同一个“执行上下文”当中的，显然then方法不可能在创建promise对象之后立即执行其onFulfilled 或 onRejected，而是通过promise内部缓存系统存储onFulfilled 和 onRejected，并在executor操作完毕再执行then的参数。
所以then的代码应该是这样写：
```html
...
then : function (onFulfilled, onRejected){
 this.thenCache.push({onFulfilled:onFulfilled,onRejected:onRejected}); /** 这里已经取消掉**/
},
...
```

最重要的是，executor函数内部异步执行之后是如何触发then参数的？大家可以思考一下。。。


我们可以回看下promise/A+的规范要求，executor方法会有两个参数：resolve，reject，都是处理promise状态，并设置promise的value值；我们可以借用这两个方法来调用then参数，代码如下：
```html
...
resolve : function(value){
  this.status = 'fulfilled';
  this.value = value;//promise的值
  this.triggerThen();//触发then参数
},
reject : function(value){
  this.status = 'rejected';
  this.value = value;
  this.triggerThen();
},
triggerThen : function(){
  ...
}
...
```


### 3.5代码合并

```html
function Defer(executor){
  this.status = 'pending';
  this.thenCache = [];
}

Defer.prototype = {
  constructor ： Defer,
  resolve : function(value){
    this.status = 'fulfilled';
    this.value = value;//promise的值
    this.triggerThen();//触发then参数
  },
  reject : function(value){
    this.status = 'rejected';
    this.value = value;
    this.triggerThen();
  },
  triggerThen : function(){
    ...
  }
  then : function(onFulfilled, onRejected){
    this.thenCache.push({onFulfilled:onFulfilled,onRejected:onRejected});
    return this;
  }
}
```


## 4 异常处理
当promise在处理过程中出现问题，可能是代码出错，可能是throw抛出了异常，其处理的方式和then一样，都在代码如下：
```html
 ...
 catch : function (onFulfilled, onRejected){
  this.thenCache.push({onFulfilled:onFulfilled,onRejected:onRejected});
  return this;
 },
 ...
```


## 使用


### 参考文献

MDN：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise

图灵社区：http://www.ituring.com.cn/article/66566
