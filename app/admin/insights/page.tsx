'use client';

import { useState, useEffect } from 'react';
import { LineChart, Line, Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
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
  
  // Beautiful gradient colors for different lanes
  const lineColors = [
    { stroke: '#3b82f6', fill: 'url(#colorBlue)' },      // Blue
    { stroke: '#10b981', fill: 'url(#colorGreen)' },     // Green
    { stroke: '#f59e0b', fill: 'url(#colorAmber)' },     // Amber
    { stroke: '#8b5cf6', fill: 'url(#colorPurple)' },    // Purple
    { stroke: '#ef4444', fill: 'url(#colorRed)' },       // Red
    { stroke: '#06b6d4', fill: 'url(#colorCyan)' },      // Cyan
    { stroke: '#ec4899', fill: 'url(#colorPink)' },      // Pink
    { stroke: '#6366f1', fill: 'url(#colorIndigo)' },   // Indigo
  ];

  // Bar chart colors with gradient
  const barColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#6366f1'];

  // Transform plant compliance for chart
  const plantComplianceData = complianceByPlant.map((p: any) => ({
    plant: p.plant,
    compliance: p.compliance,
  }));

  return (
    <div className="space-y-4">
      {/* Header with Plant Selector */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
        <div className="flex items-center gap-2">
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
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
              selectedFilter === filter
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-white to-green-50 rounded-lg shadow-md border border-green-100/50 p-3 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Operational Compliance</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.operationalCompliance}%</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
              <TrendingUp className="text-white" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-md border border-blue-100/50 p-3 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Active Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.activeUsers}</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <Users className="text-white" size={18} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-white to-orange-50 rounded-lg shadow-md border border-orange-100/50 p-3 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Without Checklist</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{kpis.usersWithoutChecklist}</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm">
              <AlertCircle className="text-white" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Compliance Trend by Area */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Compliance Trend by Area</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={areaTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGeneral" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorGreen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAmber" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPurple" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorCyan" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorPink" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ec4899" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorIndigo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis 
                dataKey="date" 
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#374151', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}
                itemStyle={{ color: '#6b7280', fontSize: '12px' }}
                formatter={(value: any) => [`${value}%`, 'Compliance']}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '11px' }}
                iconType="line"
              />
              <Area 
                type="monotone" 
                dataKey="general" 
                stroke="#6366f1" 
                strokeWidth={2.5}
                fill="url(#colorGeneral)" 
                name="General"
                dot={{ fill: '#6366f1', r: 3 }}
                activeDot={{ r: 5 }}
              />
              {uniqueLanes.map((lane, index) => {
                const displayName = lane.charAt(0).toUpperCase() + lane.slice(1);
                const color = lineColors[index % lineColors.length];
                return (
                  <Area
                    key={lane}
                    type="monotone"
                    dataKey={lane}
                    stroke={color.stroke}
                    strokeWidth={2.5}
                    fill={color.fill}
                    name={displayName}
                    dot={{ fill: color.stroke, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Compliance by Plant */}
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Compliance by Plant</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={plantComplianceData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                {barColors.map((color, index) => (
                  <linearGradient key={index} id={`barGradient${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.8}/>
                    <stop offset="100%" stopColor={color} stopOpacity={0.4}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} vertical={false} />
              <XAxis 
                dataKey="plant" 
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                domain={[0, 100]} 
                stroke="#6b7280"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  padding: '8px 12px',
                }}
                labelStyle={{ color: '#374151', fontWeight: 600, fontSize: '12px', marginBottom: '4px' }}
                itemStyle={{ color: '#6b7280', fontSize: '12px' }}
                formatter={(value: any) => [`${value}%`, 'Compliance']}
              />
              <Bar 
                dataKey="compliance" 
                radius={[8, 8, 0, 0]}
                strokeWidth={1}
              >
                {plantComplianceData.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={`url(#barGradient${index % barColors.length})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Compliance Users */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-4 py-3 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">Low Compliance Users</h2>
            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded-full border border-gray-200">
              {lowComplianceUsers.length} {lowComplianceUsers.length === 1 ? 'user' : 'users'}
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50/50 to-indigo-50/50 border-b-2 border-blue-100">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                    Name
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                    Area
                  </div>
                </th>
                <th className="text-right px-4 py-3 text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
                    Compliance
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {lowComplianceUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <AlertCircle className="text-gray-400" size={24} />
                      </div>
                      <p className="text-sm font-medium text-gray-600">No users with low compliance</p>
                      <p className="text-xs text-gray-400 mt-1">All users are meeting compliance standards</p>
                    </div>
                  </td>
                </tr>
              ) : (
                lowComplianceUsers.map((user: any, index: number) => {
                  const compliance = user.compliance || 0;
                  const isCritical = compliance < 50;
                  return (
                    <tr 
                      key={user._id || user.id} 
                      className="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/30 transition-all duration-200 group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                            isCritical 
                              ? 'bg-gradient-to-br from-red-500 to-red-600' 
                              : 'bg-gradient-to-br from-yellow-500 to-yellow-600'
                          }`}>
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-900">{user.name}</div>
                            {user.email && (
                              <div className="text-xs text-gray-500 mt-0.5">{user.email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-sm">
                          {user.subArea || user.area || 'N/A'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex-1 max-w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isCritical
                                  ? 'bg-gradient-to-r from-red-500 to-red-600'
                                  : 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                              }`}
                              style={{ width: `${compliance}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2 min-w-[60px] justify-end">
                            <span className={`text-sm font-bold ${
                              isCritical ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                              {compliance}%
                            </span>
                            {isCritical ? (
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
