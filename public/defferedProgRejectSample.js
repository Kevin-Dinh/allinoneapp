require(["dojo/Deferred", "dojo/dom", "dojo/on", "dojo/domReady!"],
function(Deferred, dom, on){
  function asyncProcess(msg){
    var deferred = new Deferred();

    dom.byId("output").innerHTML += "<br/>I'm running...";

    //deferred.then("Hello");

    setTimeout(function(){
      deferred.progress("halfway");
    }, 1000);

    setTimeout(function(){
      deferred.resolve("finished");
    }, 1500);

    setTimeout(function(){
      deferred.reject("ooops");
    }, 2000);

    return deferred.promise;
  }

  on(dom.byId("startButton"), "click", function(){
    var process = asyncProcess();
    process.then(function(results){
      dom.byId("output").innerHTML += "<br/>I'm finished, and the result was: " + results;
    }, function(err){
      dom.byId("output").innerHTML += "<br/>I errored out with: " + err;
    }, function(progress){
      dom.byId("output").innerHTML += "<br/>I made some progress: " + progress;
    });
  });
});