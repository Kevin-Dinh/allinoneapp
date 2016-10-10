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
		var url = information.url3;

		if(year.value != ""){
		 	url += year.value.trim()+"/";
		 }

		 if(country.substring(7) != ""){
		 	url += encodeURIComponent(country.substring(7))+"/";
		 	$scope.country = country.substring(7);
		 }

		 if(age.value != ""){
		 	url += age.value.trim()+"/";
		 }

		if(anydate.value != ""){
		 	url += anydate.value.trim()+"/";
		 }

		//@webservice
		$.ajax({
			dataType: 'json',
			url: url,
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

function createDataTable(weatherList){
	var counter = 0;
	document.getElementById("city").innerHTML = "Weather forecast from " + weatherList.list[0].dt_txt + " to " + weatherList.list[weatherList.list.length -1].dt_txt; 
	for (var i = 0; i < weatherList.list.length; i++) { 
    	var currentDateWithTime = weatherList.list[i].dt_txt;
    	var currentDate = currentDateWithTime.substring(0,10);
		var city = weatherList.city.name;
		var humidity = weatherList.list[i].main.humidity;
		var windSpeed = weatherList.list[i].wind.speed;
		var description = weatherList.list[i].weather[0].description;
		var temperature = Math.round((weatherList.list[i].main.temp - 273.15))*100/100;

		var backgroundColor;

		
		/*
			Compare current date with 
			privious date to apply 
			background color
		*/
		if(i == 0){
			backgroundColor = colorObj[counter];
		} else {
			var previousDateWithTime = weatherList.list[i - 1].dt_txt;
			var previousDate = previousDateWithTime.substring(0,10);

			if(currentDate === previousDate){
				backgroundColor = colorObj[counter];
			} else {
				counter++;
				backgroundColor = colorObj[counter];
			}
		}
		
		$("#displayData").append('<table id="city'+i+'" style="background-color:' +backgroundColor+ ';" width="320" border="1"><tr><td colspan="2">Date ' + currentDateWithTime + '</td></tr><tr><td>City</td><td colspan="2" rowspan="1">' + city + '</td></tr><tr><td>Humidity</td><td width="118" class="humid">' + humidity + '%</td></tr><tr><td>Wind Speed</td><td width="186" class="wind">' + windSpeed + ' km/h</td></tr><tr><td>Weather</td><td width="186">' + description + '</td></tr><tr><td>Temperature</td><td width="186" class="temp">' + temperature + '&deg;C</td></tr></table>');

	}
	//Add city to use later in UI
	$("#hiddenCity").text(weatherList.city.name);
	
}

/*
	This function will display average data
*/
function getAverageWeather(){
	var humidity = document.getElementsByClassName("humid");
	var temp = document.getElementsByClassName("temp");
	var averageWind = document.getElementsByClassName("wind");
	var city = document.getElementById("hiddenCity");
	var displayCity = city.innerHTML;
	var totalHumidity = 0;
	var totalTemp = 0;
	var finalNumber;
	var finalTempNumber;
	var allMessages = {};
	for(var i = 0; i < humidity.length; i++){
		var stringHumid = humidity[i].innerHTML;
		var stringTemp = temp[i].innerHTML;
		var tempOnlyNumber = stringTemp.substring(0, stringTemp.length - 2);
		var onlyNumber = stringHumid.substring(0, stringHumid.length - 1);
		totalTemp += +tempOnlyNumber;
		totalHumidity += +onlyNumber;
	}

	finalNumber = roundNumberToTwoDecimal(totalHumidity, humidity.length - 1);

	finalTempNumber = roundNumberToTwoDecimal(totalTemp, humidity.length - 1);

	allMessages = checkInfor(finalNumber);


	$("#displayAverage").append('<p>Prediction for '+ displayCity +'</p><table style="background-color:'+allMessages.color+';" width="320" border="1"><tr><td>Average Humidity</td><td>' + finalNumber + '</td></tr><tr><td>Average Temperature</td><td>' + finalTempNumber + '</td></tr><tr><td>Recommendation</td><td>' + allMessages.message+'</td></tr></table>');
}


function roundNumberToTwoDecimal(total, length){
	var average = Math.round(total/length)*100/100;
	return average;
}

function checkInfor(number){
	if(40 <= number && number <= 50){
		return {message:information.good, color:colorObj[0]};
	} else {
		return {message:information.bad, color:colorObj[5]};
	}
}

var information = {
	good:"This is good weather and you should visit this city.",
	bad:"Bad weather, should not go here.",
	url1:"http://api.openweathermap.org/data/2.5/forecast?",
	url2:"http://api.population.io/1.0/countries",
	url3:"http://api.population.io:80/1.0/population/",
	APPID:"4066916114404bb6ee654b8bbc254890"
}

var colorObj = ['lightgreen', 'lightblue', 'silver', 'brown', 'white', 'red'];