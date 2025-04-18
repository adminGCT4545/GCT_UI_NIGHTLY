/**
 * Conversations Module
 * 
 * Handles conversation management, including creating, loading, and saving conversations.
 */

// Create a global conversations object
window.conversations = {};

// DOM Elements
let conversationList;
let conversationTitle;
let conversationTitleInput;
let chatContainer;
let messageInput;
let sendButton;
let newChatBtn;
let viewEditHistoryBtn;
let historyEditModal;
let historyEditContent;

// State
window.conversations.conversations = {};
window.conversations.currentConversationId = null;
window.conversations.selectedModel = 'llama3.2:3b-instruct-q4_0';
window.conversations.currentTemperature = 0.7;
window.conversations.isThinkingModeEnabled = false;
window.conversations.isWebSearchEnabled = false;
window.conversations.currentResponseStyle = 'normal';
window.conversations.currentDataResidency = 'us';
window.conversations.isMedTermEnabled = false;
window.conversations.isEquipSpecEnabled = false;
window.conversations.isRagEnabled = false;
window.conversations.currentKbEndpoint = '';

/**
 * Initialize conversation management
 */
window.conversations.initializeConversations = function() {
    // Get DOM elements
    conversationList = document.getElementById('conversationList');
    conversationTitle = document.getElementById('conversationTitle');
    conversationTitleInput = document.getElementById('conversationTitleInput');
    chatContainer = document.getElementById('chatContainer');
    messageInput = document.getElementById('messageInput');
    sendButton = document.getElementById('sendButton');
    newChatBtn = document.getElementById('newChatBtn');
    viewEditHistoryBtn = document.getElementById('viewEditHistoryBtn');
    historyEditModal = document.getElementById('historyEditModal');
    historyEditContent = document.getElementById('historyEditContent');
    
    // Load saved conversations
    this.loadSavedConversations();
    
    // Set up event listeners
    setupEventListeners();
    
    // Make conversations available globally for other modules
    window.currentConversationId = window.conversations.currentConversationId;
}

/**
 * Set up event listeners for conversation management
 */
function setupEventListeners() {
    // New chat button
    if (newChatBtn) {
        newChatBtn.addEventListener('click', () => {
            window.conversations.createNewConversation();
        });
    }
    
    // Send message
    if (sendButton && messageInput) {
        sendButton.addEventListener('click', window.conversations.sendMessage);
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                window.conversations.sendMessage();
            }
        });
        
        // Update button state on input
        messageInput.addEventListener('input', updateButtonStates);
        
        // Auto-resize textarea
        messageInput.addEventListener('input', () => {
            window.utils.autoResizeTextarea(messageInput);
        });
    }
    
    // Conversation title editing
    if (conversationTitle && conversationTitleInput) {
        conversationTitle.addEventListener('click', () => {
            conversationTitle.style.display = 'none';
            conversationTitleInput.style.display = 'block';
            conversationTitleInput.focus();
            conversationTitleInput.select();
        });
        
        conversationTitleInput.addEventListener('blur', window.conversations.saveConversationTitle);
        conversationTitleInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.conversations.saveConversationTitle();
            }
        });
    }
    
    // View/Edit History
    if (viewEditHistoryBtn) {
        viewEditHistoryBtn.addEventListener('click', window.conversations.showHistoryEditModal);
    }
}

/**
 * Load saved conversations from localStorage
 */
window.conversations.loadSavedConversations = function() {
    try {
        const savedConversations = localStorage.getItem('kynseyAiConversations');
        if (savedConversations) {
            window.conversations.conversations = JSON.parse(savedConversations);
        }
        
        const lastConversationId = localStorage.getItem('kynseyAiLastConversationId');
        
        // If there are saved conversations, load the last active one
        if (Object.keys(window.conversations.conversations).length > 0) {
            if (lastConversationId && window.conversations.conversations[lastConversationId]) {
                window.conversations.loadConversation(lastConversationId);
            } else {
                // Load the most recent conversation
                const sortedIds = Object.keys(window.conversations.conversations).sort((a, b) => {
                    return new Date(window.conversations.conversations[b].createdAt || 0) - new Date(window.conversations.conversations[a].createdAt || 0);
                });
                window.conversations.loadConversation(sortedIds[0]);
            }
        } else {
            // Create a new conversation if none exist
            window.conversations.createNewConversation();
        }
        
        // Render the conversation list
        renderConversationList();
    } catch (error) {
        console.error('Error loading saved conversations:', error);
        window.conversations.createNewConversation();
    }
}

/**
 * Create a new conversation
 * @param {boolean} setActive - Whether to set the new conversation as active
 * @returns {string} The ID of the new conversation
 */
window.conversations.createNewConversation = function(setActive = true) {
    const newId = window.utils.generateId();
    const timestamp = new Date();
    const defaultName = `Analysis ${timestamp.toLocaleDateString()} ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    
    window.conversations.conversations[newId] = {
        id: newId,
        name: defaultName,
        history: [],
        model: window.conversations.selectedModel,
        temperature: window.conversations.currentTemperature,
        thinkingMode: window.conversations.isThinkingModeEnabled,
        webSearch: window.conversations.isWebSearchEnabled,
        responseStyle: window.conversations.currentResponseStyle,
        dataResidency: window.conversations.currentDataResidency,
        medTermEnabled: window.conversations.isMedTermEnabled,
        equipSpecEnabled: window.conversations.isEquipSpecEnabled,
        ragEnabled: window.conversations.isRagEnabled,
        kbEndpoint: window.conversations.currentKbEndpoint,
        createdAt: timestamp.toISOString(),
        associatedDocument: null,
        notepadContent: '',
        artifacts: []
    };
    
    if (setActive) {
        window.conversations.currentConversationId = newId;
        window.currentConversationId = newId;
        window.conversations.loadConversation(newId);
        renderConversationList();
        window.conversations.saveConversations();
    }
    
    return newId;
}

/**
 * Load a conversation
 * @param {string} conversationId - The ID of the conversation to load
 */
window.conversations.loadConversation = function(conversationId) {
    if (!window.conversations.conversations[conversationId]) return;
    
    window.conversations.currentConversationId = conversationId;
    window.currentConversationId = conversationId;
    
    const conv = window.conversations.conversations[conversationId];
    
    // Update conversation title
    if (conversationTitle) {
        conversationTitle.textContent = conv.name;
    }
    
    if (conversationTitleInput) {
        conversationTitleInput.value = conv.name;
    }
    
    // Clear chat container
    if (chatContainer) {
        chatContainer.innerHTML = '';
        
        // Add messages from history
        if (conv.history.length === 0) {
            const initialMsgId = window.utils.generateId();
            window.conversations.addMessage('Hello! How can I help you today?', 'assistant', { messageId: initialMsgId });
            conv.history.push({ 
                role: 'assistant', 
                content: 'Hello! How can I help you today?', 
                id: initialMsgId 
            });
        } else {
            conv.history.forEach(msg => {
                window.conversations.addMessage(msg.content, msg.role, { 
                    messageId: msg.id, 
                    isHtml: msg.role === 'assistant',
                    citations: msg.citations,
                    confidence: msg.confidence
                });
            });
        }
    }
    
    // Update document viewer if in dashboard mode
    if (typeof window.ui !== 'undefined' && window.ui.currentViewMode === 'dashboard') {
        const docViewer = document.getElementById('documentViewerPlaceholder');
        
        if (docViewer) {
            if (conv.associatedDocument) {
                docViewer.innerHTML = `Loading ${conv.associatedDocument.name}...`;
            } else {
                docViewer.innerHTML = `<span>No document loaded. Upload one.</span>`;
            }
        }
    }
    
    // Reset file upload if needed
    if (typeof window.fileUpload !== 'undefined' && typeof window.fileUpload.resetFileUpload === 'function') {
        window.fileUpload.resetFileUpload();
    }
    
    // Clear message input
    if (messageInput) {
        messageInput.value = '';
        window.utils.autoResizeTextarea(messageInput);
    }
    
    // Update button states
    updateButtonStates();
    
    // Highlight active conversation in the list
    highlightActiveConversation();
    
    // Save conversations
    this.saveConversations();
    
    // Update right panel with artifacts
    const rightPanel = document.getElementById('rightPanel');
    if (rightPanel) {
        rightPanel.innerHTML = '<h3 style="color: var(--text-muted); text-align: center; margin-bottom: 1rem;">Details & Artifacts</h3>';
        rightPanel.classList.remove('visible');
        
        if (conv.artifacts && conv.artifacts.length > 0) {
            conv.artifacts.forEach(window.conversations.renderArtifact);
        }
    }
    
    // Load notepad content
    if (typeof window.notepad !== 'undefined' && typeof window.notepad.loadNotepadContent === 'function') {
        window.notepad.loadNotepadContent();
    }
}

/**
 * Add a message to the chat container
 * @param {string} text - The message text
 * @param {string} role - The role of the message sender ('user' or 'assistant')
 * @param {Object} options - Additional options
 */
window.conversations.addMessage = function(text, role, options = {}) {
    if (!chatContainer) return;
    
    const { 
        isHtml = false, 
        messageId = window.utils.generateId(), 
        citations = null, 
        confidence = null,
        isStreaming = false
    } = options;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}-message`;
    messageDiv.dataset.messageId = messageId;
    
    if (isStreaming) {
        messageDiv.classList.add('streaming');
    }
    
    // Create delete button for messages
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-message-btn';
    deleteBtn.innerHTML = '&times;';
    deleteBtn.title = 'Delete message';
    deleteBtn.onclick = () => window.conversations.deleteMessage(messageId);
    
    // Create message content
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    if (isHtml) {
        contentDiv.innerHTML = window.utils.sanitizeHTML(text);
    } else {
        contentDiv.textContent = text;
    }
    
    // Add citations if available
    if (citations && Array.isArray(citations) && citations.length > 0) {
        const citationsList = document.createElement('div');
        citationsList.className = 'citation-source-list';
        
        const citationsTitle = document.createElement('h4');
        citationsTitle.textContent = 'Sources:';
        citationsList.appendChild(citationsTitle);
        
        const sourcesList = document.createElement('ul');
        citations.forEach((citation, index) => {
            const sourceItem = document.createElement('li');
            
            if (citation.url) {
                const sourceLink = document.createElement('a');
                sourceLink.href = citation.url;
                sourceLink.target = '_blank';
                sourceLink.textContent = citation.title || citation.url;
                sourceItem.appendChild(sourceLink);
            } else {
                sourceItem.textContent = citation.title || `Source ${index + 1}`;
            }
            
            sourcesList.appendChild(sourceItem);
        });
        
        citationsList.appendChild(sourcesList);
        contentDiv.appendChild(citationsList);
    }
    
    // Add confidence score if available
    if (confidence !== null && typeof confidence === 'number') {
        const confidenceSpan = document.createElement('span');
        confidenceSpan.className = 'confidence-score';
        confidenceSpan.textContent = `Confidence: ${Math.round(confidence * 100)}%`;
        contentDiv.appendChild(confidenceSpan);
    }
    
    // Assemble message
    messageDiv.appendChild(deleteBtn);
    messageDiv.appendChild(contentDiv);
    
    // Add message actions for assistant messages
    if (role === 'assistant') {
        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'message-actions';
        
        // Copy button
        const copyBtn = document.createElement('button');
        copyBtn.className = 'message-action-btn';
        copyBtn.title = 'Copy to clipboard';
        copyBtn.innerHTML = '📋';
        copyBtn.onclick = (e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(text).then(() => {
                copyBtn.innerHTML = '✓';
                setTimeout(() => { copyBtn.innerHTML = '📋'; }, 2000);
            });
        };
        
        actionsDiv.appendChild(copyBtn);
        messageDiv.appendChild(actionsDiv);
    }
    
    // Add to chat container
    chatContainer.appendChild(messageDiv);
    
    // Apply syntax highlighting to code blocks
    window.utils.highlightCodeInElement(messageDiv);
    
    // Scroll to bottom
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return messageDiv;
}

/**
 * Send a message
 */
window.conversations.sendMessage = function() {
    if (!messageInput || !sendButton) return;
    
    const messageText = messageInput.value.trim();
    if (!messageText) return;
    
    // Check for special commands
    if (messageText.startsWith('/note ')) {
        // Handle note command
        const noteText = messageText.substring(6);
        addNoteToNotepad(noteText);
        messageInput.value = '';
        window.utils.autoResizeTextarea(messageInput);
        updateButtonStates();
        return;
    }
    
    // Add user message to chat
    const userMessageId = window.utils.generateId();
    window.conversations.addMessage(messageText, 'user', { messageId: userMessageId });
    
    // Add to conversation history
    if (window.conversations.currentConversationId && window.conversations.conversations[window.conversations.currentConversationId]) {
        window.conversations.conversations[window.conversations.currentConversationId].history.push({
            role: 'user',
            content: messageText,
            id: userMessageId
        });
        
        window.conversations.saveConversations();
    }
    
    // Clear input
    messageInput.value = '';
    window.utils.autoResizeTextarea(messageInput);
    updateButtonStates();
    
    // Add assistant message (streaming)
    const assistantMessageId = window.utils.generateId();
    const assistantMessage = window.conversations.addMessage('', 'assistant', { 
        messageId: assistantMessageId,
        isHtml: true,
        isStreaming: true
    });
    
    // Get current conversation for model and temperature settings
    const currentConversation = window.conversations.conversations[window.conversations.currentConversationId];
    const model = currentConversation ? currentConversation.model : window.conversations.selectedModel;
    const temperature = currentConversation ? currentConversation.temperature : window.conversations.currentTemperature;
    
    // Prepare messages for API
    const messages = [];
    if (currentConversation && currentConversation.history) {
        // Convert conversation history to the format expected by Ollama
        currentConversation.history.forEach(msg => {
            if (msg.role === 'user' || msg.role === 'assistant') {
                messages.push({
                    role: msg.role,
                    content: msg.content
                });
            }
        });
    }
    
    // Remove the last message (user message) as we'll add it separately
    if (messages.length > 0) {
        messages.pop();
    }
    
    // Add the current user message
    messages.push({
        role: 'user',
        content: messageText
    });
    
    // Use the API to stream the response
    if (window.api && typeof window.api.streamChatMessage === 'function') {
        const contentDiv = assistantMessage.querySelector('.message-content');
        let responseContent = '';
        
        window.api.streamChatMessage(
            model,
            messages,
            { temperature },
            // onChunk callback
            (data) => {
                if (data.message && data.message.content) {
                    const newContent = data.message.content;
                    responseContent += newContent;
                    contentDiv.innerHTML = window.utils.parseAndSanitizeMarkdown(responseContent);
                    window.utils.highlightCodeInElement(assistantMessage);
                    assistantMessage.scrollIntoView({ behavior: 'smooth', block: 'end' });
                }
            },
            // onDone callback
            () => {
                assistantMessage.classList.remove('streaming');
                
                // Add to conversation history
                if (window.conversations.currentConversationId && 
                    window.conversations.conversations[window.conversations.currentConversationId]) {
                    window.conversations.conversations[window.conversations.currentConversationId].history.push({
                        role: 'assistant',
                        content: responseContent,
                        id: assistantMessageId
                    });
                    
                    window.conversations.saveConversations();
                }
            },
            // onError callback
            (error) => {
                console.error('Error streaming chat message:', error);
                contentDiv.innerHTML = 'Error: Failed to get a response. Please try again.';
                assistantMessage.classList.remove('streaming');
            }
        );
    } else {
        // Fallback if API is not available
        fallbackAssistantResponse(assistantMessage, assistantMessageId);
    }
}

/**
 * Fallback assistant response when API is not available
 * @param {HTMLElement} messageElement - The message element
 * @param {string} messageId - The message ID
 */
function fallbackAssistantResponse(messageElement, messageId) {
    // Fallback response
    const response = "I'm sorry, but I can't connect to the Ollama API right now. " +
        "Please make sure the backend server is running and Ollama is installed and running on port 11434.";
    
    const contentDiv = messageElement.querySelector('.message-content');
    contentDiv.innerHTML = response;
    messageElement.classList.remove('streaming');
    
    // Add to conversation history
    if (window.conversations.currentConversationId && window.conversations.conversations[window.conversations.currentConversationId]) {
        window.conversations.conversations[window.conversations.currentConversationId].history.push({
            role: 'assistant',
            content: response,
            id: messageId
        });
        
        window.conversations.saveConversations();
    }
}

/**
 * Delete a message
 * @param {string} messageId - The ID of the message to delete
 */
window.conversations.deleteMessage = function(messageId) {
    if (!window.conversations.currentConversationId || !window.conversations.conversations[window.conversations.currentConversationId]) return;
    
    const conversation = window.conversations.conversations[window.conversations.currentConversationId];
    const messageIndex = conversation.history.findIndex(msg => msg.id === messageId);
    
    if (messageIndex > -1) {
        conversation.history.splice(messageIndex, 1);
        
        const messageElement = chatContainer.querySelector(`[data-message-id="${messageId}"]`);
        if (messageElement) {
            messageElement.remove();
        }
        
        window.conversations.saveConversations();
    }
}

/**
 * Save the conversation title
 */
window.conversations.saveConversationTitle = function() {
    if (!conversationTitle || !conversationTitleInput || !window.conversations.currentConversationId || !window.conversations.conversations[window.conversations.currentConversationId]) return;
    
    const newTitle = conversationTitleInput.value.trim();
    if (newTitle) {
        window.conversations.conversations[window.conversations.currentConversationId].name = newTitle;
        conversationTitle.textContent = newTitle;
        window.conversations.saveConversations();
        renderConversationList();
    }
    
    conversationTitleInput.style.display = 'none';
    conversationTitle.style.display = 'block';
}

/**
 * Render the conversation list
 */
function renderConversationList() {
    if (!conversationList) return;
    
    conversationList.innerHTML = '';
    
    const sortedIds = Object.keys(window.conversations.conversations).sort((a, b) => {
        return new Date(window.conversations.conversations[b].createdAt || 0) - new Date(window.conversations.conversations[a].createdAt || 0);
    });
    
    sortedIds.forEach(id => {
        const conv = window.conversations.conversations[id];
        const item = document.createElement('button');
        item.className = 'sidebar-item';
        item.dataset.convId = id;
        item.title = conv.name;
        item.innerHTML = `<span>&#128172;</span><span class="sidebar-item-text">${conv.name}</span>`;
        item.onclick = () => window.conversations.loadConversation(id);
        conversationList.appendChild(item);
    });
    
    highlightActiveConversation();
}

/**
 * Highlight the active conversation in the list
 */
function highlightActiveConversation() {
    if (!conversationList) return;
    
    const items = conversationList.querySelectorAll('.sidebar-item');
    items.forEach(item => {
        item.classList.toggle('active', item.dataset.convId === window.conversations.currentConversationId);
    });
}

/**
 * Update button states based on input
 */
function updateButtonStates() {
    if (sendButton && messageInput) {
        sendButton.disabled = !messageInput.value.trim();
    }
}

/**
 * Save conversations to localStorage
 */
window.conversations.saveConversations = function() {
    localStorage.setItem('kynseyAiConversations', JSON.stringify(window.conversations.conversations));
    localStorage.setItem('kynseyAiLastConversationId', window.conversations.currentConversationId);
}

/**
 * Show the history edit modal
 */
window.conversations.showHistoryEditModal = function() {
    if (!historyEditModal || !historyEditContent || !window.conversations.currentConversationId || !window.conversations.conversations[window.conversations.currentConversationId]) return;
    
    const conversation = window.conversations.conversations[window.conversations.currentConversationId];
    historyEditContent.innerHTML = '';
    
    if (conversation.history.length === 0) {
        historyEditContent.innerHTML = '<p style="color: var(--text-muted);">History is empty.</p>';
    } else {
        conversation.history.forEach(msg => {
            const itemDiv = document.createElement('div');
            itemDiv.style.cssText = `margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px dashed var(--border-color);`;
            itemDiv.dataset.messageId = msg.id;
            
            const roleLabel = document.createElement('strong');
            roleLabel.textContent = msg.role.charAt(0).toUpperCase() + msg.role.slice(1);
            roleLabel.style.color = msg.role === 'user' ? 'var(--accent-primary)' : 'var(--text-secondary)';
            roleLabel.style.cssText = `display: block; margin-bottom: 0.3rem;`;
            
            const contentDiv = document.createElement('div');
            contentDiv.textContent = msg.content;
            contentDiv.style.cssText = `white-space: pre-wrap; font-size: 0.9rem;`;
            
            const deleteBtn = document.createElement('button');
            deleteBtn.innerHTML = '&times; Delete';
            deleteBtn.style.cssText = `float: right; background: none; border: 1px solid var(--danger-color); color: var(--danger-color); padding: 0.2rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.8rem; margin-left: 1rem;`;
            deleteBtn.onclick = () => {
                itemDiv.remove();
                window.conversations.deleteMessage(msg.id);
                
                if (historyEditContent.childElementCount === 0) {
                    historyEditContent.innerHTML = '<p style="color: var(--text-muted);">History is empty.</p>';
                }
            };
            
            itemDiv.appendChild(deleteBtn);
            itemDiv.appendChild(roleLabel);
            itemDiv.appendChild(contentDiv);
            historyEditContent.appendChild(itemDiv);
        });
    }
    
    historyEditModal.classList.add('active');
}

/**
 * Add a note to the notepad
 * @param {string} noteText - The note text to add
 */
function addNoteToNotepad(noteText) {
    if (!noteText) return;
    
    // If notepad functionality is available
    if (typeof window.notepad !== 'undefined' && typeof window.notepad.addNoteFromChat === 'function') {
        window.notepad.addNoteFromChat(noteText);
    } else {
        console.log('Notepad functionality not available');
    }
}

/**
 * Render an artifact in the right panel
 * @param {Object} artifact - The artifact to render
 */
window.conversations.renderArtifact = function(artifact) {
    if (!artifact || !artifact.content) {
        console.warn("Attempted to render invalid artifact:", artifact);
        return;
    }
    
    const rightPanel = document.getElementById('rightPanel');
    if (!rightPanel) return;
    
    if (!rightPanel.classList.contains('visible')) {
        rightPanel.classList.add('visible');
    }
    
    const placeholder = rightPanel.querySelector('h3');
    if (placeholder && placeholder.textContent.includes('Artifacts')) {
        placeholder.remove();
    }
    
    const artifactId = artifact.id || window.utils.generateId();
    
    // Check if artifact already exists
    if (rightPanel.querySelector(`[data-artifact-id="${artifactId}"]`)) {
        console.log("Artifact already rendered:", artifactId);
        return;
    }
    
    const artifactDiv = document.createElement('div');
    artifactDiv.className = 'artifact';
    artifactDiv.dataset.artifactId = artifactId;
    
    const type = artifact.type || 'text';
    const title = window.utils.sanitizeHTML(artifact.title || `Artifact (${type})`);
    const safeType = window.utils.sanitizeHTML(type);
    
    let contentHtml = '';
    
    if (type === 'code' || type === 'csv' || type === 'json') {
        const lang = window.utils.sanitizeHTML(artifact.language || (type === 'csv' ? 'csv' : (type === 'json' ? 'json' : '')));
        
        // Create code element
        const codeElement = document.createElement('code');
        if (lang) codeElement.className = `language-${lang}`;
        codeElement.textContent = artifact.content;
        
        contentHtml = `<pre>${codeElement.outerHTML}</pre>`;
    } else if (type === 'markdown') {
        contentHtml = window.utils.parseAndSanitizeMarkdown(artifact.content);
    } else {
        contentHtml = `<p>${window.utils.sanitizeHTML(artifact.content).replace(/\n/g, '<br>')}</p>`;
    }
    
    artifactDiv.innerHTML = `
        <div class="artifact-header">
            <span class="artifact-title">${title}</span>
            <span class="artifact-type">${safeType}</span>
        </div>
        <div class="artifact-content">${contentHtml}</div>
    `;
    
    rightPanel.appendChild(artifactDiv);
    
    // Apply syntax highlighting
    window.utils.highlightCodeInElement(artifactDiv);
    
    // Add artifact to conversation state if not already there
    if (window.conversations.currentConversationId && window.conversations.conversations[window.conversations.currentConversationId]) {
        if (!window.conversations.conversations[window.conversations.currentConversationId].artifacts) {
            window.conversations.conversations[window.conversations.currentConversationId].artifacts = [];
        }
        
        // Add only if it doesn't exist by ID
        if (!window.conversations.conversations[window.conversations.currentConversationId].artifacts.some(a => a.id === artifactId)) {
            window.conversations.conversations[window.conversations.currentConversationId].artifacts.push({ ...artifact, id: artifactId });
            window.conversations.saveConversations();
        }
    }
}
