# ImageKit Setup Guide

## Current Implementation

The app currently uses a local image upload method for development purposes. Images are stored locally and the URI is saved in the product data.

## Setting up ImageKit for Production

To use ImageKit for image uploads in production, you need to set up server-side authentication.

### 1. Get ImageKit Credentials

1. Sign up for an ImageKit account at https://imagekit.io/
2. Get your credentials from the ImageKit dashboard:
   - Public Key
   - Private Key
   - URL Endpoint

### 2. Set up Server-side Authentication

Create a server endpoint that generates authentication tokens for ImageKit uploads:

```javascript
// Example Node.js/Express endpoint
const crypto = require('crypto');

app.post('/api/imagekit/auth', (req, res) => {
  const privateKey = 'your_private_key';
  const timestamp = Date.now();
  const signature = crypto
    .createHmac('sha1', privateKey)
    .update(timestamp.toString())
    .digest('hex');

  res.json({
    signature,
    expire: timestamp + 60000, // 1 minute expiry
    token: 'your_token'
  });
});
```

### 3. Update the Image Upload Function

Replace the `uploadImageLocally` function call in `app/(tabs)/products.tsx` with `uploadImageToImageKit`:

```typescript
// In app/(tabs)/products.tsx
import { pickImage, takePhoto, uploadImageToImageKit } from '../../lib/imageUpload';

// In handleImagePicker function:
const uploadResult = await uploadImageToImageKit(imageUri, fileName);
```

### 4. Update ImageKit Configuration

Update the configuration in `lib/imageUpload.ts`:

```typescript
const IMAGEKIT_CONFIG = {
  publicKey: "your_public_key",
  urlEndpoint: "your_url_endpoint",
  authenticationEndpoint: "https://your-server.com/api/imagekit/auth",
};
```

### 5. Implement Authentication Helper Functions

Update the `uploadImageToImageKit` function to include authentication:

```typescript
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
```

## Alternative: Using ImageKit JavaScript SDK

For a simpler approach, you can use the ImageKit JavaScript SDK:

1. Install the SDK:
```bash
npm install imagekit
```

2. Update the upload function:
```typescript
import ImageKit from 'imagekit';

const imagekit = new ImageKit({
  publicKey: "your_public_key",
  urlEndpoint: "your_url_endpoint",
  authenticationEndpoint: "https://your-server.com/auth",
});

export const uploadImageToImageKit = async (imageUri: string, fileName: string): Promise<ImageUploadResult> => {
  return new Promise((resolve, reject) => {
    imagekit.upload({
      file: imageUri,
      fileName: fileName,
      tags: ["product"]
    }, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve({
          url: result.url,
          fileId: result.fileId,
          fileName: result.name,
        });
      }
    });
  });
};
```

## Security Notes

- Never expose your private key in client-side code
- Always use server-side authentication for production
- Implement proper file size and type validation
- Consider implementing image compression before upload
- Set up proper CORS policies on your server

## Testing

1. Test image upload with small images first
2. Verify that uploaded images are accessible via the returned URL
3. Test image transformations if needed
4. Monitor upload success rates and error handling 