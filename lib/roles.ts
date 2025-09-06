import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export type UserRole = 'pilot' | 'admin' | 'inspector'

export interface UserWithRole extends User {
  role?: UserRole
}

// Get user's role from the database
export async function getUserRole(userId: string): Promise<UserRole | null> {
  try {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle()  // Use maybeSingle instead of single to avoid errors when no row exists

    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }

    return data?.role || null
  } catch (error) {
    console.error('Error in getUserRole:', error)
    return null
  }
}

// Assign role to user (typically called after signup)
export async function assignUserRole(userId: string, role: UserRole): Promise<boolean> {
  try {
    // First check if user already has a role
    const { data: existingRole } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', userId)
      .single()

    if (existingRole) {
      console.log('User already has a role assigned')
      return true
    }

    // Insert new role
    const { data, error } = await supabase
      .from('user_roles')
      .insert([
        {
          user_id: userId,
          role: role
        }
      ])
      .select()

    if (error) {
      console.error('Error assigning user role:', error)
      return false
    }

    console.log('Role assigned successfully:', data)
    return true
  } catch (error) {
    console.error('Error in assignUserRole:', error)
    return false
  }
}

// Check if user has specific role
export function hasRole(user: UserWithRole, requiredRole: UserRole): boolean {
  return user.role === requiredRole
}

// Check if user has admin privileges
export function isAdmin(user: UserWithRole): boolean {
  return user.role === 'admin'
}

// Check if user has inspector privileges
export function isInspector(user: UserWithRole): boolean {
  return user.role === 'inspector'
}

// Check if user is a pilot
export function isPilot(user: UserWithRole): boolean {
  return user.role === 'pilot'
}