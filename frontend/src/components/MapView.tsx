import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { SearchResult } from '../types';
import { formatDateShort } from '../lib/utils';

interface MapViewProps {
  results: SearchResult[];
  selectedId: string | null;
  onSelectEvent: (id: string) => void;
  onOpenEvent: (id: string) => void;
}

// Sub-component to fly to selected marker
const FlyToSelected: React.FC<{
  results: SearchResult[];
  selectedId: string | null;
}> = ({ results, selectedId }) => {
  const map = useMap();
  useEffect(() => {
    if (!selectedId) return;
    const ev = results.find(r => r.id === selectedId);
    if (!ev?.geo?.lat || !ev?.geo?.lon) return;
    map.flyTo([ev.geo.lat, ev.geo.lon], Math.max(map.getZoom(), 5), {
      duration: 0.6,
    });
  }, [selectedId, results, map]);
  return null;
};

export const MapView: React.FC<MapViewProps> = ({
  results,
  selectedId,
  onSelectEvent,
  onOpenEvent,
}) => {
  // Only events with valid coordinates
  const geocoded = useMemo(
    () => results.filter(r => r.geo?.lat != null && r.geo?.lon != null),
    [results]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0 border-l border-term-border">
      {/* Map header */}
      <div className="flex items-center justify-between px-3 py-1 border-b border-term-border bg-term-surface flex-shrink-0">
        <span className="text-[7px] text-term-dim tracking-widest">
          GEOSPATIAL · {geocoded.length}/{results.length} GEOCODED
        </span>
        <span className="text-[7px] text-term-dim">◉ SELECT MARKER TO OPEN</span>
      </div>

      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ flex: 1, width: '100%', minHeight: 0 }}
        zoomControl
        attributionControl
      >
        {/* Satellite base layer */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          attribution="Esri"
          maxZoom={18}
        />
        {/* Label overlay */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          attribution=""
          maxZoom={18}
          opacity={0.7}
        />

        <FlyToSelected results={results} selectedId={selectedId} />

        {geocoded.map(ev => {
          const isSelected = ev.id === selectedId;
          const lat = ev.geo!.lat!;
          const lon = ev.geo!.lon!;
          return (
            <CircleMarker
              key={ev.id}
              center={[lat, lon]}
              radius={isSelected ? 7 : 4}
              pathOptions={{
                color: isSelected ? '#00ff41' : '#00cfff',
                fillColor: isSelected ? '#00ff41' : '#00cfff',
                fillOpacity: isSelected ? 1 : 0.7,
                weight: isSelected ? 2 : 1,
              }}
              eventHandlers={{
                click: () => onSelectEvent(ev.id),
                dblclick: () => onOpenEvent(ev.id),
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#c8c8c8' }}>
                  <div style={{ color: '#666', marginBottom: 2 }}>
                    {formatDateShort(ev.date_event ?? ev.date_published)}
                    {ev.geo?.country && ` · ${ev.geo.country}`}
                  </div>
                  <div style={{ fontWeight: 600, marginBottom: 2, lineHeight: 1.3 }}>
                    {ev.title}
                  </div>
                  <div style={{ color: '#666', marginBottom: 4 }}>
                    {ev.source_name}
                  </div>
                  <button
                    onClick={() => onOpenEvent(ev.id)}
                    style={{
                      background: 'none',
                      border: '1px solid #1e1e1e',
                      color: '#00ff41',
                      fontSize: '8px',
                      padding: '1px 4px',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    OPEN DETAIL →
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>
    </div>
  );
};
