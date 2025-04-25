import express from 'express';
import crypto from 'crypto';
import cors from 'cors';

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

const ALGORITHM = 'aes-128-cbc';

app.post('/generate-hash', (req, res) => {
  try {
    const { password, secret, till } = req.body;

    if (!password || !secret || !till) {
      return res.status(400).json({
        status: false,
        error: 'Missing required parameters: password, secret, and till are required'
      });
    }

    // Generate a 16-byte random initialization vector (IV)
    const iv = crypto.randomBytes(16);
    
    // Create plaintext in the format "till.password"
    const plaintext = `${till}.${password}`;
    
    // Create a cipher using the secret key and the IV in AES-128-CBC mode
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secret, 'hex'), iv);
    
    // Encrypt the text (with padding) and combine output parts
    const encryptedText = cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
    
    // Return a string in the format "iv_hex.encryptedText_hex"
    const hash = iv.toString('hex') + '.' + encryptedText;

    res.json({
      status: true,
      response: {
        hash,
        till
      }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      error: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Hash generation server running at http://localhost:${port}`);
});