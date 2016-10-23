var express = require('express');

var app = express();

//Pass the folder's name so files can be use directly
app.use(express.static('public'));

app.get('/allinoneapp.html', function (req, res) {
   res.sendFile( __dirname + "/" + "allinoneapp.html" );
});

app.get('/deffered-sample.html', function (req, res) {
   res.sendFile( __dirname + "/" + "deffered-sample.html" );
});

var server = app.listen(8080, function () {
   var host = server.address().address;
   var port = server.address().port;
   console.log("Allinoneapp is listening at http://%s:%s", host, port)

});