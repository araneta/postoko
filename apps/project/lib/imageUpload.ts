import * as ImagePicker from 'expo-image-picker';

// ImageKit configuration
const IMAGEKIT_CONFIG = {
  publicKey: "public_WAJvDiOf18kQ94w+cwl80i7SPcU=",
  urlEndpoint: "https://ik.imagekit.io/mbp4i7p96",
  authenticationEndpoint: "http://localhost:3000/api/imagekit/auth",
};

export interface ImageUploadResult {
  url: string;
  fileId: string;
  fileName: string;
}

export const pickImage = async (): Promise<string | null> => {
  try {
    // Request permissions
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return null;
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('Error picking image:', error);
    return null;
  }
};

export const takePhoto = async (): Promise<string | null> => {
  try {
    // Request permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera is required!');
      return null;
    }

    // Launch camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      return result.assets[0].uri;
    }

    return null;
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
};

// Method 1: Using ImageKit with server-side authentication (recommended for production)
export const uploadImageToImageKit = async (imageUri: string, fileName: string): Promise<ImageUploadResult> => {
  try {
    // Get authentication from your server
    const authResponse = await fetch(IMAGEKIT_CONFIG.authenticationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const auth = await authResponse.json();
    
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Create form data
    const formData = new FormData();
    formData.append('file', blob, fileName);
    formData.append('fileName', fileName);
    formData.append('publicKey', IMAGEKIT_CONFIG.publicKey);
    formData.append('useUniqueFileName', 'true');
    formData.append('signature', auth.signature);
    formData.append('expire', auth.expire.toString());
    formData.append('token', auth.token);

    // Upload to ImageKit
    const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: formData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      throw new Error(`Upload failed: ${errorData.message || uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();
    
    return {
      url: result.url,
      fileId: result.fileId,
      fileName: result.name,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Method 2: Alternative approach - store image locally and use a placeholder URL
// This is useful for development or when you don't have server-side authentication set up
export const uploadImageLocally = async (imageUri: string, fileName: string): Promise<ImageUploadResult> => {
  // For development purposes, we'll return the local URI
  // In production, you should implement proper image upload to your server
  return {
    url: imageUri,
    fileId: `local_${Date.now()}`,
    fileName: fileName,
  };
};

export const generateImageKitURL = (imageUrl: string, transformation?: any): string => {
  const baseUrl = IMAGEKIT_CONFIG.urlEndpoint;
  const transformationString = transformation 
    ? `tr:${JSON.stringify(transformation)}`
    : '';
  
  return `${baseUrl}/${transformationString}/${imageUrl}`;
}; 