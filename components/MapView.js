import dynamic from 'next/dynamic';

// Leaflet uses 'window' which is not available during SSR
// We must load the Map component only on the client side
const MapContent = dynamic(() => import('./MapContent'), { 
  ssr: false,
  loading: () => <div className="bg-slate-100 rounded-[1.2rem] animate-pulse" style={{ height: '300px' }} />
});

export default function MapView(props) {
  return <MapContent {...props} />;
}
