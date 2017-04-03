# 编写可维护代码之“中间件模式”


##引言

此次我们谈论的中间件，针对前端和Node的Express和Koa开发而言。对于严格意义上的中间件（平台与应用之间的通用服务），例如用于缓解后台高访问量的消息中间件，本篇不会去叙述，因为不是本篇的论述意图。

言归正传，当我们在编写业务代码时候，我们无法避免有些业务逻辑复杂而导致业务代码写得又长又乱，如果再加上时间紧凑情况下写出来的代码估计会更让人抓狂。以至于我们一直在寻求更好的架构设计和更好的代码设计，这是一个没有终点的求知之路，但是在这条路上会越走越好。

## 1. AOP

AOP意为面向切面编程，是在Java的Spring框架的重点内容，其作用如下图所示：

根据上图，整个响应http过程可以看做是一条串联的管道，对于每个http请求我们都想插入相同的逻辑例如数据过滤、日志统计的目的，为了不和业务逻辑混淆一块，提高代码复用率，AOP提倡从横向切面思路向管道某个位置插入一段代码逻辑，这样就实现在任何业务逻辑前后都有相同代码逻辑段，开发者只需专注写业务逻辑，既不影响整个响应http过程，而且隔离了业务逻辑，实现高内聚低耦合原则。

可以说AOP对OOP进行了一个补充，OOP是对做同一件事情的业务逻辑封装成一个对象，但是做一件事情过程中又想做别的事情对OOP来说难以解决。就像上图所示，当系统在响应用户修改信息的请求时，系统在业务处理之前对用户提交的数据做了安全过滤，业务处理之后还要做日志统计。相反如果把所有逻辑都柔合在一起，每次写业务都需重复编写数据过滤和日志统计的代码，违反了单一职责，高内聚低耦合的原则，并且降低代码复用率。

在前端，我们可以借用这种思想通过before和after函数来实现，我们看下代码实现：
```html
Function.prototype.before = function(fn){//函数处理前执行fn
  var self = this;
   return function(){
     fn.call(this);
     self.apply(this, arguments);
   }
}
Function.prototype.after = function(fn){//函数处理后执行fn
  var self = this;
   return function(){
     self.apply(this, arguments);
     fn.call(this);
   }
}
```
实现思路是对被处理的函数通过闭包封装在新的函数里，在新的函数内部按照顺序执行传入的参数fn和被处理的函数。

举个栗子：

用户提交表单数据之前需要用户行为统计，代码应该是这样写：
```html
function report(){
   console.log('上报数据');
}
function submit(){
   console.log('提交数据');
}

submit.before(report)(); //提交之前执行report
//结果： 上报数据
//      提交数据
```
从代码可以看出已经把统计和数据提交业务隔离起来，互不影响。

但是如果提交数据之前需要验证功能并且依据验证结果是否能提交，怎么做？这里要改动before函数，看下代码：
```html
Function.prototype.before = function(fn){//函数处理后执行fn
  var self = this;
   return function(){
     var res = fn.call(this);
     if(res)//返回成功则执行函数
       self.apply(this, arguments);
   }
}
function report(){
   console.log('上报数据');
   return true;
}
function validate(){
   console.log('验证不通过');
   return false;
}
function submit(){
   console.log('提交数据');
}

submit.before(report).before(validate)();
//结果：
// 验证不通过
function report(){
   console.log('上报数据');
   return true;
}
function validate(){
   console.log('验证通过');
   return true;
}
function submit(){
   console.log('提交数据');
}

submit.before(report).before(validate)();
//结果：
// 验证通过
// 上报数据
// 提交数据
```
AOP思想在前端分解隔离业务已经做到位了，但是却有了一串长长的链式出来，如果处理不当很容易让维护者看晕，例如下面这样：
```html
//提交数据前，验证数据，然后上报，在提交之后做返回首页的跳转
function report(){
   console.log('上报数据');
   return true;
}
function validate(){
   console.log('验证通过');
   return true;
}
function submit(){
   console.log('提交数据');
}
function goBack(){
   console.log('返回首页')
}
submit.before(report).before(validate).after(goBack)();
//结果：
// 验证通过
// 上报数据
// 提交数据
```
栗子可能并没有那么晕，但是也得仔细看才能看懂整个流程，实际开发中估计会有更麻烦情况出现，另外，如果before或after的参数fn是一个异步操作的话，又需要做些patch，显然还是有些不足的，那么还有没有其他解决办法呢，既能隔离业务，又能方便清爽地使用～我们可以先看看其他框架的中间件解决方案。

## 2. express 与 koa的中间件

express和koa本身都是非常轻量的框架，express是集合路由和其他几个中间件合成的web开发框架，koa是express原班人马重新打造一个更轻量的框架，所以koa已经被剥离所有中间件，甚至连router中间件也被抽离出来，任由用户自行添加第三方中间件。express和koa中间件原理一样，我们就抽express来讲。
我们先看下express中间件写法：
```html
var express = require('express');
var app = express();

app.use(function(req, res, next) {
  console.log('数据统计');
  next();//执行权利传递给
});

app.use(function(req, res, next) {
  console.log('日志统计');
  next();
});

app.get('/', function(req, res, next) {
  res.send('Hello World!');
});

app.listen(3000);
//整个请求处理过程就是先数据统计、日志统计，最后返回一个Hello World！
```
上图运作流程图如下：


从上图来看，每一个“管道”都是一个中间件，每个中间件通过next方法传递执行权给下一个中间件，express就是一个调用各种中间件的框架。

中间件就是一个函数，通过express的use方法接收中间件，每个中间件有express传入的req，res和next参数。如果要把请求传递给下一个中间件必须使用 next() 方法。当调用res.send方法则此次请求结束，node直接返回请求给客户，但是若在res.send方法之后调用next方法，整个中间件链式调用还会往下执行，因为当前hello world所处的函数也是一块中间件，而res.send只是一个方法用于返回请求。

## 3. 借用中间件

我们可以借用中间件思想来分解我们的前端业务逻辑，通过next方法层层传递给下一个业务。做到这几点首先必须有个管理中间件的对象，我们先创建一个名为Middleware的对象：
```html
function Middleware(){
   this.cache = [];
}
Middleware通过数组缓存中间件。下面是next和use方法：

Middleware.prototype.use = function(fn){
  if(typeof fn !== 'function'){
    throw 'middleware must be a function';
  }
  this.cache.push(fn);
  return this;
}

Middleware.prototype.next = function(fn){
  if(this.middlewares && this.middlewares.length > 0 ){
    var ware = this.middlewares.shift();
    ware.call(this, this.next.bind(this));
  }
}
Middleware.prototype.handleRequest = function(){//执行请求
  this.middlewares = this.cache.map(function(fn){//复制
    return fn;
  });
  this.next();
}
我们用Middleware简单使用一下：

var middleware = new Middleware();
middleware.use(function(next){console.log(1);next();})
middleware.use(function(next){console.log(2);next();})
middleware.use(function(next){console.log(3);})
middleware.use(function(next){console.log(4);next();})
middleware.handleRequest();
//输出结果：
//1
//2
//3
//
```
4没有出来是因为上一层中间件没有调用next方法，我们升级一下Middleware高级使用
```html
var middleware = new Middleware();
middleware.use(function(next){
  console.log(1);next();console.log('1结束');
});
middleware.use(function(next){
   console.log(2);next();console.log('2结束');
});
middleware.use(function(next){
   console.log(3);console.log('3结束');
});
middleware.use(function(next){
   console.log(4);next();console.log('4结束');
});
middleware.handleRequest();
//输出结果：
//1
//2
//3
//3结束
//2结束
//1结束
```
上面代码的流程图：
可以看出：每一个中间件执行权利传递给下一个中间件并等待其结束以后又开始做别的事情，方法非常巧妙，有这特性读者可以玩转中间件。

说到重点，我们如何在实际开发用到这种方法呢？比如在表单提交的逻辑上，先后有表单验证，数据提交，返回首页共三步逻辑。
```html
function validate(next){
  console.log('validate');
  next();//通过验证
}
function send(next){
   setTimeout(function(){//模拟异步
     console.log('send');
     next();
    }, 100);
}
function goBack(){
   console.log('goBack');
}
```
我们总不能每次new 一个middleware去集合所有逻辑，这样使用比较生硬，整体业务被包裹在middleware并不像是一个表单提交的业务，我们应该用submitForm函数来表示表单提交更为贴切，但是为了使用Middleware的功能又不能总是更改命名，我们应该用继承：
```html
function extend(child, parent){
   child.prototype = new parent();
   parent.call(child);
}

function submitForm(){
   console.log('start submit');//这里可以做提交表单的前期工作
}

extend(submitForm, Middleware);

(new submitForm()).use(validate).use(send).use(goBack).handleRequest();

//结果：
// start submit
// validate
//
// send
// goBack
```
通过以上代码，实现了业务分离，又能很好控制业务下发执行的权利，所以“中间件”模式算是一种不错的设计。从代码阅读难度和代码编写的角度来说难度并不大，能提高代码可维护性，只要维护人员拥有该方面的知识，问题就不大了。

完整的源码点击这里：https://github.com/humyfred/js_demo_and_blog/tree/master/src/middleware
