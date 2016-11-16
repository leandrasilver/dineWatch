
// one global variable that is an empty object
var app = {};

// Receive data from api that receives only theaters in that city that the users input input our search menu
$('form.cityForm').on('submit', function(e) {
	e.preventDefault();

	// clear the drop down menu for theater selections before user enters a searchQuery
	$('#selectTheater').empty();

	// go out and get search input value and use it and get data from the api
	var searchQuery = $('input[type=text]').val();

	app.getTheaterLocations(searchQuery);

});

app.getTheaterLocations = function(location) {
	// call the api
	// pass it an object on how we want to pass on our request
	var finalCity, finalState, finalLocation;
	
	$().ready(function () {
		var url = 'https://maps.googleapis.com/maps/api/geocode/json?address='+location+'&key=AIzaSyC9huZQwaCRBXQdLsoZP9PjFo7hY2PJvyo&callback=?';

	  $.get(url, function (data) {
		
		components = data.results[0].address_components;
		for (var i = 0; i < components.length; i++){
			if (components[i].types[0] == 'locality'){
				finalCity = components[i].long_name;
			}
			else if (components[i].types[0] == 'administrative_area_level_1'){
				finalState = components[i].short_name;
			}
		}
		FinalLocation = (finalCity != '' && finalState != '')? finalCity + ', ' + finalState : location;
		$.ajax({
		url:'https://api.foursquare.com/v2/venues/search?client_id=FMHSMARH2CA2RXR4TI0RYMPYFNJORC33ISEK3ED23MLR1US0&client_secret=DDHE1CKUUCGIM3ICDGJ0W5NVPLJBKA1D0HEPAEXH2CGDDZ2R&v=20161019',
		method: 'GET',
		dataType:'json',
		data: {
			near:FinalLocation,
			query:'cinema',
			limit: 100
			}
	})
	.done(function(theaterResults){
		// make an array of the movie theater id's from foursquare to filter out anything other then a theater
		// var movieCategoryIds =['4bf58dd8d48988d17f941735','56aa371be4b08b9a8d5734de','4bf58dd8d48988d17e941735','4bf58dd8d48988d180941735'];
		// Grab just the venues of the theaters and filter out anything named with cinema, but is not actually a movie theaters using ID numbers from documentation
		var justTheTheaters = (theaterResults.response.venues).filter(function(theater){
			// Since not all objects have a category , only return the ones that have the id that match with theaters, movie theaters, indian theaters , and drive ins}
			if (theater.categories[0]) {
				return (theater.categories[0].id === '4bf58dd8d48988d17f941735' || theater.categories[0].id === '56aa371be4b08b9a8d5734de' || theater.categories[0].id === '4bf58dd8d48988d17e941735' || theater.categories[0].id === '4bf58dd8d48988d180941735')
			}
		});

		// The api returns theaters that are within and surround the scope of the city, so I am filtering for cities that match the query's city only
		var filteredCity = justTheTheaters.filter(function(item){
			// Remove all spaces from the string of location entered in by the user and overwrite the variable, then make all the letters lowercase
			// location = location.replace(/\s/g, '');
			// location = location.toLowerCase();
			// var cityName = item.location.city.toLowerCase();
			// var cityState = item.location.state.toLowerCase();
			var totalCity = item.location.city != undefined ? item.location.city.toUpperCase() + ', ' + item.location.state.toUpperCase() : '';
			return totalCity.indexOf(FinalLocation.toUpperCase()) != -1
		});

		// For every iteration, append the theater info into a option
		// make sure the address and city properties are defined first, if not then filter them out of the choices
		for (var i= 0; i < filteredCity.length; i ++) {
			var theaterName= filteredCity[i].name;
			var theaterAddress= filteredCity[i].location.address;
			var theaterCity= filteredCity[i].location.city;
			// creation options in the select menu with data that is associated with the filteredCity itself so it can be referenced upon later
			var option = $('<option>').text(`${theaterName} , ${theaterAddress} , ${theaterCity}`).data('theater', filteredCity[i]);
			if (theaterCity !== undefined && theaterAddress !== undefined) {
				$('#selectTheater').append(option);
			}
		}
		// Only go to page page if a successful city was entered
		$('.citySection').hide();
		$('.theaterSection').show();
	})	
	.fail(function(error) {
		alert("Please enter a city name");
	})
	  });
	});
	
};

// Have user select a theater in that city that is in a drop down menu
app.userInputObject = {};

// On submit grab the lat and long from the selected location
$('form.theaterForm').on('submit', function(e) {
	e.preventDefault();

	// go out and get search input value and use it and get data from the api
	var selectedTheaterObject = $('#selectTheater option:selected').data();

	// Grab the lat and long coordinates from the selectedTheaterobject and store them in a variable 
	app.selectedTheaterLat= selectedTheaterObject.theater.location.lat;
	app.selectedTheaterLng= selectedTheaterObject.theater.location.lng;
	app.theaterName=selectedTheaterObject.theater.name;

	// Array with lat and longs to be sent in next api request with food category
	app.theaterll = app.selectedTheaterLat + ',' + app.selectedTheaterLng;

	// add the user input to the user input object
	app.userInputObject.ll = app.theaterll;
	console.log('theater form submitted');

	$('.theaterSection').hide();
	$('section.foodSection').show();
});


// make sure a food cuisine was chosen, if not alert user to select
	// Have user select a food craving 
	$('form.foodForm').on('submit', function(e) {
		e.preventDefault();

		// go out and get search input value and use it and get data from the api
		app.usersFoodChoice = $('input[type=radio]:checked').val();

		// add the user input to the user input object
		app.userInputObject.categoryId = app.usersFoodChoice;

		// make a call to the api using the user inputs object
		app.getFoodLocationsNearTheater(app.userInputObject);
		console.log(app.userFoodChoice);
		// If something is selected then show the next page, otherwise alert
		if (app.usersFoodChoice !== undefined) {
			$('.foodSection').hide();
			$('.results').show();
			$('footer').show();

			// Place the theater name in the text above the map
			$('.foodSelection').text(app.theaterName);

			// display the map
			app.mymap = L.map('mapid')
				.setView([app.selectedTheaterLat,app.selectedTheaterLng], 13);

			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibGVhbmRyYXNpbHZlciIsImEiOiJjaXVuODR3MXEwMGoyMnptdzRqcTB3bzF5In0.RLqE7nVL3VFrB5LIxT_mCQ', {
			    attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
			    maxZoom: 18,
			    id: 'mapbox.streets',
			}).addTo(app.mymap);

			// Define a custom marker for the theater
			var theaterIcon = L.icon({
				iconUrl: 'images/markermovie.png',
				iconSize: [41, 56], // [1/2 width, 100% height]
				iconAnchor: [20.5, 56], // [1/4 width, 100% height]
				popupAnchor: [0, -55], // -100% height + 1
				shadowAnchor: [13, 41]
			});

			L.marker([app.selectedTheaterLat,app.selectedTheaterLng], {icon: theaterIcon, zIndexOffset:30}).addTo(app.mymap).bindPopup(
				`<div class="popupContainer">
					<h3>${app.theaterName}</h3>
				 </div>
				`
			);

		} else {
			alert('Hey, pick an option');
			return false;
		}
	});

// Make a request to API once we know users location and what food they want
app.getFoodLocationsNearTheater = function (userInputObject) {
	$.ajax({
		url:'https://api.foursquare.com/v2/venues/search?client_id=FMHSMARH2CA2RXR4TI0RYMPYFNJORC33ISEK3ED23MLR1US0&client_secret=DDHE1CKUUCGIM3ICDGJ0W5NVPLJBKA1D0HEPAEXH2CGDDZ2R&v=20161019',
		method: 'GET',
		dataType:'json',
		data: {
			intent:'browse',
			radius:1000,
			categoryId:userInputObject.categoryId,
			limit: 20,
			ll:userInputObject.ll,
		}
		// data property that will take key value pairs and add them as a query string to our url
	})
	.done(function(foodResults) {
		var foodVenues=foodResults.response.venues;
		console.log(foodVenues);
		for (var i= 0; i < foodVenues.length; i ++) {
			app.foodName= foodVenues[i].name;
			var foodAddressLat= foodVenues[i].location.lat;
			var foodAddressLng= foodVenues[i].location.lng;
			app.foodAddress = foodVenues[i].location.address;
			app.displayLocations(foodAddressLat,foodAddressLng);
		}
	})
};

// Display food locations
app.displayLocations = function(lat,lng) {
	// Define a custom marker for the food joints
	var foodIcon = L.icon({
		iconUrl: 'images/foodmarker.png',
		iconSize: [41, 56],
		iconAnchor: [20.5, 56],
		popupAnchor: [0, -55],
		shadowAnchor: [13, 41]
	});

	if (app.foodAddress === undefined) {
		L.marker([lat,lng], {icon: foodIcon,riseOnHover: true}).addTo(app.mymap).bindPopup(
			`<div class="popupContainer">
				<h3>${app.foodName}</h3>
			 </div>
			`
		).openPopup();
	} else {
		L.marker([lat,lng], {icon: foodIcon,riseOnHover: true}).addTo(app.mymap).bindPopup(
			`<div class="popupContainer">
				<h3>${app.foodName}</h3>
				<div>
					<h3>${app.foodAddress}</h3>
				</div>
			 </div>
			`
		).openPopup();
	}
};

// initialize method 
app.init= function() {
	// Hide everything but header
	$('.results').hide();
	$('.foodSection').hide();
	$('.theaterSection').hide();
	$('.citySection').hide();
	$('footer').hide();

	// When begin is pressed show city search
	$('button.begin').on('click', function(){
		$('header').hide();
		$('.svgContainer').slideUp();
		$('.citySection').show();
	});

	// When try again button is pressed go back to the start
	$('button.tryAgain').on('click', function(){
		location.reload();
	});

	$('.foodForm .flexParent div').on('click', function(){
		$('.foodForm .flexParent div').removeClass('jsSelectedFood');
		$(this).addClass('jsSelectedFood');
	});

};

// when the page loads start the app
$(function(){
	app.init();
});