var http = require('http'),
    url  = require("url"),
    path = require("path"),
    fs   = require("fs");

// 创建一个 HTTP 服务器
var srv = http.createServer( (req, res) => {
  console.log('here req');
  res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8'});
  fs.readFile(parserUrl(req),function (err,data){
    res.end(data);
  });
}).listen(3000,function(){
	console.log('start server');
});

function parserUrl(req){
	console.log(url.parse(req.url))
	return pathname = '.' + url.parse(req.url).pathname;
}