'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, CheckCircle, Circle, MapPin, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { isWithinGeofence, getDistanceToGeofence } from '@/lib/geofence';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface Checklist {
  _id: string;
  name: string;
  lane: string;
  area: string;
  role: string;
  requiresLocation: boolean;
  location?: {
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
  };
  activities: Array<{
    _id?: string;
    id?: string;
    name: string;
    requiresPhoto: boolean;
  }>;
}

interface Activity {
  _id?: string;
  id?: string;
  name: string;
  requiresPhoto: boolean;
  completed: boolean;
  photo: string | null;
  completedAt: Date | null;
}

export default function ChecklistPage() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [locationValidated, setLocationValidated] = useState(false);
  const [validatingLocation, setValidatingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load user's checklists
  useEffect(() => {
    const loadChecklists = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const checklistsData = await api.activities.getChecklists();
        setChecklists(checklistsData);
        
        // Auto-select first checklist if available
        if (checklistsData.length > 0) {
          const firstChecklist = checklistsData[0];
          setSelectedChecklist(firstChecklist);
          
          // Initialize activities from checklist
          // Check if activities are already completed today
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const initialActivities: Activity[] = firstChecklist.activities.map((act: any) => {
            const activityId = act._id?.toString() || act.id?.toString() || '';
            return {
              _id: activityId,
              id: activityId,
              name: act.name,
              requiresPhoto: act.requiresPhoto || false,
              completed: false, // Will be updated based on today's completions
              photo: null,
              completedAt: null,
            };
          });
          
          setActivities(initialActivities);
        }
      } catch (error) {
        console.error('Failed to load checklists:', error);
      } finally {
        setLoading(false);
      }
    };

    loadChecklists();
  }, [user]);

  if (!user) {
    return null;
  }

  // Validate location
  const validateLocation = async () => {
    if (!selectedChecklist?.requiresLocation || !selectedChecklist?.location) {
      setLocationValidated(true);
      return;
    }

    setValidatingLocation(true);
    setLocationError(null);

    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;
      const { latitude, longitude, radius } = selectedChecklist.location!;

      // Validate using API
      try {
        const validation = await api.geofence.validate(selectedChecklist._id, userLat, userLng);
        
        if (validation.valid) {
          setLocationValidated(true);
          setLocationError(null);
        } else {
          const distance = getDistanceToGeofence(userLat, userLng, latitude, longitude);
          setLocationError(
            `You are ${Math.round(distance)}m away from the required location. Please move closer to start activities.`
          );
          setLocationValidated(false);
        }
      } catch (apiError) {
        // Fallback to client-side validation
        if (isWithinGeofence(userLat, userLng, latitude, longitude, radius)) {
          setLocationValidated(true);
          setLocationError(null);
        } else {
          const distance = getDistanceToGeofence(userLat, userLng, latitude, longitude);
          setLocationError(
            `You are ${Math.round(distance)}m away from the required location. Please move closer to start activities.`
          );
          setLocationValidated(false);
        }
      }
    } catch (error: any) {
      console.error('Location error:', error);
      if (error.code === 1) {
        setLocationError('Location access denied. Please enable location services to continue.');
      } else if (error.code === 2) {
        setLocationError('Location unavailable. Please check your GPS settings.');
      } else {
        setLocationError('Unable to get your location. Please try again.');
      }
      setLocationValidated(false);
    } finally {
      setValidatingLocation(false);
    }
  };

  // Complete activity
  const completeActivity = async (activityId: string) => {
    const activity = activities.find(a => (a._id || a.id) === activityId);
    if (!activity || !selectedChecklist) return;

    // Check if photo is required
    if (activity.requiresPhoto && !activity.photo) {
      setSelectedActivity(activityId);
      setShowCamera(true);
      return;
    }

    try {
      // Get user's current location for completion
      let latitude: number | undefined;
      let longitude: number | undefined;

      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
          });
        });
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
      } catch (error) {
        // Location not available, continue without it
        console.warn('Could not get location for activity completion');
      }

      // Complete activity via API
      await api.activities.complete({
        checklistId: selectedChecklist._id,
        activityId: activityId,
        latitude,
        longitude,
        photo: activity.photo || undefined,
      });

      // Update local state
      setActivities(activities.map(a => {
        const aId = a._id || a.id;
        return aId === activityId
          ? { ...a, completed: true, completedAt: new Date() }
          : a;
      }));
    } catch (error: any) {
      alert(error.message || 'Failed to complete activity');
    }
  };

  // Capture photo
  const capturePhoto = async (photoDataUrl: string) => {
    if (selectedActivity) {
      // Update local state immediately
      setActivities(activities.map(a => {
        const aId = a._id || a.id;
        return aId === selectedActivity
          ? { ...a, photo: photoDataUrl }
          : a;
      }));
      setSelectedActivity(null);
    }
    setShowCamera(false);
  };

  // Calculate completion percentage
  const completionPercentage = activities.length > 0
    ? Math.round((activities.filter(a => a.completed).length / activities.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-black">Loading checklist...</p>
        </div>
      </div>
    );
  }

  if (!selectedChecklist) {
    return (
      <div className="min-h-screen bg-white">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Link href="/mobile" className="p-2 text-black">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="text-lg font-bold text-black">Checklist</h1>
          </div>
        </header>
        <main className="p-4">
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No checklists assigned</p>
            <p className="text-sm text-gray-500">Please contact your administrator to assign a checklist.</p>
          </div>
        </main>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/mobile" className="p-2 text-black">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-black">{selectedChecklist.name}</h1>
            <p className="text-xs text-gray-600">{selectedChecklist.area} - {selectedChecklist.role}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-black">{completionPercentage}%</div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
        </div>
      </header>

      {/* Location Validation */}
      {selectedChecklist.requiresLocation && !locationValidated && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <MapPin className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">Location Validation Required</h3>
              <p className="text-sm text-gray-700 mb-3">
                You must be at the required location to start activities.
                {selectedChecklist.location?.address && (
                  <span className="block mt-1">Location: {selectedChecklist.location.address}</span>
                )}
              </p>
              {locationError && (
                <div className="flex items-start gap-2 mb-3 p-2 bg-red-50 border border-red-200 rounded">
                  <AlertCircle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{locationError}</p>
                </div>
              )}
              <button
                onClick={validateLocation}
                disabled={validatingLocation}
                className="w-full px-4 py-2 bg-black text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {validatingLocation ? 'Validating...' : 'Validate Location'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      <main className="p-4 pb-24">
        <div className="max-w-md mx-auto space-y-3">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No activities in this checklist</p>
            </div>
          ) : (
            activities.map((activity) => {
              const activityId = activity._id || activity.id || '';
              return (
                <div
                  key={activityId}
                  className={`border-2 rounded-lg p-4 ${
                    activity.completed
                      ? 'border-gray-300 bg-gray-50'
                      : 'border-black bg-white'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => !activity.completed && completeActivity(activityId)}
                      disabled={activity.completed || (selectedChecklist.requiresLocation && !locationValidated)}
                      className={`flex-shrink-0 mt-1 ${
                        activity.completed
                          ? 'text-green-600'
                          : 'text-gray-400'
                      } disabled:opacity-50`}
                    >
                      {activity.completed ? (
                        <CheckCircle size={24} />
                      ) : (
                        <Circle size={24} />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium mb-1 ${
                        activity.completed ? 'text-gray-500 line-through' : 'text-black'
                      }`}>
                        {activity.name}
                      </h3>
                      {activity.requiresPhoto && (
                        <div className="flex items-center gap-2 mt-2">
                          <Camera size={14} className="text-gray-600" />
                          <span className="text-xs text-gray-600">Photo required</span>
                          {activity.photo && (
                            <span className="text-xs text-green-600 font-medium">✓ Photo taken</span>
                          )}
                        </div>
                      )}
                      {activity.completedAt && (
                        <p className="text-xs text-gray-500 mt-1">
                          Completed at {activity.completedAt.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                  {activity.photo && (
                    <div className="mt-3 relative w-full aspect-video rounded-lg border border-gray-200 overflow-hidden">
                      <Image
                        src={activity.photo}
                        alt="Activity photo"
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Camera Modal */}
      {showCamera && (
        <CameraModal
          onCapture={capturePhoto}
          onClose={() => {
            setShowCamera(false);
            setSelectedActivity(null);
          }}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
}

// Camera Component
function CameraModal({
  onCapture,
  onClose
}: {
  onCapture: (photoDataUrl: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    // Request camera access
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      .then((mediaStream) => {
        currentStream = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      })
      .catch((err) => {
        console.error('Camera error:', err);
        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access to take photos.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found on this device.');
        } else {
          setError('Unable to access camera. Please try again.');
        }
      });

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context?.drawImage(video, 0, 0);

      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      onCapture(photoDataUrl);

      // Stop camera
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <h2 className="text-lg font-semibold">Take Photo</h2>
        <button onClick={onClose} className="p-2">
          <X size={24} />
        </button>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
            <p className="text-white mb-4">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white text-black rounded-lg font-medium"
            >
              Close
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 relative bg-black">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="p-6 bg-black">
            <button
              onClick={takePhoto}
              className="w-full py-4 bg-white text-black rounded-lg font-semibold text-lg"
            >
              Capture Photo
            </button>
          </div>
        </>
      )}
    </div>
  );
}
