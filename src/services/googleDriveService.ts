import { requireGoogleLogin } from '../firebase';
import { parseResponseJson } from '../utils/api';

/**
 * Service to manage Google Drive API file uploads and folder structure.
 */

// Helper to search for a folder or create it under an optional parent
export const getOrCreateFolder = async (
  accessToken: string,
  folderName: string,
  parentFolderId?: string
): Promise<string> => {
  try {
    let queryStr = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentFolderId) {
      queryStr += ` and '${parentFolderId}' in parents`;
    }
    const query = encodeURIComponent(queryStr);
    const searchRes = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name)`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const searchData = await parseResponseJson(searchRes, 'Failed to search folder');
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create folder
    const body: { name: string; mimeType: string; parents?: string[] } = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    if (parentFolderId) {
      body.parents = [parentFolderId];
    }

    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    const createData = await parseResponseJson(createRes, 'Failed to create folder');
    return createData.id;
  } catch (error) {
    console.warn(`Could not create/find folder '${folderName}' under parent ${parentFolderId || 'root'}:`, error);
    
    // If inside a parent failed, fall back to searching/creating in root
    if (parentFolderId) {
      return getOrCreateFolder(accessToken, folderName);
    }
    throw error;
  }
};

/**
 * Uploads a raw file to a specific Google Drive folder.
 */
export const uploadFileToDrive = async (
  accessToken: string,
  file: File,
  folderId: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> => {
  const metadata = {
    name: file.name,
    parents: [folderId],
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch(
    'https://upload.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  const data = await parseResponseJson(res, 'Google Drive upload failed');

  // Set reader permissions for anyone so the shop/partner can print it
  if (data.id) {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone',
        }),
      });
    } catch (permError) {
      console.warn('Failed to set permissions for anyone on the file:', permError);
    }
  }

  return data;
};

/**
 * High-level function to automatically route a file upload to a secure,
 * user-specific subdirectory within the parent 'PrintHub_Orders' directory.
 * Prevents cross-user file access.
 */
export const uploadUserFileToDrive = async (
  accessToken: string,
  file: File,
  userId: string
): Promise<{ id: string; webViewLink: string; webContentLink: string }> => {
  // 1. Ensure root 'PrintHub_Orders' folder exists in the user's Drive
  const rootFolderId = await getOrCreateFolder(accessToken, 'PrintHub_Orders');

  // 2. Ensure a secure subfolder for the specific user UID exists inside 'PrintHub_Orders'
  const userSubfolderName = `User_${userId}`;
  const userFolderId = await getOrCreateFolder(accessToken, userSubfolderName, rootFolderId);

  // 3. Upload file directly inside the user's subfolder
  return uploadFileToDrive(accessToken, file, userFolderId);
};
