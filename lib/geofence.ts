/**
 * Geofence validation utility
 * 
 * This utility provides functions to validate if a user's location
 * is within a geofence (circular area) defined by a center point and radius.
 */

/**
 * Calculate the distance between two geographic points using the Haversine formula
 * @param lat1 Latitude of first point
 * @param lng1 Longitude of first point
 * @param lat2 Latitude of second point
 * @param lng2 Longitude of second point
 * @returns Distance in meters
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
}

/**
 * Check if a user's location is within a geofence
 * @param userLat User's current latitude
 * @param userLng User's current longitude
 * @param geofenceLat Geofence center latitude
 * @param geofenceLng Geofence center longitude
 * @param radiusMeters Geofence radius in meters
 * @returns true if user is within the geofence, false otherwise
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  geofenceLat: number,
  geofenceLng: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(userLat, userLng, geofenceLat, geofenceLng);
  return distance <= radiusMeters;
}

/**
 * Get the distance from user to geofence center
 * @param userLat User's current latitude
 * @param userLng User's current longitude
 * @param geofenceLat Geofence center latitude
 * @param geofenceLng Geofence center longitude
 * @returns Distance in meters
 */
export function getDistanceToGeofence(
  userLat: number,
  userLng: number,
  geofenceLat: number,
  geofenceLng: number
): number {
  return calculateDistance(userLat, userLng, geofenceLat, geofenceLng);
}

/**
 * Validate geofence for a checklist
 * This function should be called when a user attempts to start a checklist
 * that requires location validation.
 * 
 * @example
 * ```typescript
 * const checklist = {
 *   requiresLocation: true,
 *   location: {
 *     latitude: 19.4326,
 *     longitude: -99.1332,
 *     radius: 50
 *   }
 * };
 * 
 * const userLocation = await getUserLocation(); // Get from device GPS
 * 
 * if (!isWithinGeofence(
 *   userLocation.lat,
 *   userLocation.lng,
 *   checklist.location.latitude,
 *   checklist.location.longitude,
 *   checklist.location.radius
 * )) {
 *   const distance = getDistanceToGeofence(
 *     userLocation.lat,
 *     userLocation.lng,
 *     checklist.location.latitude,
 *     checklist.location.longitude
 *   );
 *   alert(`You are ${Math.round(distance)}m away from the required location. Please move closer.`);
 *   return false;
 * }
 * 
 * // User is within geofence, proceed with checklist
 * return true;
 * ```
 */
