// src/hooks/useFileUpload.ts
// Simplified file upload logic

import { useCallback } from 'react';
import { supabase } from '../services/supabase';

export const useFileUpload = () => {
  const uploadFile = useCallback(
    async (
      file: File,
      department: string,
      userId: string
    ): Promise<{ success: boolean; error?: string }> => {
      try {
        // Add timestamp to filename to ensure uniqueness
        const timestamp = new Date().getTime();
        const filename = file.name;
        const nameWithoutExt = filename.lastIndexOf('.') > 0 ? filename.substring(0, filename.lastIndexOf('.')) : filename;
        const ext = filename.lastIndexOf('.') > 0 ? filename.substring(filename.lastIndexOf('.')) : '';
        const uniqueFilename = `${nameWithoutExt}-${timestamp}${ext}`;
        
        // Remove 'backups/' prefix - it's already the bucket name
        const path = `${department}/${userId}/${uniqueFilename}`;

        // For large files, use resumable upload
        const fileSizeMB = file.size / (1024 * 1024);
        const useResumableUpload = fileSizeMB > 50; // Use resumable for files > 50MB

        let uploadResult;
        if (useResumableUpload) {
          console.log('useFileUpload - using resumable upload for large file');
          // Use resumable upload for large files
          uploadResult = await supabase.storage
            .from('backups')
            .upload(path, file, {
              upsert: false,
              duplex: 'half',
            });
        } else {
          // Use regular upload for smaller files
          uploadResult = await supabase.storage
            .from('backups')
            .upload(path, file, {
              upsert: false,
            });
        }

        // Create timeout promise - longer for large files
        const timeoutDuration = useResumableUpload ? 600000 : 120000; // 10 minutes for large files, 2 minutes for small
        const uploadPromise = Promise.resolve(uploadResult);

        const timeoutPromise = new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error(`Upload took too long (${timeoutDuration / 1000} seconds). If file is very large, please try again or contact support.`)), timeoutDuration)
        );

        let uploadError: any = null;
        try {
          console.log('useFileUpload - starting Promise.race for upload...');
          const result = await Promise.race([uploadPromise, timeoutPromise]);
          console.log('useFileUpload - Promise.race completed, result:', result);
          uploadError = result?.error;
        } catch (err: any) {
          console.log('useFileUpload - Promise.race rejected with:', err.message);
          uploadError = err;
        }

        if (uploadError) {
          console.error('useFileUpload - storage upload error:', uploadError);
          // If file already exists, continue anyway (it might be same file being re-uploaded)
          if (!uploadError.message?.includes('already exists')) {
            throw uploadError;
          } else {
            console.log('useFileUpload - file already exists in storage, continuing...');
          }
        }

        console.log('useFileUpload - file uploaded to storage, getting URL');

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('backups')
          .getPublicUrl(path);

        const downloadURL = urlData.publicUrl;
        console.log('useFileUpload - public URL:', downloadURL);

        // Save metadata to database
        console.log('useFileUpload - inserting metadata into backups table');
        const insertData = {
          filename: filename,  // Store original filename
          department,
          uploadedby: userId,  // PostgreSQL stores as lowercase
          filesize: file.size,  // PostgreSQL stores as lowercase
          downloadurl: downloadURL,  // PostgreSQL stores as lowercase
          path,
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
              .eq('filename', filename)
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
