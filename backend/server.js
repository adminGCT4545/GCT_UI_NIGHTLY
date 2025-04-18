/**
 * KYNSEY AI - Backend Server
 * 
 * This server connects the frontend to Ollama for LLM capabilities.
 */

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Configuration
const PORT = process.env.PORT || 3000;
const OLLAMA_BASE_URL = 'http://localhost:11434';

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Configure Socket.io for real-time communication
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('../')); // Serve the frontend files

// Routes

/**
 * Get a list of available models from Ollama
 */
app.get('/api/models', async (req, res) => {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`);
    
    // Ollama returns models in the 'models' property
    if (response.data && response.data.models) {
      res.json(response.data.models);
    } else {
      // If the response format is different, try to adapt
      console.warn('Unexpected Ollama API response format:', response.data);
      
      // If we have an array of models directly
      if (Array.isArray(response.data)) {
        res.json(response.data);
      } else {
        // Try to extract model information from the response
        const models = [];
        
        // Handle case where response is an object with model names as keys
        if (typeof response.data === 'object' && response.data !== null) {
          // For Ollama API v1, the response might be { models: [...] }
          if (Array.isArray(response.data.models)) {
            res.json(response.data.models);
            return;
          }
          
          // For Ollama API v2, the response might be { "name1": {...}, "name2": {...} }
          for (const key in response.data) {
            if (key !== 'error' && key !== 'status') {
              models.push({ name: key, ...response.data[key] });
            }
          }
          
          res.json(models);
        } else {
          // Fallback to empty array if we can't extract models
          res.json([]);
        }
      }
    }
  } catch (error) {
    console.error('Error fetching models:', error.message);
    res.status(500).json({ error: 'Failed to fetch models from Ollama' });
  }
});

/**
 * Generate a chat completion (non-streaming)
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { model, messages, temperature = 0.7 } = req.body;
    
    if (!model || !messages) {
      return res.status(400).json({ error: 'Model and messages are required' });
    }

    const response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
      model,
      messages,
      stream: false,
      temperature
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error generating chat completion:', error.message);
    res.status(500).json({ error: 'Failed to generate chat completion' });
  }
});

// Socket.io connection for streaming responses
io.on('connection', (socket) => {
  console.log('Client connected');

  // Handle streaming chat completions
  socket.on('chat-stream', async (data) => {
    try {
      const { model, messages, temperature = 0.7 } = data;
      
      if (!model || !messages) {
        socket.emit('error', { error: 'Model and messages are required' });
        return;
      }

      const response = await axios.post(`${OLLAMA_BASE_URL}/api/chat`, {
        model,
        messages,
        stream: true,
        temperature
      }, {
        responseType: 'stream'
      });

      let buffer = '';
      
      response.data.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        buffer += chunkStr;
        
        // Process complete JSON objects
        let processedUpTo = 0;
        let jsonStartIndex = 0;
        
        while ((jsonStartIndex = buffer.indexOf('{', processedUpTo)) !== -1) {
          try {
            // Find the end of the JSON object
            let jsonEndIndex = buffer.indexOf('\n', jsonStartIndex);
            if (jsonEndIndex === -1) break; // Incomplete JSON, wait for more data
            
            const jsonStr = buffer.substring(jsonStartIndex, jsonEndIndex);
            const jsonObj = JSON.parse(jsonStr);
            
            // Emit the chunk to the client
            socket.emit('chat-response', jsonObj);
            
            // If this is the final message, emit a done event
            if (jsonObj.done) {
              socket.emit('chat-done');
            }
            
            processedUpTo = jsonEndIndex + 1;
          } catch (e) {
            // If we can't parse the JSON, move past this character and try again
            processedUpTo = jsonStartIndex + 1;
          }
        }
        
        // Keep only the unprocessed part of the buffer
        buffer = buffer.substring(processedUpTo);
      });

      response.data.on('end', () => {
        socket.emit('chat-done');
      });

      response.data.on('error', (err) => {
        console.error('Stream error:', err);
        socket.emit('error', { error: 'Stream error occurred' });
      });
    } catch (error) {
      console.error('Error in chat stream:', error.message);
      socket.emit('error', { error: 'Failed to generate streaming chat completion' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
