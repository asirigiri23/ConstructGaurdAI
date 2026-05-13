export default function WeatherWidget({ weather }) {
  return (
    <div className="card weather-card">
      <p className="eyebrow">Weather Context</p>
      <h2>Site conditions</h2>
      {!weather ? (
        <p>Weather appears after analysis or when the backend weather endpoint is reachable.</p>
      ) : (
        <div className="weather-grid">
          <div><strong>{weather.temperature_2m ?? '--'}°F</strong><span>Temperature</span></div>
          <div><strong>{weather.wind_speed_10m ?? '--'} mph</strong><span>Wind</span></div>
          <div><strong>{weather.wind_gusts_10m ?? '--'} mph</strong><span>Gusts</span></div>
          <div><strong>{weather.relative_humidity_2m ?? '--'}%</strong><span>Humidity</span></div>
        </div>
      )}
    </div>
  );
}
