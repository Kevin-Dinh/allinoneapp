require(["dojo/Deferred", "dojo/dom", "dojo/on", "dojo/domReady!"],
function(Deferred, dom, on){
  function asyncProcess(msg){
    var deferred = new Deferred();

    dom.byId("output").innerHTML += "<br/>I'm running...";

    setTimeout(function(){
      deferred.resolve(msg);
    }, 1000);

    return deferred.promise;
  }

  on(dom.byId("startButton"), "click", function(){
    var process = asyncProcess("first");
    process.then(function(results){
      dom.byId("output").innerHTML += "<br/>I'm finished, and the result was: " + results;
      return asyncProcess("second");
    }).then(function(results){
      dom.byId("output").innerHTML += "<br/>I'm really finished now, and the result was: " + results;
    });
  });

});