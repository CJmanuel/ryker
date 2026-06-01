// src/hooks/useFileUpload.ts
// Simplified file upload logic using B2 Storage

import { useCallback } from 'react';
import { b2Storage } from '../services/b2Storage';
import { supabase } from '../services/supabase';

export const useFileUpload = () => {
  const uploadFile = useCallback(
    async (
      file: File,
      department: string,
      userId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        console.log('useFileUpload - starting B2 upload for file:', file.name);

        // Upload to B2 Storage
        const uploadResult = await b2Storage.uploadFile(file, department, userId);

        if (!uploadResult.success || !uploadResult.fileInfo) {
          console.error('useFileUpload - B2 storage upload error:', uploadResult.error);
          throw new Error(uploadResult.error || 'Upload to B2 failed');
        }

        console.log('useFileUpload - file uploaded to B2 storage');

        const fileInfo = uploadResult.fileInfo;

        // Save metadata to Supabase database
        console.log('useFileUpload - inserting metadata into backups table');
        const insertData = {
          filename: file.name,
          department,
          uploadedby: userId,
          filesize: file.size,
          downloadurl: fileInfo.downloadUrl,
          path: fileInfo.fileName,
          b2_file_id: fileInfo.fileId,
        };
        console.log('useFileUpload - insert data:', insertData);

        // Insert into database
        const { error: dbError } = await supabase
          .from('backups')
          .insert([insertData]);

        if (dbError) {
          console.error('useFileUpload - database insert error:', dbError);
          // If it's a constraint error due to duplicate, try to update instead
          if (dbError.message?.includes('duplicate') || dbError.code === '23505') {
            console.log('useFileUpload - attempting to update existing record...');
            const { error: updateError } = await supabase
              .from('backups')
              .update(insertData)
              .eq('filename', file.name)
              .eq('uploadedBy', userId);

            if (updateError) {
              console.error('useFileUpload - database update error:', updateError);
              throw updateError;
            }
            console.log('useFileUpload - file metadata updated successfully');
          } else {
            throw dbError;
          }
        } else {
          console.log('useFileUpload - file metadata saved successfully');
        }

        return { success: true };
      } catch (err: any) {
        console.error('useFileUpload - error:', err);
        return { success: false, error: err.message || 'Upload failed' };
      }
    },
    []
  );

  return { uploadFile };
};
