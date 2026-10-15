
async function  getGeoCode(){

    // combine input with the api to build desired URL
    let userInput = document.querySelector("#cityInput").value;
    let geoAPI = "https://geocoding-api.open-meteo.com/v1/search?name=".concat(userInput);
    try{

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

    catch(error){
        console.log(error.message);
    }
}


// asynchronous function for getting the weather from latitude and longitude
async function getWeather(info){

    let latitude = info.latitude;
    let longitude = info.longitude;
    let weatherAPI = "https://api.open-meteo.com/v1/forecast?";
    let weatherURL = weatherAPI.concat(
                        "latitude=", latitude,
                        "&longitude=", longitude,
                        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,pressure_msl",
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
}


// function call on the form submission
let searchForm = document.querySelector("#searchForm");

searchForm.addEventListener("submit", async function(event){
    event.preventDefault();    // prevent browser's default auto refresh

    const geoInfo = await getGeoCode();
    let weather = await getWeather(geoInfo);

    displayWeather(weather, geoInfo);
});
