'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, UserPlus, Search, Filter, Download, CheckCircle, XCircle } from 'lucide-react';
import PlantSelector, { Plant } from '@/components/PlantSelector';
import { api } from '@/lib/api';

export default function UsersPage() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<string | 'all'>('all');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load plants and users
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load plants
        const plantsData = await api.plants.getAll();
        const normalizedPlants: Plant[] = plantsData.map((p: any) => ({
          _id: p._id,
          id: p._id,
          name: p.name,
        }));
        setPlants(normalizedPlants);

        // Load users
        const usersData = await api.users.getAll();
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Reload users when plant changes
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const usersData = await api.users.getAll(selectedPlant === 'all' ? undefined : selectedPlant);
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    if (!loading) {
      loadUsers();
    }
  }, [selectedPlant, loading]);

  const handlePlantCreate = async (name: string) => {
    try {
      const newPlant = await api.plants.create({ name });
      const normalizedPlant: Plant = {
        _id: newPlant._id,
        id: newPlant._id,
        name: newPlant.name,
      };
      setPlants([...plants, normalizedPlant]);
      setSelectedPlant(normalizedPlant._id || normalizedPlant.id || 'all');
    } catch (error: any) {
      alert(error.message || 'Failed to create plant');
    }
  };

  const handlePlantEdit = async (id: string, name: string) => {
    try {
      const updatedPlant = await api.plants.update(id, { name });
      setPlants(plants.map(p => {
        const pId = p._id || p.id;
        return pId === id ? { ...p, name: updatedPlant.name } : p;
      }));
    } catch (error: any) {
      alert(error.message || 'Failed to update plant');
    }
  };

  const handlePlantDelete = async (id: string) => {
    try {
      await api.plants.delete(id);
      setPlants(plants.filter(p => (p._id || p.id) !== id));
      setUsers(users.filter(u => {
        const plantId = u.plantId ? (typeof u.plantId === 'object' ? u.plantId._id : u.plantId) : null;
        return plantId !== id;
      }));
      if (selectedPlant === id) {
        setSelectedPlant('all');
      }
    } catch (error: any) {
      alert(error.message || 'Failed to delete plant');
    }
  };

  const plantFilteredUsers = selectedPlant === 'all'
    ? users
    : users.filter((user) => {
        if (!user.plantId) return false;
        const plantId = typeof user.plantId === 'object' ? user.plantId._id : user.plantId;
        return plantId === selectedPlant;
      });

  const filteredUsers = plantFilteredUsers.filter((user) => {
    const hasChecklist = user.lane && user.subArea && user.roleName;
    const matchesFilter =
      filter === 'all' ||
      (filter === 'assigned' && hasChecklist) ||
      (filter === 'unassigned' && !hasChecklist);
    
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const assignedUsers = plantFilteredUsers.filter((u) => u.lane && u.subArea && u.roleName);
  const unassignedUsers = plantFilteredUsers.filter((u) => !u.lane || !u.subArea || !u.roleName);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-600 mt-1">User management and checklist assignment</p>
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
          <button
            onClick={() => setShowUserModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            New User
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{plantFilteredUsers.length}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <UserPlus className="text-blue-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">With Checklist</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{assignedUsers.length}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Without Checklist</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{unassignedUsers.length}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <XCircle className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'assigned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              With Checklist
            </button>
            <button
              onClick={() => setFilter('unassigned')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unassigned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Without Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Checklist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                      <span className="text-gray-600">Loading users...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userId = user._id || user.id || '';
                  return (
                    <tr key={userId} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      {user.compliance !== null && (
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${
                            user.compliance >= 90
                              ? 'text-green-600'
                              : user.compliance >= 70
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {user.compliance}%
                          </div>
                          <div className="text-xs text-gray-500">Compliance</div>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.lane ? (
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                          {user.lane}
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                          {user.subArea}
                        </span>
                        <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded">
                          {user.roleName || user.role}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.lane && user.subArea && user.roleName ? (
                      <span className="text-sm text-gray-900">Assigned</span>
                    ) : (
                      <span className="text-sm text-orange-600 font-medium">No checklist</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.compliance !== null ? (
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            user.compliance >= 90
                              ? 'bg-green-500'
                              : user.compliance >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                          }`}
                          style={{ width: `${user.compliance}%` }}
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignmentModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {user.lane && user.subArea && user.roleName ? 'Reassign' : 'Assign'}
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete "${user.name}"?`)) {
                            try {
                              await api.users.delete(userId);
                              setUsers(users.filter(u => (u._id || u.id) !== userId));
                            } catch (error: any) {
                              alert(error.message || 'Failed to delete user');
                            }
                          }
                        }}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 size={16} />
                      </button>
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

      {/* User Creation Modal */}
      {showUserModal && (
        <UserModal 
          editingUser={selectedUser}
          plants={plants}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={() => {
            // Reload users
            const loadUsers = async () => {
              try {
                const usersData = await api.users.getAll(selectedPlant === 'all' ? undefined : selectedPlant);
                setUsers(usersData);
              } catch (error) {
                console.error('Failed to reload users:', error);
              }
            };
            loadUsers();
          }}
        />
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedUser && (
        <AssignmentModal
          user={selectedUser}
          plants={plants}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedUser(null);
          }}
          onSave={() => {
            // Reload users
            const loadUsers = async () => {
              try {
                const usersData = await api.users.getAll(selectedPlant === 'all' ? undefined : selectedPlant);
                setUsers(usersData);
              } catch (error) {
                console.error('Failed to reload users:', error);
              }
            };
            loadUsers();
          }}
        />
      )}
    </div>
  );
}

// User Creation Modal
function UserModal({ onClose, editingUser, onSave, plants }: { 
  onClose: () => void; 
  editingUser?: any;
  onSave?: () => void;
  plants?: Plant[];
}) {
  const [formData, setFormData] = useState({
    name: editingUser?.name || '',
    email: editingUser?.email || '',
    phone: editingUser?.phone || '',
    password: '',
    role: editingUser?.role || 'user',
    plantId: editingUser?.plantId 
      ? (typeof editingUser.plantId === 'object' ? editingUser.plantId._id : editingUser.plantId)
      : '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingUser) {
        const userId = editingUser._id || editingUser.id;
        await api.users.update(userId, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          ...(formData.password && { password: formData.password }),
          ...(formData.plantId && { plantId: formData.plantId }),
        });
      } else {
        // Use admin register endpoint
        await api.auth.registerAdmin({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password,
          role: formData.role,
          ...(formData.plantId && { plantId: formData.plantId }),
        });
      }
      if (onSave) onSave();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">{editingUser ? 'Edit User' : 'New User'}</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {!editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {editingUser && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password (leave blank to keep current)
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plant (Optional)
            </label>
            <select
              value={formData.plantId || ''}
              onChange={(e) => setFormData({ ...formData, plantId: e.target.value || undefined })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">No Plant Assigned</option>
              {plants?.map((plant) => (
                <option key={plant._id || plant.id} value={plant._id || plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Assignment Modal
function AssignmentModal({ user, onClose, onSave, plants }: { 
  user: any; 
  onClose: () => void;
  onSave?: () => void;
  plants?: Plant[];
}) {
  const [selectedLane, setSelectedLane] = useState(user.lane || '');
  const [selectedSubArea, setSelectedSubArea] = useState(user.subArea || '');
  const [selectedRole, setSelectedRole] = useState(user.roleName || user.role || '');
  const [selectedPlant, setSelectedPlant] = useState<string>(
    user.plantId ? (typeof user.plantId === 'object' ? user.plantId._id : user.plantId) : ''
  );
  const [lanes, setLanes] = useState<any[]>([]);
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Load lanes and checklists when plant changes
  useEffect(() => {
    const loadData = async () => {
      if (selectedPlant) {
        try {
          const lanesData = await api.lanes.getAll(selectedPlant);
          setLanes(lanesData);
          const checklistsData = await api.checklists.getAll(selectedPlant);
          setChecklists(checklistsData);
        } catch (error) {
          console.error('Failed to load assignment data:', error);
        }
      } else {
        setLanes([]);
        setChecklists([]);
        setSelectedLane('');
        setSelectedSubArea('');
        setSelectedRole('');
      }
    };
    loadData();
  }, [selectedPlant]);

  const selectedLaneData = lanes.find(l => l.name === selectedLane);
  const availableChecklists = checklists.filter(c => 
    c.lane === selectedLane && 
    c.area === selectedSubArea && 
    c.role === selectedRole
  );

  const handleAssign = async () => {
    if (!selectedPlant) {
      alert('Please select a plant first');
      return;
    }
    if (!selectedLane || !selectedSubArea || !selectedRole) {
      alert('Please select lane, sub-area, and role');
      return;
    }
    
    setLoading(true);
    try {
      const userId = user._id || user.id;
      await api.users.update(userId, {
        plantId: selectedPlant,
        lane: selectedLane,
        subArea: selectedSubArea,
        roleName: selectedRole,
      });
      if (onSave) onSave();
      onClose();
    } catch (error: any) {
      alert(error.message || 'Failed to assign user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {user.checklist ? 'Reassign' : 'Assign'} Checklist to {user.name}
          </h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Plant *</label>
            <select
              value={selectedPlant}
              onChange={(e) => {
                setSelectedPlant(e.target.value);
                setSelectedLane('');
                setSelectedSubArea('');
                setSelectedRole('');
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a plant...</option>
              {plants?.map((plant) => (
                <option key={plant._id || plant.id} value={plant._id || plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">Select a plant to see available lanes and checklists</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lane</label>
              <select
                value={selectedLane}
                onChange={(e) => {
                  setSelectedLane(e.target.value);
                  setSelectedSubArea('');
                  setSelectedRole('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!selectedPlant}
              >
                <option value="">Select...</option>
                {lanes.map((lane) => (
                  <option key={lane._id || lane.id} value={lane.name}>
                    {lane.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub-area</label>
              <select
                value={selectedSubArea}
                onChange={(e) => {
                  setSelectedSubArea(e.target.value);
                  setSelectedRole('');
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!selectedLane || !selectedPlant}
              >
                <option value="">Select...</option>
                {selectedLaneData?.subAreas.map((subArea: any) => (
                  <option key={subArea._id || subArea.id || subArea.name} value={subArea.name}>
                    {subArea.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!selectedLane || !selectedPlant}
              >
                <option value="">Select...</option>
                {selectedLaneData?.roles.map((role: string, index: number) => (
                  <option key={index} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Available Checklists</label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-50"
                disabled
              >
                <option value="">
                  {availableChecklists.length > 0 
                    ? `${availableChecklists.length} checklist(s) available`
                    : 'No checklists available for this combination'}
                </option>
              </select>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              When assigning a checklist, the user will be automatically associated with the selected lane and sub-area.
            </p>
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
            onClick={handleAssign}
            disabled={loading || !selectedPlant || !selectedLane || !selectedSubArea || !selectedRole}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : (user.lane && user.subArea && user.roleName ? 'Reassign' : 'Assign')}
          </button>
        </div>
      </div>
    </div>
  );
}

