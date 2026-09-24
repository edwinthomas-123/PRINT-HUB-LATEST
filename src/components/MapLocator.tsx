import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { Shop } from '../types';
import { Link } from 'react-router-dom';
import { MapPin, Printer } from 'lucide-react';
import { isShopCurrentlyOpen } from '../utils';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

function ShopMarker({ shop }: { shop: Shop; key?: React.Key }) {
  const [markerRef, marker] = useAdvancedMarkerRef();
  const [open, setOpen] = useState(false);

  // default to somewhere if missing
  const pos = shop.location || { lat: 9.9312 + (Math.random() - 0.5) * 0.1, lng: 76.2673 + (Math.random() - 0.5) * 0.1 };

  return (
    <>
      <AdvancedMarker ref={markerRef} position={pos} onClick={() => setOpen(!open)}>
        <Pin background="#4F46E5" glyphColor="#fff" borderColor="#4338CA" />
      </AdvancedMarker>
      {open && (
        <InfoWindow anchor={marker} onCloseClick={() => setOpen(false)}>
          <div className="p-2 max-w-[200px]">
            <h3 className="font-bold text-sm mb-1">{shop.name}</h3>
            <p className="text-xs text-slate-500 mb-2">{shop.address}</p>
            {isShopCurrentlyOpen(shop) ? <span className="bg-green-50 text-green-700 text-[10px] px-1.5 py-0.5 rounded font-medium mb-3 inline-block">Open Now</span> : <span className="bg-slate-100 text-slate-600 text-[10px] px-1.5 py-0.5 rounded font-medium mb-3 inline-block">Closed</span>}
            <Link 
              to={`/shop/${shop.id}`}
              className="block w-full bg-indigo-600 text-white text-center text-xs py-1.5 rounded font-medium hover:bg-indigo-500 transition"
            >
              Order Print
            </Link>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

export function MapLocator({ shops }: { shops: Shop[] }) {
  if (!hasValidKey) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center h-[500px] flex flex-col items-center justify-center">
        <MapPin className="w-8 h-8 text-slate-300 mb-4" />
        <h3 className="text-lg font-bold text-slate-700 mb-2">Google Maps API Key Required</h3>
        <p className="text-sm text-slate-500 mb-4 max-w-sm mx-auto">
          To view the interactive map, you need to configure the Google Maps API key in AI Studio.
        </p>
        <div className="bg-white p-4 rounded-lg border border-slate-200 text-left text-sm text-slate-600 max-w-sm w-full shadow-sm">
          <ul className="list-disc pl-4 space-y-2">
            <li>Open <strong>Settings</strong> (⚙️ icon, top right)</li>
            <li>Select <strong>Secrets</strong></li>
            <li>Add <code>GOOGLE_MAPS_PLATFORM_KEY</code></li>
            <li>Paste your key and press Enter</li>
          </ul>
        </div>
      </div>
    );
  }

  // default center Kochi
  const center = { lat: 9.9312, lng: 76.2673 };

  return (
    <div className="h-[500px] w-full rounded-xl overflow-hidden border border-slate-200 shadow-sm relative">
      <APIProvider apiKey={API_KEY} version="weekly">
        <Map
          defaultCenter={center}
          defaultZoom={12}
          mapId="PRINT_SHOPS_MAP"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          gestureHandling="greedy"
          disableDefaultUI={true}
        >
          {shops.map(shop => (
            <ShopMarker key={shop.id} shop={shop} />
          ))}
        </Map>
      </APIProvider>
    </div>
  );
}
