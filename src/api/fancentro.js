import axios from 'axios';

const FANCENTRO_API_URL = 'https://fancentro.com/external';
const HASH_API_URL = 'https://backend-sandy-three-95.vercel.app';
const EMAIL = 'vtarabcakova@gmail.com';
const PASSWORD = '92hf83jsba&1';
const SECRET = '75f2bd1131870721df8eb57d322e8adb';
const MODEL_TOKEN = '7089ba0426640fccf726c6774b9ada83';

export const authenticate = async () => {
  try {
    const till = Math.floor(Date.now() / 1000) + 3600;
    
    const hashResponse = await axios.post(`${HASH_API_URL}/generate-hash`, {
      password: PASSWORD,
      secret: SECRET,
      till
    });

    if (!hashResponse.data.status) {
      throw new Error(hashResponse.data.error || 'Hash generation failed');
    }

    const { hash } = hashResponse.data.response;

    const response = await axios.get(`${FANCENTRO_API_URL}/client.auth`, {
      params: {
        email: EMAIL,
        till,
        hash
      }
    });

    if (!response.data.status) {
      throw new Error(response.data.error || 'Authentication failed');
    }

    return response.data.response;
  } catch (error) {
    throw new Error(`Authentication failed: ${error.message}`);
  }
};

export const fetchUsers = async (authToken) => {
  try {
    const response = await axios.get(`${FANCENTRO_API_URL}/chat.getContacts`, {
      params: {
        ct: MODEL_TOKEN,
        auth: authToken,
        limit: 400
      }
    });

    if (!response.data.status) {
      throw new Error(response.data.error || 'Failed to fetch users');
    }

    return response.data.response;
  } catch (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }
};

export const fetchChatMessages = async (authToken, interlocutorId) => {
  try {
    const response = await axios.get(`${FANCENTRO_API_URL}/chat.getMessages`, {
      params: {
        ct: MODEL_TOKEN,
        auth: authToken,
        interlocutorId
      }
    });

    if (!response.data.status) {
      throw new Error(response.data.error || 'Failed to fetch messages');
    }

    return response.data.response;
  } catch (error) {
    throw new Error(`Failed to fetch messages: ${error.message}`);
  }
};

export const sendMessage = async (authToken, interlocutorId, message) => {
  try {
    const response = await axios.post(`${FANCENTRO_API_URL}/chat.sendMessage`, null, {
      params: {
        ct: MODEL_TOKEN,
        auth: authToken,
        interlocutorId,
        message: encodeURIComponent(message),
        type: 'text'
      }
    });

    if (!response.data.status) {
      throw new Error(response.data.error || 'Failed to send message');
    }

    return response.data.response;
  } catch (error) {
    throw new Error(`Failed to send message: ${error.message}`);
  }
};