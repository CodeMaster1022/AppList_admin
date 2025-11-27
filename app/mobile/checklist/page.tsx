'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Camera, CheckCircle, Circle, MapPin, AlertCircle, X } from 'lucide-react';
import Link from 'next/link';
import { isWithinGeofence, getDistanceToGeofence } from '@/lib/geofence';
import BottomNavigation from '@/components/mobile/BottomNavigation';
import { useAuth } from '@/contexts/AuthContext';

// Mock checklist data
const mockChecklist = {
  id: 1,
  name: 'Checklist Operations - Reception',
  lane: 'Operations',
  area: 'Reception',
  role: 'Hosts',
  requiresLocation: true,
  location: {
    address: '123 Main Street, City',
    latitude: 19.4326,
    longitude: -99.1332,
    radius: 50 // meters
  },
  activities: [
    {
      id: 1,
      name: 'Check reception area cleanliness',
      requiresPhoto: true,
      completed: false,
      photo: null as string | null,
      completedAt: null as Date | null
    },
    {
      id: 2,
      name: 'Verify guest reservation system',
      requiresPhoto: false,
      completed: false,
      photo: null as string | null,
      completedAt: null as Date | null
    },
    {
      id: 3,
      name: 'Inspect welcome desk supplies',
      requiresPhoto: true,
      completed: false,
      photo: null as string | null,
      completedAt: null as Date | null
    }
  ]
};

interface Activity {
  id: number;
  name: string;
  requiresPhoto: boolean;
  completed: boolean;
  photo: string | null;
  completedAt: Date | null;
}

export default function ChecklistPage() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>(mockChecklist.activities);
  const [locationValidated, setLocationValidated] = useState(false);
  const [validatingLocation, setValidatingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  if (!user) {
    return null;
  }

  // Validate location
  const validateLocation = async () => {
    if (!mockChecklist.requiresLocation || !mockChecklist.location) {
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
      const { latitude, longitude, radius } = mockChecklist.location!;

      // Check if user is within geofence
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
  const completeActivity = async (activityId: number) => {
    const activity = activities.find(a => a.id === activityId);
    if (!activity) return;

    // Check if photo is required
    if (activity.requiresPhoto && !activity.photo) {
      setSelectedActivity(activityId);
      setShowCamera(true);
      return;
    }

    // Mark as completed
    setActivities(activities.map(a =>
      a.id === activityId
        ? { ...a, completed: true, completedAt: new Date() }
        : a
    ));
  };

  // Capture photo
  const capturePhoto = (photoDataUrl: string) => {
    if (selectedActivity) {
      setActivities(activities.map(a =>
        a.id === selectedActivity
          ? { ...a, photo: photoDataUrl }
          : a
      ));
      setSelectedActivity(null);
    }
    setShowCamera(false);
  };

  // Calculate completion percentage
  const completionPercentage = Math.round(
    (activities.filter(a => a.completed).length / activities.length) * 100
  );

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link href="/mobile" className="p-2 text-black">
            <ArrowLeft size={20} />
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-black">{mockChecklist.name}</h1>
            <p className="text-xs text-gray-600">{mockChecklist.area} - {mockChecklist.role}</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-black">{completionPercentage}%</div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
        </div>
      </header>

      {/* Location Validation */}
      {mockChecklist.requiresLocation && !locationValidated && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="flex items-start gap-3">
            <MapPin className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-black mb-1">Location Validation Required</h3>
              <p className="text-sm text-gray-700 mb-3">
                You must be at the required location to start activities.
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
          {activities.map((activity) => (
            <div
              key={activity.id}
              className={`border-2 rounded-lg p-4 ${
                activity.completed
                  ? 'border-gray-300 bg-gray-50'
                  : 'border-black bg-white'
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => !activity.completed && completeActivity(activity.id)}
                  disabled={activity.completed || !locationValidated}
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
                <div className="mt-3">
                  <img
                    src={activity.photo}
                    alt="Activity photo"
                    className="w-full rounded-lg border border-gray-200"
                  />
                </div>
              )}
            </div>
          ))}
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

