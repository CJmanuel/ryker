// src/services/activityLogger.ts
// Comprehensive activity logging for audit trail

import { supabase } from './supabase';

export type ActivityType =
  | 'upload'
  | 'download'
  | 'delete'
  | 'login'
  | 'register'
  | 'create_campaign'
  | 'update_campaign'
  | 'delete_campaign'
  | 'create_client'
  | 'update_client'
  | 'delete_client'
  | 'create_budget'
  | 'update_budget'
  | 'delete_budget'
  | 'create_team'
  | 'update_team'
  | 'delete_team'
  | 'create_media'
  | 'update_media'
  | 'delete_media'
  | 'login_failed'
  | 'logout'
  | 'permission_denied'
  | 'data_export'
  | 'settings_change';

interface ActivityLog {
  type: ActivityType;
  userId: string;
  username?: string;
  department: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  resourceName?: string;
  filename?: string;
  fileSize?: number;
  fileType?: string;
  changes?: Record<string, { before: any; after: any }>;
  timestamp: any;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error';
}

/**
 * Log activity to Firestore for audit trail
 * Only admins can view logs via rules
 */
export const logActivity = async (
  type: ActivityType,
  userId: string,
  department: string,
  action: string,
  options?: {
    username?: string;
    resourceType?: string;
    resourceId?: string;
    resourceName?: string;
    filename?: string;
    fileSize?: number;
    fileType?: string;
    changes?: Record<string, { before: any; after: any }>;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, any>;
    severity?: 'info' | 'warning' | 'error';
  }
): Promise<void> => {
  try {
    const logEntry: Omit<ActivityLog, 'id'> = {
      type,
      userId,
      department,
      action,
      severity: options?.severity || 'info',
      timestamp: new Date().toISOString(),
      username: options?.username,
      resourceType: options?.resourceType,
      resourceId: options?.resourceId,
      resourceName: options?.resourceName,
      filename: options?.filename,
      fileSize: options?.fileSize,
      fileType: options?.fileType,
      changes: options?.changes,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      metadata: options?.metadata,
    };

    // Remove undefined fields to keep database clean
    Object.keys(logEntry).forEach(
      (k) => logEntry[k as keyof Omit<ActivityLog, 'id'>] === undefined && delete logEntry[k as keyof Omit<ActivityLog, 'id'>]
    );

    const { error } = await supabase
      .from('logs')
      .insert([logEntry]);

    if (error) {
      console.error('Failed to log activity:', error);
    }
  } catch (err) {
    console.error('Failed to log activity:', err);
    // silently fail - don't break app if logging fails
  }
};

/**
 * Helper to log file operations
 */
export const logFileOperation = async (
  type: 'upload' | 'download' | 'delete',
  userId: string,
  department: string,
  fileName: string,
  fileSize: number,
  fileType: string,
  username?: string,
  metadata?: Record<string, any>
): Promise<void> => {
  return logActivity(type, userId, department, `${type.charAt(0).toUpperCase() + type.slice(1)} file: ${fileName}`, {
    username,
    resourceType: 'file',
    resourceName: fileName,
    filename: fileName,
    fileSize,
    fileType,
    metadata,
  });
};

/**
 * Helper to log collection CRUD operations
 */
export const logCollectionOperation = async (
  operation: 'create' | 'update' | 'delete',
  collectionName: string,
  userId: string,
  department: string,
  resourceId: string,
  resourceName: string,
  username?: string,
  changes?: Record<string, { before: any; after: any }>,
  metadata?: Record<string, any>
): Promise<void> => {
  const type = `${operation}_${collectionName}` as ActivityType;
  const action = `${operation.charAt(0).toUpperCase() + operation.slice(1)} ${collectionName.slice(0, -1)}: ${resourceName}`;

  return logActivity(type, userId, department, action, {
    username,
    resourceType: collectionName,
    resourceId,
    resourceName,
    changes,
    metadata,
  });
};

/**
 * Helper to log authentication events
 */
export const logAuthEvent = async (
  type: 'login' | 'logout' | 'login_failed' | 'register',
  userId: string,
  username: string,
  department?: string,
  metadata?: Record<string, any>,
  loginFailureReason?: string
): Promise<void> => {
  let action = '';
  let severity: 'info' | 'warning' | 'error' = 'info';

  if (type === 'login') {
    action = `User logged in: ${username}`;
  } else if (type === 'logout') {
    action = `User logged out: ${username}`;
  } else if (type === 'login_failed') {
    action = `Login failed for: ${username} (${loginFailureReason || 'invalid credentials'})`;
    severity = 'warning';
  } else if (type === 'register') {
    action = `New user registered: ${username}`;
  }

  return logActivity(type, userId, department || 'unknown', action, {
    username,
    severity,
    metadata: {
      ...metadata,
      failureReason: loginFailureReason,
    },
  });
};
