function Middleware(){
  this.cache = [];
  this.options = null;
}

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
    ware.call(this, this.options, this.next.bind(this));
  }
}

Middleware.prototype.handleRequest = function(options){
  this.middlewares = this.cache.map(function(fn){//复制
    return fn;
  });
  this.options = options;
  this.next();
}

function validate(options, next){
  console.log('validate', options.data);
  next();//通过验证
}
function send(options, next){
   setTimeout(function(){//模拟异步
     console.log('send', options.data);
     options.url = 'www.baidu.com';//设置跳转的url
     next();
    }, 100);
}
function goTo(options, next){
   console.log('goTo', options.url);
}

var submitForm = new Middleware();
submitForm.use(validate).use(send).use(goTo);
submitForm.handleRequest({data:{name:'xiaoxiong', age: 20}});
//结果：
// validate Object {name: "xiaoxiong", age: 20}
//
// send Object {name: "xiaoxiong", age: 20}
// goTo www.baidu.com

submitForm.handleRequest({data:{name:'xiaohong', age: 21}});//触发第二次，改变数据内容
//结果：
// validate Object {name: "xiaohong", age: 21}
//
// send Object {name: "xiaohong", age: 21}
// goTo www.baidu.com
