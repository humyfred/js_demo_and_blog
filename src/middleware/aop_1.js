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


function report(){
   console.log('上报数据');
}
function submit(){
   console.log('提交数据');
}

submit.before(report)(); //提交之前执行report
//结果： 上报数据
//      提交数据
