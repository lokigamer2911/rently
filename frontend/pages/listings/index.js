import { useState, useEffect, useRef } from 'react';
import { FiMapPin, FiSearch, FiSliders, FiTag, FiX, FiCheck, FiLoader } from 'react-icons/fi';
import useSWR from 'swr';
import { fetcher, api } from '../../lib/api';
import ListingCard from '../../components/ListingCard';
import TiltCard from '../../components/TiltCard';
import Button from '../../components/Button';
import MapView from '../../components/MapView';
import { useJsApiLoader } from '@react-google-maps/api';

const libraries = ['places'];

export default function Listings() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef(null);
  const isSelection = useRef(false);
  const [categoryId, setCategoryId] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minRating, setMinRating] = useState('');
  const [radius, setRadius] = useState('25');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'list' | 'map'

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries: libraries
  });

  const { data: categories } = useSWR('/categories', fetcher);
  
  const params = new URLSearchParams({
    ...(q && { q }),
    ...(city && !lat && { city }),
    ...(lat && { lat }),
    ...(lng && { lng }),
    ...(radius && { radius }),
    ...(categoryId && { categoryId }),
    ...(minPrice && { minPrice: minPrice * 100 }),
    ...(maxPrice && { maxPrice: maxPrice * 100 }),
    ...(minRating && { minRating }),
  }).toString();

  const { data } = useSWR(`/listings?${params}`, fetcher);
  const listings = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];

  const resetFilters = () => {
    setQ('');
    setCity('');
    setLat('');
    setLng('');
    setRadius('25');
    setCategoryId('');
    setMinPrice('');
    setMaxPrice('');
    setMinRating('');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (city.length < 3 || isSelection.current) {
      if (isSelection.current) isSelection.current = false;
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timer = setTimeout(async () => {
      if (!window.google) return;
      
      const service = new window.google.maps.places.AutocompleteService();
      setIsLoadingSuggestions(true);
      
      service.getPlacePredictions({ 
        input: city,
        componentRestrictions: { country: 'in' },
        types: ['(cities)']
      }, (predictions, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
          const uniqueSuggestions = predictions.map(p => ({
            display_name: p.description,
            city: p.structured_formatting.main_text,
            id: p.place_id
          }));
          setSuggestions(uniqueSuggestions);
          setShowSuggestions(true);
        } else {
          setSuggestions([]);
        }
        setIsLoadingSuggestions(false);
      });
    }, 500);

    return () => clearTimeout(timer);
  }, [city]);

  const selectSuggestion = (s) => {
    isSelection.current = true;
    setCity(s.city);
    setShowSuggestions(false);
    if (!window.google) return;
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));
    service.getDetails({ placeId: s.id, fields: ['geometry'] }, (place, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place.geometry) {
        setLat(place.geometry.location.lat());
        setLng(place.geometry.location.lng());
      }
    });
  };

  return (
    <div className="space-y-10">
      {/* Search Header */}
      <section className="hero-panel !pb-6 sm:!pb-12 !overflow-visible">
        <div className="max-w-3xl mx-auto text-center mb-6 sm:mb-10">
          <p className="eyebrow mx-auto mb-3 sm:mb-5">Premium Marketplace</p>
          <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900">
            Find gear that <span className="text-brand-600 italic">performs.</span>
          </h1>
          <p className="mt-3 sm:mt-6 text-sm sm:text-lg text-slate-500 leading-relaxed">
            Search rental items from verified local owners.
          </p>
        </div>

        <div className="max-w-4xl mx-auto surface-card !p-2 sm:!p-3 flex flex-col sm:flex-row gap-2 shadow-2xl mobile-nav-spacer">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="input !border-none !bg-transparent !pl-10 sm:!pl-12 !h-12 sm:!h-14 text-sm sm:text-lg"
              placeholder="What are you looking for?"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <div className="w-px h-8 bg-slate-100 self-center hidden md:block"></div>
          <div className="flex-1 relative" ref={suggestionRef}>
            <FiMapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              className="input !border-none !bg-transparent !pl-10 sm:!pl-12 !h-12 sm:!h-14 text-sm sm:text-lg"
              placeholder="In which city?"
              value={city}
              onChange={(e) => {
                setCity(e.target.value);
                setLat('');
                setLng('');
                if (e.target.value.length >= 3) setShowSuggestions(true);
              }}
              onFocus={() => {
                if (city.length >= 3) setShowSuggestions(true);
              }}
            />
            {isLoadingSuggestions && (
              <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-500 animate-spin" size={18} />
            )}
            
            {showSuggestions && (suggestions.length > 0 || isLoadingSuggestions) && (
              <div className="absolute top-full left-0 right-0 mt-2 z-50 overflow-hidden surface-card !p-2 shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  {isLoadingSuggestions && suggestions.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm">Searching for cities...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map((s) => (
                      <button
                        key={s.id}
                        className="w-full text-left p-3 hover:bg-slate-50 rounded-xl transition-colors group flex items-center gap-3"
                        onClick={() => selectSuggestion(s)}
                      >
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-brand-50 group-hover:text-brand-500 transition-colors">
                          <FiMapPin size={14} />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{s.city}</p>
                          <p className="text-xs text-slate-400 truncate max-w-[250px]">{s.display_name}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    !isLoadingSuggestions && <div className="p-4 text-center text-slate-400 text-sm">No cities found</div>
                  )}
                </div>
              </div>
            )}
          </div>
          <Button variant="primary" className="!h-12 sm:!h-14 !px-6 sm:!px-8 text-sm sm:text-lg shadow-brand">
            Search
          </Button>
        </div>
      </section>

      {/* Main Grid with Sidebar */}
      <div className="grid gap-6 sm:gap-10 lg:grid-cols-[280px_1fr]">
        {/* Sidebar Filters */}
        <aside className="space-y-8 hidden lg:block">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center justify-between">
              Categories
              {categoryId && <Button variant="ghost" onClick={() => setCategoryId('')} className="text-brand-600 hover:underline !p-0">Clear</Button>}
            </h3>
            <div className="flex flex-col gap-1">
              {categories?.map(cat => (
                <Button 
                  key={cat.id}
                  variant={categoryId === cat.id ? 'primary' : 'ghost'}
                  onClick={() => setCategoryId(cat.id === categoryId ? '' : cat.id)}
                  className={`flex w-full items-center justify-between !px-4 !py-3 !rounded-xl transition-all !text-sm !font-medium ${
                    categoryId === cat.id 
                    ? '!bg-brand-600 !text-white shadow-lg shadow-brand-200' 
                    : '!text-slate-600 hover:!bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FiTag size={14} />
                    {cat.name}
                  </span>
                  {categoryId === cat.id && <FiCheck size={14} />}
                </Button>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Price Range (Daily)</h3>
            <div className="grid grid-cols-2 gap-3">
              <input 
                type="number" 
                placeholder="Min Rs" 
                className="input !py-3 !text-sm"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
              />
              <input 
                type="number" 
                placeholder="Max Rs" 
                className="input !py-3 !text-sm"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Search Radius</h3>
            <select 
              className="input !py-3 !text-sm w-full bg-white"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              disabled={!lat}
            >
              <option value="10">10 km</option>
              <option value="25">25 km</option>
              <option value="50">50 km</option>
              <option value="100">100 km</option>
            </select>
            {!lat && <p className="text-xs text-slate-400 mt-2">Select a city from suggestions to use radius search.</p>}
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">Minimum Rating</h3>
            <div className="flex flex-col gap-2">
              {[4, 3, 2].map(rating => (
                <label key={rating} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="minRating" 
                    value={rating} 
                    checked={minRating === String(rating)}
                    onChange={(e) => setMinRating(e.target.value)}
                    className="w-4 h-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                  />
                  <span className="text-sm text-slate-600 group-hover:text-slate-900">{rating}+ Stars</span>
                </label>
              ))}
              <label className="flex items-center gap-3 cursor-pointer group">
                <input 
                  type="radio" 
                  name="minRating" 
                  value="" 
                  checked={minRating === ''}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="w-4 h-4 text-brand-600 border-slate-300 focus:ring-brand-500"
                />
                <span className="text-sm text-slate-600 group-hover:text-slate-900">Any Rating</span>
              </label>
            </div>
          </div>

          <Button variant="secondary" onClick={resetFilters} className="w-full !py-3 flex items-center justify-center gap-2">
            <FiX size={16} />
            Reset All
          </Button>
        </aside>

        {/* Catalog Content */}
        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand-600 mb-1">
                {listings.length} Results Found
              </p>
              <h2 className="text-3xl font-bold text-slate-900">Explore the Storefront</h2>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setViewMode('grouped')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'grouped' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  By Category
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  All Items
                </button>
                <button 
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${viewMode === 'map' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  Map
                </button>
              </div>
              
              {/* Mobile Filter Toggle */}
              <Button 
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="lg:hidden flex items-center gap-2"
              >
                <FiSliders size={16} />
                Filters
              </Button>
            </div>
          </div>

          {listings.length > 0 ? (
            viewMode === 'map' ? (
              <div className="h-[600px] w-full rounded-[1.2rem] overflow-hidden border border-slate-200">
                <MapView listings={listings} height={600} />
              </div>
            ) : viewMode === 'grouped' ? (
              <div className="space-y-12">
                {Object.entries(
                  listings.reduce((acc, l) => {
                    const catName = l.category?.name || 'Uncategorized';
                    if (!acc[catName]) acc[catName] = [];
                    acc[catName].push(l);
                    return acc;
                  }, {})
                ).map(([catName, catListings]) => (
                  <div key={catName} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-brand-600 shadow-md"></div>
                      <h3 className="text-xl font-bold text-slate-800 tracking-tight">{catName}</h3>
                      <span className="text-[11px] font-bold px-2.5 py-0.5 bg-slate-100 rounded-full text-slate-500">
                        {catListings.length} {catListings.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                    <div className="catalog-grid !gap-8">
                      {catListings.map((listing) => (
                        <TiltCard key={listing.id} max={6} className="h-full">
                          <ListingCard l={listing} />
                        </TiltCard>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="catalog-grid !gap-8">
                {listings.map((listing) => (
                  <TiltCard key={listing.id} max={6} className="h-full">
                    <ListingCard l={listing} />
                  </TiltCard>
                ))}
              </div>
            )
          ) : (
            <div className="catalog-empty !bg-slate-50/50">
              <p className="text-2xl text-slate-900 font-bold mb-2">No gear found matching that.</p>
              <p className="text-slate-500 max-w-sm mx-auto text-sm leading-relaxed">
                Try widening your price range, checking a different city, or removing a category filter.
              </p>
              <Button variant="primary" onClick={resetFilters} className="mt-6">Clear All Filters</Button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// SSR: Pre-fetch initial listings for SEO and faster first paint
export async function getServerSideProps(context) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5050/api';
  const { q, city, categoryId, minPrice, maxPrice } = context.query;

  try {
    const params = new URLSearchParams({});
    if (q) params.set('q', q);
    if (city) params.set('city', city);
    if (categoryId) params.set('categoryId', categoryId);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);

    const url = `${apiUrl}/listings${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'RentlyBot/1.0 (SEO crawler)' },
    });

    if (!res.ok) {
      return { props: { initialListings: [] } };
    }

    const listings = await res.json();

    return {
      props: {
        initialListings: Array.isArray(listings) ? listings : [],
      },
      revalidate: 60,
    };
  } catch {
    return { props: { initialListings: [] } };
  }
}
