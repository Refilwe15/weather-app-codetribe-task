const apiKey = "a48bbc5ec6c9320927fdbe9bc68ed148";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

const iframe = document.getElementById("map");

// checking weather by the name of the city - this is the main function
async function checkWeather(city) {
  const response = await fetch(apiUrl + city + `&appid=${apiKey}`);
  let data = await response.json();
  displayInformation(data);
    
  // fetch weekly forecast
  getWeeklyForecast(city);
}

// Function to check weather by coordinates
async function checkWeatherByCoords(lat, lon) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
  );
  let data = await response.json();
  displayInformation(data);
  
  iframe.src = `https://www.google.com/maps?q=${lat},${lon}&hl=en&z=12&output=embed`;

  // fetch weekly forecast by coords
  getWeeklyForecastByCoordinates(lat, lon);
}

// ui update function
function displayInformation(data) {
  //console.log(data);

  // Update City & Temp
  document.querySelector(".city").innerHTML = data.name;
  document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°C";


  const utcSeconds = data.dt + data.timezone;
  const localDate = new Date(utcSeconds * 1000);

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayName = days[localDate.getUTCDay()];

  const options = { day: "numeric", month: "long", year: "numeric" };
  const formattedDate = localDate.toLocaleDateString("en-GB", options);

  const formattedTime = localDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  document.querySelector(".date").innerHTML = `${dayName}, ${formattedDate}`;
  document.querySelector(".time").innerHTML = formattedTime;

  // --- Update Weather Icon ---
  const weatherIcon = document.getElementById("weather-icon");
  if (data.weather[0].main === "Clouds") {
    weatherIcon.src = "assets/clouds.png";
  } else if (data.weather[0].main === "Clear") {
    weatherIcon.src = "assets/clear.png";
  } else if (data.weather[0].main === "Rain") {
    weatherIcon.src = "assets/rain.png";
  } else if (data.weather[0].main === "Mist") {
    weatherIcon.src = "assets/mist.png";
  } else {
    weatherIcon.src = "assets/drizzle.png";
  }

  // --- Update Highlights ---
  document.getElementById("wind").innerText = data.wind.speed + " m/s";
  document.getElementById("humidity").innerText = data.main.humidity + "%";
  document.getElementById("visibility").innerText = (data.visibility / 1000) + " km";
  document.getElementById("pressure").innerText = data.main.pressure + " hPa";

  const sunriseDate = new Date((data.sys.sunrise + data.timezone) * 1000);
  const sunriseTime = sunriseDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  document.getElementById("sunrise").innerText = sunriseTime;

  // UV Index requires a different endpoint - placeholder for now
  document.getElementById("uv").innerText = "N/A";
}

// Weekly Forecast
async function getWeeklyForecast(city) {
  const response = await fetch(forecastUrl + city + `&appid=${apiKey}`);
  const data = await response.json();
  updateWeeklyForecastUI(data);
}

async function getWeeklyForecastByCoordinates(lat, lon) {
  const response = await fetch(
    `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`
  );
  const data = await response.json();
  updateWeeklyForecastUI(data);
  iframe.src = `https://www.google.com/maps?q=${lat},${lon}&hl=en&z=12&output=embed`;
}

function updateWeeklyForecastUI(data) {
  const cardsContainer = document.querySelector(".cards-container");
  cardsContainer.innerHTML = ""; // clear old

  // Get forecast at 12:00 each day
  const dailyForecasts = {};
  data.list.forEach((item) => {
    if (item.dt_txt.includes("12:00:00")) {
      const date = new Date(item.dt * 1000);
      const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
      dailyForecasts[dayName] = item;
    }
  });

  // Show up to 7 days
  Object.keys(dailyForecasts).slice(0, 7).forEach((day) => {
    const forecast = dailyForecasts[day];
    const temp = Math.round(forecast.main.temp) + "°C";
    const weather = forecast.weather[0].main;

    // pick icon
    let icon = "bi bi-cloud-sun";
    if (weather === "Clouds") icon = "bi bi-clouds";
    if (weather === "Clear") icon = "bi bi-brightness-high";
    if (weather === "Rain") icon = "bi bi-cloud-rain";
    if (weather === "Snow") icon = "bi bi-snow";

    // build card
    const card = document.createElement("div");
    card.classList.add("today-cards");
    card.innerHTML = `
      <p>${day}</p>
      <i class="${icon}"></i>
      <p>${temp}</p>
    `;
    cardsContainer.appendChild(card);
  });
}

// Event Listeners for search
const searchBox = document.querySelector(".input-group .form-control");
const searchBtn = document.querySelector(".input-group .btn");

searchBtn.addEventListener("click", () => {
  checkWeather(searchBox.value);
});

searchBox.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    checkWeather(searchBox.value);
  }
});

// Get Current Location Weather
function getCurrentLocationWeather() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        let lat = position.coords.latitude;
        let lon = position.coords.longitude;
        checkWeatherByCoords(lat, lon);
        iframe.src = `https://www.google.com/maps?q=${lat},${lon}&hl=en&z=12&output=embed`;
      },
      (error) => {
        alert("Unable to retrieve location. Please allow location access.");
        console.error(error);
      }
    );
  } else {
    alert("Geolocation is not supported by this browser.");
  }
}

// Automatically load current location on startup
window.onload = getCurrentLocationWeather;
