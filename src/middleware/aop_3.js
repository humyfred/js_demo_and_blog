
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


//提交数据前，验证数据，然后上报，在提交之后做返回首页的跳转
function report(){
   console.log('上报数据');
   return true;
}
function validate(){
   console.log('验证通过');
   return true;
}
function submit(){
   console.log('提交数据');
}
function goBack(){
   console.log('返回首页')
}
submit.before(report).before(validate).after(goBack)();
//结果：
// 验证通过
// 上报数据
// 提交数据
// 返回首页
