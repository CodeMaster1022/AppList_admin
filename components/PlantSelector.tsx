'use client';

import { useState } from 'react';
import { ChevronDown, Plus, Edit, Trash2, Building2 } from 'lucide-react';

export interface Plant {
  id: number;
  name: string;
  hasData?: boolean;
}

interface PlantSelectorProps {
  plants: Plant[];
  selectedPlant: number | 'all';
  onPlantChange: (plantId: number | 'all') => void;
  onPlantCreate: (name: string) => void;
  onPlantEdit: (id: number, name: string) => void;
  onPlantDelete: (id: number) => void;
}

export default function PlantSelector({
  plants,
  selectedPlant,
  onPlantChange,
  onPlantCreate,
  onPlantEdit,
  onPlantDelete,
}: PlantSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPlant, setEditingPlant] = useState<Plant | null>(null);
  const [deletingPlant, setDeletingPlant] = useState<Plant | null>(null);
  const [newPlantName, setNewPlantName] = useState('');
  const [editPlantName, setEditPlantName] = useState('');

  const selectedPlantName = selectedPlant === 'all' 
    ? 'ALL' 
    : plants.find(p => p.id === selectedPlant)?.name || 'ALL';

  const handleCreate = () => {
    if (newPlantName.trim()) {
      onPlantCreate(newPlantName.trim());
      setNewPlantName('');
      setShowCreateModal(false);
    }
  };

  const handleEdit = () => {
    if (editingPlant && editPlantName.trim()) {
      onPlantEdit(editingPlant.id, editPlantName.trim());
      setEditPlantName('');
      setShowEditModal(false);
      setEditingPlant(null);
    }
  };

  const handleDelete = () => {
    if (deletingPlant) {
      onPlantDelete(deletingPlant.id);
      setShowDeleteModal(false);
      setDeletingPlant(null);
      if (selectedPlant === deletingPlant.id) {
        onPlantChange('all');
      }
    }
  };

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <Building2 size={18} className="text-gray-600" />
          <span className="font-medium text-gray-900">{selectedPlantName}</span>
          <ChevronDown size={18} className="text-gray-600" />
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute right-0 mt-2 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
              <div className="p-2">
                <button
                  onClick={() => {
                    onPlantChange('all');
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedPlant === 'all'
                      ? 'bg-blue-50 text-blue-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  ALL
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(true);
                    setIsOpen(false);
                  }}
                  className="w-full mt-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Plus size={16} />
                  Add Plant
                </button>
                {plants.map((plant) => (
                  <div
                    key={plant.id}
                    className="group flex items-center justify-between px-3 py-2 rounded-lg hover:bg-gray-100"
                  >
                    <button
                      onClick={() => {
                        onPlantChange(plant.id);
                        setIsOpen(false);
                      }}
                      className={`flex-1 text-left transition-colors ${
                        selectedPlant === plant.id
                          ? 'text-blue-600 font-medium'
                          : 'text-gray-700'
                      }`}
                    >
                      {plant.name}
                    </button>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingPlant(plant);
                          setEditPlantName(plant.name);
                          setShowEditModal(true);
                        }}
                        className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Edit plant"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingPlant(plant);
                          setShowDeleteModal(true);
                        }}
                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Delete plant"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Create Plant</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant Name
              </label>
              <input
                type="text"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter plant name"
                autoFocus
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlantName('');
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingPlant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Edit Plant</h2>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plant Name
              </label>
              <input
                type="text"
                value={editPlantName}
                onChange={(e) => setEditPlantName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEdit();
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter plant name"
                autoFocus
              />
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditPlantName('');
                  setEditingPlant(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && deletingPlant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Delete Plant</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                Are you sure you want to delete &quot;{deletingPlant.name}&quot;?
              </p>
              {deletingPlant.hasData && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>Warning:</strong> This plant has operational data. Deleting it will remove all associated information including lanes, checklists, and user assignments.
                  </p>
                </div>
              )}
              <p className="text-sm text-gray-600">
                This action cannot be undone.
              </p>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingPlant(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

