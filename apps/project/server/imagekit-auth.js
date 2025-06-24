const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

// ImageKit configuration
const IMAGEKIT_CONFIG = {
  privateKey: 'private_hIjBXnO9Y9NTuoDbYMBHPt7NRuQ=',
  publicKey: "public_WAJvDiOf18kQ94w+cwl80i7SPcU=",
  urlEndpoint: "https://ik.imagekit.io/mbp4i7p96",
};

// ImageKit authentication endpoint
app.post('/api/imagekit/auth', (req, res) => {
  try {
    // Generate timestamp in SECONDS (not milliseconds) - this is crucial!
    const timestamp = Math.floor(Date.now() / 1000);
    
    // Generate expire time (40 minutes from now in seconds)
    const expire = timestamp + (40 * 60); // 40 minutes
    
    // Generate token
    const token = req.query.token || uuidv4();
    
    // Generate signature using HMAC-SHA1 with timestamp in seconds
    const signature = crypto
      .createHmac('sha1', IMAGEKIT_CONFIG.privateKey)
      .update(timestamp.toString())
      .digest('hex');

    console.log('Generated auth:', {
      timestamp,
      expire,
      token,
      signature: signature.substring(0, 10) + '...' // Log partial signature for security
    });

    res.json({
      signature,
      expire: expire.toString(), // Ensure expire is a string
      token: token
    });
  } catch (error) {
    console.error('Error generating ImageKit auth:', error);
    res.status(500).json({ error: 'Failed to generate authentication' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'ImageKit auth server is running' });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`ImageKit auth server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Auth endpoint: http://localhost:${PORT}/api/imagekit/auth`);
}); 