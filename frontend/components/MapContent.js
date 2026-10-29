import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useState, useCallback, useEffect } from 'react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '1.2rem'
};

const defaultCenter = {
  lat: 19.076,
  lng: 72.8777 // Mumbai
};

const options = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    {
      "featureType": "administrative",
      "elementType": "geometry",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "poi",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "road",
      "elementType": "labels.icon",
      "stylers": [{ "visibility": "off" }]
    },
    {
      "featureType": "transit",
      "stylers": [{ "visibility": "off" }]
    }
  ]
};

const libraries = ['places'];

export default function MapContent({ lat, lng, height = 300, onClick, listings }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const [selectedListing, setSelectedListing] = useState(null);
  const [map, setMap] = useState(null);

  const center = (listings && listings.length > 0 && listings[0].lat && listings[0].lng)
    ? { lat: listings[0].lat, lng: listings[0].lng }
    : (lat && lng ? { lat, lng } : defaultCenter);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  if (!isLoaded) return <div className="bg-slate-100 rounded-[1.2rem] animate-pulse" style={{ height }} />;

  return (
    <div style={{ height, width: '100%', borderRadius: '1.2rem', overflow: 'hidden' }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={13}
        onUnmount={onUnmount}
        options={options}
        onClick={(e) => onClick && onClick({ lat: e.latLng.lat(), lng: e.latLng.lng() })}
      >
        {listings?.map(l => l.lat && l.lng && (
          <Marker
            key={l.id}
            position={{ lat: l.lat, lng: l.lng }}
            onClick={() => setSelectedListing(l)}
          />
        ))}

        {lat && lng && !listings && (
          <Marker position={{ lat, lng }} />
        )}

        {selectedListing && (
          <InfoWindow
            position={{ lat: selectedListing.lat, lng: selectedListing.lng }}
            onCloseClick={() => setSelectedListing(null)}
          >
            <div className="w-48 text-left p-1">
              <img
                src={(Array.isArray(selectedListing.images) ? selectedListing.images[0] : JSON.parse(selectedListing.images || '[]')[0]) || 'https://via.placeholder.com/150'}
                className="w-full h-24 object-cover rounded-lg mb-2"
                alt={selectedListing.title}
              />
              <h4 className="font-bold text-slate-900 truncate">{selectedListing.title}</h4>
              <p className="text-brand-600 font-semibold text-sm mb-2">₹{selectedListing.pricePerDay} Price Per Day</p>
              <a href={`/listings/${selectedListing.id}`} className="text-xs font-bold text-white bg-slate-900 px-3 py-1.5 rounded-full block text-center no-underline hover:bg-slate-800">
                View Details
              </a>
            </div>
          </InfoWindow>
        )}
      </GoogleMap>
    </div>
  );
}
