'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { generateExcelTemplate } from '@/lib/excelTemplate';
import PlantSelector, { Plant } from '@/components/PlantSelector';
import { isWithinGeofence, getDistanceToGeofence } from '@/lib/geofence';
import mapboxgl from 'mapbox-gl';

// Set Mapbox access token
const MAPBOX_TOKEN = 'pk.eyJ1IjoianMxMDIyIiwiYSI6ImNtaGx2dTB2aTBqeHMybHM1bzF5enU5ejUifQ._lgVorwHSSTaPpZlu14eMQ';
mapboxgl.accessToken = MAPBOX_TOKEN;

// Mapbox Geocoding Autocomplete Component
function MapboxAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search for an address or place..."
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string, lat: number, lng: number) => void;
  placeholder?: string;
}) {
  const [suggestions, setSuggestions] = useState<Array<{ place_name: string; center: [number, number] }>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const searchPlaces = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${MAPBOX_TOKEN}&limit=5`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        setSuggestions(
          data.features.map((feature: any) => ({
            place_name: feature.place_name,
            center: feature.center as [number, number] // [lng, lat]
          }))
        );
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (newValue.length >= 3) {
        searchPlaces(newValue);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);
  };

  const handleSelect = (suggestion: { place_name: string; center: [number, number] }) => {
    // Mapbox returns coordinates as [longitude, latitude]
    const [lng, lat] = suggestion.center;
    
    onChange(suggestion.place_name);
    onSelect(suggestion.place_name, lat, lng);
    setShowSuggestions(false);
    setSuggestions([]);
    
    // Clear debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
  };

  useEffect(() => {
    // Close suggestions when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => {
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        autoComplete="off"
      />
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleSelect(suggestion);
              }}
              onMouseDown={(e) => {
                // Prevent input from losing focus
                e.preventDefault();
              }}
              className="w-full text-left px-4 py-2 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 cursor-pointer"
            >
              <p className="text-sm text-gray-900">{suggestion.place_name}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Mapbox Map Component
function MapboxMap({ 
  latitude, 
  longitude, 
  radius,
  onLocationSelect
}: { 
  latitude: number; 
  longitude: number; 
  radius: number;
  onLocationSelect?: (lat: number, lng: number) => void;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const zoomHandlerRef = useRef<(() => void) | null>(null);
  const clickHandlerRef = useRef<((e: mapboxgl.MapMouseEvent) => void) | null>(null);
  const radiusRef = useRef(radius);
  const [isMounted, setIsMounted] = useState(false);

  // Keep radius ref updated
  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  // Helper function to convert meters to pixels at current zoom
  const metersToPixels = (meters: number, lat: number, zoom: number) => {
    const earthCircumference = 40075017; // in meters
    const latitudeRadians = lat * (Math.PI / 180);
    const metersPerPixel = (earthCircumference * Math.cos(latitudeRadians)) / (256 * Math.pow(2, zoom));
    return meters / metersPerPixel;
  };

  // Ensure component only renders on client
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Initialize map once
  useEffect(() => {
    if (!isMounted || !mapContainer.current) return;
    if (map.current) return; // Map already initialized
    
    // Use provided coordinates or default to Mexico City
    const initialLat = latitude || 19.4326;
    const initialLng = longitude || -99.1332;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [initialLng, initialLat],
      zoom: latitude && longitude ? 15 : 10 // Zoom out more if no location set
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add click handler to select location
    if (onLocationSelect) {
      const clickHandler = (e: mapboxgl.MapMouseEvent) => {
        const { lng, lat } = e.lngLat;
        onLocationSelect(lat, lng);
      };
      clickHandlerRef.current = clickHandler;
      map.current.on('click', clickHandler);
      // Change cursor to pointer to indicate clickable
      map.current.getCanvas().style.cursor = 'crosshair';
    }

    // Wait for map to load before adding layers
    map.current.on('load', () => {
      if (!map.current) return;

      // Only add geofence circle if location is set
      if (latitude && longitude) {
        // Add circle source
        map.current.addSource('geofence', {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            properties: {}
          }
        });

        const currentZoom = map.current.getZoom();
        const initialRadius = 50; // Default radius, will be updated by second useEffect
        const radiusInPixels = metersToPixels(initialRadius, latitude, currentZoom);

        // Add circle layer
        map.current.addLayer({
          id: 'geofence-circle',
          type: 'circle',
          source: 'geofence',
          paint: {
            'circle-radius': radiusInPixels,
            'circle-color': '#3b82f6',
            'circle-opacity': 0.2,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#3b82f6'
          }
        });
      }

      // Update circle radius on zoom
      const zoomHandler = () => {
        if (map.current && map.current.getLayer('geofence-circle')) {
          const zoom = map.current.getZoom();
          // Use current radius from ref
          const currentRadius = radiusRef.current || 50;
          const radiusInPixels = metersToPixels(currentRadius, latitude, zoom);
          map.current.setPaintProperty('geofence-circle', 'circle-radius', radiusInPixels);
        }
      };
      zoomHandlerRef.current = zoomHandler;
      map.current.on('zoom', zoomHandler);
    });

    // Add marker only if location is set
    if (latitude && longitude) {
      marker.current = new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat([longitude, latitude])
        .addTo(map.current);
    }

    // Cleanup on unmount
    return () => {
      if (map.current) {
        if (zoomHandlerRef.current) {
          map.current.off('zoom', zoomHandlerRef.current);
        }
        if (onLocationSelect && clickHandlerRef.current) {
          map.current.off('click', clickHandlerRef.current);
        }
        map.current.remove();
        map.current = null;
      }
      if (marker.current) {
        marker.current.remove();
        marker.current = null;
      }
    };
  }, [isMounted, latitude, longitude, onLocationSelect]); // Only initialize once

  // Update map when position or radius changes
  useEffect(() => {
    if (!map.current) return;

    // Use provided coordinates or keep current center
    const currentLat = latitude || 19.4326;
    const currentLng = longitude || -99.1332;

    // Update map center if location is set
    if (latitude && longitude) {
      map.current.setCenter([longitude, latitude]);
    }

    // Add or update marker
    if (latitude && longitude) {
      if (!marker.current) {
        marker.current = new mapboxgl.Marker({ color: '#3b82f6' })
          .setLngLat([longitude, latitude])
          .addTo(map.current);
      } else {
        marker.current.setLngLat([longitude, latitude]);
      }
    } else if (marker.current) {
      // Remove marker if no location
      marker.current.remove();
      marker.current = null;
    }

    // Update geofence circle only if location is set
    if (latitude && longitude) {
      const updateCircle = () => {
        if (!map.current) return;

        // Add source if it doesn't exist
        if (!map.current.getSource('geofence')) {
          map.current.addSource('geofence', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              properties: {}
            }
          });

          const currentZoom = map.current.getZoom();
          const radiusInPixels = metersToPixels(radius, latitude, currentZoom);

          map.current.addLayer({
            id: 'geofence-circle',
            type: 'circle',
            source: 'geofence',
            paint: {
              'circle-radius': radiusInPixels,
              'circle-color': '#3b82f6',
              'circle-opacity': 0.2,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#3b82f6'
            }
          });
        } else {
          const source = map.current.getSource('geofence') as mapboxgl.GeoJSONSource;
          source.setData({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [longitude, latitude]
            },
            properties: {}
          });

          // Update circle radius in pixels based on current zoom
          if (map.current.getLayer('geofence-circle')) {
            const zoom = map.current.getZoom();
            const radiusInPixels = metersToPixels(radius, latitude, zoom);
            map.current.setPaintProperty('geofence-circle', 'circle-radius', radiusInPixels);
          }
        }
      };

      if (map.current.loaded()) {
        updateCircle();
      } else {
        map.current.once('load', updateCircle);
      }
    } else {
      // Remove geofence circle if no location
      if (map.current.getLayer('geofence-circle')) {
        map.current.removeLayer('geofence-circle');
      }
      if (map.current.getSource('geofence')) {
        map.current.removeSource('geofence');
      }
    }
  }, [latitude, longitude, radius]);

  if (!isMounted) {
    return (
      <div 
        className="w-full h-64 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ minHeight: '256px' }}
      >
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className="w-full rounded-lg overflow-hidden"
      style={{ height: '256px', minHeight: '256px' }}
    />
  );
}

// Mock data
const mockLanes = [
  {
    id: 1,
    plantId: 1,
    name: 'Operations',
    subAreas: [
      { id: 1, name: 'Valet Parking' },
      { id: 2, name: 'Floor Equipment' },
      { id: 3, name: 'Kitchen Equipment' },
      { id: 4, name: 'Reception' },
      { id: 5, name: 'Logistics' },
    ],
    roles: ['Waiters', 'Captains', 'Supervisors', 'Hosts', 'Runners'],
  },
  {
    id: 2,
    plantId: 1,
    name: 'Kitchen',
    subAreas: [
      { id: 6, name: 'Cold Kitchen' },
      { id: 7, name: 'Hot Kitchen' },
      { id: 8, name: 'Pastry' },
    ],
    roles: ['Chef', 'Sous Chef', 'Cook', 'Assistant'],
  },
  {
    id: 3,
    plantId: 1,
    name: 'Common Areas',
    subAreas: [
      { id: 9, name: 'Dining Room' },
      { id: 10, name: 'Bar' },
      { id: 11, name: 'Terrace' },
    ],
    roles: ['Waiters', 'Bartenders', 'Hosts'],
  },
  {
    id: 4,
    plantId: 2,
    name: 'Cleaning',
    subAreas: [
      { id: 12, name: 'General Cleaning' },
    ],
    roles: ['Cleaning Staff', 'Cleaning Supervisor'],
  },
  {
    id: 5,
    plantId: 2,
    name: 'Maintenance',
    subAreas: [
      { id: 13, name: 'General Maintenance' },
    ],
    roles: ['Technician', 'Maintenance Supervisor'],
  },
];

interface Lane {
  id: number;
  plantId: number;
  name: string;
  subAreas: Array<{ id: number; name: string }>;
  roles: string[];
}

interface Checklist {
  id: number;
  plantId: number;
  name: string;
  lane: string;
  area: string;
  role: string;
  activities: Array<{ id: number; name: string; requiresPhoto: boolean; recurrence?: string }>;
  generalRecurrence?: string;
  requiresLocation?: boolean;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
    radius: number; // in meters
  };
}

export default function OperationsPage() {
  const [activeTab, setActiveTab] = useState<'lanes' | 'checklists'>('lanes');
  const [expandedLanes, setExpandedLanes] = useState<number[]>([1]);
  const [showLaneModal, setShowLaneModal] = useState(false);
  const [editingLane, setEditingLane] = useState<Lane | null>(null);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<Checklist | null>(null);
  const [checklistType, setChecklistType] = useState<'individual' | 'bulk' | null>(null);
  const [lanes, setLanes] = useState<Lane[]>([...mockLanes]);
const [checklists, setChecklists] = useState<Checklist[]>([
    { id: 1, plantId: 1, name: 'Checklist Operations - Reception', lane: 'Operations', area: 'Reception', role: 'Hosts', activities: [], generalRecurrence: 'daily' },
    { id: 2, plantId: 1, name: 'Checklist Kitchen - Hot Kitchen', lane: 'Kitchen', area: 'Hot Kitchen', role: 'Chef', activities: [], generalRecurrence: 'daily' },
    { id: 3, plantId: 2, name: 'Checklist Cleaning - General', lane: 'Cleaning', area: 'General Cleaning', role: 'Cleaning Staff', activities: [], generalRecurrence: 'daily' },
  ]);
  const [plants, setPlants] = useState<Plant[]>([
    { id: 1, name: 'Plant 1', hasData: true },
    { id: 2, name: 'Plant 2', hasData: true },
  ]);
  const [selectedPlant, setSelectedPlant] = useState<number | 'all'>('all');
  const filteredLanes = selectedPlant === 'all' ? lanes : lanes.filter(lane => lane.plantId === selectedPlant);
  const filteredChecklists = selectedPlant === 'all' ? checklists : checklists.filter(checklist => checklist.plantId === selectedPlant);
  const canModifyCurrentPlant = selectedPlant !== 'all';

  const toggleLane = (laneId: number) => {
    setExpandedLanes((prev) =>
      prev.includes(laneId)
        ? prev.filter((id) => id !== laneId)
        : [...prev, laneId]
    );
  };

  const downloadTemplate = () => {
    generateExcelTemplate();
  };

  const handleLaneSave = (laneData: Omit<Lane, 'id' | 'plantId'>) => {
    if (editingLane) {
      setLanes(lanes.map(l => l.id === editingLane.id ? { ...editingLane, ...laneData } : l));
      setEditingLane(null);
    } else {
      if (selectedPlant === 'all') {
        alert('Select a specific plant to add lanes.');
        return;
      }
      const newLane: Lane = {
        id: Date.now(),
        plantId: selectedPlant as number,
        ...laneData,
      };
      setLanes([...lanes, newLane]);
    }
  };

  const handleLaneDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this lane? This will also remove all associated sub-areas and roles.')) {
      setLanes(lanes.filter(l => l.id !== id));
      setExpandedLanes(expandedLanes.filter(lid => lid !== id));
    }
  };

  const handlePlantCreate = (name: string) => {
    const newPlant: Plant = {
      id: Date.now(),
      name,
      hasData: false,
    };
    setPlants([...plants, newPlant]);
    setSelectedPlant(newPlant.id);
  };

  const handlePlantEdit = (id: number, name: string) => {
    setPlants(plants.map(p => p.id === id ? { ...p, name } : p));
  };

  const handlePlantDelete = (id: number) => {
    setPlants(plants.filter(p => p.id !== id));
    setLanes(lanes.filter(lane => lane.plantId !== id));
    setChecklists(checklists.filter(checklist => checklist.plantId !== id));
    if (selectedPlant === id) {
      setSelectedPlant('all');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Operations</h1>
          <p className="text-gray-600 mt-1">Configuration of lanes, areas and roles</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <PlantSelector
            plants={plants}
            selectedPlant={selectedPlant}
            onPlantChange={setSelectedPlant}
            onPlantCreate={handlePlantCreate}
            onPlantEdit={handlePlantEdit}
            onPlantDelete={handlePlantDelete}
          />
          <div className="flex gap-3">
            <button
              onClick={() => {
                if (!canModifyCurrentPlant) return;
                setChecklistType('individual');
                setShowChecklistModal(true);
              }}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${canModifyCurrentPlant ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              disabled={!canModifyCurrentPlant}
              title={canModifyCurrentPlant ? 'Create checklist' : 'Select a plant to add checklists'}
            >
              <Plus size={20} />
              Create Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('lanes')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'lanes'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Lanes & Structure
          </button>
          <button
            onClick={() => setActiveTab('checklists')}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeTab === 'checklists'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Checklists
          </button>
        </nav>
      </div>

   
   {/* Lanes Tab */}
   {activeTab === 'lanes' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Operational Lanes</h2>
            <button
              onClick={() => canModifyCurrentPlant && setShowLaneModal(true)}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 ${canModifyCurrentPlant ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
              disabled={!canModifyCurrentPlant}
              title={canModifyCurrentPlant ? 'Create a new lane' : 'Select a plant to add lanes'}
            >
              <Plus size={20} />
              New Lane
            </button>
          </div>

          <div className="space-y-3">
            {filteredLanes.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No lanes configured for this plant yet.</p>
            ) : (
              filteredLanes.map((lane) => (
                <div
                  key={lane.id}
                  className="bg-white rounded-lg border border-gray-200 shadow-sm"
                >
                  <div
                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleLane(lane.id)}
                  >
                    <div className="flex items-center gap-3">
                      {expandedLanes.includes(lane.id) ? (
                        <ChevronDown className="text-gray-400" size={20} />
                      ) : (
                        <ChevronRight className="text-gray-400" size={20} />
                      )}
                      <h3 className="text-lg font-semibold text-gray-900">{lane.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingLane(lane);
                          setShowLaneModal(true);
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit lane"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaneDelete(lane.id);
                        }}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete lane"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  {expandedLanes.includes(lane.id) && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-200">
                      {/* Sub-areas */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-700">Sub-areas</h4>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const newArea = { id: Date.now(), name: '' };
                              setLanes(lanes.map(l => 
                                l.id === lane.id 
                                  ? { ...l, subAreas: [...l.subAreas, newArea] }
                                  : l
                              ));
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Plus size={16} />
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {lane.subAreas.map((area) => (
                            <span
                              key={area.id}
                              className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={area.name}
                                onChange={(e) => {
                                  setLanes(lanes.map(l =>
                                    l.id === lane.id
                                      ? { ...l, subAreas: l.subAreas.map(a => a.id === area.id ? { ...a, name: e.target.value } : a) }
                                      : l
                                  ));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-transparent border-none outline-none w-24 text-blue-700"
                              />
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete sub-area "${area.name}"?`)) {
                                    setLanes(lanes.map(l =>
                                      l.id === lane.id
                                        ? { ...l, subAreas: l.subAreas.filter(a => a.id !== area.id) }
                                        : l
                                    ));
                                  }
                                }}
                                className="hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Roles */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-medium text-gray-700">Roles</h4>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setLanes(lanes.map(l =>
                                l.id === lane.id
                                  ? { ...l, roles: [...l.roles, ''] }
                                  : l
                              ));
                            }}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <Plus size={16} />
                            Add
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {lane.roles.map((role, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={role}
                                onChange={(e) => {
                                  setLanes(lanes.map(l =>
                                    l.id === lane.id
                                      ? { ...l, roles: l.roles.map((r, i) => i === idx ? e.target.value : r) }
                                      : l
                                  ));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-transparent border-none outline-none w-20 text-green-700"
                              />
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete role "${role}"?`)) {
                                    setLanes(lanes.map(l =>
                                      l.id === lane.id
                                        ? { ...l, roles: l.roles.filter((_, i) => i !== idx) }
                                        : l
                                    ));
                                  }
                                }}
                                className="hover:text-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* Checklists Tab */}
      {activeTab === 'checklists' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Checklists</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  setChecklistType('bulk');
                  setShowChecklistModal(true);
                }}
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <FileSpreadsheet className="mx-auto mb-3 text-gray-400" size={48} />
                <h3 className="font-semibold text-gray-900 mb-2">Bulk Upload</h3>
                <p className="text-sm text-gray-600">
                  Download the Excel template, complete it and upload it to create multiple checklists
                </p>
              </button>
              <button
                onClick={() => {
                  setChecklistType('individual');
                  setShowChecklistModal(true);
                }}
                className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center"
              >
                <Plus className="mx-auto mb-3 text-gray-400" size={48} />
                <h3 className="font-semibold text-gray-900 mb-2">Create Individual</h3>
                <p className="text-sm text-gray-600">
                  Create a checklist manually by selecting lane, sub-area and roles
                </p>
              </button>
            </div>
          </div>

          {/* Checklist List */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Created Checklists</h3>
            <div className="space-y-3">
              {filteredChecklists.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No checklists created yet. Create your first checklist above.</p>
              ) : (
                filteredChecklists.map((checklist) => (
                <div
                  key={checklist.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                >
                  <div>
                    <p className="font-medium text-gray-900">{checklist.name}</p>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        {checklist.lane}
                      </span>
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        {checklist.area}
                      </span>
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded">
                        {checklist.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        setEditingChecklist(checklist);
                        setChecklistType('individual');
                        setShowChecklistModal(true);
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                      title="Edit checklist"
                    >
                      <Edit size={18} />
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${checklist.name}"?`)) {
                          setChecklists(checklists.filter(c => c.id !== checklist.id));
                        }
                      }}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                      title="Delete checklist"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lane Modal */}
      {showLaneModal && (
        <LaneModal 
          lane={editingLane}
          onClose={() => {
            setShowLaneModal(false);
            setEditingLane(null);
          }}
          onSave={handleLaneSave}
        />
      )}

      {/* Checklist Modal */}
      {showChecklistModal && checklistType && (
        <ChecklistModal
          type={checklistType}
          lanes={filteredLanes}
          editingChecklist={editingChecklist}
          onClose={() => {
            setShowChecklistModal(false);
            setChecklistType(null);
          }}
          onDownloadTemplate={downloadTemplate}
          onSave={(checklist) => {
            if (!editingChecklist && selectedPlant === 'all') {
              alert('Select a specific plant to add checklists.');
              return;
            }
            if (editingChecklist) {
              setChecklists(checklists.map(c => c.id === editingChecklist.id ? { ...editingChecklist, ...checklist } : c));
              setEditingChecklist(null);
            } else {
              const newChecklist: Checklist = {
                id: Date.now(),
                plantId: selectedPlant as number,
                ...checklist,
              };
              setChecklists([...checklists, newChecklist]);
            }
            setShowChecklistModal(false);
            setChecklistType(null);
            setActiveTab('checklists');
          }}
        />
      )}
    </div>
  );
}

// Lane Creation/Edit Modal
function LaneModal({ 
  lane, 
  onClose, 
  onSave 
}: { 
  lane?: Lane | null; 
  onClose: () => void;
  onSave: (lane: Omit<Lane, 'id' | 'plantId'>) => void;
}) {
  const [name, setName] = useState(lane?.name || '');
  const [subAreas, setSubAreas] = useState<Array<{ id: number; name: string }>>(
    lane?.subAreas || [{ id: Date.now(), name: '' }]
  );
  const [roles, setRoles] = useState<string[]>(lane?.roles || ['']);

  const addSubArea = () => setSubAreas([...subAreas, { id: Date.now(), name: '' }]);
  const removeSubArea = (index: number) => setSubAreas(subAreas.filter((_, i) => i !== index));
  const updateSubArea = (index: number, value: string) => {
    const newSubAreas = [...subAreas];
    newSubAreas[index] = { ...newSubAreas[index], name: value };
    setSubAreas(newSubAreas);
  };

  const addRole = () => setRoles([...roles, '']);
  const removeRole = (index: number) => setRoles(roles.filter((_, i) => i !== index));
  const updateRole = (index: number, value: string) => {
    const newRoles = [...roles];
    newRoles[index] = value;
    setRoles(newRoles);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {lane ? 'Edit Lane' : 'Create New Lane'}
          </h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lane Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="E.g: Operations, Kitchen, etc."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Sub-areas
              </label>
              <button
                onClick={addSubArea}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {subAreas.map((area, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={area.name}
                    onChange={(e) => updateSubArea(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Sub-area name"
                  />
                  <button
                    onClick={() => removeSubArea(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    disabled={subAreas.length === 1}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Roles
              </label>
              <button
                onClick={addRole}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <Plus size={16} />
                Add
              </button>
            </div>
            <div className="space-y-2">
              {roles.map((role, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={role}
                    onChange={(e) => updateRole(index, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Role name"
                  />
                  {roles.length > 1 && (
                    <button
                      onClick={() => removeRole(index)}
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (name.trim() && subAreas.every(a => a.name.trim()) && roles.every(r => r.trim())) {
                onSave({
                  name: name.trim(),
                  subAreas: subAreas.filter(a => a.name.trim()).map(a => ({ id: a.id, name: a.name.trim() })),
                  roles: roles.filter(r => r.trim()),
                });
                onClose();
              }
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={!name.trim() || !subAreas.some(a => a.name.trim()) || !roles.some(r => r.trim())}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Checklist Modal Component
function ChecklistModal({
  type,
  lanes,
  editingChecklist,
  onClose,
  onDownloadTemplate,
  onSave,
}: {
  type: 'individual' | 'bulk';
  lanes: Lane[];
  editingChecklist?: Checklist | null;
  onClose: () => void;
  onDownloadTemplate: () => void;
  onSave: (checklist: Omit<Checklist, 'id' | 'plantId'>) => void;
}) {
  // Individual Checklist Form - hooks must be at top level
  const [selectedLane, setSelectedLane] = useState(editingChecklist?.lane || '');
  const [selectedSubArea, setSelectedSubArea] = useState(editingChecklist?.area || '');
  const [selectedRole, setSelectedRole] = useState(editingChecklist?.role || '');
  const [title, setTitle] = useState(editingChecklist?.name || '');
  const [activities, setActivities] = useState<Array<{ id: number; name: string; requiresPhoto: boolean; recurrence?: string }>>(
    editingChecklist?.activities || []
  );
  const [generalRecurrence, setGeneralRecurrence] = useState(editingChecklist?.generalRecurrence || '');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showRecurrenceModal, setShowRecurrenceModal] = useState<number | null>(null);
  const [recurrenceConfig, setRecurrenceConfig] = useState<{ days: number; type: string }>({ days: 1, type: 'days' });
  
  // Geofencing states
  const [requiresLocation, setRequiresLocation] = useState(editingChecklist?.requiresLocation || false);
  const [locationAddress, setLocationAddress] = useState(editingChecklist?.location?.address || '');
  const [locationLat, setLocationLat] = useState(editingChecklist?.location?.latitude || 0);
  const [locationLng, setLocationLng] = useState(editingChecklist?.location?.longitude || 0);
  const [geofenceRadius, setGeofenceRadius] = useState(editingChecklist?.location?.radius || 50); // default 50 meters

  // Get selected lane data
  const selectedLaneData = lanes.find(l => l.name === selectedLane);
  
  // Reset sub-area and role when lane changes
  const handleLaneChange = (laneName: string) => {
    setSelectedLane(laneName);
    setSelectedSubArea('');
    setSelectedRole('');
  };

  if (type === 'bulk') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Bulk Checklist Upload</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
                <li>Download the Excel template</li>
                <li>Complete the information for lanes, sub-areas, roles and activities</li>
                <li>Upload the completed file to create checklists in bulk</li>
              </ol>
            </div>
            <div className="flex gap-3">
              <button
                onClick={onDownloadTemplate}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Download size={20} />
                Download Template
              </button>
              <label className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2 cursor-pointer">
                <Upload size={20} />
                Upload File
                <input type="file" accept=".xlsx,.xls" className="hidden" />
              </label>
            </div>
          </div>
          <div className="p-6 border-t border-gray-200 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const addActivity = () => {
    setActivities([...activities, { id: Date.now(), name: '', requiresPhoto: false }]);
  };

  const removeActivity = (id: number) => {
    setActivities(activities.filter((a) => a.id !== id));
  };

  const updateActivity = (id: number, field: string, value: any) => {
    setActivities(activities.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const moveActivity = (index: number, direction: 'up' | 'down') => {
    const newActivities = [...activities];
    if (direction === 'up' && index > 0) {
      [newActivities[index - 1], newActivities[index]] = [newActivities[index], newActivities[index - 1]];
    } else if (direction === 'down' && index < newActivities.length - 1) {
      [newActivities[index], newActivities[index + 1]] = [newActivities[index + 1], newActivities[index]];
    }
    setActivities(newActivities);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedLane) {
      newErrors.lane = 'Please select a lane';
    }
    if (!selectedSubArea) {
      newErrors.subArea = 'Please select a sub-area';
    }
    if (!selectedRole) {
      newErrors.role = 'Please select a role';
    }
    if (!title.trim()) {
      newErrors.title = 'Please enter a checklist title';
    }
    if (activities.length === 0) {
      newErrors.activities = 'Please add at least one activity';
    }
    if (requiresLocation && (!locationAddress.trim() || locationLat === 0 || locationLng === 0)) {
      newErrors.location = 'Please select a valid location';
    }
    
    // Validate activities
    activities.forEach((activity, index) => {
      if (!activity.name.trim()) {
        newErrors[`activity-${index}`] = 'Activity name is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      return;
    }

    const checklist: Omit<Checklist, 'id' | 'plantId'> = {
      name: title,
      lane: selectedLane,
      area: selectedSubArea,
      role: selectedRole,
      activities: activities.map(a => ({ ...a })),
      generalRecurrence: generalRecurrence || undefined,
      requiresLocation: requiresLocation || undefined,
      location: requiresLocation && locationLat !== 0 && locationLng !== 0 ? {
        address: locationAddress,
        latitude: locationLat,
        longitude: locationLng,
        radius: geofenceRadius,
      } : undefined,
    };

    onSave(checklist);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingChecklist ? 'Edit Checklist' : 'Create Individual Checklist'}
          </h2>
        </div>
        <div className="p-6 space-y-6">
          {/* Selection Fields */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lane</label>
              <select
                value={selectedLane}
                onChange={(e) => handleLaneChange(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.lane ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select...</option>
                {lanes.map((lane) => (
                  <option key={lane.id} value={lane.name}>
                    {lane.name}
                  </option>
                ))}
              </select>
              {errors.lane && <p className="text-red-500 text-xs mt-1">{errors.lane}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub-area</label>
              <select
                value={selectedSubArea}
                onChange={(e) => {
                  setSelectedSubArea(e.target.value);
                  setSelectedRole('');
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.subArea ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!selectedLane}
              >
                <option value="">Select...</option>
                {selectedLaneData?.subAreas.map((subArea) => (
                  <option key={subArea.id} value={subArea.name}>
                    {subArea.name}
                  </option>
                ))}
              </select>
              {errors.subArea && <p className="text-red-500 text-xs mt-1">{errors.subArea}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.role ? 'border-red-500' : 'border-gray-300'
                }`}
                disabled={!selectedLane}
              >
                <option value="">Select...</option>
                {selectedLaneData?.roles.map((role, index) => (
                  <option key={index} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Checklist Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.title ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="E.g: Checklist Reception - Hosts"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
          </div>

          {/* General Recurrence */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              General Recurrence (Optional)
            </label>
            <select
              value={generalRecurrence}
              onChange={(e) => setGeneralRecurrence(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No recurrence</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {/* Activities */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">Activities</label>
              <button
                onClick={addActivity}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={18} />
                Add Activity
              </button>
            </div>
            {errors.activities && <p className="text-red-500 text-xs mb-2">{errors.activities}</p>}
            <div className="space-y-3">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                >
                  <div className="flex gap-3 mb-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={activity.name}
                        onChange={(e) => {
                          updateActivity(activity.id, 'name', e.target.value);
                          // Clear error when user types
                          if (errors[`activity-${index}`]) {
                            const newErrors = { ...errors };
                            delete newErrors[`activity-${index}`];
                            setErrors(newErrors);
                          }
                        }}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          errors[`activity-${index}`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="Activity name"
                      />
                      {errors[`activity-${index}`] && (
                        <p className="text-red-500 text-xs mt-1">{errors[`activity-${index}`]}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={activity.requiresPhoto}
                        onChange={(e) => updateActivity(activity.id, 'requiresPhoto', e.target.checked)}
                        id={`photo-${activity.id}`}
                        className="w-4 h-4"
                      />
                      <label htmlFor={`photo-${activity.id}`} className="text-sm text-gray-700">
                        Required photo
                      </label>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <select
                        value={activity.recurrence || ''}
                        onChange={(e) => updateActivity(activity.id, 'recurrence', e.target.value)}
                        className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
                      >
                        <option value="">No special recurrence</option>
                        <option value="every-3-days">Every 3 days</option>
                        <option value="every-7-days">Every 7 days</option>
                        <option value="every-15-days">Every 15 days</option>
                      </select>
                      <button
                        onClick={() => setShowRecurrenceModal(activity.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1"
                        title="Configure custom recurrence"
                      >
                        <Plus size={14} />
                        Custom
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => moveActivity(index, 'up')}
                        disabled={index === 0}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveActivity(index, 'down')}
                        disabled={index === activities.length - 1}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded disabled:opacity-50"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removeActivity(activity.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {activities.length === 0 && (
                <p className="text-center text-gray-500 py-8">
                  No activities. Click &quot;Add Activity&quot; to get started.
                </p>
              )}
            </div>
          </div>

          {/* Location Geofencing */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                This checklist requires validating the user&apos;s location at a specific point:
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setRequiresLocation(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !requiresLocation
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setRequiresLocation(true)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    requiresLocation
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>

            {requiresLocation && (
              <div className="space-y-4 mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                {/* Location Autocomplete */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Search and select, or click on map)
                  </label>
                  <MapboxAutocomplete
                    value={locationAddress}
                    onChange={setLocationAddress}
                    onSelect={(address, lat, lng) => {
                      setLocationAddress(address);
                      setLocationLat(lat);
                      setLocationLng(lng);
                    }}
                    placeholder="Search for an address or place..."
                  />
                  {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Tip: You can also click on the map below to set the location
                  </p>
                </div>

                {/* Map Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Preview {locationLat === 0 || locationLng === 0 ? '(Click on map to set location)' : ''}
                  </label>
                  <div className="w-full rounded-lg overflow-hidden border border-gray-300">
                    <MapboxMap 
                      latitude={locationLat || 19.4326} 
                      longitude={locationLng || -99.1332} 
                      radius={geofenceRadius}
                      onLocationSelect={(lat, lng) => {
                        setLocationLat(lat);
                        setLocationLng(lng);
                        // Reverse geocode to get address
                        fetch(
                          `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
                        )
                          .then(res => res.json())
                          .then(data => {
                            if (data.features && data.features.length > 0) {
                              setLocationAddress(data.features[0].place_name);
                            }
                          })
                          .catch(err => console.error('Error reverse geocoding:', err));
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      {locationLat !== 0 && locationLng !== 0 ? (
                        <>Coordinates: {locationLat.toFixed(6)}, {locationLng.toFixed(6)}</>
                      ) : (
                        <>No location selected. Click on the map above to set a location.</>
                      )}
                    </p>
                    {locationLat !== 0 && locationLng !== 0 && (
                      <a
                        href={`https://www.google.com/maps?q=${locationLat},${locationLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:text-blue-800 underline"
                      >
                        Open in Google Maps
                      </a>
                    )}
                  </div>
                </div>

                {/* Geofence Radius */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geofence Radius: {geofenceRadius} meters
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="10"
                      max="500"
                      step="10"
                      value={geofenceRadius}
                      onChange={(e) => setGeofenceRadius(Number(e.target.value))}
                      className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <input
                      type="number"
                      min="10"
                      max="500"
                      step="10"
                      value={geofenceRadius}
                      onChange={(e) => setGeofenceRadius(Math.max(10, Math.min(500, Number(e.target.value))))}
                      className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                    <span className="text-sm text-gray-600">meters</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Users must be within this radius to start the checklist
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Checklist
          </button>
        </div>
      </div>

      {/* Custom Recurrence Modal */}
      {showRecurrenceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Configure Custom Recurrence</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Repeat every
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    value={recurrenceConfig.days}
                    onChange={(e) => setRecurrenceConfig({ ...recurrenceConfig, days: parseInt(e.target.value) || 1 })}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  <select
                    value={recurrenceConfig.type}
                    onChange={(e) => setRecurrenceConfig({ ...recurrenceConfig, type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRecurrenceModal(null);
                  setRecurrenceConfig({ days: 1, type: 'days' });
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const recurrenceValue = `every-${recurrenceConfig.days}-${recurrenceConfig.type}`;
                  updateActivity(showRecurrenceModal, 'recurrence', recurrenceValue);
                  setShowRecurrenceModal(null);
                  setRecurrenceConfig({ days: 1, type: 'days' });
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

