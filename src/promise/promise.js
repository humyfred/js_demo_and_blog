function Defer(executor){
  if(!(this instanceof Defer)){
    	throw 'constructor Defer should use "new" keyword';
  }

  if(typeof executor !== 'function'){
    throw 'Defer params should be a function';
  }

	this.thenCache = [];//{resolve:,reject:}
	this.errorHandle = null;
	this.status = 'pendding';
	this.value = undefined;
	this.rejectReason = null;
	var self = this;
	setTimeout(function(){

  	try{
    	executor.call(self, self.resolve.bind(self), self.reject.bind(self));//传递resolve，reject方法
  	}catch(e){
    	self.reject(e);
  	}

	 }, 0);

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
	}else if(this.status === 'rejected'){//解析失败
		if(this.errorHandle)
			this.value = this.errorHandle.call(undefined, this.rejectReason);
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
		}catch(e){
			if(this.errorHandle)
				this.value = this.errorHandle.call(undefined, e);
			return this;
		}
	}else{//不是函数则忽略
		this.triggerThen();
	}
};


Defer.prototype.catch = function(fn){
	if(typeof fn === 'function'){
		var self = this;
		this.errorHandle = function(e){
			self.status = 'resolved';
			return fn.call(undefined, e);
		} ;
	}else{
		this.errorHandle = null;
	}
};
