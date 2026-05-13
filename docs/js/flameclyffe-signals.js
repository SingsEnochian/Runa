window.FlameclyffeSignals = (() => {
  const DEFAULT_TARGET = { label: 'Saint Augustine, Florida', latitude: 29.9012, longitude: -81.3124 };
  const SCHUMANN = [7.83, 14.3, 20.8, 27.3, 33.8];
  const SCHUMANN_PROXIES = [423, 772, 1123, 1474, 1825];
  const TACTILE_ANCHORS = [27, 54, 108];

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const fmt = (value, digits = 1) => value == null || Number.isNaN(Number(value)) ? 'n/a' : Number(value).toFixed(digits);

  async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) throw new Error(url);
    return response.json();
  }

  function latestTableRow(data) {
    if (!Array.isArray(data) || !Array.isArray(data[0])) return null;
    const headers = data[0].map((item) => String(item).toLowerCase());
    for (let index = data.length - 1; index > 0; index -= 1) {
      const row = data[index];
      if (Array.isArray(row) && row.some((value) => value !== null && value !== '')) {
        const out = {};
        headers.forEach((header, col) => { out[header] = row[col]; });
        return out;
      }
    }
    return null;
  }

  function pickNumber(row, parts) {
    if (!row) return null;
    const key = Object.keys(row).find((candidate) => parts.every((part) => candidate.includes(part)));
    return key ? Number(row[key]) : null;
  }

  function xrayFlux(data) {
    if (!Array.isArray(data)) return null;
    const rows = data.filter((row) => row && typeof row === 'object');
    const found = [...rows].reverse().find((row) => String(row.energy || '').includes('0.1-0.8')) || rows.at(-1);
    return found ? Number(found.flux) : null;
  }

  function flareClassFactor(value) {
    const text = String(value || '').toUpperCase();
    const number = parseFloat(text.slice(1)) || 1;
    if (text.startsWith('X')) return clamp(0.9 + number * 0.04, 0, 1.4);
    if (text.startsWith('M')) return clamp(0.65 + number * 0.025, 0, 1);
    if (text.startsWith('C')) return clamp(0.35 + number * 0.015, 0, 0.72);
    if (text.startsWith('B')) return 0.18;
    if (text.startsWith('A')) return 0.08;
    return 0;
  }

  function fluxFactor(flux) {
    return flux > 0 ? clamp((Math.log10(flux) + 8) / 4, 0, 1.25) : 0;
  }

  async function fetchSignals(target = DEFAULT_TARGET) {
    const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast');
    weatherUrl.searchParams.set('latitude', target.latitude);
    weatherUrl.searchParams.set('longitude', target.longitude);
    weatherUrl.searchParams.set('timezone', 'auto');
    weatherUrl.searchParams.set('current', 'temperature_2m,relative_humidity_2m,precipitation,cloud_cover,pressure_msl,wind_speed_10m');

    const results = await Promise.allSettled([
      fetchJson(weatherUrl),
      fetchJson('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json'),
      fetchJson('https://services.swpc.noaa.gov/products/solar-wind/plasma-5-minute.json'),
      fetchJson('https://services.swpc.noaa.gov/products/solar-wind/mag-5-minute.json'),
      fetchJson('https://services.swpc.noaa.gov/json/goes/primary/xrays-6-hour.json'),
      fetchJson('https://services.swpc.noaa.gov/json/goes/primary/xray-flares-latest.json'),
      fetchJson('https://services.swpc.noaa.gov/json/solar-radio-flux.json'),
    ]);

    const space = {};
    const weather = results[0].status === 'fulfilled' ? results[0].value.current || null : null;

    const kpRows = results[1].status === 'fulfilled' ? results[1].value : null;
    const kpRow = Array.isArray(kpRows) ? kpRows.at(-1) : null;
    if (Array.isArray(kpRow)) space.kp = Number(kpRow[1]);

    const plasma = latestTableRow(results[2].status === 'fulfilled' ? results[2].value : null);
    const magnetic = latestTableRow(results[3].status === 'fulfilled' ? results[3].value : null);
    space.speed = pickNumber(plasma, ['speed']);
    space.density = pickNumber(plasma, ['density']);
    space.bt = pickNumber(magnetic, ['bt']);
    space.bz = pickNumber(magnetic, ['bz']);
    space.xray = xrayFlux(results[4].status === 'fulfilled' ? results[4].value : null);

    const flare = results[5].status === 'fulfilled' ? results[5].value || {} : {};
    space.flare = flare.classType || flare.class_type || flare.current_class || flare.max_class || 'quiet';

    const radio = results[6].status === 'fulfilled' ? results[6].value : null;
    if (Array.isArray(radio)) {
      const last = radio.at(-1);
      space.f107 = Number(last?.flux || last?.observed_flux || last?.[1]) || null;
    }

    return { weather, space };
  }

  function modulation(state) {
    const weather = state.weather || {};
    const space = state.space || {};
    const humidity = +(weather.relative_humidity_2m ?? 68);
    const wind = +(weather.wind_speed_10m ?? 8);
    const pressure = +(weather.pressure_msl ?? 1013);
    const cloud = +(weather.cloud_cover ?? 35);
    const precip = +(weather.precipitation ?? 0);
    const kp = +(space.kp ?? 1);
    const hour = new Date().getUTCHours() + new Date().getUTCMinutes() / 60;
    const timePhase = ((hour + state.target.longitude / 15 + 24) % 24) / 24;
    const pressureTilt = clamp((pressure - 1013) / 45, -1, 1);
    const humidityTilt = clamp((humidity - 50) / 50, -1, 1);
    const windTilt = clamp(wind / 50, 0, 1);
    const stormTilt = clamp(precip / 8 + cloud / 180, 0, 1);
    const speedFactor = clamp(((space.speed || 350) - 300) / 500, 0, 1.35);
    const densityFactor = clamp((space.density || 4) / 25, 0, 1.2);
    const magFactor = clamp((space.bt || 5) / 30, 0, 1.2);
    const southFactor = clamp((-(space.bz || 0)) / 18, 0, 1.1);
    const flareFactor = clamp(fluxFactor(space.xray) + flareClassFactor(space.flare) * 0.35, 0, 1.4);

    return {
      timePhase,
      pressureTilt,
      humidityTilt,
      windTilt,
      stormTilt,
      kp,
      kpFactor: clamp(kp / 9, 0, 1),
      weatherPulse: clamp((humidityTilt + 1) * 0.25 + windTilt * 0.4 + stormTilt * 0.35, 0, 1),
      speedFactor,
      densityFactor,
      magFactor,
      southFactor,
      flareFactor,
    };
  }

  function schumannWeight(state, index, mod) {
    const lat = Math.abs(state.target.latitude) * Math.PI / 180;
    return clamp((0.55 + 0.45 * Math.abs(Math.cos(lat * (index + 1)))) * (1 + mod.humidityTilt * 0.08 + mod.pressureTilt * 0.06 - mod.stormTilt * 0.05) * (1 + mod.kpFactor * 0.16), 0.25, 1.35);
  }

  return { DEFAULT_TARGET, SCHUMANN, SCHUMANN_PROXIES, TACTILE_ANCHORS, fetchSignals, modulation, schumannWeight, fmt, clamp };
})();
