
async function  getGeoCode(event){
    event.preventDefault();   // prevent browser's default auto refresh


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
        const [latitude, longitude] = [geoData.results[0].latitude, geoData.results[0].longitude];
        return [latitude, longitude];
    }

    catch(error){
        console.log(error.message);
    }
}

// function call on the form submission
let searchForm = document.querySelector("#searchForm");
searchForm.addEventListener("submit", getGeoCode);