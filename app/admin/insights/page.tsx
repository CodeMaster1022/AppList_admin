'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Users, AlertCircle, Calendar, Download } from 'lucide-react';
import PlantSelector, { Plant } from '@/components/PlantSelector';
import { api } from '@/lib/api';

const filterOptions = ['Day', 'Week', 'Month', 'Year', 'Custom Range'];

export default function InsightsPage() {
  const [selectedFilter, setSelectedFilter] = useState('Week');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<string | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<any>(null);

  // Load plants
  useEffect(() => {
    const loadPlants = async () => {
      try {
        const plantsData = await api.plants.getAll();
        const normalizedPlants: Plant[] = plantsData.map((p: any) => ({
          _id: p._id,
          id: p._id,
          name: p.name,
        }));
        setPlants(normalizedPlants);
      } catch (error) {
        console.error('Failed to load plants:', error);
      }
    };
    loadPlants();
  }, []);

  // Load insights
  useEffect(() => {
    const loadInsights = async () => {
      setLoading(true);
      try {
        const period = selectedFilter.toLowerCase() === 'day' ? 'day' :
                      selectedFilter.toLowerCase() === 'week' ? 'week' :
                      selectedFilter.toLowerCase() === 'month' ? 'month' :
                      selectedFilter.toLowerCase() === 'year' ? 'year' : 'month';
        
        const plantId = selectedPlant === 'all' ? undefined : selectedPlant;
        const data = await api.insights.get(plantId, period);
        setInsights(data);
      } catch (error) {
        console.error('Failed to load insights:', error);
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, [selectedPlant, selectedFilter]);

  const handlePlantCreate = async (name: string) => {
    try {
      const newPlant = await api.plants.create({ name });
      const normalizedPlant: Plant = {
        _id: newPlant._id,
        id: newPlant._id,
        name: newPlant.name,
      };
      setPlants([...plants, normalizedPlant]);
    } catch (error: any) {
      alert(error.message || 'Failed to create plant');
    }
  };

  const handlePlantEdit = async (id: string, name: string) => {
    try {
      const updatedPlant = await api.plants.update(id, { name });
      setPlants(plants.map(p => {
        const plantId = p._id || p.id;
        return plantId === id ? { ...p, name: updatedPlant.name } : p;
      }));
    } catch (error: any) {
      alert(error.message || 'Failed to update plant');
    }
  };

  const handlePlantDelete = async (id: string) => {
    try {
      await api.plants.delete(id);
      setPlants(plants.filter(p => (p._id || p.id) !== id));
      if (selectedPlant === id) {
        setSelectedPlant('all');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete plant');
    }
  };

  if (loading && !insights) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading insights...</p>
        </div>
      </div>
    );
  }

  const kpis = insights?.kpis || { operationalCompliance: 0, activeUsers: 0, usersWithoutChecklist: 0 };
  const lowComplianceUsers = insights?.lowComplianceUsers || [];
  const complianceTrends = insights?.complianceTrends || [];
  const complianceByPlant = insights?.complianceByPlant || [];

  // Get unique lanes from compliance trends data
  const getUniqueLanes = () => {
    const lanes = new Set<string>();
    complianceTrends.forEach((point: any) => {
      Object.keys(point).forEach(key => {
        if (key !== 'date' && key !== 'general') {
          lanes.add(key);
        }
      });
    });
    return Array.from(lanes);
  };

  const uniqueLanes = getUniqueLanes();
  
  // Create chart data with all lanes found in the data
  const areaTrendData = complianceTrends.map((point: any) => {
    const dataPoint: any = {
      date: point.date,
      general: point.general || 0,
    };
    
    // Add all lanes dynamically
    uniqueLanes.forEach(lane => {
      dataPoint[lane] = point[lane] || 0;
    });
    
    return dataPoint;
  });
  
  // Line colors for different lanes
  const lineColors = ['#82ca9d', '#ffc658', '#ff7300', '#0088fe', '#00c49f', '#ffbb28', '#ff8042', '#8884d8'];

  // Transform plant compliance for chart
  const plantComplianceData = complianceByPlant.map((p: any) => ({
    plant: p.plant,
    compliance: p.compliance,
  }));

  return (
    <div className="space-y-8">
      {/* Header with Plant Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Insights</h1>
        <div className="flex items-center gap-4">
          <PlantSelector
            plants={plants}
            selectedPlant={selectedPlant}
            onPlantChange={setSelectedPlant}
            onPlantCreate={handlePlantCreate}
            onPlantEdit={handlePlantEdit}
            onPlantDelete={handlePlantDelete}
          />
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {filterOptions.map((filter) => (
          <button
            key={filter}
            onClick={() => {
              setSelectedFilter(filter);
              if (filter !== 'Custom Range') {
                setShowCustomRange(false);
              } else {
                setShowCustomRange(true);
              }
            }}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedFilter === filter
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Operational Compliance</h3>
            <TrendingUp className="text-green-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.operationalCompliance}%</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Active Users</h3>
            <Users className="text-blue-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.activeUsers}</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">Without Checklist</h3>
            <AlertCircle className="text-yellow-600" size={20} />
          </div>
          <p className="text-3xl font-bold text-gray-900">{kpis.usersWithoutChecklist}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance Trend by Area */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Trend by Area</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={areaTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="general" stroke="#8884d8" name="General" strokeWidth={2} />
              {uniqueLanes.map((lane, index) => {
                const displayName = lane.charAt(0).toUpperCase() + lane.slice(1);
                return (
                  <Line
                    key={lane}
                    type="monotone"
                    dataKey={lane}
                    stroke={lineColors[index % lineColors.length]}
                    name={displayName}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance by Plant */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance by Plant</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={plantComplianceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plant" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="compliance" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Compliance Users */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Low Compliance Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Name</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Area</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {lowComplianceUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-8 text-gray-500">
                    No users with low compliance
                  </td>
                </tr>
              ) : (
                lowComplianceUsers.map((user: any) => (
                  <tr key={user._id || user.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-gray-900">{user.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.subArea || user.area || 'N/A'}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`font-medium ${(user.compliance || 0) < 50 ? 'text-red-600' : 'text-yellow-600'}`}>
                        {user.compliance || 0}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
