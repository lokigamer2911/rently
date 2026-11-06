import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Free tile layers (no API key required)
const OSM_STREET_URL = 'https://{s}.tile.openstreetmap.org/{z}/{y}/{x}';
const ESRI_SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export default function MapView({ listings = [], height = 400, center = [20.5937, 78.9629], zoom = 5 }) {
  // SSR guard — return placeholder on server to avoid window reference
  if (typeof window === 'undefined') {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100" style={{ height }}>
        <span className="text-slate-400 text-sm">Map loading…</span>
      </div>
    );
  }

  const [mapType, setMapType] = useState('street'); // 'street' | 'satellite'
  const [provider, setProvider] = useState('leaflet'); // 'leaflet' | 'google'
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  // Load Google Maps script dynamically if API key exists (client-side only)
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (apiKey && apiKey !== 'your_api_key_here' && apiKey !== '' && !window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => setGoogleMapsLoaded(true);
      script.onerror = () => console.warn('Google Maps failed to load — using Leaflet fallback');
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div className="rounded-[1.2rem] overflow-hidden border border-slate-200 shadow-sm h-full flex flex-col" style={{ height }}>
      {/* Provider + Map Type Toggle */}
      <div className="flex justify-end gap-2 px-2 py-1 bg-white/90 backdrop-blur z-10">
        {/* Map Type: Street / Satellite */}
        <button
          onClick={() => setMapType('street')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mapType === 'street'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
          aria-label="Street view"
        >
          🗺️ Street
        </button>
        <button
          onClick={() => setMapType('satellite')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            mapType === 'satellite'
              ? 'bg-brand-600 text-white shadow-sm'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
          aria-label="Satellite view"
        >
          🛰️ Satellite
        </button>

        {/* Provider Toggle: Leaflet / Google */}
        {googleMapsLoaded && (
          <button
            onClick={() => setProvider((p) => (p === 'leaflet' ? 'google' : 'leaflet'))}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              provider === 'google'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
            aria-label="Switch map provider"
          >
            {provider === 'google' ? 'Leaflet' : 'Google Maps'}
          </button>
        )}
      </div>

      {/* Map Container */}
      <div className="flex-1 w-full h-full relative">
        {provider === 'google' && googleMapsLoaded && typeof window !== 'undefined' && window.google ? (
          <GoogleMapContainer
            listings={listings}
            center={center}
            zoom={zoom}
            mapType={mapType}
            style={{ height: '100%', width: '100%' }}
          />
        ) : (
          <LeafletMapContainer
            listings={listings}
            center={center}
            zoom={zoom}
            mapType={mapType}
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </div>

      {/* Fallback notice if no maps available */}
      {!googleMapsLoaded && provider === 'google' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-white/90 backdrop-blur z-20">
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-3">
            ⚠️
          </div>
          <h3 className="font-bold text-slate-900 mb-2">Google Maps not configured</h3>
          <p className="text-sm text-slate-600 text-center max-w-xs">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable Google Maps. Currently using free OpenStreetMap.
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Leaflet Implementation ── */
function LeafletMapContainer({ listings, center, zoom, mapType, style }) {
  const STREET_URL = 'https://{s}.tile.openstreetmap.org/{z}/{y}/{x}';
  const SATELLITE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

  return (
    <MapContainer center={center} zoom={zoom} style={style} zoomControl={true}>
      {mapType === 'street' ? (
        <TileLayer attribution='&copy; OpenStreetMap contributors' url={OSM_STREET_URL} />
      ) : (
        <TileLayer attribution='&copy; Esri, Maxar' url={SATELLITE_URL} />
      )}
      {listings.map((listing) => (
        <Marker key={listing.id} position={[listing.lat, listing.lng]}>
          <Popup>
            <div className="p-2">
              <h3 className="font-bold text-slate-900">{listing.title}</h3>
              <p className="text-sm text-slate-600">Rs {(listing.pricePerDay / 100).toFixed(0)}/day</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

/* ── Google Maps Implementation (ready when API key is added) ── */
function GoogleMapContainer({ listings, center, zoom, mapType, style }) {
  const mapRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!window.google || !mapRef.current) return;

    const mapTypeId = mapType === 'satellite' ? 'satellite' : 'roadmap';
    new window.google.maps.Map(mapRef.current, {
      center: { lat: center[0], lng: center[1] },
      zoom,
      mapTypeId,
      styles: [
        {
          featureType: 'poi.business',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#243c2d' }],
        },
      ],
    });

    listings.forEach((listing) => {
      new window.google.maps.Marker({
        position: { lat: listing.lat, lng: listing.lng },
        map: mapRef.current,
        title: listing.title,
      });
    });
  }, [listings, center, zoom, mapType]);

  return <div ref={mapRef} style={style} />;
}
