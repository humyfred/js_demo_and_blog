Function.prototype.before = function(fn){//函数处理后执行fn
  var self = this;
   return function(){
     var res = fn.call(this);
     if(res)//返回成功则执行函数
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


function validate2(){
   console.log('验证通过');
   return true;
}

submit.before(report).before(validate2)();
//结果：
// 验证通过
// 上报数据
// 提交数据
