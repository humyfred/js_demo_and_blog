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
