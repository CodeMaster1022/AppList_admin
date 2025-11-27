/**
 * Authentication utilities with mock data
 */

export type UserRole = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  password: string; // In production, this would be hashed
  name: string;
  role: UserRole;
  phone?: string;
  // User-specific fields
  lane?: string;
  subArea?: string;
  roleName?: string;
  plantId?: number;
  compliance?: number;
}

// Mock users database
export const mockUsers: User[] = [
  // Admin users
  {
    id: 1,
    email: 'admin@restaurant.com',
    password: 'admin123',
    name: 'Admin User',
    role: 'admin',
    phone: '+1 (555) 000-0001'
  },
  // Regular users
  {
    id: 2,
    email: 'john.smith@restaurant.com',
    password: 'user123',
    name: 'John Smith',
    role: 'user',
    phone: '+1 (555) 123-4567',
    lane: 'Operations',
    subArea: 'Reception',
    roleName: 'Hosts',
    plantId: 1,
    compliance: 92
  },
  {
    id: 3,
    email: 'jane.doe@restaurant.com',
    password: 'user123',
    name: 'Jane Doe',
    role: 'user',
    phone: '+1 (555) 234-5678',
    lane: 'Kitchen',
    subArea: 'Hot Kitchen',
    roleName: 'Chef',
    plantId: 1,
    compliance: 88
  },
  {
    id: 4,
    email: 'bob.wilson@restaurant.com',
    password: 'user123',
    name: 'Bob Wilson',
    role: 'user',
    phone: '+1 (555) 345-6789',
    lane: 'Cleaning',
    subArea: 'General Cleaning',
    roleName: 'Cleaning Staff',
    plantId: 2,
    compliance: 95
  }
];

/**
 * Authenticate user with email and password
 */
export function authenticate(email: string, password: string): User | null {
  const user = mockUsers.find(
    u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
  );
  
  if (!user) {
    return null;
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

/**
 * Get user by ID
 */
export function getUserById(id: number): User | null {
  const user = mockUsers.find(u => u.id === id);
  if (!user) {
    return null;
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

/**
 * Get user by email
 */
export function getUserByEmail(email: string): User | null {
  const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    return null;
  }
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword as User;
}

