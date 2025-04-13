// Формула Хаверсина
const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 1000);
  };

// Радиусы для объектов
const categoriesRadius = {
    shops: 500,
    pharmacies: 600,
    transport_nodes: 700,
    clinics: 2000,
    malls: 3000,
    parks: 1500,
    banks: 1000,
    kindergartens: 1000,
    schools: 1500,
  };
  
// Категории инфраструктуры и запросы для их поиска
const infrastructureCategories = [
    {
      key: "shops",
      radius: categoriesRadius.shops,
      query: (lat, lng, radius) => `
        node["shop"~"supermarket|convenience"](around:${radius}, ${lat}, ${lng});
        way["shop"~"supermarket|convenience"](around:${radius}, ${lat}, ${lng});
        relation["shop"~"supermarket|convenience"](around:${radius}, ${lat}, ${lng});
      `,
      areaQuery: (bbox) => `
        node["shop"~"supermarket|convenience"](${bbox});
        way["shop"~"supermarket|convenience"](${bbox});
        relation["shop"~"supermarket|convenience"](${bbox});
      `,
      parser: (elements, lat, lng) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Магазин",
        hours: el.tags.opening_hours || "Нет информации",
        distance: getDistance(lat, lng, el.lat, el.lon),
      })),
      areaParser: (elements) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Магазин",
        hours: el.tags.opening_hours || "Нет информации",
      })),
    },
    {
      key: "pharmacies",
      radius: categoriesRadius.pharmacies,
      query: (lat, lng, radius) => `
        node["amenity"="pharmacy"](around:${radius}, ${lat}, ${lng});
      `,
      areaQuery: (bbox) => `
        node["amenity"="pharmacy"](${bbox});
      `,
      parser: (elements, lat, lng) => elements.map(el => ({
        id: el.id,
        lat: el.lat,
        lon: el.lon,
        name: el.tags.name || "Аптека",
        hours: el.tags.opening_hours || "Нет информации",
        distance: getDistance(lat, lng, el.lat, el.lon),
      })),
      areaParser: (elements) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Аптека",
        hours: el.tags.opening_hours || "Нет информации",
      })),
    },
    {
      key: "transport",
      radius: categoriesRadius.transport_nodes,
      query: (lat, lng, radius) => `
        node["public_transport"="stop_position"](around:${radius}, ${lat}, ${lng});
      `,
      areaQuery: (bbox) => `
        node["public_transport"="stop_position"](${bbox});
      `,
      parser: (elements, lat, lng) => elements.map(el => ({
        id: el.id,
        lat: el.lat,
        lon: el.lon,
        name: el.tags.name || "Остановка",
        distance: getDistance(lat, lng, el.lat, el.lon),
      })),
      areaParser: (elements) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Остановка",
      })),
    },
    {
      key: "clinics",
      radius: categoriesRadius.clinics,
      query: (lat, lng, radius) => `
        node["amenity"~"clinic|hospital"](around:${radius}, ${lat}, ${lng});
      `,
      areaQuery: (bbox) => `
        node["amenity"~"clinic|hospital"](${bbox});
      `,
      parser: (elements, lat, lng) => elements.map(el => ({
        id: el.id,
        lat: el.lat,
        lon: el.lon,
        name: el.tags.name || "Поликлиника",
        hours: el.tags.opening_hours || "Нет информации",
        distance: getDistance(lat, lng, el.lat, el.lon),
      })),
      areaParser: (elements) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Поликлиника",
        hours: el.tags.opening_hours || "Нет информации",
      })),
    },
    {
      key: "malls",
      radius: categoriesRadius.malls,
      query: (lat, lng, radius) => `
        node["shop"="mall"](around:${radius},${lat},${lng});
        way["shop"="mall"](around:${radius},${lat},${lng});
        relation["shop"="mall"](around:${radius},${lat},${lng});
      `,
      areaQuery: (bbox) => `
        node["shop"="mall"](${bbox});
        way["shop"="mall"](${bbox});
        relation["shop"="mall"](${bbox});
      `,
      parser: (elements, lat, lng) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Торговый центр",
        hours: el.tags.opening_hours || "Нет информации",
        distance: getDistance(lat, lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
      })),
      areaParser: (elements) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Торговый центр",
        hours: el.tags.opening_hours || "Нет информации",
      })),
    },
    {
      key: "parks",
      radius: categoriesRadius.parks,
      query: (lat, lng, radius) => `
        way["leisure"="park"](around:${radius},${lat},${lng});
        relation["leisure"="park"](around:${radius},${lat},${lng});
      `,
      areaQuery: (bbox) => `
        way["leisure"="park"](${bbox});
        relation["leisure"="park"](${bbox});
      `,
      parser: (elements, lat, lng) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Парк",
        distance: getDistance(lat, lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
      })),
      areaParser: (elements) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Парк",
      })),
    },
    {
      key: "banks",
      radius: categoriesRadius.banks,
      query: (lat, lng, radius) => `
        node["amenity"="bank"](around:${radius},${lat},${lng});
      `,
      areaQuery: (bbox) => `
        node["amenity"="bank"](${bbox});
      `,
      parser: (elements, lat, lng) => elements.map(el => ({
        id: el.id,
        lat: el.lat,
        lon: el.lon,
        name: el.tags.name || "Банк",
        hours: el.tags.opening_hours || "Нет информации",
        distance: getDistance(lat, lng, el.lat, el.lon),
      })),
      areaParser: (elements) => elements.map(el => ({
        id: el.id,
        lat: el.lat,
        lon: el.lon,
        name: el.tags.name || "Банк",
        hours: el.tags.opening_hours || "Нет информации",
      })),
    },
    {
      key: "kindergartens",
      radius: categoriesRadius.kindergartens,
      query: (lat, lng, radius) => `
        node["amenity"="kindergarten"](around:${radius},${lat},${lng});
        way["amenity"="kindergarten"](around:${radius},${lat},${lng});
        relation["amenity"="kindergarten"](around:${radius},${lat},${lng});
      `,
      areaQuery: (bbox) => `
        node["amenity"="kindergarten"](${bbox});
        way["amenity"="kindergarten"](${bbox});
        relation["amenity"="kindergarten"](${bbox});
      `,
      parser: (elements, lat, lng) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Детский сад",
        hours: el.tags.opening_hours || "Нет информации",
        distance: getDistance(lat, lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
      })),
      areaParser: (elements) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Детский сад",
        hours: el.tags.opening_hours || "Нет информации",
      })),
    },
    {
      key: "schools",
      radius: categoriesRadius.schools,
      query: (lat, lng, radius) => `
        node["amenity"="school"](around:${radius},${lat},${lng});
        way["amenity"="school"](around:${radius},${lat},${lng});
        relation["amenity"="school"](around:${radius},${lat},${lng});
      `,
      areaQuery: (bbox) => `
        node["amenity"="school"](${bbox});
        way["amenity"="school"](${bbox});
        relation["amenity"="school"](${bbox});
      `,
      parser: (elements, lat, lng) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Школа",
        hours: el.tags.opening_hours || "Нет информации",
        distance: getDistance(lat, lng, el.lat ?? el.center?.lat, el.lon ?? el.center?.lon),
      })),
      areaParser: (elements) => elements.map(el => ({
        id: el.id,
        lat: el.lat ?? el.center?.lat,
        lon: el.lon ?? el.center?.lon,
        name: el.tags.name || "Школа",
        hours: el.tags.opening_hours || "Нет информации",
      })),
    },
  ];

  export { getDistance, categoriesRadius, infrastructureCategories };