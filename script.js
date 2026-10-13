
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
        let coordinates = [geoData.results[0].latitude, geoData.results[0].longitude];
        return coordinates;
    }

    catch(error){
        console.log(error.message);
    }
}


// asynchronous function for getting the weather from latitude and longitude
async function getWeather(latitude, longitude){

    let weatherAPI = "https://api.open-meteo.com/v1/forecast?";
    let weatherURL = weatherAPI.concat(
                        "latitude=", latitude,
                        "&longitude=", longitude,
                        "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m",
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




// function call on the form submission
let searchForm = document.querySelector("#searchForm");

searchForm.addEventListener("submit", async function(event){
    event.preventDefault();    // prevent browser's default auto refresh

    const [latitude, longitude] = await getGeoCode();
    getWeather(latitude, longitude);

});
