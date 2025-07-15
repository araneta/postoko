import * as ImagePicker from 'expo-image-picker';
import { Alert } from 'react-native';

// ImageKit configuration
const IMAGEKIT_CONFIG = {
  publicKey: "public_WAJvDiOf18kQ94w+cwl80i7SPcU=",
  urlEndpoint: "https://ik.imagekit.io/mbp4i7p96",
  authenticationEndpoint: "http://localhost:3000/api/imagekit/auth",
};

// Maximum file size in bytes (750 KB)
const MAX_FILE_SIZE = 750 * 1024;

// Helper function to check file size and return error message if needed
export const checkFileSize = async (imageUri: string): Promise<string | null> => {
  try {
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    if (blob.size > MAX_FILE_SIZE) {
      const fileSizeKB = Math.round(blob.size / 1024);
      return `The selected image (${fileSizeKB} KB) exceeds the maximum allowed size of 750 KB. Please choose a smaller image.`;
    }
    return null;
  } catch (error) {
    return 'Failed to process image. Please try again.';
  }
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
      Alert.alert('Permission Required', 'Permission to access camera roll is required!');
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
    Alert.alert('Error', 'Failed to pick image. Please try again.');
    return null;
  }
};

export const takePhoto = async (): Promise<string | null> => {
  try {
    // Request permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    
    if (permissionResult.granted === false) {
      Alert.alert('Permission Required', 'Permission to access camera is required!');
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
    Alert.alert('Error', 'Failed to take photo. Please try again.');
    return null;
  }
};

// Method 1: Using ImageKit with server-side authentication (recommended for production)
export const uploadImageToImageKit = async (imageUri: string, fileName: string): Promise<ImageUploadResult | null> => {
  try {
    // Convert image URI to blob
    const response = await fetch(imageUri);
    const blob = await response.blob();

    // Check file size
    if (blob.size > MAX_FILE_SIZE) {
      const fileSizeKB = Math.round(blob.size / 1024);
      return null; // Return null to indicate failure, error message will be handled by caller
    }

    // Get authentication from your server
    const authResponse = await fetch(IMAGEKIT_CONFIG.authenticationEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const auth = await authResponse.json();

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
      return null; // Return null to indicate failure, error message will be handled by caller
    }

    const result = await uploadResponse.json();
    
    return {
      url: result.url,
      fileId: result.fileId,
      fileName: result.name,
    };
  } catch (error) {
    console.error('Error uploading image:', error);
    return null; // Return null to indicate failure, error message will be handled by caller
  }
};

// Method 2: Alternative approach - store image locally and use a placeholder URL
// This is useful for development or when you don't have server-side authentication set up
export const uploadImageLocally = async (imageUri: string, fileName: string): Promise<ImageUploadResult | null> => {
  try {
    // Check file size for local uploads too
    const response = await fetch(imageUri);
    const blob = await response.blob();

    if (blob.size > MAX_FILE_SIZE) {
      return null; // Return null to indicate failure, error message will be handled by caller
    }

    // For development purposes, we'll return the local URI
    // In production, you should implement proper image upload to your server
    return {
      url: imageUri,
      fileId: `local_${Date.now()}`,
      fileName: fileName,
    };
  } catch (error) {
    console.error('Error uploading image locally:', error);
    return null; // Return null to indicate failure, error message will be handled by caller
  }
};

export const generateImageKitURL = (imageUrl: string, transformation?: any): string => {
  const baseUrl = IMAGEKIT_CONFIG.urlEndpoint;
  const transformationString = transformation 
    ? `tr:${JSON.stringify(transformation)}`
    : '';
  
  return `${baseUrl}/${transformationString}/${imageUrl}`;
}; 