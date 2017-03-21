function Defer(fn){

	if(!(this instanceof Defer)){
		throw new Error('please add "new" keyword ');
	}
	this.thenCache = [];//{resolve:,reject:,notify:}
	this.catchCache = [];
	this.doneFn = null;
	this.finallyCache = null;
	this.status = 'pendding';
	this.value = undefined;
	setTimeout(fn.bind(this, this.resolve.bind(this), this.reject.bind(this), this.notify.bind(this) ), 0);
}


Defer.prototype.resolve = function(value){
	this.status = 'resolve';
	this.value = value;
	this.doing(value);
	return this;
}



Defer.prototype.reject = function(value){
	this.status = 'reject';
	this.value = value;
	this.doing(value);
	return this;
}


Defer.prototype.notify = function(value){
	this.status = 'notify';
	this.value = value;
	this.doing(value);
	return this;
}



Defer.prototype.done = function(fn){
	this.status = 'done';
	this.value = value;
	this.doneFn = fn;
}


Defer.prototype.then = function(resolve,reject,notify){
	var todo = {resolve:resolve,reject:reject,notify:notify};
	this.thenCache.push(todo);
	return this;
}


Defer.prototype.doing = function(value){
	var current = this.thenCache.shift();
	var res  = undefined;
	if(!current){
		return this;
	}
	this.value = value;
	if(this.status === 'resolve'){
		res = current.resolve;
	}else if(this.status === 'reject'){
		res = current.reject;
	}else if(this.status === 'notify'){
		res = current.notify;
	}

	var temp = undefined;
	if(res){
		temp = res.call(this, value);
		this.doing(temp);
		//else this.doneFn(null);
	}else{
		var err = this.catchCache.shift();
		if(err)
			err.call(this, new Error('function not found'));
	}
	return this;
}


Defer.prototype.catch = function(fn){
	this.catchCache.push(fn);
}



Defer.prototype.finally = function(fn){
	this.finallyCache = fn;
 }
