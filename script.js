const apiGatewayUrl = "http://localhost:3000";
const openWeatherApiKey = "243eb7f11f1cb24b9bb062aa813a01f9"; // Replace with your API key

// 🔍 Autocomplete City Names
document.getElementById("city").addEventListener("input", async (e) => {
  const query = e.target.value.trim();
  if (query.length < 3) return;

  try {
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        query
      )}&limit=10&appid=${openWeatherApiKey}`
    );
    const cities = await res.json();

    const dataList = document.getElementById("citySuggestions");
    dataList.innerHTML = "";

    cities.forEach((city) => {
      const name = city.name;
      const state = city.state || "";
      const country = city.country || "";
      const label = `${name}${state ? ", " + state : ""}${
        country ? ", " + country : ""
      }`;
      const option = document.createElement("option");
      option.value = label;
      dataList.appendChild(option);
    });
  } catch (error) {
    console.error("Autocomplete Error:", error);
  }
});

// 🌦️ Weather & Forecast Fetching
document.getElementById("getWeatherBtn").addEventListener("click", async () => {
  const city = document.getElementById("city").value.trim();
  const resultDiv = document.getElementById("result");
  resultDiv.innerHTML = "Loading...";

  if (!city) {
    resultDiv.innerHTML = "Please enter a city name.";
    return;
  }

  try {
    // Get location from API Gateway
    const locRes = await fetch(
      `${apiGatewayUrl}/location?city=${encodeURIComponent(city)}`
    );
    if (!locRes.ok) throw new Error("Location service error");
    const locData = await locRes.json();

    const lat = locData.latitude;
    const lon = locData.longitude;

    // Get weather from API Gateway
    const weatherRes = await fetch(
      `${apiGatewayUrl}/weather?lat=${lat}&lon=${lon}`
    );
    if (!weatherRes.ok) throw new Error("Weather service error");
    const weather = await weatherRes.json();

    // Parse numeric temperature from string (e.g., "17.43°C")
    const tempNum = parseFloat(weather.temperature);

    // Get forecast from API Gateway via POST with correct body structure
    const forecastRes = await fetch(`${apiGatewayUrl}/forecast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentData: { temperature: tempNum } }),
    });
    if (!forecastRes.ok) throw new Error("Forecast service error");
    const forecast = await forecastRes.json();

    // Display results
    resultDiv.innerHTML = `
      <h3>Results for ${city}</h3>
      <p><strong>Location:</strong> Latitude ${lat}, Longitude ${lon}</p>
      <p><strong>Current Weather:</strong> ${weather.temperature}, Humidity: ${weather.humidity}, Condition: ${weather.condition}</p>
      <p><strong>Forecast:</strong> ${forecast.forecast}</p>
    `;
  } catch (error) {
    console.error(error);
    resultDiv.innerHTML = `<span class="error">Error: ${error.message}</span>`;
  }
});

// 💳 Payment Handler
document.getElementById("paymentForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const amount = document.getElementById("amount").value;
  const paymentResult = document.getElementById("paymentResult");
  paymentResult.innerHTML = "Processing payment...";

  try {
    const payRes = await fetch(`${apiGatewayUrl}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: "guest",
        amount: Number(amount),
        method: "UPI",
        purpose: "Weather Forecast",
      }),
    });

    if (!payRes.ok) throw new Error("Payment failed");
    const payData = await payRes.json();

    paymentResult.innerHTML = `
      <strong>${payData.status}</strong><br>${payData.message || ""}
    `;
  } catch (error) {
    console.error(error);
    paymentResult.innerHTML = `<span class="error">${error.message}</span>`;
  }
});
