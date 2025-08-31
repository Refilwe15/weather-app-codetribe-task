const apiKey = "a48bbc5ec6c9320927fdbe9bc68ed148";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";
const iframe = document.getElementById("map");

// --- Dark Mode ---
const root = document.documentElement;
const themeBtn = document.getElementById("theme-toggle");
function setTheme(theme){
  root.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
  themeBtn.querySelector("i").className = theme==="dark"?"bi bi-sun":"bi bi-moon";
}
const savedTheme = localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");
setTheme(savedTheme);
themeBtn.addEventListener("click", ()=>setTheme(root.getAttribute("data-theme")==="dark"?"light":"dark"));

// --- Notification ---
const notifyBtn = document.getElementById("notify-btn");
notifyBtn.addEventListener("click",()=>{
  if("Notification" in window){
    if(Notification.permission==="default"){
      Notification.requestPermission().then(p=>{
        if(p==="granted"){ alert("Weather notifications enabled!"); notifyBtn.style.display="none"; }
        else alert("Notifications blocked. Enable in browser settings.");
      });
    } else if(Notification.permission==="granted"){ alert("Notifications already enabled."); notifyBtn.style.display="none"; }
    else alert("Notifications blocked.");
  } else alert("Your browser does not support notifications.");
});

// --- Weather functions ---
async function checkWeather(city){
  try{
    const res = await fetch(apiUrl+city+`&appid=${apiKey}`);
    const data = await res.json();
    localStorage.setItem("lastWeather", JSON.stringify(data));
    displayInformation(data);
    getWeeklyForecast(city);
  } catch {
    const cached = localStorage.getItem("lastWeather");
    if(cached) displayInformation(JSON.parse(cached));
  }
}

async function checkWeatherByCoords(lat, lon){
  try{
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    const data = await res.json();
    localStorage.setItem("lastWeather", JSON.stringify(data));
    displayInformation(data);
    getWeeklyForecastByCoordinates(lat, lon);
    iframe.src=`https://www.google.com/maps?q=${lat},${lon}&hl=en&z=12&output=embed`;
  } catch {
    const cached = localStorage.getItem("lastWeather");
    if(cached) displayInformation(JSON.parse(cached));
  }
}

function displayInformation(data){
  document.querySelector(".city").innerText = data.name;
  document.querySelector(".temp").innerText = Math.round(data.main.temp)+"°C";
  document.querySelector(".cond").innerText = data.weather[0].main;

  const utcSeconds = data.dt + data.timezone;
  const localDate = new Date(utcSeconds*1000);
  const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const dayName = days[localDate.getUTCDay()];
  const options={day:"numeric",month:"long",year:"numeric"};
  document.querySelector(".date").innerText=`${dayName}, ${localDate.toLocaleDateString("en-ZA",options)}`;
  document.querySelector(".time").innerText=localDate.toLocaleTimeString("en-ZA",{hour:"2-digit",minute:"2-digit",hour12:true});

  const weatherIcon = document.getElementById("weather-icon");
  const iconMap={Clear:"assets/clear.png", Clouds:"assets/clouds.png", Rain:"assets/rain.png", Snow:"assets/snow.png", Drizzle:"assets/drizzle.png", Mist:"assets/mist.png", Thunderstorm:"assets/thunder.png"};
  weatherIcon.src=iconMap[data.weather[0].main]||"assets/clear.png";

  document.getElementById("wind").innerText=data.wind.speed+" m/s";
  document.getElementById("humidity").innerText=data.main.humidity+"%";
  document.getElementById("visibility").innerText=(data.visibility/1000)+" km";
  document.getElementById("pressure").innerText=data.main.pressure+" hPa";
  const sunriseDate = new Date((data.sys.sunrise+data.timezone)*1000);
  document.getElementById("sunrise").innerText=sunriseDate.toLocaleTimeString("ZA",{hour:"2-digit",minute:"2-digit",hour12:true});
  document.getElementById("uv").innerText="N/A";

  checkForHazardousWeather(data);
}

// --- Forecast functions ---
async function getWeeklyForecast(city){
  try{
    const res=await fetch(forecastUrl+city+`&appid=${apiKey}`);
    const data=await res.json();
    localStorage.setItem("lastForecast",JSON.stringify(data));
    updateWeeklyForecastUI(data);
  } catch {
    const cached=localStorage.getItem("lastForecast");
    if(cached) updateWeeklyForecastUI(JSON.parse(cached));
  }
}

async function getWeeklyForecastByCoordinates(lat,lon){
  try{
    const res=await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
    const data=await res.json();
    localStorage.setItem("lastForecast",JSON.stringify(data));
    updateWeeklyForecastUI(data);
  } catch {
    const cached=localStorage.getItem("lastForecast");
    if(cached) updateWeeklyForecastUI(JSON.parse(cached));
  }
}

function updateWeeklyForecastUI(data){
  const container=document.querySelector(".cards-container");
  container.innerHTML="";
  const dailyForecasts={};
  data.list.forEach(item=>{ if(item.dt_txt.includes("12:00:00")){ const d=new Date(item.dt*1000); dailyForecasts[d.toLocaleDateString("en-US",{weekday:"long"})]=item; } });
  Object.keys(dailyForecasts).slice(0,7).forEach(day=>{
    const f=dailyForecasts[day]; const temp=Math.round(f.main.temp)+"°C"; let icon="bi bi-cloud-sun";
    if(f.weather[0].main==="Clouds") icon="bi bi-clouds";
    if(f.weather[0].main==="Clear") icon="bi bi-brightness-high";
    if(f.weather[0].main==="Rain") icon="bi bi-cloud-rain";
    if(f.weather[0].main==="Snow") icon="bi bi-snow";
    const card=document.createElement("div"); card.classList.add("today-cards");
    card.innerHTML=`<p>${day}</p><i class="${icon}"></i><p>${temp}</p>`;
    container.appendChild(card);
  });
}

// --- Search ---
document.querySelector(".input-group .btn").addEventListener("click",()=>checkWeather(document.querySelector(".input-group .form-control").value));
document.querySelector(".input-group .form-control").addEventListener("keypress",e=>{if(e.key==="Enter") checkWeather(e.target.value);});

// --- Current location ---
function getCurrentLocationWeather(){
  if(navigator.geolocation){ navigator.geolocation.getCurrentPosition(pos=>checkWeatherByCoords(pos.coords.latitude,pos.coords.longitude),()=>alert("Enable location.")); }
  else alert("Geolocation not supported.");
}
window.onload=getCurrentLocationWeather;

// --- Notifications ---
function pushWeatherNotification(condition, city){ if(Notification.permission==="granted") new Notification(`Weather Alert in ${city}`,{body:`Alert: ${condition} expected!`,icon:"/assets/alert.png"});}
function checkForHazardousWeather(data){const h=["Thunderstorm","Rain","Snow","Extreme","Tornado","Drizzle"]; if(h.includes(data.weather[0].main)) pushWeatherNotification(data.weather[0].main,data.name);}
