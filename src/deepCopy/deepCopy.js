function deepCopy(target, source){
	var toString = Object.prototype.toString;
	var cache = {};
	target = toString.call(target) === '[object Object]' ? target : {};
	cache[source] = target;//处理环
	target = copy(target, source);
 
	function copy(target, source){
 		for(var key in source){
 			if(source.hasOwnProperty(key)){
 			   if(typeof source[key] === 'object'){
 			   	 if(cache[source[key]]){
 			   	   target[key] = cache[source[key]];
 			   	   continue ;
 			   	 }
 			   	 var cp = toString.call(source[key]) === '[object Array]' ? []: {};
 			   	 target[key] = copy(cp, source[key]);
 			   	 cache[source[key]] = cp;
 			   }else{
 			     target[key] = source[key];
 			   }
 			}

 		}
 		return target;
	}
	return target;
}