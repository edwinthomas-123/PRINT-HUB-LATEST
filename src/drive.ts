import { parseResponseJson } from './utils/api';

export const USERS_PARENT_FOLDER_ID = '1pFFMuQSNxDGIq7nJMeIRnKrHcmdhncn6';
export const SHOPS_PARENT_FOLDER_ID = '197ot44pKT0s5CO7V7Fc9nubIzfq5ZXjU';

export const getOrCreateFolder = async (accessToken: string, folderName: string, parentFolderId?: string) => {
  try {
    let queryStr = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    if (parentFolderId) {
      queryStr += ` and '${parentFolderId}' in parents`;
    }
    const query = encodeURIComponent(queryStr);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    const searchData = await parseResponseJson(searchRes, 'Failed to search folder');
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    
    // Create folder
    const body: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };
    if (parentFolderId) {
      body.parents = [parentFolderId];
    }
    
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const createData = await parseResponseJson(createRes, 'Failed to create folder');
    return createData.id;
  } catch (error) {
    console.warn(`Could not create folder under parent ${parentFolderId || 'root'}, falling back:`, error);
    // Fallback to creating at the root of user's Google Drive or 'Print Shop Orders'
    let queryStr = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
    const query = encodeURIComponent(queryStr);
    const searchRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id, name)`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const searchData = await parseResponseJson(searchRes, 'Failed to search root folder').catch(() => null);
    if (searchData?.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }
    
    const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder'
      })
    });
    const createData = await parseResponseJson(createRes, 'Failed to create root folder');
    return createData.id;
  }
};

export const uploadFileToDrive = async (accessToken: string, file: File, folderId: string) => {
  const metadata = {
    name: file.name,
    parents: [folderId]
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', file);

  const res = await fetch('https://upload.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`
    },
    body: form
  });
  
  const data = await parseResponseJson(res, 'Google Drive upload failed');
  
  // Make file readable by anyone so shop can view/print it
  if (data.id) {
    try {
      await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          role: 'reader',
          type: 'anyone'
        })
      });
    } catch (permError) {
      console.warn("Failed to set read permissions for anyone on the file:", permError);
    }
  }
  
  return data;
};
