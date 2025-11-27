'use client';

import { useState } from 'react';
import { Plus, Edit, Trash2, UserPlus, Search, Filter, Download, CheckCircle, XCircle } from 'lucide-react';
import PlantSelector, { Plant } from '@/components/PlantSelector';

// Mock data
const initialUsers = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@restaurant.com',
    lane: 'Operations',
    subArea: 'Reception',
    role: 'Hosts',
    checklist: 'Checklist Reception - Hosts',
    compliance: 92,
    status: 'active',
    plantId: 1,
  },
  {
    id: 2,
    name: 'Mary Johnson',
    email: 'mary.johnson@restaurant.com',
    lane: 'Kitchen',
    subArea: 'Hot Kitchen',
    role: 'Chef',
    checklist: 'Checklist Kitchen - Chef',
    compliance: 88,
    status: 'active',
    plantId: 1,
  },
  {
    id: 3,
    name: 'Carlos Lopez',
    email: 'carlos.lopez@restaurant.com',
    lane: null,
    subArea: null,
    role: null,
    checklist: null,
    compliance: null,
    status: 'active',
    plantId: 1,
  },
  {
    id: 4,
    name: 'Anna Martinez',
    email: 'anna.martinez@restaurant.com',
    lane: 'Cleaning',
    subArea: 'General Cleaning',
    role: 'Cleaning Staff',
    checklist: 'Checklist Cleaning - General',
    compliance: 75,
    status: 'active',
    plantId: 2,
  },
  {
    id: 5,
    name: 'Peter Sanchez',
    email: 'peter.sanchez@restaurant.com',
    lane: null,
    subArea: null,
    role: null,
    checklist: null,
    compliance: null,
    status: 'active',
    plantId: 2,
  },
  {
    id: 6,
    name: 'Laura Rodriguez',
    email: 'laura.rodriguez@restaurant.com',
    lane: 'Operations',
    subArea: 'Valet Parking',
    role: 'Waiters',
    checklist: 'Checklist Operations - Waiters',
    compliance: 95,
    status: 'active',
    plantId: 2,
  },
];

export default function UsersPage() {
  const [showUserModal, setShowUserModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [plants, setPlants] = useState<Plant[]>([
    { id: 1, name: 'Plant 1', hasData: true },
    { id: 2, name: 'Plant 2', hasData: true },
  ]);
  const [selectedPlant, setSelectedPlant] = useState<number | 'all'>('all');
  const [users, setUsers] = useState(initialUsers);
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
    setUsers(users.filter(user => user.plantId !== id));
    if (selectedPlant === id) {
      setSelectedPlant('all');
    }
  };

  const plantFilteredUsers = selectedPlant === 'all'
    ? users
    : users.filter((user) => user.plantId === selectedPlant);

  const filteredUsers = plantFilteredUsers.filter((user) => {
    const matchesFilter =
      filter === 'all' ||
      (filter === 'assigned' && user.checklist !== null) ||
      (filter === 'unassigned' && user.checklist === null);
    
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const assignedUsers = plantFilteredUsers.filter((u) => u.checklist !== null);
  const unassignedUsers = plantFilteredUsers.filter((u) => u.checklist === null);

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
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
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
                          {user.role}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {user.checklist ? (
                      <span className="text-sm text-gray-900">{user.checklist}</span>
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
                        {user.checklist ? 'Reassign' : 'Assign'}
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <Edit size={16} />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Creation Modal */}
      {showUserModal && (
        <UserModal onClose={() => setShowUserModal(false)} />
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && selectedUser && (
        <AssignmentModal
          user={selectedUser}
          onClose={() => {
            setShowAssignmentModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </div>
  );
}

// User Creation Modal
function UserModal({ onClose }: { onClose: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    position: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle user creation
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">New User</h2>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Create User
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Assignment Modal
function AssignmentModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [selectedLane, setSelectedLane] = useState(user.lane || '');
  const [selectedSubArea, setSelectedSubArea] = useState(user.subArea || '');
  const [selectedRole, setSelectedRole] = useState(user.role || '');
  const [selectedChecklist, setSelectedChecklist] = useState(user.checklist || '');

  const handleAssign = () => {
    // Handle assignment
    onClose();
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lane</label>
              <select
                value={selectedLane}
                onChange={(e) => setSelectedLane(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="operacion">Operations</option>
                <option value="cocina">Kitchen</option>
                <option value="areas-comunes">Common Areas</option>
                <option value="limpieza">Cleaning</option>
                <option value="mantenimiento">Maintenance</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sub-area</label>
              <select
                value={selectedSubArea}
                onChange={(e) => setSelectedSubArea(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!selectedLane}
              >
                <option value="">Select...</option>
                {selectedLane && (
                  <>
                    <option value="recepcion">Recepción</option>
                    <option value="valet">Valet Parking</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rol</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!selectedLane}
              >
                <option value="">Select...</option>
                {selectedLane && (
                  <>
                    <option value="meseros">Waiters</option>
                    <option value="hosts">Hosts</option>
                    <option value="supervisores">Supervisors</option>
                  </>
                )}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Checklist</label>
              <select
                value={selectedChecklist}
                onChange={(e) => setSelectedChecklist(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!selectedLane || !selectedSubArea || !selectedRole}
              >
                <option value="">Select...</option>
                {selectedLane && selectedSubArea && selectedRole && (
                  <>
                    <option value="checklist-1">Checklist Reception - Hosts</option>
                    <option value="checklist-2">Checklist Operations - Waiters</option>
                  </>
                )}
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
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            {user.checklist ? 'Reassign' : 'Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}

