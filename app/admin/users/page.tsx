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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-gray-500 text-xs mt-0.5">Manage users and assign checklists</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
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
            className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 flex items-center justify-center gap-1.5 text-sm font-medium shadow-md transition-all duration-200"
          >
            <Plus size={16} />
            <span>New User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-white to-blue-50 rounded-lg shadow-md border border-blue-100/50 p-3 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{plantFilteredUsers.length}</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm">
              <UserPlus className="text-white" size={18} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-green-50 rounded-lg shadow-md border border-green-100/50 p-3 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">With Checklist</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{assignedUsers.length}</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-sm">
              <CheckCircle className="text-white" size={18} />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-white to-orange-50 rounded-lg shadow-md border border-orange-100/50 p-3 hover:shadow-lg transition-all duration-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Without Checklist</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{unassignedUsers.length}</p>
            </div>
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-sm">
              <XCircle className="text-white" size={18} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 p-3">
        <div className="flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            />
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                filter === 'assigned'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              With Checklist
            </button>
            <button
              onClick={() => setFilter('unassigned')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                filter === 'unassigned'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Without Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  User
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Checklist
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Compliance
                </th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
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
                    <tr key={userId} className="hover:bg-blue-50/30 transition-colors duration-150">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-gray-900 truncate">{user.name}</div>
                        <div className="text-xs text-gray-500 truncate">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {user.lane ? (
                      <div className="flex flex-wrap gap-1">
                        <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded shadow-sm">
                          {user.lane}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-green-500 to-green-600 text-white rounded shadow-sm">
                          {user.subArea}
                        </span>
                        <span className="px-2 py-0.5 text-xs font-medium bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded shadow-sm">
                          {user.roleName || user.role}
                        </span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs text-gray-400 bg-gray-100 rounded">
                        Unassigned
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {user.lane && user.subArea && user.roleName ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-green-700 bg-green-100 rounded">
                        <CheckCircle size={12} className="mr-1" />
                        Assigned
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium text-orange-700 bg-orange-100 rounded">
                        <XCircle size={12} className="mr-1" />
                        No checklist
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {user.compliance !== null ? (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 max-w-20 bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              user.compliance >= 90
                                ? 'bg-gradient-to-r from-green-500 to-green-600'
                                : user.compliance >= 70
                                ? 'bg-gradient-to-r from-yellow-500 to-yellow-600'
                                : 'bg-gradient-to-r from-red-500 to-red-600'
                            }`}
                            style={{ width: `${user.compliance}%` }}
                          />
                        </div>
                        <span className={`text-xs font-semibold ${
                          user.compliance >= 90
                            ? 'text-green-600'
                            : user.compliance >= 70
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {user.compliance}%
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignmentModal(true);
                        }}
                        className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      >
                        {user.lane && user.subArea && user.roleName ? 'Reassign' : 'Assign'}
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedUser(user);
                          setShowUserModal(true);
                        }}
                        className="p-1 text-gray-600 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                        title="Edit user"
                      >
                        <Edit size={14} />
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                            try {
                              const userId = user._id || user.id;
                              await api.users.delete(userId);
                              setUsers(users.filter(u => (u._id || u.id) !== userId));
                            } catch (error: any) {
                              alert(error.message || 'Failed to delete user');
                            }
                          }
                        }}
                        className="p-1 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={14} />
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3">
          <h2 className="text-lg font-bold text-white">{editingUser ? 'Edit User' : 'Create New User'}</h2>
          <p className="text-blue-100 text-xs mt-0.5">{editingUser ? 'Update user information' : 'Add a new user to the system'}</p>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="Enter full name"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="user@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              placeholder="+1 (555) 123-4567"
            />
          </div>
          {!editingUser && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Minimum 6 characters"
              />
            </div>
          )}
          {editingUser && (
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                placeholder="Leave blank to keep current"
              />
              <p className="text-xs text-gray-400 mt-0.5">Leave blank to keep current password</p>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Plant
            </label>
            <select
              value={formData.plantId || ''}
              onChange={(e) => setFormData({ ...formData, plantId: e.target.value || undefined })}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
            >
              <option value="">No Plant Assigned</option>
              {plants?.map((plant) => (
                <option key={plant._id || plant.id} value={plant._id || plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-semibold shadow-md transition-all duration-200"
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-3">
          <h2 className="text-lg font-bold text-white">
            {user.checklist ? 'Reassign' : 'Assign'} Checklist to {user.name}
          </h2>
          <p className="text-blue-100 text-xs mt-0.5">Select plant, lane, sub-area, and role to assign checklists</p>
        </div>
        <div className="p-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Plant *</label>
            <select
              value={selectedPlant}
              onChange={(e) => {
                setSelectedPlant(e.target.value);
                setSelectedLane('');
                setSelectedSubArea('');
                setSelectedRole('');
              }}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
              required
            >
              <option value="">Select a plant...</option>
              {plants?.map((plant) => (
                <option key={plant._id || plant.id} value={plant._id || plant.id}>
                  {plant.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-0.5">Select a plant to see available lanes and checklists</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Lane</label>
              <select
                value={selectedLane}
                onChange={(e) => {
                  setSelectedLane(e.target.value);
                  setSelectedSubArea('');
                  setSelectedRole('');
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Sub-area</label>
              <select
                value={selectedSubArea}
                onChange={(e) => {
                  setSelectedSubArea(e.target.value);
                  setSelectedRole('');
                }}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Available Checklists</label>
              <select
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
                disabled
              >
                <option value="">
                  {availableChecklists.length > 0 
                    ? `${availableChecklists.length} checklist(s) available`
                    : 'No checklists available'}
                </option>
              </select>
            </div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-2.5">
            <p className="text-xs text-blue-800 font-medium">
              When assigning a checklist, the user will be automatically associated with the selected lane and sub-area.
            </p>
          </div>
        </div>
        <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={loading || !selectedPlant || !selectedLane || !selectedSubArea || !selectedRole}
            className="px-4 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 font-semibold shadow-md transition-all duration-200 disabled:shadow-none"
          >
            {loading ? 'Saving...' : (user.lane && user.subArea && user.roleName ? 'Reassign' : 'Assign')}
          </button>
        </div>
      </div>
    </div>
  );
}

