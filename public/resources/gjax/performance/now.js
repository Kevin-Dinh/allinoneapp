define([], function() {
    return function(perf){
        //we need acces to performance object (native or gjax), but we cannot requrie gjax/performance (cyclic dep)
        //so make this module as factory, which accepts performance object as argument
    	return function() {
    		return (new Date()).getTime() - perf.timing.navigationStart; 
    	};
    };
});