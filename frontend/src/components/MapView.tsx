import React, { useCallback, useMemo, useRef } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/maplibre';
import type { MapRef, MapMouseEvent } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { SearchResult } from '../types';
import { formatDateShort, getSourceIcon } from '../lib/utils';

// Free dark vector tiles — no API key required
const MAP_STYLE = 'https://tiles.openfreemap.org/styles/dark';

interface MapViewProps {
  results: SearchResult[];
  selectedId: string | null;
  onSelectEvent: (id: string) => void;
  onOpenEvent: (id: string) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  results,
  selectedId,
  onSelectEvent,
  onOpenEvent,
}) => {
  const mapRef = useRef<MapRef>(null);

  const geocoded = useMemo(
    () => results.filter(r => r.geo?.lat != null && r.geo?.lon != null),
    [results]
  );

  // GeoJSON feature collection for all event markers
  const geojson = useMemo((): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: geocoded.map(ev => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [ev.geo!.lon!, ev.geo!.lat!] },
      properties: {
        id: ev.id,
        title: ev.title,
        source: ev.source_name,
        date: formatDateShort(ev.date_event ?? ev.date_published),
        country: ev.geo?.country ?? '',
        selected: ev.id === selectedId,
      },
    })),
  }), [geocoded, selectedId]);

  // Popup state
  const [popupInfo, setPopupInfo] = React.useState<{
    id: string; lng: number; lat: number;
    title: string; source: string; date: string; country: string;
  } | null>(null);

  // Fly to selected event
  React.useEffect(() => {
    if (!selectedId) return;
    const ev = results.find(r => r.id === selectedId);
    if (!ev?.geo?.lat || !ev?.geo?.lon) return;
    mapRef.current?.flyTo({
      center: [ev.geo.lon, ev.geo.lat],
      zoom: Math.max(mapRef.current.getZoom(), 5),
      duration: 600,
    });
  }, [selectedId, results]);

  const onClick = useCallback((e: MapMouseEvent) => {
    const features = e.target.queryRenderedFeatures(e.point, { layers: ['events-circle'] });
    if (!features.length) { setPopupInfo(null); return; }
    const props = features[0].properties as Record<string, string>;
    const coords = (features[0].geometry as GeoJSON.Point).coordinates;
    onSelectEvent(props.id);
    setPopupInfo({
      id: props.id,
      lng: coords[0],
      lat: coords[1],
      title: props.title,
      source: props.source,
      date: props.date,
      country: props.country,
    });
  }, [onSelectEvent]);

  return (
    <div className="flex-1 flex flex-col min-h-0 border-l border-term-border">
      <div className="flex items-center justify-between px-3 py-1 border-b border-term-border bg-term-surface flex-shrink-0">
        <span className="text-[7px] text-term-dim tracking-widest">
          GEOSPATIAL · {geocoded.length}/{results.length} GEOCODED
        </span>
        <span className="text-[7px] text-term-dim">◎ CLICK MARKER · DBL-CLICK OPEN</span>
      </div>

      <div className="flex-1 min-h-0">
        <Map
          ref={mapRef}
          mapStyle={MAP_STYLE}
          initialViewState={{ longitude: 0, latitude: 20, zoom: 2 }}
          style={{ width: '100%', height: '100%' }}
          onClick={onClick}
          onDblClick={e => {
            const features = e.target.queryRenderedFeatures(e.point, { layers: ['events-circle'] });
            if (features.length) onOpenEvent((features[0].properties as Record<string,string>).id);
          }}
          cursor="default"
          reuseMaps
        >
          <NavigationControl position="bottom-right" showCompass={false} />

          <Source id="events" type="geojson" data={geojson}>
            {/* Glow ring for selected */}
            <Layer
              id="events-glow"
              type="circle"
              paint={{
                'circle-radius': 12,
                'circle-color': '#00ff41',
                'circle-opacity': [
                  'case', ['==', ['get', 'selected'], true], 0.15, 0
                ],
                'circle-blur': 1,
              }}
            />
            {/* Main dot */}
            <Layer
              id="events-circle"
              type="circle"
              paint={{
                'circle-radius': ['case', ['==', ['get', 'selected'], true], 7, 4],
                'circle-color': ['case', ['==', ['get', 'selected'], true], '#00ff41', '#00cfff'],
                'circle-opacity': 0.9,
                'circle-stroke-width': ['case', ['==', ['get', 'selected'], true], 1.5, 0],
                'circle-stroke-color': '#00ff41',
              }}
            />
          </Source>

          {popupInfo && (
            <Popup
              longitude={popupInfo.lng}
              latitude={popupInfo.lat}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              closeButton={false}
              offset={12}
            >
              <div style={{
                fontFamily: '"JetBrains Mono", monospace',
                fontSize: '9px',
                color: '#c8c8c8',
                background: '#0d0d0d',
                border: '1px solid #1e1e1e',
                padding: '6px 8px',
                maxWidth: '220px',
              }}>
                <div style={{ color: getSourceIcon(popupInfo.source).color, fontWeight: 700, marginBottom: 2 }}>
                  {getSourceIcon(popupInfo.source).symbol} {popupInfo.source}
                </div>
                <div style={{ color: '#666', marginBottom: 3, fontSize: '8px' }}>
                  {popupInfo.date}{popupInfo.country ? ` · ${popupInfo.country}` : ''}
                </div>
                <div style={{ fontWeight: 600, marginBottom: 5, lineHeight: 1.3 }}>
                  {popupInfo.title.length > 80 ? popupInfo.title.slice(0, 80) + '…' : popupInfo.title}
                </div>
                <button
                  onClick={() => { onOpenEvent(popupInfo.id); setPopupInfo(null); }}
                  style={{
                    background: 'none', border: '1px solid #00ff41',
                    color: '#00ff41', fontSize: '8px', padding: '1px 6px',
                    cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.05em',
                  }}
                >
                  OPEN DETAIL →
                </button>
              </div>
            </Popup>
          )}
        </Map>
      </div>
    </div>
  );
};
