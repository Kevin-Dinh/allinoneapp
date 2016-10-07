var information = {
	greenBackground:"lightgreen",
	blueBackground:"lightblue",
	silverBackground:"silver",
	whiteBackground:"white",
	brownBackground:"brown",
	good:"This is good weather and you should visit this city.",
	bad:"Bad weather, should not go here.",
	url1:"http://api.openweathermap.org/data/2.5/forecast?",
	url2:"http://api.population.io/1.0/countries",
	url3:"http://api.population.io:80/1.0/population/",
	APPID:"4066916114404bb6ee654b8bbc254890"
}

$( function() {
    $( "#datepicker" ).datepicker({
    	dateFormat: 'yy-mm-dd',
    });
  });

function refreshPage(){
	location.reload();
}

function searchForWeather(){
	var id = document.getElementById("locationId");
	var locationId = id.value;
	var param = {id:locationId, APPID: information.APPID}
	//@webservice
	$.ajax({
		dataType: 'jsonp',
		url: information.url1,
		data: param,
		success: function (weatherData){
			createDataTable(weatherData);
		},
	});
	
};

function createDataTable(response){

	document.getElementById("city").innerHTML = "Weather forecast from " + response.list[0].dt_txt + " to " + response.list[response.list.length -1].dt_txt; 
	for (var i = 0; i < response.list.length; i++) { 
    	var date = response.list[i].dt_txt;
		var city = response.city.name;
		var humidity = response.list[i].main.humidity;
		var windSpeed = response.list[i].wind.speed;
		var description = response.list[i].weather[0].description;
		var temperature = Math.round((response.list[i].main.temp - 273.15))*100/100;

		var backgroundColor;
		if(i <= 3){
			backgroundColor = information.greenBackground;
		}else if (4 <= i && i <= 11) {
			backgroundColor = information.blueBackground;
		} else if(12 <= i && i <= 19) {
			backgroundColor = information.silverBackground;
		} else if(20 <= i && i <= 27) {
			backgroundColor = information.brownBackground;
		}  else if(28 <= i && i <= 35) {
			backgroundColor = information.whiteBackground;
		} 
		
	$("#displayData").append('<table id="city'+i+'" style="background-color:' +backgroundColor+ ';" width="320" border="1"><tr><td colspan="2">Date ' + date + '</td></tr><tr><td>City</td><td colspan="2" rowspan="1">' + city + '</td></tr><tr><td>Humidity</td><td width="118" class="humid">' + humidity + '%</td></tr><tr><td>Wind Speed</td><td width="186" class="wind">' + windSpeed + ' km/h</td></tr><tr><td>Weather</td><td width="186">' + description + '</td></tr><tr><td>Temperature</td><td width="186" class="temp">' + temperature + '&deg;C</td></tr></table>');

	}
	$("#hiddenCity").text(response.city.name);
	
}

function getAverageWeather(){
	var humidity = document.getElementsByClassName("humid");
	var temp = document.getElementsByClassName("temp");
	var averageWind = document.getElementsByClassName("wind");
	var city = document.getElementById("hiddenCity");
	var displayCity = city.innerHTML;
	var averageHumidity = 0;
	var averageTemp = 0;
	var finalNumber;
	var finalTempNumber;
	var allMessages = {};
	for(var i = 0; i < humidity.length; i++){
		var stringHumid = humidity[i].innerHTML;
		var stringTemp = temp[i].innerHTML;
		var tempOnlyNumber = stringTemp.substring(0, stringTemp.length - 2);
		var onlyNumber = stringHumid.substring(0, stringHumid.length - 1);
		averageTemp += +tempOnlyNumber;
		averageHumidity += +onlyNumber;
	}


	finalNumber = Math.round(averageHumidity/humidity.length - 1)*100/100;
	finalTempNumber = Math.round(averageTemp/humidity.length - 1)*100/100;

	allMessages = checkInfor(finalNumber);


	$("#displayAverage").append('<p>Prediction for '+ displayCity +'</p><table style="background-color:'+allMessages.color+';" width="320" border="1"><tr><td>Average Humidity</td><td>' + finalNumber + '</td></tr><tr><td>Average Temperature</td><td>' + finalTempNumber + '</td></tr><tr><td>Recommendation</td><td>' + allMessages.message+'</td></tr></table>');
	

}

var app = angular.module('myApp', []);
app.controller('countriesCtrl', function($scope, $http) {
	//@webservice
 		$http.get(information.url2)
    	.then(function (countries) {
    		var list = countries.data.countries;
    		$scope.countries = list;
    	});
   	$scope.populationSearch = function() {
		var country = document.getElementById("selectedCountry").value;
		//var country = document.getElementById("selectedCountry");
		var age = document.getElementById("age");
		var year = document.getElementById("year");
		var today = document.getElementById("today");
		var anydate = document.getElementById("datepicker");
		var checkStatus = false;
		$.var = information.url3;

		if(year.value != ""){
		 	$.var += year.value+"/";
		 }

		 if(country.substring(7) != ""){
		 	$.var += country.substring(7)+"/";
		 	$scope.country = country.substring(7);
		 }

		 if(age.value != ""){
		 	$.var += age.value+"/";
		 }

		if(anydate.value != ""){
		 	$.var += anydate.value+"/";
		 }

		//@webservice
		$.ajax({
			dataType: 'json',
			url: $.var,
			data: {},
			success: function (population){
				if(anydate.value != ""){
					$scope.specificdate = population;
				}else{
					$scope.alldata = population;
				}
			},
		});
   	};

   	$scope.emptyAllTxtBox = function(){
		$("#selectedCountry").val('');
		$("#age").val('');
		$("#year").val('');
		$("#datepicker").val('');
		$("#today").val('');
   	};
});

function comparePop(males, females){

}

function checkInfor(number){
	if(40 <= number && number <= 50){
		return {message:information.good, color:'lightgreen'};
	} else {
		return {message:information.bad, color:'red'};
	}
}