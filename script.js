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


async function  getGeoCode(){

    // combine input with the api to build desired URL
    let userInput = document.querySelector("#cityInput").value;
    let geoAPI = "https://geocoding-api.open-meteo.com/v1/search?name=".concat(userInput);
    
    let geoResponse = await fetch(geoAPI);

    // throw desired error for the failed responses
    if(!geoResponse.ok){
        throw new Error (`Something went wrong: ${geoResponse.status}`);
    }


    // convert fetched data to usable format
    let geoData = await geoResponse.json();

    if(geoData.results === undefined){
        throw new Error("City not found");
    }


    // get the latitude and longitude for the use of location
    const location = geoData.results[0];
    return {
        latitude: location.latitude,
        longitude: location.longitude,
        cityName: location.name,
        country: location.country
    };
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

    let weatherResponse = await fetch(weatherURL);

    // throw desired error for the failed responses
    if(!weatherResponse.ok){
        throw new Error (`Something went wrong: ${weatherResponse.status}`);
    }


    let weatherData = await weatherResponse.json();
    return weatherData;

}




// function for extracting weather information and display it
function displayWeather(data, location){

    // getting the weather data needed
    let feelsLikeTemp = data.current.apparent_temperature;
    let temperature = data.current.temperature_2m;
    let humididty = data.current.relative_humidity_2m;
    let windSpeed = data.current.wind_speed_10m;
    let pressure = data.current.pressure_msl;
    let cityName = location.cityName;
    let countryName = location.country;

    // targeting elements to be changed 
    let feelsLikeElement = document.querySelector("#feelsLike");
    let tempElement = document.querySelector("#temperature");
    let humidityElement = document.querySelector("#humidity");
    let windSpeedElement = document.querySelector("#windSpeed");
    let pressureElement = document.querySelector("#pressure");
    let cityElement = document.querySelector("#cityName");


    // assign them respective values
    feelsLikeElement.textContent = feelsLikeTemp;
    tempElement.textContent = temperature;
    humidityElement.textContent = humididty;
    windSpeedElement.textContent = windSpeed;
    pressureElement.textContent = pressure;
    cityElement.textContent = `${cityName}, ${countryName}`;

    // Get current weather condition
    const code = data.current.weather_code;

    const weatherInfo = weatherConditions[code] || {
        icon: "fa-cloud",
        description: "Unknown conditions"
    };

    // Update main card's description
    document.querySelector("#weatherCondition").textContent =
        weatherInfo.description;

    // Update main card's icon
    document.querySelector("#weatherIcon i").className =
        `fa-solid ${weatherInfo.icon}`;
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


    // getting the icon and description as according to the weathger code, to be displayed in the card
    let weatherInfo;
    weatherCodes.forEach( code => {
        weatherInfo = weatherConditions[code];
    });


    // running an iterator to display the extracted values from the data into the weather cards
    let cards = document.querySelectorAll(".forecast-day");

    cards.forEach((card, index) => {
        const maxTemp = maxWeatherArray[index];
        const minTemp = minWeatherArray[index];
        const nextDay = nextDays[index];
        const code = weatherCodes[index];

        // Find the matching icon and description
        const weatherInfo = weatherConditions[code] || {
            icon: "fa-cloud",
            description: "Unknown conditions"
        };

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
let searchForm = document.querySelector("#searchForm");
let message = document.getElementById("message");
searchForm.addEventListener("submit", async function(event){
    event.preventDefault();    // prevent browser's default auto refresh


    try{
        const geoInfo = await getGeoCode();
        let weather = await getWeather(geoInfo);

        displayWeather(weather, geoInfo);
        displayPrediction(weather);
    }
    catch(error){

        if (error instanceof TypeError) {
            message.textContent =
                "Network error. Please check your internet connection.";
        } else {
            message.textContent = error.message;
        }
    }
});
