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



/* [CODEREVIEW]
	We should place the entry point at top
	then follow up by the methods ordered by it's priority
	don't make JS source code messy like a spaghetti 
*/

$( function() {
    $( "#datepicker" ).datepicker({
    	dateFormat: 'yy-mm-dd',
    });
  });


/* [CODEREVIEW] I think we could just use the method itself*/
function refreshPage(){
	location.reload();
}

/* [CODEREVIEW] too generic method name*/
function search(){
	var id = document.getElementById("locationId");
	var locationId = id.value;
	var param = {id:locationId, APPID: information.APPID}
	//@webservice
	$.ajax({
		dataType: 'jsonp',
		url: information.url1,
		data: param,
		success: function (response){
			createDataTable(response);
		},
	});
	
};

/* [CODEREVIEW] make arg more meaningfull*/
function createDataTable(response){

	document.getElementById("city").innerHTML = "Weather forecast from " + response.list[0].dt_txt + " to " + response.list[response.list.length -1].dt_txt; 
	for (var i = 0; i < response.list.length; i++) { 
		/* [CODEREVIEW] make a alias here for access the current item in loop
		ex: var currentItemOrAnotherMoreSemanticName = response.list[i]; // then use it later, */
    	var date = response.list[i].dt_txt;
		var city = response.city.name;
		var humidity = response.list[i].main.humidity;
		var windSpeed = response.list[i].wind.speed;
		var description = response.list[i].weather[0].description;

		/* [CODEREVIEW] 
			what does this formular mean?
			make a util method for re-usability and readility*/
		var temperature = Math.round((response.list[i].main.temp - 273.15))*100/100;

		/* [CODEREVIEW] give this variable some default value*/
		var backgroundColor;
		/* [CODEREVIEW] This range check is missing readbility and maintainability*/
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
		/*backgroundColor = information.greenBackground;
		if(i >= 1){
			var date2 = (response.list[i - 1].dt_txt);
			var check = false;
			var d1 = date.substring(0,10);
			var d2 = date2.substring(0,10);
			if( d1 === d2){
				check = true;
			}else{
				check = false;
			}

			if(check == true){
				backgroundColor = information.greenBackground;
			} else {
				backgroundColor = information.blueBackground;
			}
		}*/
		
		/* [CODEREVIEW] too long LOC, make it more readble, maintainable*/
		/*RECOMMENDATION 
			$("#displayData").append('<table id="city')
			.append(i)
			.append('"style="background-color:' +backgroundColor+ ';" width="320" border="1"><tr><td colspan="2">Date ' + date + '</td></tr><tr><td>City</td><td colspan="2" rowspan="1">' + city + '</td></tr><tr><td>Humidity</td><td width="118" class="humid">' + humidity + '%</td></tr><tr><td>Wind Speed</td><td width="186" class="wind">' + windSpeed + ' km/h</td></tr><tr><td>Weather</td><td width="186">' + description + '</td></tr><tr><td>Temperature</td><td width="186" class="temp">' + temperature + '&deg;C</td></tr></table>');
			}*/
		$("#displayData").append('<table id="city')
		.append(i)
		.append('"style="background-color:' +backgroundColor+ ';" width="320" border="1"><tr><td colspan="2">Date ' + date + '</td></tr><tr><td>City</td><td colspan="2" rowspan="1">' + city + '</td></tr><tr><td>Humidity</td><td width="118" class="humid">' + humidity + '%</td></tr><tr><td>Wind Speed</td><td width="186" class="wind">' + windSpeed + ' km/h</td></tr><tr><td>Weather</td><td width="186">' + description + '</td></tr><tr><td>Temperature</td><td width="186" class="temp">' + temperature + '&deg;C</td></tr></table>');
	}
	$("#hiddenCity").text(response.city.name);
	
}

/* [CODEREVIEW] again too generic method name, make it more sematic */
function compare(){
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


	/* [CODEREVIEW] move the unnecessary part of code out of loop */
	finalNumber = Math.round(averageHumidity/(humidity.length - 1))*100/100;
	finalTempNumber = Math.round(averageTemp/(humidity.length - 1))*100/100;
	


	allMessages = checkInfor(finalNumber);


	$("#displayAverage").append('<p>Prediction for '+ displayCity +'</p><table style="background-color:'+allMessages.color+';" width="320" border="1"><tr><td>Average Humidity</td><td>' + finalNumber + '</td></tr><tr><td>Average Temperature</td><td>' + finalTempNumber + '</td></tr><tr><td>Recommendation</td><td>' + allMessages.message+'</td></tr></table>');
	

}

var app = angular.module('myApp', []);
app.controller('countriesCtrl', function($scope, $http) {
	//@webservice
 		$http.get(information.url2) /* [CODEREVIEW] not meaningfull variable's name*/
    	.then(function (response) {  /* [CODEREVIEW] response: the same, make it more semantic*/
    		var list = response.data.countries;
    		$scope.countries = list;
    	});

    	/* [CODEREVIEW] don't try to miss pure js style with angular style on this way*/
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
		 

		 /* [CODEREVIEW] USE $http, make it more semantic, dont mix type*/
		//var paramData = {"/":year.value, "/":country.substring(7),"/":age.value, "/":anydate.value}
		//urlPopulation = $.var;
		//@webservice
		$.ajax({
			documentataType: 'json',
			url: $.var,
			data: {},
			success: function (response){
				if(anydate.value != ""){
					$scope.specificdate = response;
				}else{
					$scope.alldata = response;
				}
			},
		});
   	};
});

function comparePop(males, females){

}

/* [CODEREVIEW] make it more meanning name*/
function checkInfor(number){
	if(40 <= number && number <= 50){
		return {message:information.good, color:'lightgreen'};
	} else {
		return {message:information.bad, color:'red'};
	}
}