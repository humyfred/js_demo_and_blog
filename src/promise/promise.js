function Defer(fn){

	if(!(this instanceof Defer)){
		throw new Error('please add "new" keyword ');
	}
	this.thenCache = [];//{resolve:,reject:,notify:}
	this.errorHandle = null;
	this.doneHandle = null;
	this.errorHandle = null;
	this.status = 'pendding';
	this.value = undefined;
	setTimeout(fn.bind(this, this.resolve.bind(this), this.reject.bind(this), this.notify.bind(this) ), 0);
}


Defer.prototype.resolve = function(value){
	this.status = 'resolve';
	this.value = value;
	this.triggerThen();
}



Defer.prototype.reject = function(value){
	this.status = 'reject';
	this.value = value;
	this.triggerThen();
}


/**
  终结then链
*/
Defer.prototype.done = function(fn){
	if(typeof fn === 'function'){
		this.doneHandle = fn;
	}
}


Defer.prototype.then = function(resolve,reject,notify){
	var todo = {resolve:resolve,reject:reject,notify:notify};
	this.thenCache.push(todo);
	return this;
}


Defer.prototype.triggerThen = function(){
	var current = this.thenCache.shift();
	var res = null;
	if(!current){
		return this;
	}
	if(this.status === 'resolve'){
		res = current.resolve;
	}else if(this.status === 'reject'){
		res = current.reject;
	}

	if(typeof res === 'function'){
		try{
			this.value = res.call(undefined, this.value);//重置promise的value
			this.triggerThen();//继续执行then链
		}catch(e){
			this.errorHandle.call()
		}
	}else{//不是函数则忽略
		this.triggerThen();
	}
}


Defer.prototype.catch = function(fn){
	if(typeof fn === 'function'){
		this.errorHandle = fn ;
	}else{
		this.errorHandle = null;
	}
}

Defer.prototype.finally = function(fn){
	if(typeof fn === 'function'){
		this.finalHandle = fn ;
	}else{
		this.finalHandle = null;
	}
 }
