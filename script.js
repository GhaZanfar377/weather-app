let searchForm = document.querySelector("#searchForm");
let message = document.getElementById("message");
let targetInput = document.querySelector("#cityInput");
let minSearchLength = 3;

// ticket numbers, used to ignore old (stale) answers
let latestSearchId = 0;
let latestWeatherId = 0;

const suggestionsCard = document.getElementById("locationSuggestions");

// elements of the weather cards 
const feelsLikeElement = document.querySelector("#feelsLike");
const tempElement = document.querySelector("#temperature");
const humidityElement = document.querySelector("#humidity");
const windSpeedElement = document.querySelector("#windSpeed");
const pressureElement = document.querySelector("#pressure");
const cityElement = document.querySelector("#cityName");
const conditionElement = document.querySelector("#weatherCondition");
const weatherIconElement = document.querySelector("#weatherIcon i");
const forecastCards = document.querySelectorAll(".forecast-day");


// assigning respective icons adn description to be displayed for each weather code
const weatherConditions = {
    0:  { icon: "fa-sun", description: "Clear sky" },
    1:  { icon: "fa-sun", description: "Mainly clear" },
    2:  { icon: "fa-cloud-sun", description: "Partly cloudy" },
    3:  { icon: "fa-cloud", description: "Overcast" },
    45: { icon: "fa-smog", description: "Fog" },
    48: { icon: "fa-smog", description: "Fog" },
    51: { icon: "fa-cloud-rain", description: "Light drizzle" },
    53: { icon: "fa-cloud-rain", description: "Drizzle" },
    55: { icon: "fa-cloud-rain", description: "Heavy drizzle" },
    61: { icon: "fa-cloud-rain", description: "Light rain" },
    63: { icon: "fa-cloud-showers-heavy", description: "Rain" },
    65: { icon: "fa-cloud-showers-heavy", description: "Heavy rain" },
    71: { icon: "fa-snowflake", description: "Light snow" },
    73: { icon: "fa-snowflake", description: "Snow" },
    75: { icon: "fa-snowflake", description: "Heavy snow" },
    80: { icon: "fa-cloud-showers-heavy", description: "Rain showers" },
    81: { icon: "fa-cloud-showers-heavy", description: "Rain showers" },
    82: { icon: "fa-cloud-showers-heavy", description: "Heavy showers" },
    95: { icon: "fa-cloud-bolt", description: "Thunderstorm" },
    96: { icon: "fa-cloud-bolt", description: "Thunderstorm with hail" },
    99: { icon: "fa-cloud-bolt", description: "Thunderstorm with hail" }
};


// small helper function for getting the information of weather codes
function getInformation(input){
    return weatherConditions[input] || {
        icon: "fa-cloud",
        description: "Unknown conditions"
    };
}


// shows the right error message on the page
function showError(error){
    message.textContent = error.message;
}


// fetch that gives a clear message when the network is down
async function safeFetch(url){
    try{
        return await fetch(url);
    }
    catch(error){
        throw new Error("Network error. Please check your internet connection.");
    }
}


// removes the previous error 
function removeError(){
    message.textContent = "";
}


// defuse the timer AND ignore any search already sent
function cancelPendingSearch(){
    clearTimeout(debounceTimer);
    latestSearchId++;
}


// clears everything the weather cards show (mirrors displayWeather + displayPrediction)
function resetWeather(){

    // main card
    feelsLikeElement.textContent = "";
    tempElement.textContent = "";
    humidityElement.textContent = "";
    windSpeedElement.textContent = "";
    pressureElement.textContent = "";
    cityElement.textContent = "";
    conditionElement.textContent = "";
    weatherIconElement.className = "fa-solid";

    // forecast cards
    forecastCards.forEach((card) => {
        card.querySelector(".forecast-date").textContent = "";
        card.querySelector(".forecast-max").textContent = "";
        card.querySelector(".forecast-min").textContent = "";
        card.querySelector(".forecast-condition").textContent = "";
        card.querySelector(".forecast-icon").className = "fa-solid forecast-icon";
    });
}

// the function to call to get geocode and suggest locations
async function findPlaces(city){
    const myId = ++latestSearchId;

    removeError();
    try{
        const geoInfo = await getGeoCode(city);

        // if the response is not not the newest one throw it away
        if(myId !== latestSearchId){
            return;
        }

        suggestLocations(geoInfo, findWeather);
    }
    catch(error){

        // previous error must also be cleared
        if(myId !== latestSearchId){
            return;
        }

        suggestionsCard.hidden = true;
        showError(error);
    }
}


async function findWeather(location){

    cancelPendingSearch();
    removeError();
    const myWeatherId = ++latestWeatherId;

    try{
        const weather = await getWeather(location);

        // if the response is not not the newest one throw it away
        if(myWeatherId !== latestWeatherId){
            return;
        }

        displayWeather(weather, location);
        displayPrediction(weather);
    }
    catch(error){

        // previous error must also be cleared
        if(myWeatherId !== latestWeatherId){
            return;
        }

        resetWeather();
        showError(error);
    }

}

// the mechanism of functions calling throught debouncing
let debounceTimer;

targetInput.addEventListener("input", () => {

    cancelPendingSearch();
    removeError();
    suggestionsCard.hidden = true;
    let cleanedInput = targetInput.value.trim();

    if(cleanedInput.length < minSearchLength){
        return;
    }

    debounceTimer = setTimeout(() => {
        findPlaces(cleanedInput);
    },400);
    
});

   

// draws the suggestion list, and calls onSelect(location) when the user clicks one
function suggestLocations(locations, onSelect){


    const suggestionsList = document.getElementById("suggestionsList");
    const suggestionsCount = document.getElementById("suggestionsCount");

    // Clear previous results
    suggestionsList.replaceChildren();

    // Update results count
    suggestionsCount.textContent = `${locations.length} ${
        locations.length === 1 ? "place" : "places"
    }`;

    // Create suggestion elements
    locations.forEach((location) => {
        const option = document.createElement("button");
        option.type = "button";
        option.className = "location-option";
        option.setAttribute("role", "option");

        option.innerHTML = `
            <span class="location-option-icon">
                <i class="fa-solid fa-location-dot"></i>
            </span>

            <span class="location-option-info">
                <span class="location-option-name">${location.name}</span>
                <span class="location-option-details">
                    ${[location.admin1, location.admin2, location.country]
                        .filter(Boolean)
                        .join(" · ")}
                </span>
            </span>

            <span class="location-option-arrow">
                <i class="fa-solid fa-chevron-right"></i>
            </span>
        `;

        suggestionsList.appendChild(option);

        option.addEventListener("click", () =>{
            suggestionsCard.hidden = true;
            onSelect(location);
        })
    });

    // Display the card
    suggestionsCard.hidden = false;
}



async function  getGeoCode(input){

    // combine input with the api to build desired URL
    let geoAPI = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(input)}`;
    
    let geoResponse = await safeFetch(geoAPI);

    // throw desired error for the failed responses
    if(!geoResponse.ok){
        throw new Error (`Something went wrong: ${geoResponse.status}`);
    }


    // convert fetched data to usable format
    let geoData = await geoResponse.json();

    if(!geoData.results || geoData.results.length === 0){
        throw new Error("City not found");
    }


    // get the latitude and longitude for the use of location
    const allLocations = geoData.results;
    return allLocations;
}


// asynchronous function for getting the weather from latitude and longitude
async function getWeather(info){

    if(info === undefined){
        throw new Error("City not Found");
    }

    let latitude = info.latitude;
    let longitude = info.longitude;
    let weatherAPI = "https://api.open-meteo.com/v1/forecast?";
    let weatherURL = weatherAPI.concat(
                        "latitude=", latitude,
                        "&longitude=", longitude,
                        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl,is_day",
                        "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
                        "&timezone=auto",
                        "&forecast_days=7"
                    );

    let weatherResponse = await safeFetch(weatherURL);

    // throw desired error for the failed responses
    if(!weatherResponse.ok){
        throw new Error (`Something went wrong: ${weatherResponse.status}`);
    }


    let weatherData = await weatherResponse.json();
    return weatherData;

}




// function for extracting weather information and display it
function displayWeather(data, location){

    if(data){
    
        // getting the weather data needed
        let feelsLikeTemp = data.current.apparent_temperature;
        let temperature = data.current.temperature_2m;
        let humidity = data.current.relative_humidity_2m;
        let windSpeed = data.current.wind_speed_10m;
        let pressure = data.current.pressure_msl;
        let cityName = location.name;
        let countryName = location.country;


        // assign them respective values
        feelsLikeElement.textContent = feelsLikeTemp;
        tempElement.textContent = temperature;
        humidityElement.textContent = humidity;
        windSpeedElement.textContent = windSpeed;
        pressureElement.textContent = pressure;
        cityElement.textContent = `${cityName}, ${countryName}`;

        // Get current weather condition
        const code = data.current.weather_code;

        const weatherInfo = getInformation(code);

        // Update main card's description and icon
        conditionElement.textContent = weatherInfo.description;
        weatherIconElement.className = `fa-solid ${weatherInfo.icon}`;
    }

}



// function to display prediction
function displayPrediction(data){

    // extract the needed data for prediction
    let maxWeatherArray = data.daily.temperature_2m_max.slice(1,6);
    let minWeatherArray = data.daily.temperature_2m_min.slice(1,6);
    let datesArray = data.daily.time.slice(1,6);
    let weatherCodes = data.daily.weather_code.slice(1, 6);


    // Day name of each date
    let nextDays = datesArray.map(date =>
        new Date(date + "T12:00:00").toLocaleDateString("en-US", {
            weekday: "short"
        })
    );


    // running an iterator to display the extracted values from the data into the weather cards

    forecastCards.forEach((card, index) => {
        const maxTemp = maxWeatherArray[index];
        const minTemp = minWeatherArray[index];
        const nextDay = nextDays[index];
        const code = weatherCodes[index];

        // Find the matching icon and description
        const weatherInfo = getInformation(code);

         // Put the values into the HTML
        card.querySelector(".forecast-date").textContent = nextDay;
        card.querySelector(".forecast-max").textContent = `${maxTemp}°`;
        card.querySelector(".forecast-min").textContent = `${minTemp}°`;
        card.querySelector(".forecast-condition").textContent =
            weatherInfo.description;

        // Update the icon
        const icon = card.querySelector(".forecast-icon");
        icon.className = `fa-solid ${weatherInfo.icon} forecast-icon`;
    })


}

// function call on the form submission
searchForm.addEventListener("submit", function(event){

    event.preventDefault();    // prevent browser's default auto refresh
    cancelPendingSearch();

    let cleanedInput =targetInput.value.trim();
    if(cleanedInput.length < minSearchLength){
        return;
    }

    findPlaces(cleanedInput);
});
