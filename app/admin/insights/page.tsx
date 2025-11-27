'use client';

import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, AlertCircle, Calendar, Download } from 'lucide-react';
import PlantSelector, { Plant } from '@/components/PlantSelector';

// Mock data
type AreaTrendPoint = {
  date: string;
  general: number;
  operacion: number;
  cocina: number;
  limpieza: number;
  mantenimiento: number;
};

type PlantTrendPoint = { date: string; value: number };

interface PlantInsight {
  metrics: {
    overallCompliance: number;
    activeUsers: number;
    usersWithoutChecklist: number;
  };
  areaTrend: AreaTrendPoint[];
  plantTrend: PlantTrendPoint[];
  lowComplianceUsers: Array<{ id: number; name: string; area: string; compliance: number }>;
}

const filterOptions = ['Day', 'Week', 'Month', 'Year', 'Custom Range'];

const aggregatedAreaTrend: AreaTrendPoint[] = [
  { date: '2024-01-01', general: 85, operacion: 88, cocina: 82, limpieza: 90, mantenimiento: 80 },
  { date: '2024-01-02', general: 87, operacion: 90, cocina: 84, limpieza: 92, mantenimiento: 82 },
  { date: '2024-01-03', general: 89, operacion: 91, cocina: 86, limpieza: 93, mantenimiento: 84 },
  { date: '2024-01-04', general: 88, operacion: 89, cocina: 85, limpieza: 91, mantenimiento: 83 },
  { date: '2024-01-05', general: 90, operacion: 92, cocina: 87, limpieza: 94, mantenimiento: 85 },
  { date: '2024-01-06', general: 91, operacion: 93, cocina: 88, limpieza: 95, mantenimiento: 86 },
  { date: '2024-01-07', general: 89, operacion: 91, cocina: 86, limpieza: 93, mantenimiento: 84 },
];

const aggregatedPlantTrend = [
  { date: '2024-01-01', plant1: 85, plant2: 82, plant3: 88 },
  { date: '2024-01-02', plant1: 87, plant2: 84, plant3: 90 },
  { date: '2024-01-03', plant1: 89, plant2: 86, plant3: 91 },
  { date: '2024-01-04', plant1: 88, plant2: 85, plant3: 89 },
  { date: '2024-01-05', plant1: 90, plant2: 87, plant3: 92 },
  { date: '2024-01-06', plant1: 91, plant2: 88, plant3: 93 },
  { date: '2024-01-07', plant1: 89, plant2: 86, plant3: 91 },
];

const aggregatedLowComplianceUsers = [
  { id: 1, name: 'John Smith', area: 'Kitchen', compliance: 45 },
  { id: 2, name: 'Mary Johnson', area: 'Operations', compliance: 52 },
  { id: 3, name: 'Carlos Lopez', area: 'Cleaning', compliance: 58 },
  { id: 4, name: 'Anna Martinez', area: 'Maintenance', compliance: 62 },
  { id: 5, name: 'Peter Sanchez', area: 'Kitchen', compliance: 65 },
];

const aggregatedMetrics = {
  overallCompliance: 87.5,
  activeUsers: 45,
  usersWithoutChecklist: 8,
};

const createAreaTrendForPlant = (offset: number): AreaTrendPoint[] =>
  aggregatedAreaTrend.map((point) => ({
    ...point,
    general: Math.min(100, point.general + offset),
    operacion: Math.min(100, point.operacion + offset),
    cocina: Math.min(100, point.cocina + offset),
    limpieza: Math.min(100, point.limpieza + offset),
    mantenimiento: Math.min(100, point.mantenimiento + offset),
  }));

const createPlantTrendSeries = (key: keyof typeof aggregatedPlantTrend[number]) =>
  aggregatedPlantTrend.map((point) => ({
    date: point.date,
    value: (point[key] as number) ?? point.plant1,
  }));

const plantInsightsData: Record<number, PlantInsight> = {
  1: {
    metrics: {
      overallCompliance: 90,
      activeUsers: 30,
      usersWithoutChecklist: 3,
    },
    areaTrend: createAreaTrendForPlant(2),
    plantTrend: createPlantTrendSeries('plant1'),
    lowComplianceUsers: [
      { id: 11, name: 'Ethan Walker', area: 'Kitchen', compliance: 42 },
      { id: 12, name: 'Sophia Lee', area: 'Operations', compliance: 55 },
      { id: 13, name: 'Michael Chen', area: 'Cleaning', compliance: 63 },
    ],
  },
  2: {
    metrics: {
      overallCompliance: 84,
      activeUsers: 15,
      usersWithoutChecklist: 5,
    },
    areaTrend: createAreaTrendForPlant(-3),
    plantTrend: createPlantTrendSeries('plant2'),
    lowComplianceUsers: [
      { id: 21, name: 'Isabella Ruiz', area: 'Maintenance', compliance: 48 },
      { id: 22, name: 'Liam Davis', area: 'Common Areas', compliance: 57 },
    ],
  },
};

const defaultPlantInsight: PlantInsight = {
  metrics: {
    overallCompliance: 0,
    activeUsers: 0,
    usersWithoutChecklist: 0,
  },
  areaTrend: createAreaTrendForPlant(0),
  plantTrend: createPlantTrendSeries('plant3'),
  lowComplianceUsers: [],
};

export default function InsightsPage() {
  const [selectedFilter, setSelectedFilter] = useState('Week');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([
    { id: 1, name: 'Plant 1', hasData: true },
    { id: 2, name: 'Plant 2', hasData: true },
    { id: 3, name: 'Plant 3', hasData: false },
  ]);
  const [selectedPlant, setSelectedPlant] = useState<number | 'all'>('all');
  const [plantInsightsState, setPlantInsightsState] = useState<Record<number, PlantInsight>>(plantInsightsData);

  const aggregatedInsight = {
    metrics: aggregatedMetrics,
    areaTrend: aggregatedAreaTrend,
    plantTrend: aggregatedPlantTrend,
    lowComplianceUsers: aggregatedLowComplianceUsers,
    isAll: true as const,
  };

  const selectedInsight =
    selectedPlant === 'all'
      ? aggregatedInsight
      : {
          ...(plantInsightsState[selectedPlant as number] ?? defaultPlantInsight),
          isAll: false as const,
        };

  const { overallCompliance, activeUsers, usersWithoutChecklist } = selectedInsight.metrics;

  const handlePlantCreate = (name: string) => {
    const newPlant: Plant = {
      id: Date.now(),
      name,
      hasData: false,
    };
    setPlants([...plants, newPlant]);
    setPlantInsightsState({
      ...plantInsightsState,
      [newPlant.id]: {
        metrics: {
          overallCompliance: 0,
          activeUsers: 0,
          usersWithoutChecklist: 0,
        },
        areaTrend: createAreaTrendForPlant(0),
        plantTrend: createPlantTrendSeries('plant3'),
        lowComplianceUsers: [],
      },
    });
    setSelectedPlant(newPlant.id);
  };

  const handlePlantEdit = (id: number, name: string) => {
    setPlants(plants.map(p => p.id === id ? { ...p, name } : p));
  };

  const handlePlantDelete = (id: number) => {
    setPlants(plants.filter(p => p.id !== id));
    const { [id]: _, ...restInsights } = plantInsightsState;
    setPlantInsightsState(restInsights);
    if (selectedPlant === id) {
      setSelectedPlant('all');
    }
  };

  const selectedPlantName =
    selectedPlant === 'all'
      ? 'ALL'
      : plants.find((plant) => plant.id === selectedPlant)?.name || 'Plant';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
          <p className="text-gray-600 mt-1">Visibility into your business operations</p>
        </div>
        
        <div className="flex flex-col items-end gap-3">
          {/* Plant Selector */}
          <PlantSelector
            plants={plants}
            selectedPlant={selectedPlant}
            onPlantChange={setSelectedPlant}
            onPlantCreate={handlePlantCreate}
            onPlantEdit={handlePlantEdit}
            onPlantDelete={handlePlantDelete}
          />
          
          {/* Filter Buttons */}
          <div className="flex items-center gap-2">
            {filterOptions.map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setSelectedFilter(filter);
                  if (filter === 'Custom Range') {
                    setShowCustomRange(true);
                  } else {
                    setShowCustomRange(false);
                  }
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Range Picker */}
      {showCustomRange && (
        <div className="bg-white p-4 rounded-lg border border-gray-200 flex items-center gap-4">
          <Calendar className="text-gray-400" size={20} />
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="Start date"
          />
          <span className="text-gray-400">to</span>
          <input
            type="date"
            className="px-3 py-2 border border-gray-300 rounded-lg"
            placeholder="End date"
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Apply
          </button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main KPI - Cumplimiento Operativo */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Operational Compliance</h3>
            <TrendingUp className="text-blue-600" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{overallCompliance}%</span>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${overallCompliance}%` }}
              />
            </div>
          </div>
        </div>

        {/* Usuarios Activos */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
            <Users className="text-green-600" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{activeUsers}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Employees with assigned checklist</p>
        </div>

        {/* Sin Checklist */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Without Checklist</h3>
            <AlertCircle className="text-orange-600" size={20} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900">{usersWithoutChecklist}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Employees without assigned checklist</p>
        </div>
      </div>

      {/* Charts and Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Chart by Area */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Trend by Area
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={selectedInsight.areaTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="general" stroke="#3b82f6" strokeWidth={2} name="General" />
              <Line type="monotone" dataKey="operacion" stroke="#10b981" strokeWidth={2} name="Operations" />
              <Line type="monotone" dataKey="cocina" stroke="#f59e0b" strokeWidth={2} name="Kitchen" />
              <Line type="monotone" dataKey="limpieza" stroke="#8b5cf6" strokeWidth={2} name="Cleaning" />
              <Line type="monotone" dataKey="mantenimiento" stroke="#ef4444" strokeWidth={2} name="Maintenance" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Trend Chart by Plant */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Compliance Trend by Plant
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            {selectedInsight.isAll ? (
              <LineChart data={selectedInsight.plantTrend as typeof aggregatedPlantTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="plant1" stroke="#3b82f6" strokeWidth={2} name="Plant 1" />
                <Line type="monotone" dataKey="plant2" stroke="#10b981" strokeWidth={2} name="Plant 2" />
                <Line type="monotone" dataKey="plant3" stroke="#f59e0b" strokeWidth={2} name="Plant 3" />
              </LineChart>
            ) : (
              <LineChart data={selectedInsight.plantTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name={`${selectedPlantName} Compliance`}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* Low Compliance Users List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Lowest Compliance
            </h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
              <Download size={16} />
              Export
            </button>
          </div>
          <div className="space-y-3">
            {selectedInsight.lowComplianceUsers.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">
                No compliance alerts for this plant.
              </p>
            ) : (
              selectedInsight.lowComplianceUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.area}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-lg font-semibold text-gray-900">{user.compliance}%</span>
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          user.compliance < 50 ? 'bg-red-500' : 'bg-orange-500'
                        }`}
                        style={{ width: `${user.compliance}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

