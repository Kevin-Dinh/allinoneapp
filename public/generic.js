$( "#searchWeather" ).bind( "click", function() {
	$id = $("#locationId").val();
	$param = {id:$id, APPID: $information.applicationID};

	getWeather($information.url1, $param, function(weatherData){
		createDataTable(weatherData);
	}, function(errorHandler){
		typeof errorHandler.responseJSON !== 'undefined' ? $("#errorHandlerForWeatherTab").text(errorHandler.responseJSON.detail) : $("#errorHandlerForWeatherTab").text("Invalid input!");
		
	})
});

$app = angular.module('myApp', []);
$app.controller('countriesCtrl', function($scope, $http) {
	//@webservice
 		$http.get($information.url2)
    	.then(function (countries) {
    		$list = countries.data.countries;
    		$scope.countries = $list;
    	});

   	$scope.populationSearch = function() {
		$checkStatus = false;
		$url = $information.url3;

		$year = $("#year").val();
        if($year != "") {
             $url += encodeURIComponent($year.trim()) + "/";
        }

        $country = $("#selectedCountry").val().substring(7);
		 if($country != ""){
		 	 $url += $country+"/";
		 	$scope.country = $country;
		 }

		 $age = $("#age").val();
		 if($age != ""){
		 	 $url += $age.trim()+"/";
		 }

		 $specificDate = $("#datepicker").val();
		if($specificDate != ""){
		 	 $url += encodeURIComponent($specificDate) +"/";
		 }



		 ;
		 getPopulationData($url, function (population) {
		 	if($specificDate != ""){
					$scope.specificdate = population;
				}else{
					$scope.alldata = population;
					$scope.header = [1];
				}
		 }, function (errorHandler){
		
		 	typeof errorHandler.responseJSON !== 'undefined' ? $("#errorHandler").text(errorHandler.responseJSON.detail) : $("#errorHandler").text("Invalid input!");
		 });
		
   	};

   	$scope.emptyAllTxtBox = function(){
		$("#selectedCountry, #age, #year, #datepicker, #today").val('');
   	};

   	$scope.showBiggerNumber = function(){
		for ($i = $(".male").length - 1; $i >= 0; $i--) {
			$a = $(".male").val();
			$.checkBiggerNumber = compare($(".male")[i].val(), $(".female")[$i].val());
			$.color = assignColor($.checkBiggerNumber);
			
			$color == 'red' ? $scope.checkColor = $.checkBiggerNumber  : $scope.checkColor;
		}
	};
});

$(function() {
    $( "#datepicker" ).datepicker({
    	dateFormat: 'yy-mm-dd',
    });

  });

function compare(malePopulation, femalePopulation){
	return malePopulation > femalePopulation ? true : "";
}

function assignColor(data){
	return data == true ? $colorObj[5] : "";
}

$("#refresh").bind("click", function refreshPage(){
	location.reload();
});



function createDataTable(weatherList){
	$counter = 0;
	$("#city").text("Weather forecast from " + weatherList.list[0].dt_txt + " to " + weatherList.list[weatherList.list.length -1].dt_txt); 


	$listOfWeather = weatherList.list.length;
	for ($i = 0; $i < $listOfWeather; $i++) { 
    	$currentDateWithTime = weatherList.list[$i].dt_txt;
    	$currentDate = $currentDateWithTime.substring(0,10);
		
		/*
			Compare current date with 
			privious date to apply 
			background color
		*/
		if($i == 0){
			$backgroundColor = $colorObj[$counter];
		} else {
			$previousDateWithTime = weatherList.list[$i - 1].dt_txt;
			$previousDate = $previousDateWithTime.substring(0,10);

			$currentDate === $previousDate ? $backgroundColor = $colorObj[$counter] : $backgroundColor = $colorObj[++$counter];
		}

		$mainPart = weatherList.list[$i];
		$city = weatherList.city.name;
		$humidity = $mainPart.main.humidity;
		$windSpeed = $mainPart.wind.speed;
		$description = $mainPart.weather[0].description;
		$temperature = Math.round(($mainPart.main.temp - 273.15))*100/100;
		
		$("#displayData").append('<table id="city'+
			$i+'" style="background-color:' +
			$backgroundColor+ ';" width="320" border="1"><tr><td colspan="2">Date ' + 
			$currentDateWithTime + '</td></tr><tr><td>City</td><td colspan="2" rowspan="1">' + 
			$city + '</td></tr><tr><td>Humidity</td><td width="118" class="humid">' + 
			$humidity + '%</td></tr><tr><td>Wind Speed</td><td width="186" class="wind">' + 
			$windSpeed + ' km/h</td></tr><tr><td>Weather</td><td width="186">' + 
			$description + '</td></tr><tr><td>Temperature</td><td width="186" class="temp">' + 
			$temperature + '&deg;C</td></tr></table>');

	}
	//Add city to use later in UI
	$("#hiddenCity").text(weatherList.city.name);
	
}

/*
	This function will display average data
*/
$("#averageWeather").bind("click", function getAverageWeather(){

	$humidity = $(".humid");
	$temp = $(".temp"),
	$city = $("#hiddenCity");

	$humidityList = $.map($humidity, function($value, $index){
        return $value.innerHTML.replace("%","");
    });

	$totalH = 0;
	$totalHumidity = $.each($humidityList, function(index, value){

		return $totalH += +value;
	});

    $temperatureList = $.map($temp, function(value, index){
        return value.innerHTML.replace("°C","");
    });

    $totalTemp = 0;
    $totalHumidity = $.each($temperatureList, function(index, value){
		return $totalTemp += +value;
	});

	$finalHumidity = roundNumberToTwoDecimal($totalH, $humidity.length - 1);
	$finalTempNumber = roundNumberToTwoDecimal($totalTemp, $temp.length - 1);
	$allMessages = checkInfor($finalHumidity);
	$displayCity = $city.text();

	$("#displayAverage").append('<p>Prediction for '+ 
		$displayCity +'</p><table style="background-color:'+
		$allMessages.color+';" width="320" border="1"><tr><td>Average Humidity</td><td>' + 
		$finalHumidity + '</td></tr><tr><td>Average Temperature</td><td>' + 
		$finalTempNumber + '</td></tr><tr><td>Recommendation</td><td>' + 
		$allMessages.message+'</td></tr></table>');
});

function roundNumberToTwoDecimal(total, length){
	return $average = Math.round(total/length)*100/100;
}


function checkInfor(number){
	return (40 <= number && number <= 50) ? {message:$information.goodWeather, color:$colorObj[0]} : {message:$information.badWeather, color:$colorObj[5]};
}

$information = {
	goodWeather:"This is good weather and you should visit this city.",
	badWeather:"Bad weather, should not go here.",
	applicationID:"4066916114404bb6ee654b8bbc254890"
}

$web_services = {
	url1:"http://api.openweathermap.org/data/2.5/forecast",
	url2:"http://api.population.io/1.0/countries",
	url3:"http://api.population.io:80/1.0/population/",
}

Object.assign($information, $web_services);

$colorObj = ['lightgreen', 'lightblue', 'silver', 'brown', 'white', 'red'];