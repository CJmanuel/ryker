// src/hooks/useStorageQuota.ts
// Monitor storage usage and warn when approaching limits

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

const STORAGE_LIMIT = 1024 * 1024 * 1024 * 1000; // 1000GB limit
const WARNING_THRESHOLD = 0.8; // 80%

interface StorageStats {
  used: number;
  limit: number;
  percentageUsed: number;
  shouldWarn: boolean;
}

export const useStorageQuota = (department: string): StorageStats => {
  const [stats, setStats] = useState<StorageStats>({
    used: 0,
    limit: STORAGE_LIMIT,
    percentageUsed: 0,
    shouldWarn: false,
  });

  useEffect(() => {
    const checkQuota = async () => {
      try {
        // Get total file size from backups table
        const { data: backups, error } = await supabase
          .from('backups')
          .select('fileSize')
          .eq('department', department);

        if (error) throw error;

        let totalUsed = backups?.reduce((sum, backup) => sum + (backup.fileSize || 0), 0) || 0;

        // Also check media assets
        const { data: mediaAssets, error: mediaError } = await supabase
          .from('media_assets')
          .select('fileSize')
          .eq('department', department);

        if (!mediaError) {
          const mediaTotal = mediaAssets?.reduce((sum, asset) => sum + (asset.fileSize || 0), 0) || 0;
          totalUsed += mediaTotal;
        }

        const percentageUsed = totalUsed / STORAGE_LIMIT;
        const shouldWarn = percentageUsed >= WARNING_THRESHOLD;

        setStats({
          used: totalUsed,
          limit: STORAGE_LIMIT,
          percentageUsed,
          shouldWarn,
        });
      } catch (err) {
        console.error('Error checking storage quota:', err);
      }
    };

    if (department) {
      checkQuota();
    }
  }, [department]);

  return stats;
};
