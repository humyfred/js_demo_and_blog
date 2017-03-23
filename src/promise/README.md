# 手写一款 Promise

Promise 对象是用来处理异步操作的工具,解决开发者对异步回调的烦恼。可以说Promise是个代理对象，在设计模式来讲就是代理模式，它代理了一个值（通过resolve方法传递的值），并且设置了几个状态让用户知道当前代理值解析的结果。而笔者此次按照Promise/A＋ 的规范要求，自己尝试做了一款简化版的Promise。

# 开发步骤

我们每一步按照Promise/A＋层层的规范编写Promise，以便理解Promise处理过程。

为了避免与浏览器中的Promise函数冲突，此次用Defer代替Promise:
```html
function Defer(){
  this.value = null;//代理的值
}
```

## 1.Promise 参数 executor
当新建一个promise需要用户传递一个executor函数，其形参包含Promise自行传递的resolve，reject两个方法，分别表示代理的值解析成功并传递值，代理的值解析失败并传失败原因。而如果executor在执行过程中出错，则promise立即被拒绝（调用reject），代码如下：
```html
function Defer(executor){
  if(!(this instanceof Defer)){
    throw 'constructor Defer should use "new" keyword';
  }
  if(typeof executor !== 'function'){
    throw 'Defer params should be a function';
  }
  try{
    executor.call(this, this.resolve.bind(this), this.reject.bind(this));//传递resolve，reject方法
  }catch(e){//报错立即拒绝
    this.reject(e);
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
而相应的resolve，reject方法内部要修改当前promise状态：
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
then : function(onFulfilled, onRejected){
  return this;
},
...
```

### 3.2then参数的调用时期和要求：

 (1) onFulfilled(onResolved)：可选参数，如果不是函数则必须忽略;

 (2) onRejected：可选参数，如果不是函数则必须忽略;

 (3) 当promise成功执行，所有onFulfilled按注册顺序执行，如果promise被拒绝，所有onRejected按注册顺序执行；

 (4) onFulfilled 和 onRejected必须作为纯函数调用

 (5) promise的executor执行完毕并调用resolve或reject方可调用then参数onFulfilled 和 onRejected。

#### api调用示例
```html
new promise().then(fn).then(fn).then(fn).....
```

谈谈规则(4)，两个函数必须作为纯函数调用。所谓纯函数调用我认为是不包含在Object的属性当中并直接引用（否则this会指向该Object，可以通过apply，call，bind改变this指向），并且this的值是undefined（严格模式才会如此，非严格模式this指向window）；则代码应是这样(示例)：
```html
onFulfilled.call(undefined, promise_value);
```

谈谈规则(5)，等待executor执行完毕并调用resolve或reject方可调用then参数。我们知道executor内部很多情况下会有异步操作，而我们调用then方法与创建promise对象在同一个“执行上下文”当中的(从api调用示例可知)，显然then方法不可能在创建promise对象之后立即执行其参数onFulfilled 或 onRejected，而是通过promise内部缓存存储onFulfilled 和 onRejected（一般为数组），当需要执行参数时候调用数组的shift方法则可按注册顺序执行,这样同时解决了规则(3),所以then方法任务是缓存参数，而规则(1)(2)只能下放到触发onFulfilled 或 onRejected时候才判断。所以整个过程就是executor执行完毕得到代理的值通过resolve或reject返回给then参数。

所以then的代码应该是这样写：
```html
...
then : function (onFulfilled, onRejected){//只做缓存作用
 this.thenCache.push({onFulfilled:onFulfilled,onRejected:onRejected});
},
...
```

而executor函数如果在promise里直接调会比then函数先执行，如果executor是同步操作，那么Promise的resolve或reject方法会在then前面执行，而then此时还没做好缓存onFulfilled 或 onRejected任务Promise就开始按顺序调用onFulfilled 或 onRejected必然会出错。为了让then先执行，Defer的代码应该是这样写：
```html
function Defer(executor){
  if(!(this instanceof Defer)){
    throw 'constructor Defer should use "new" keyword';
  }

  if(typeof executor !== 'function'){
    throw 'Defer params should be a function';
  }

	this.thenCache = [];//{resolve:,reject:}
	this.status = 'pendding';
	this.value = null;
	this.rejectReason = null;//reject拒因
	var self = this;
	setTimeout(function(){//把executor的call任务插入到Event Loop的消息队列去，以异步执行executor，避免与then方法同步

  try{
    executor.call(self, self.resolve.bind(self), self.reject.bind(self));
  }catch(e){
    self.reject(e);
  }

	 }, 0);
}
```

executor方法会有两个参数：resolve，reject，都是处理promise状态，并设置promise代理的value值；我们可以借用这两个方法来调用then参数，把(1)、(2)条规则判断下放到triggerThen处理代码如下：
```html
...
resolve : function(value){
  this.status = 'fulfilled';
  this.value = value;//promise的值
  this.triggerThen();//触发then参数
},
reject : function(reason){
  this.status = 'rejected';
  this.rejectReason = reason;//拒因
  this.triggerThen();
},
then : function (onFulfilled, onRejected){
 this.thenCache.push({onFulfilled:onFulfilled,onRejected:onRejected});
},
triggerThen : function(){
  ...
}
...
```
### 3.5 triggerThen 处理
综合上一小节的理论阐述，triggerThen直接贴出代码，旁边会加上注释说明属于哪种规则
```html
Defer.prototype.triggerThen = function(){
	var current = this.thenCache.shift();//规则(3)
	var res = null;

	if(!current){//成功解析并读取完then cache
		return this;
	}

	if(this.status === 'resolved'){
		res = current.resolve;
	}else if(this.status === 'rejected'){
		res = current.reject;
	}

	if(typeof res === 'function'){//规则(1)(2)
		this.value = res.call(undefined, this.value);//重置promise的value，规则(4)
		this.triggerThen();//继续执行then链
	}else{//不是函数则忽略
		this.triggerThen();//规则(1)(2)
	}
};
```


## 4 异常处理
当promise在处理过程中出现问题，可能是代码出错，可能是throw抛出了异常，其处理的方式和then一样，缓存异常处理函数，在triggerThen函数中根据都在代码如下：
```html
 ...
 catch : function (onFulfilled, onRejected){
  this.thenCache.push({onFulfilled:onFulfilled,onRejected:onRejected});
  return this;
 },
 ...
```


triggerThen处理异常代码如下：
```html
Defer.prototype.triggerThen = function(){
	var current = this.thenCache.shift();
	var res = null;

	if(!current && this.status === 'resolved'){//成功解析并读取完then cache
		return this;
	}else if(!current && this.status === 'rejected'){//解析失败，并读取完then cache,直接调用errorHandle
		if(this.errorHandle)
			this.value = this.errorHandle.call(undefined, this.rejectReason);//处理异常部分
		return this;
	};

	if(this.status === 'resolved'){
		res = current.resolve;
	}else if(this.status === 'rejected'){
		res = current.reject;
	}

	if(typeof res === 'function'){
		try{
			this.value = res.call(undefined, this.value);//重置promise的value
			this.triggerThen();//继续执行then链
		}catch(e){//处理异常部分
			if(this.errorHandle)
				this.value = this.errorHandle.call(undefined, e);
			return this;
		}
	}else{//不是函数则忽略
		this.triggerThen();
	}
};
```

## 4 测试
```html
 function test(){
   return new Defer(function(res,rej){
     setTimeout(function(){
       res(1);
     },1000);
   });
 }

 test().then(function(value){
   console.log('resolve then 1', value);
   return value;
 }).then(function(value){
   console.log('resolve then 2', value);
 }).catch(function(e){
   console.log('error',e);
 });
 //结果:
 //resolve then 1
 //resolve then 2
 //

 function test2(){
   return new Defer(function(res,rej){
     setTimeout(function(){
       rej(1);
     },1000);
   });
 }

 test2().then(null, function(value){
   console.log('reject then 1', value);
   return value;
 }).then(null, function(value){
   console.log('reject then 2', value);
 }).catch(function(e){
   console.log('error',e);
 });
 //结果:
 //reject then 1
 //reject then 2
 //error 1

 test2().then(null, function(value){
   console.log('reject then 1', value);
   throw 'throw error from then 1';
 }).then(null, function(value){
   console.log('reject then 2', value);
 }).catch(function(e){
   console.log('error',e);
 });
 //结果:
 //reject then 1
 //error throw error from then 1
```


## 5 小结
一个简单版的Promise就大功告成，可能本文对Promise／A＋规范描述还不够详细，还有其他理论并没有过多描述，甚至有些理论有出入（比如then返回的是新的对象），请大家多多包涵；本次是以练习为主，学习Promise概念的核心思想，并通过代码实现，提高编码能力。对于理解本次Promise代码，最关键还是需要好好理解浏览器的事件循环（Event loop），一句话即Promise是先同步处理then、catch函数再异步处理executor函数，接着通过resolve或reject触发then、catch的参数。

另外笔者埋了一个坑，Defer对象在resolve或reject函数调用之后已成settled状态（reject 或 reject），此时状态不能改变，而本次代码Defer本身自带了resolve和reject函数，是随时可改变自身状态，大家可以想像一下如何实现。可以参考Jquery的Deffered或者GitHub上的Q模块，两个实现的思路是一样。

完整的源码点击这里：https://github.com/humyfred/js_demo/blob/master/src/promise/promise.js


### 参考文献

MDN：https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Promise

图灵社区：http://www.ituring.com.cn/article/66566
