requre(['dojo/Deferred','dojo/request/xhr'],function(deferred, xhr){
	xhr("http://api.population.io/1.0/countries", {
		handleAs: "json"
	}).then(function(countries){
		var countryList = countries.data.countries;
		console.log(countryList);
	},function(err){
		console.log("Cannot get list of countries");
	});
});