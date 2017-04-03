function Middleware(){
  this.cache = [];
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
    ware.call(this, this.next.bind(this));
  }
}


Middleware.prototype.handleRequest = function(){
  this.middlewares = this.cache.map(function(fn){//复制
    return fn;
  });
  this.next();
}

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
