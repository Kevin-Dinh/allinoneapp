function searchForWeather() { // CODEREVIEW: move important parts first
    var id = document.getElementById(locationId);
    var locationId = id.value;
    var param = { id: locationId, APPID: information.APPID }
        //@webservice
    $.ajax({
        dataType: 'jsonp',
        url: information.url1,
        data: param, //CODEREVIEW: security unsanitized parameters !
        success: function(weatherData) {
            createDataTable(weatherData);
        }
    });
}

var app = angular.module('myApp', []);
app.controller('countriesCtrl', function($scope, $http) {
    //@webservice
    $http.get(information.url2)
        .then(function(countries) {
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
        // CODEREVIEW: url building API in angular
        if (year.value != "") {
            url += year.value.trim() + "/"; //CODEREVIEW:  SECURITY, do not trust svc output for building URLs
        }

        if (country.substring(7) != "") {
            url += encodeURIComponent(country.substring(7)) + "/";
            $scope.country = country.substring(7);
        }

        if (age.value != "") {
            url += age.value.trim() + "/";
        }

        if (anydate.value != "") {
            url += anydate.value.trim() + "/";
        }

        //@webservice
        $.ajax({
            dataType: 'json',
            url: url,
            data: {},
            success: function(population) {
                if (anydate.value != "") {
                    $scope.specificdate = population;
                } else {
                    $scope.alldata = population;
                    $scope.header = [1];
                }
            }
            // CODEREVIEW: failures ?
        });
    };

    $scope.emptyAllTxtBox = function() {
    	// CODEREVIEW: PERF one selector for all (measure speed up)
    	// $("#selectedCountry,#age")
        $("#selectedCountry").val('');
        $("#age").val('');
        $("#year").val('');
        $("#datepicker").val('');
        $("#today").val('');
    };
});

// $(function(){}); // CODEREVIEW: link to docs ???
$(function() {
    $("#datepicker").datepicker({
        dateFormat: 'yy-mm-dd',
    });
});

function refreshPage() {
    location.reload(); //CODEREVIEW: tab aware ?, othewose useless
}

function createDataTable(weatherList) {
    var counter = 0;
    // CODEREVIEW: SECURITY XSS attack by WS response ?
    document.getElementById("city").innerHTML = "Weather forecast from " + weatherList.list[0].dt_txt + " to " + weatherList.list[weatherList.list.length - 1].dt_txt;
    // CODEREVIEW: I hate for loops 

    for (var i = 0; i < weatherList.list.length; i++) { //CODEREVIEW: perf, see jsperf for samples
    // a1:    for (var i = Things.length - 1; i >= 0; i--) {
    // 	Things[i]
    // }

    // a2: for (var i = 0, l = weatherList.list.length; i < l ; i++) 
    	// calculates backgond color, and sets displayData
        var backgroundColor;
		var displayData;

		// 

        var currentDateWithTime = weatherList.list[i].dt_txt;
        var currentDate = currentDateWithTime.substring(0, 10);
        var city = weatherList.city.name;
        var humidity = weatherList.list[i].main.humidity;
        var windSpeed = weatherList.list[i].wind.speed;
        var description = weatherList.list[i].weather[0].description;
        var temperature = Math.round((weatherList.list[i].main.temp - 273.15)) * 100 / 100;
        /*
        	Compare current date with 
        	privious date to apply 
        	background color
        */
        if (i == 0) {
            backgroundColor = colorObj[counter];
        } else {
            var previousDateWithTime = weatherList.list[i - 1].dt_txt;
            var previousDate = previousDateWithTime.substring(0, 10); //CODEREVIEW: date api ? angular ? ES ?
            // CODEREVIEW: useless ternary if
           	backgroundColor=colorObj[currentDate === previousDate?counter:counter++];
        }
        // CODEREVIEW: lookup + appnd in loop, very expensive
        // buff.push(markup)
        // CODEREVIEW: replace c oncats with templating !
        $("#displayData").append('<table id="city' \
        	+ i + '" style="background-color:' 
        	+ backgroundColor + 
        	';" width="320" border="1"><tr><td colspan="2">Date ' + currentDateWithTime + '</td></tr><tr><td>City</td><td colspan="2" rowspan="1">' + city + '</td></tr><tr><td>Humidity</td><td width="118" class="humid">' + humidity + '%</td></tr><tr><td>Wind Speed</td><td width="186" class="wind">' + windSpeed + ' km/h</td></tr><tr><td>Weather</td><td width="186">' + description + '</td></tr><tr><td>Temperature</td><td width="186" class="temp">' + temperature + '&deg;C</td></tr></table>');

    }

    // CODEREVIEW: lookup: $("#displayData").append(markup.join());
    //Add city to use later in UI
    $("#hiddenCity").text(weatherList.city.name);

}

/*
	This function will display average data
*/
function getAverageWeather() {
    // CODEREVIEW: his is not basic, no need to var all variables at the bgining f function
    // CODEREVIEW: mixning jQuery and 'standard' functions
    var humidity = document.getElementsByClassName("humid");
    var temp = document.getElementsByClassName("temp");
    var totalHumidity = 0;
    var totalTemp = 0;


    // CODEREVIEW: no for loops (use map, filter, etc...)
    for (var i = 0; i < humidity.length; i++) {
        var stringHumid = humidity[i].innerHTML;
        var stringTemp = temp[i].innerHTML;
        // CODEREVIEW: extract all parsing functions parseTemp, parseDate etc...
        var tempOnlyNumber = stringTemp.substring(0, stringTemp.length - 2);
        var onlyNumber = stringHumid.substring(0, stringHumid.length - 1);
        totalTemp += +tempOnlyNumber; //;-))
        totalHumidity += +onlyNumber;
    };



    var allMessages = {};
    var displayCity = city.innerHTML;
    var averageWind = document.getElementsByClassName("wind");
    var city = document.getElementById("hiddenCity");

    var finalNumber = roundNumberToTwoDecimal(totalHumidity, humidity.length - 1);
    var finalTempNumber = roundNumberToTwoDecimal(totalTemp, humidity.length - 1);

    allMessages = checkInfor(finalNumber); //CODEREVIEW: infor ? is not english word, do not shorten names

    // CODEREVIEW: never build inine style attributes, always use classes
    // this could be exception however
    $("#displayAverage").append('<p>Prediction for ' + //
        displayCity + '</p><table style="background-color:' + //
        allMessages.color + //
        ';" width="320" border="1"><tr><td>Average Humidity</td><td>' + //
        finalNumber + //
        '</td></tr><tr><td>Average Temperature</td><td>' //
        + finalTempNumber //
        + '</td></tr><tr><td>Recommendation</td><td>' + allMessages.message + '</td></tr></table>');
}


function roundNumberToTwoDecimal(total, length) {
    var average = Math.round(total / length) * 100 / 100;
    return average;
}

function checkInfor(number) {
	return 40 <= number && number <= 50 //
		? { message: information.good, color: colorObj[0] } //
		: { message: information.bad, color: colorObj[5] }
}


var information = {
	// CODEREVIEW: mixture of many things, cats, dogs, apples
    good: "This is good weather and you should visit this city.",
    bad: "Bad weather, should not go here.",
    // CODEREVIEW: bad variable names
    APPID: "4066916114404bb6ee654b8bbc254890"
}
var web_services= {
	// forecast: {url: "http://api.openweathermap.org/data/2.5/forecast", APPID: "4066916114404bb6ee654b8bbc254890"} 
	// countries: "http://api.population.io/1.0/countries"
	// population: "http://api.population.io:80/1.0/population/""
	url1: "http://api.openweathermap.org/data/2.5/forecast?",
    url2: "http://api.population.io/1.0/countries",
    url3: "http://api.population.io:80/1.0/population/"
}
// function web_services_url(){
// 	return this.url || this;
// }
// for(var ws in web_services){ //CODEREVIEW: no for loops ? 
// 	web_services[ws].url=web_services_url; // augmenting existing object, attaching function
// }
// // now i can use this on heterogenous structire web_services.forecast.url();

// CODEREVIEW: beware XB (means cross-browser) compatibility (angular equivalent, jquery equivalent)
Object.assign(information, web_services); // just for back compat, refactor

var colorObj = ['lightgreen', 'lightblue', 'silver', 'brown', 'white', 'red'];




