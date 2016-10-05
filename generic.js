function search(){
	var id = document.getElementById("locationId");
	var locationId = id.value;
	var urlString = "http://api.openweathermap.org/data/2.5/forecast?id="+ locationId +"&APPID=4066916114404bb6ee654b8bbc254890"
	$.ajax({
		dataType: 'jsonp',
		url: urlString,
		success: function (response){
			createDataTable(response);
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
	if(i <= 2){
		backgroundColor = "lightgreen";
	}else if (3 <= i && i <= 10) {
		backgroundColor = "lightblue";
	} else if(11 <= i && i <= 18) {
		backgroundColor = "white"
	} else if(19 <= i && i <= 26) {
		backgroundColor = "silver"
	}  else if(27 <= i && i <= 34) {
		backgroundColor = "brown"
	} 

	
	
	$("#displayData").append('<table id="city'+i+'" style="background-color:' +backgroundColor+ ';" width="320" border="1"><tr><td colspan="2">Date ' + date + '</td></tr><tr><td>City</td><td colspan="2" rowspan="1">' + city + '</td></tr><tr><td>Humidity</td><td width="118" class="humid">' + humidity + '%</td></tr><tr><td>Wind Speed</td><td width="186" class="wind">' + windSpeed + ' km/h</td></tr><tr><td>Weather</td><td width="186">' + description + '</td></tr><tr><td>Temperature</td><td width="186" class="temp">' + temperature + '&deg;C</td></tr></table>');


	}
	$("#hiddenCity").text(response.city.name);
	
}

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
	var message = "";
	for(var i = 0; i < humidity.length; i++){
		var stringHumid = humidity[i].innerHTML;
		var stringTemp = temp[i].innerHTML;
		var tempOnlyNumber = stringTemp.substring(0, stringTemp.length - 2);
		var onlyNumber = stringHumid.substring(0, stringHumid.length - 1);
		averageTemp += +tempOnlyNumber;
		averageHumidity += +onlyNumber;
		if(i == humidity.length - 1){
			finalNumber = Math.round(averageHumidity/i)*100/100;
			finalTempNumber = Math.round(averageTemp/i)*100/100;
		}
	}

	if(finalNumber >= 40 && finalNumber <= 50){
		message = "This is good weather and you should visit this city.";
	} else {
		message = "Bad weather, should not go here.";
	}

	$("#displayAverage").append('<p>Prediction for '+ displayCity +'</p><table style="background-color:red;" width="320" border="1"><tr><td>Average Humidity</td><td>' + finalNumber + '</td></tr><tr><td>Average Temperature</td><td>' + finalTempNumber + '</td></tr><tr><td>Recommendation</td><td>' + message+'</td></tr></table>');
	

}


function clear(){
	$("#displayData").html('');
	$("#displayAverage").html('');
}


var app = angular.module('myApp', []);
app.controller('countriesCtrl', function($scope, $http) {
 		$http.get("http://api.population.io/1.0/countries")
    	.then(function (response) {
    		var list = response.data.countries;
    		$scope.countries = list;
    	});
   
   	$scope.populationSearch = function() {
		var country = document.getElementById("selectedCountry").value;
		var age = document.getElementById("age");
		var year = document.getElementById("year");
		var today = document.getElementById("today");
		var anydate = document.getElementById("anydate");
		var urlPopulation;
		
		if(country != "" && year.value != "" && age.value != ""){
			urlPopulation = "http://api.population.io:80/1.0/population/" +year.value+ "/" + country.substring(7)+"/" + age.value + "/";
			$.ajax({
				dataType: 'json',
				url: urlPopulation,
				success: function (response){
					//getPopulationForSpecificAge(response);
					$scope.specificdata = response;
				},
			});
		}
		else if(country != "" && year.value != ""){
			urlPopulation = "http://api.population.io:80/1.0/population/" +year.value+ "/" + country.substring(7)+"/";
			$.ajax({
				dataType: 'json',
				url: urlPopulation,
				success: function (response){
					//response.forEach(poplateData);
					$scope.alldata = response;
				},
			});
		} 

   	};
});



function getPopulationForSpecificAge(data){
	var table = $("<table/>").addClass('tbPopulation');
   	var tr = $("<tr/>");


}

function poplateData(element, index, response){
	var total = 0;
	total += +(element.females + element.males)
	element.age;
	element.year;
	element.total;
	element.country;
	var table = $("<table/>").addClass('tbPopulation');
   	var tr = $("<tr/>");
   	var td = $("<td/>");
   	var td1 = $("<td/>");
   	var td2 = $("<td/>");
   	var td3 = $("<td/>");
   	td.append("Total");
   	td1.append("Age");
   	td2.append(element.total);
   	td3.append(element.age);
   	tr.append(td1,td3,td,td2);
   	table.append(tr);
	$("#totalPopulation").append(table);
}
	

