function fastclick(){
	this.tapTimeout = 700;
	this.trackingClickStart = 0;
	this.body = document.body;
	this.init();
}

fastclick.prototype.init = function(){
	this.body.addEventListener('touchstart', this.touchStart.bind(this), false);
	this.body.addEventListener('touchmove', this.touchMove.bind(this), false);
	this.body.addEventListener('touchend', this.touchEnd.bind(this), false);
	this.body.addEventListener('touchcancel', this.touchCancel.bind(this), false);
}

fastclick.prototype.sendClick = function(target, event){
	var touch = event.changedTouches[0];
	var clickEvent = document.createEvent('MouseEvents');
	clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
	clickEvent.forwardedTouchEvent = true;
	target.dispatchEvent(clickEvent);
}

fastclick.prototype.touchStart = function(event){
	if (event.targetTouches.length > 1) {//多指触控不做处理
		return true;
	}

	this.target = event.target;
	this.trackingClickStart = event.timeStamp;
}

fastclick.prototype.touchMove = function(event){
	if(this.target!== event.target){//移动了则取消触碰时最初元素
		this.target = null;
	}
}

fastclick.prototype.touchEnd = function(event){
	if(!this.target){//移动则不派发click事件
		return false;
	}

	if ((event.timeStamp - this.trackingClickStart) > this.tapTimeout) {//长按超时取消click
		return true;
	}

	this.trackingClickStart = 0;

	event.preventDefault();
	this.sendClick(this.target, event);

}

fastclick.prototype.touchCancel = function() {
	this.target = null;
};
