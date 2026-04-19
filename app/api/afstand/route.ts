export async function POST(req: Request) {
  const { adres } = await req.json();

  if (!adres) {
    return Response.json({ error: "Geen adres opgegeven" }, { status: 400 });
  }

  const geocodeUrl = `https://api.openrouteservice.org/geocode/search?api_key=${process.env.ORS_API_KEY}&text=${encodeURIComponent(adres)}&boundary.country=NL&size=1`;

  const geocodeRes = await fetch(geocodeUrl);
  const geocodeData = await geocodeRes.json();

  if (!geocodeData.features?.length) {
    return Response.json({ error: "Adres niet gevonden" }, { status: 404 });
  }

  const [clientLng, clientLat] = geocodeData.features[0].geometry.coordinates;

  const HQ_LAT = 52.03118096686153;
  const HQ_LNG = 5.601439718146923;

  const routeUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.ORS_API_KEY}&start=${HQ_LNG},${HQ_LAT}&end=${clientLng},${clientLat}`;

  const routeRes = await fetch(routeUrl);
  const routeData = await routeRes.json();

  const segment = routeData.features?.[0]?.properties?.segments?.[0];

  if (!segment) {
    return Response.json(
      { error: "Route kon niet berekend worden" },
      { status: 500 },
    );
  }

  const afstand_km = (segment.distance / 1000).toFixed(1);
  const reistijd_min = Math.round(segment.duration / 60);

  return Response.json({ afstand_km, reistijd_min });
}
