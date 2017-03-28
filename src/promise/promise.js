function Defer(executor){
  if(!(this instanceof Defer)){
    	throw 'Defer is a constructor and should be called width "new" keyword';
  }

  if(typeof executor !== 'function'){
    throw 'Defer params must be a function';
  }

  this.thenCache = [];//{resolve:,reject:}
  this.errorHandle = null;
  this.status = 'pendding';
  this.value = null;
  this.rejectReason = null;
  var self = this;
  setTimeout(function(){
    try{
      executor.call(self, self.resolve.bind(self), self.reject.bind(self));//传递resolve，reject方法
    }catch(e){
      self.reject(e);
    }
  },0);
  return this;
}


Defer.prototype.resolve = function(value){
  this.status = 'resolved';
  this.value = value;
  this.triggerThen();
};

Defer.prototype.reject = function(reason){
  this.status = 'rejected';
  this.rejectReason = reason;
  this.triggerThen();
};

Defer.prototype.then = function(resolve,reject){
  var todo = {resolve:resolve,reject:reject};
  this.thenCache.push(todo);
  return this;
};


Defer.prototype.triggerThen = function(){
  var current = this.thenCache.shift();
  var res = null;

  if(!current && this.status === 'resolved'){//成功解析并读取完then cache
    return this;
  }else if(!current && this.status === 'rejected'){//解析失败并读取完then cache，直接调用errorHandle
    if(this.errorHandle){
      this.value = this.errorHandle.call(undefined, this.rejectReason);
      this.status= 'resolved';
    }
    return this;
  };

  if(this.status === 'resolved'){
    res = current.resolve;
  }else if(this.status === 'rejected'){
    res = current.reject;
  }

  if(typeof res === 'function'){
    try{
      this.value = res.call(undefined, this.value || this.rejectReason);//重置promise的value
      this.status = 'resolved';
      this.triggerThen();//继续执行then链
    }catch(e){
      this.status = 'rejected';//异常，则promise为reject
      this.rejectReason = e;
      return this.triggerThen();//触发then链
    }
  }else{//不是函数则忽略
    this.triggerThen();
  }
};

Defer.prototype.catch = function(fn){
  if(typeof fn === 'function'){
    this.errorHandle = fn;
  }
};
