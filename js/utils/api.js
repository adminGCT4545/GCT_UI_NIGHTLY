/**
 * KYNSEY AI - API Module
 * 
 * Handles communication with the backend server.
 */

// Create a global API object
window.api = {};

// Configuration
const API_BASE_URL = 'http://localhost:3000/api';
let socket = null;

/**
 * Initialize the API module
 */
window.api.initialize = function() {
    // Initialize Socket.io connection
    if (typeof io !== 'undefined') {
        socket = io('http://localhost:3000');
        
        socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        socket.on('disconnect', () => {
            console.log('Disconnected from server');
        });
        
        socket.on('error', (error) => {
            console.error('Socket error:', error);
        });
    } else {
        console.error('Socket.io not loaded');
    }
}

/**
 * Get available models from Ollama
 * @returns {Promise<Array>} List of available models
 */
window.api.getModels = async function() {
    try {
        const response = await fetch(`${API_BASE_URL}/models`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Ollama API returns models in a 'models' array or directly in the response
        if (data.models && Array.isArray(data.models)) {
            return data.models;
        } else if (Array.isArray(data)) {
            return data;
        } else {
            // If we have an object with a 'models' property that's not an array
            console.warn('Unexpected model data format:', data);
            return [];
        }
    } catch (error) {
        console.error('Error fetching models:', error);
        return [];
    }
}

/**
 * Send a chat message to Ollama (non-streaming)
 * @param {string} model - The model to use
 * @param {Array} messages - The conversation history
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} The response from Ollama
 */
window.api.sendChatMessage = async function(model, messages, options = {}) {
    try {
        const response = await fetch(`${API_BASE_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages,
                temperature: options.temperature || 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('Error sending chat message:', error);
        throw error;
    }
}

/**
 * Send a chat message to Ollama with streaming response
 * @param {string} model - The model to use
 * @param {Array} messages - The conversation history
 * @param {Object} options - Additional options
 * @param {Function} onChunk - Callback for each chunk of the response
 * @param {Function} onDone - Callback when the response is complete
 * @param {Function} onError - Callback for errors
 */
window.api.streamChatMessage = function(model, messages, options = {}, onChunk, onDone, onError) {
    if (!socket) {
        console.error('Socket not initialized');
        if (onError) onError(new Error('Socket not initialized'));
        return;
    }
    
    // Set up event listeners
    socket.on('chat-response', (data) => {
        if (onChunk) onChunk(data);
    });
    
    socket.on('chat-done', () => {
        // Clean up event listeners
        socket.off('chat-response');
        socket.off('chat-done');
        socket.off('error');
        
        if (onDone) onDone();
    });
    
    socket.on('error', (error) => {
        // Clean up event listeners
        socket.off('chat-response');
        socket.off('chat-done');
        socket.off('error');
        
        if (onError) onError(error);
    });
    
    // Send the request
    socket.emit('chat-stream', {
        model,
        messages,
        temperature: options.temperature || 0.7
    });
}
