import { Router } from 'express';
import { readFile, writeFile } from 'node:fs/promises';

const router = Router();
const storagePath = new URL('./storage.json', import.meta.url);
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

interface ConsultationRecord {
  id: number;
  symptoms: string;
  createdAt: string;
}

interface VideoSessionRecord {
  id: number;
  sessionUrl: string;
  createdAt: string;
}

interface DoctorNotificationRecord {
  id: number;
  title: string;
  message: string;
  createdAt: string;
}

interface StorageData {
  consultationCount: number;
  videoSessionCount: number;
  consultationRecords: ConsultationRecord[];
  videoSessionRecords: VideoSessionRecord[];
  doctorNotifications: DoctorNotificationRecord[];
}

const defaultStorage: StorageData = {
  consultationCount: 0,
  videoSessionCount: 0,
  consultationRecords: [],
  videoSessionRecords: [],
  doctorNotifications: []
};

let storage: StorageData = { ...defaultStorage };

const loadStorage = async () => {
  try {
    const raw = await readFile(storagePath, 'utf8');
    storage = JSON.parse(raw) as StorageData;
  } catch (error) {
    storage = { ...defaultStorage };
    await writeFile(storagePath, JSON.stringify(storage, null, 2), 'utf8');
  }
};

const saveStorage = async () => {
  await writeFile(storagePath, JSON.stringify(storage, null, 2), 'utf8');
};

const cityConfig = {
  kigali: { lat: -1.9441, lon: 30.0619 },
  huye: { lat: -2.6092, lon: 29.7390 },
  musanze: { lat: -1.5094, lon: 29.6270 },
  rubavu: { lat: -1.7436, lon: 29.2569 },
  butare: { lat: -2.5901, lon: 29.7410 }
};

const stubCityRisk = {
  kigali: {
    level: 'Moderate',
    details: 'Humidity and pollution may increase asthma risk.',
    temperature: '26°C',
    humidity: '68%',
    condition: 'Clouds',
    aqi: 95,
    pollen: 'Moderate',
    trigger: 'Humidity and pollen',
    riskScore: 56
  },
  huye: {
    level: 'High',
    details: 'Thicker air and variable weather may trigger symptoms.',
    temperature: '28°C',
    humidity: '72%',
    condition: 'Rain',
    aqi: 120,
    pollen: 'High',
    trigger: 'Humidity and pollen',
    riskScore: 74
  },
  musanze: {
    level: 'Low',
    details: 'Cooler mountain air with lower humidity.',
    temperature: '19°C',
    humidity: '52%',
    condition: 'Clear',
    aqi: 45,
    pollen: 'Low',
    trigger: 'Cool air',
    riskScore: 28
  },
  rubavu: {
    level: 'Moderate',
    details: 'Lakeside humidity can worsen airway sensitivity.',
    temperature: '24°C',
    humidity: '70%',
    condition: 'Mist',
    aqi: 88,
    pollen: 'Moderate',
    trigger: 'Humidity',
    riskScore: 52
  },
  butare: {
    level: 'Moderate',
    details: 'Cooler Butare weather with moderate humidity.',
    temperature: '22°C',
    humidity: '65%',
    condition: 'Clouds',
    aqi: 82,
    pollen: 'Moderate',
    trigger: 'Humidity',
    riskScore: 58
  }
};

const calculateMlRiskScore = (weather: any) => {
  const temp = weather.main?.temp ?? 0;
  const humidity = weather.main?.humidity ?? 0;
  const condition = weather.weather?.[0]?.main ?? 'Clear';

  const tempScore = Math.min(40, Math.max(0, ((temp - 18) / 12) * 40));
  const humidityScore = Math.min(35, Math.max(0, ((humidity - 40) / 40) * 35));
  const conditionScore = ['Smoke', 'Dust', 'Sand', 'Ash', 'Thunderstorm', 'Squall', 'Tornado'].includes(condition)
    ? 15
    : ['Rain', 'Drizzle', 'Snow', 'Mist', 'Haze', 'Fog'].includes(condition)
    ? 8
    : 3;

  return Math.round(tempScore + humidityScore + conditionScore);
};

const getRiskLevel = (weather: any) => {
  const temp = weather.main?.temp ?? 0;
  const humidity = weather.main?.humidity ?? 0;
  const condition = weather.weather?.[0]?.main ?? 'Clear';
  const riskScore = calculateMlRiskScore(weather);
  let level = 'Low';
  let details = `Current temperature is ${temp}°C with ${humidity}% humidity.`;

  if (riskScore >= 70) {
    level = 'High';
    details += ' Conditions are unfavorable for asthma and risk is elevated.';
  } else if (riskScore >= 45) {
    level = 'Moderate';
    details += ' Monitor symptoms carefully and avoid triggers.';
  } else {
    details += ' Conditions are generally safer, but continue preventive care.';
  }

  const aqi = level === 'High' ? 140 : level === 'Moderate' ? 90 : 45;
  const pollen = ['Smoke', 'Dust', 'Sand', 'Ash', 'Thunderstorm', 'Squall', 'Tornado'].includes(condition) || level === 'High'
    ? 'High'
    : ['Drizzle', 'Rain', 'Snow', 'Mist', 'Haze', 'Fog'].includes(condition)
    ? 'Low'
    : 'Moderate';
  const trigger = ['Smoke', 'Dust', 'Sand', 'Ash', 'Thunderstorm', 'Squall', 'Tornado'].includes(condition)
    ? condition
    : humidity >= 65
    ? 'Humidity'
    : 'Temperature';

  return {
    level,
    details,
    temperature: `${temp}°C`,
    humidity: `${humidity}%`,
    condition,
    aqi,
    pollen,
    trigger,
    riskScore
  };
};

const fetchCityRisk = async (city: string, lat: number, lon: number) => {
  if (!OPENWEATHER_API_KEY) {
    return stubCityRisk[city as keyof typeof stubCityRisk];
  }

  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWEATHER_API_KEY}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error for ${city}: ${response.statusText}`);
  }

  const data = await response.json();
  return getRiskLevel(data);
};

router.get('/weather/risk', async (req, res) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lon = parseFloat(req.query.lon as string);
    const entries = await Promise.all(
      Object.entries(cityConfig).map(async ([city, coord]) => {
        const risk = await fetchCityRisk(city, coord.lat, coord.lon);
        return [city, risk] as const;
      })
    );

    const cities = Object.fromEntries(entries);

    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      const locationRisk = await fetchCityRisk('currentLocation', lat, lon);
      return res.json({ cities, location: locationRisk });
    }

    res.json({ cities });
  } catch (error) {
    console.error('Weather risk fetch failed:', error);
    res.json({ cities: stubCityRisk, location: stubCityRisk.kigali });
  }
});

router.get('/weather/butare', async (req, res) => {
  try {
    const coord = cityConfig.butare;
    const butareRisk = await fetchCityRisk('butare', coord.lat, coord.lon);
    res.json({ butare: butareRisk });
  } catch (error) {
    console.error('Butare weather fetch failed:', error);
    res.json({ butare: stubCityRisk.butare });
  }
});

router.get('/doctor/notifications', async (req, res) => {
  await loadStorage();
  res.json({ notifications: storage.doctorNotifications.slice(0, 10) });
});

export default router;
