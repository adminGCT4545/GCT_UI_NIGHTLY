/**
 * Settings Module
 * 
 * Handles application settings and preferences.
 */

// Create a global settings object
window.settings = {};

// DOM Elements
let settingsPanel;
let settingsTabs;
let settingsContents;
let closeSettingsBtn;
let settingsBtn;

/**
 * Initialize settings panel and event listeners
 */
window.settings.initializeSettings = function() {
    console.log('Initializing settings panel');
    
    // Get DOM elements
    settingsPanel = document.getElementById('settingsPanel');
    settingsTabs = document.querySelectorAll('.settings-tab');
    settingsContents = document.querySelectorAll('.settings-content');
    closeSettingsBtn = document.getElementById('closeSettingsBtn');
    settingsBtn = document.getElementById('settingsBtn');
    
    // Set up event listeners
    setupEventListeners();
    
    // Initialize settings UI
    window.settings.updateSettingsUI();
    
    // Populate settings content
    populateSettingsContent();
    
    console.log('Settings panel initialized');
}

/**
 * Set up event listeners for settings panel
 */
function setupEventListeners() {
    console.log('Setting up settings event listeners');
    
    // Settings button
    if (settingsBtn) {
        console.log('Settings button found, adding event listener');
        settingsBtn.addEventListener('click', toggleSettingsPanel);
    } else {
        console.error('Settings button not found');
    }
    
    // Close settings button
    if (closeSettingsBtn) {
        console.log('Adding click event listener to close settings button');
        closeSettingsBtn.addEventListener('click', function() {
            console.log('Close settings button clicked');
            if (settingsPanel) {
                console.log('Removing active class from settings panel');
                settingsPanel.classList.remove('active');
                console.log('Settings panel classList after removing active:', settingsPanel.classList);
            } else {
                console.error('Settings panel not found');
            }
        });
    } else {
        console.error('Close settings button not found');
    }
    
    // Settings tabs
    if (settingsTabs && settingsTabs.length > 0) {
        settingsTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                switchSettingsTab(tabId);
            });
        });
    } else {
        console.error('Settings tabs not found or empty');
    }
}

/**
 * Toggle settings panel visibility
 */
function toggleSettingsPanel() {
    console.log('Toggle settings panel called');
    
    if (!settingsPanel) {
        console.error('Settings panel not found');
        return;
    }
    
    console.log('Settings panel element:', settingsPanel);
    console.log('Settings panel classList before toggle:', settingsPanel.classList);
    
    // Toggle the active class
    const isActive = settingsPanel.classList.contains('active');
    if (isActive) {
        settingsPanel.classList.remove('active');
    } else {
        settingsPanel.classList.add('active');
        
        // Only update settings when opening the panel
        updateSettingsValues();
    }
    
    console.log('Settings panel classList after toggle:', settingsPanel.classList);
}

/**
 * Update settings values when opening the panel
 */
function updateSettingsValues() {
    // Apply theme preferences
    const darkThemeRadio = document.getElementById('darkTheme');
    const lightThemeRadio = document.getElementById('lightTheme');
    
    if (darkThemeRadio && lightThemeRadio) {
        const savedTheme = localStorage.getItem('theme') || 'dark';
        
        if (savedTheme === 'light') {
            lightThemeRadio.checked = true;
            darkThemeRadio.checked = false;
        } else {
            darkThemeRadio.checked = true;
            lightThemeRadio.checked = false;
        }
    } else {
        console.log('Theme radio buttons not found');
    }
    
    // Update model settings
    const modelSelect = document.getElementById('modelSelect');
    if (modelSelect && window.conversations) {
        modelSelect.value = window.conversations.selectedModel || 'llama3:8b';
    }
    
    const temperatureSlider = document.getElementById('temperatureSlider');
    const temperatureValue = document.getElementById('temperatureValue');
    if (temperatureSlider && temperatureValue && window.conversations) {
        temperatureSlider.value = window.conversations.currentTemperature || 0.7;
        temperatureValue.textContent = temperatureSlider.value;
    }
    
    const enableThinking = document.getElementById('enableThinking');
    if (enableThinking && window.conversations) {
        enableThinking.checked = window.conversations.isThinkingModeEnabled || false;
    }
    
    const enableWebSearch = document.getElementById('enableWebSearch');
    if (enableWebSearch && window.conversations) {
        enableWebSearch.checked = window.conversations.isWebSearchEnabled || false;
    }
    
    // Update interface settings
    const showTimestamps = document.getElementById('showTimestamps');
    if (showTimestamps) {
        showTimestamps.checked = localStorage.getItem('showTimestamps') === 'true';
    }
    
    const enableSounds = document.getElementById('enableSounds');
    if (enableSounds) {
        enableSounds.checked = localStorage.getItem('enableSounds') === 'true';
    }
    
    // Update account settings
    const saveHistory = document.getElementById('saveHistory');
    if (saveHistory) {
        saveHistory.checked = localStorage.getItem('saveHistory') !== 'false';
    }
    
    const allowAnalytics = document.getElementById('allowAnalytics');
    if (allowAnalytics) {
        allowAnalytics.checked = localStorage.getItem('allowAnalytics') === 'true';
    }
}

/**
 * Switch between settings tabs
 * @param {string} tabId - The ID of the tab to switch to
 */
function switchSettingsTab(tabId) {
    console.log('Switching to settings tab:', tabId);
    
    if (!settingsTabs || !settingsContents) {
        console.error('Settings tabs or contents not found');
        return;
    }
    
    // Get the tabs and contents directly from the DOM to ensure we have the latest elements
    const tabs = document.querySelectorAll('.settings-tab');
    const contents = document.querySelectorAll('.settings-content');
    
    console.log('Found tabs:', tabs.length);
    console.log('Found contents:', contents.length);
    
    // Update active tab
    tabs.forEach(tab => {
        console.log('Tab:', tab.dataset.tab, 'Comparing with:', tabId);
        if (tab.dataset.tab === tabId) {
            tab.classList.add('active');
            console.log('Activated tab:', tabId);
        } else {
            tab.classList.remove('active');
        }
    });
    
    // Update active content
    contents.forEach(content => {
        const contentId = content.id;
        console.log('Content ID:', contentId, 'Looking for:', `${tabId}Settings`);
        if (contentId === `${tabId}Settings`) {
            content.classList.add('active');
            console.log('Activated content:', contentId);
        } else {
            content.classList.remove('active');
        }
    });
    
    console.log('Tab switch complete');
}

/**
 * Update settings UI based on current settings
 */
window.settings.updateSettingsUI = function() {
    // This function would update the UI elements based on the current settings
    // For example, setting the correct values for model selection, temperature, etc.
    
    // For now, we'll just populate with default values if needed
    populateSettingsContent();
}

/**
 * Fetch available models from Ollama
 * @returns {Promise<Array>} List of available models
 */
async function fetchOllamaModels() {
    console.log('Fetching Ollama models');
    
    if (window.api && typeof window.api.getModels === 'function') {
        try {
            const models = await window.api.getModels();
            console.log('Fetched models:', models);
            return models;
        } catch (error) {
            console.error('Error fetching Ollama models:', error);
            return [];
        }
    } else {
        console.error('API module not available or getModels function not found');
        return [];
    }
}

/**
 * Populate settings content with options
 */
async function populateSettingsContent() {
    console.log('Populating settings content');
    
    // Make sure the settings tabs have event listeners
    const tabs = document.querySelectorAll('.settings-tab');
    tabs.forEach(tab => {
        // Remove existing event listeners to avoid duplicates
        const newTab = tab.cloneNode(true);
        tab.parentNode.replaceChild(newTab, tab);
        
        // Add new event listener
        newTab.addEventListener('click', () => {
            const tabId = newTab.dataset.tab;
            console.log('Tab clicked:', tabId);
            switchSettingsTab(tabId);
        });
    });
    
    // General Settings
    const generalSettings = document.getElementById('generalSettings');
    if (generalSettings) {
        generalSettings.innerHTML = `
            <div class="settings-section">
                <div class="settings-section-title">Theme</div>
                <div class="settings-option">
                    <input type="radio" id="darkTheme" name="theme" value="dark" checked>
                    <label for="darkTheme">Dark Theme</label>
                </div>
                <div class="settings-option">
                    <input type="radio" id="lightTheme" name="theme" value="light">
                    <label for="lightTheme">Light Theme</label>
                </div>
            </div>
            
            <div class="settings-section">
                <div class="settings-section-title">Interface</div>
                <div class="settings-option">
                    <input type="checkbox" id="showTimestamps" checked>
                    <label for="showTimestamps">Show message timestamps</label>
                </div>
                <div class="settings-option">
                    <input type="checkbox" id="enableSounds">
                    <label for="enableSounds">Enable notification sounds</label>
                </div>
                <div class="settings-option">
                    <button id="saveGeneralSettings" class="settings-button primary">Save Changes</button>
                </div>
            </div>
        `;
        
        // Add event listeners for theme toggle
        const darkThemeRadio = document.getElementById('darkTheme');
        const lightThemeRadio = document.getElementById('lightTheme');
        
        if (darkThemeRadio && lightThemeRadio) {
            const savedTheme = localStorage.getItem('theme') || 'dark';
            
            if (savedTheme === 'light') {
                lightThemeRadio.checked = true;
                darkThemeRadio.checked = false;
            } else {
                darkThemeRadio.checked = true;
                lightThemeRadio.checked = false;
            }
            
            darkThemeRadio.addEventListener('change', () => {
                if (darkThemeRadio.checked) {
                    document.body.classList.remove('light-theme');
                    localStorage.setItem('theme', 'dark');
                }
            });
            
            lightThemeRadio.addEventListener('change', () => {
                if (lightThemeRadio.checked) {
                    document.body.classList.add('light-theme');
                    localStorage.setItem('theme', 'light');
                }
            });
        }
        
        // Add event listeners for interface settings
        const showTimestamps = document.getElementById('showTimestamps');
        const enableSounds = document.getElementById('enableSounds');
        const saveGeneralSettings = document.getElementById('saveGeneralSettings');
        
        if (showTimestamps) {
            showTimestamps.checked = localStorage.getItem('showTimestamps') === 'true';
        }
        
        if (enableSounds) {
            enableSounds.checked = localStorage.getItem('enableSounds') === 'true';
        }
        
        if (saveGeneralSettings) {
            saveGeneralSettings.addEventListener('click', () => {
                // Save interface settings
                if (showTimestamps) {
                    localStorage.setItem('showTimestamps', showTimestamps.checked);
                }
                
                if (enableSounds) {
                    localStorage.setItem('enableSounds', enableSounds.checked);
                }
                
                // Show success message
                alert('General settings saved successfully!');
            });
        }
    }
    
    // Model Settings
    const modelSettings = document.getElementById('modelSettings');
    if (modelSettings) {
        // Fetch available models from Ollama
        const ollamaModels = await fetchOllamaModels();
        
        // Create model options HTML
        let modelOptionsHtml = '';
        if (ollamaModels && ollamaModels.length > 0) {
            ollamaModels.forEach(model => {
                // Handle different model data formats
                let modelName;
                if (typeof model === 'string') {
                    modelName = model;
                } else if (model.name) {
                    modelName = model.name;
                } else if (model.model) {
                    modelName = model.model;
                } else if (model.id) {
                    modelName = model.id;
                } else {
                    // If we can't determine the model name, skip this model
                    return;
                }
                
                // Create a display name that's more user-friendly
                let displayName = modelName;
                
                // If the model has a size property, include it
                if (model.size) {
                    displayName += ` (${model.size})`;
                }
                
                // If the model has a modified_at property, include a "Last updated" note
                let titleAttr = '';
                if (model.modified_at) {
                    const date = new Date(model.modified_at);
                    titleAttr = `title="Last updated: ${date.toLocaleString()}"`;
                }
                
                const selected = modelName === (window.conversations?.selectedModel || 'llama3:8b') ? 'selected' : '';
                modelOptionsHtml += `<option value="${modelName}" ${selected} ${titleAttr}>${displayName}</option>`;
            });
        } else {
            // Fallback options if no models are fetched
            modelOptionsHtml = `
                <option value="llama3:8b" selected>Llama 3 (8B)</option>
                <option value="llama3:70b">Llama 3 (70B)</option>
                <option value="mistral:7b">Mistral (7B)</option>
                <option value="codellama:7b">CodeLlama (7B)</option>
            `;
        }
        
        modelSettings.innerHTML = `
            <div class="settings-section">
                <div class="settings-section-title">Model Selection</div>
                <div class="settings-option">
                    <select id="modelSelect">
                        ${modelOptionsHtml}
                    </select>
                </div>
                <div class="settings-info">
                    <p>Models are loaded from your local Ollama installation.</p>
                    <p><a href="https://ollama.com/library" target="_blank">Browse Ollama model library</a></p>
                </div>
            </div>
            
            <div class="settings-section">
                <div class="settings-section-title">Parameters</div>
                <div class="settings-option">
                    <label>Temperature</label>
                    <div class="slider-container">
                        <input type="range" id="temperatureSlider" min="0" max="1" step="0.1" value="0.7">
                        <span id="temperatureValue">0.7</span>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <div class="settings-section-title">Features</div>
                <div class="settings-option">
                    <input type="checkbox" id="enableThinking">
                    <label for="enableThinking">Show thinking process</label>
                </div>
                <div class="settings-option">
                    <input type="checkbox" id="enableWebSearch">
                    <label for="enableWebSearch">Enable web search</label>
                </div>
                <div class="settings-option">
                    <button id="saveModelSettings" class="settings-button primary">Save Changes</button>
                </div>
            </div>
        `;
        
        // Add event listeners for model settings
        const temperatureSlider = document.getElementById('temperatureSlider');
        const temperatureValue = document.getElementById('temperatureValue');
        
        if (temperatureSlider && temperatureValue) {
            temperatureSlider.value = window.conversations ? window.conversations.currentTemperature : 0.7;
            temperatureValue.textContent = temperatureSlider.value;
            
            temperatureSlider.addEventListener('input', () => {
                temperatureValue.textContent = temperatureSlider.value;
            });
        }
        
        const modelSelect = document.getElementById('modelSelect');
        const enableThinking = document.getElementById('enableThinking');
        const enableWebSearch = document.getElementById('enableWebSearch');
        const saveModelSettings = document.getElementById('saveModelSettings');
        
        if (modelSelect && window.conversations) {
            modelSelect.value = window.conversations.selectedModel || 'llama3:8b';
        }
        
        if (enableThinking && window.conversations) {
            enableThinking.checked = window.conversations.isThinkingModeEnabled || false;
        }
        
        if (enableWebSearch && window.conversations) {
            enableWebSearch.checked = window.conversations.isWebSearchEnabled || false;
        }
        
        if (saveModelSettings) {
            saveModelSettings.addEventListener('click', () => {
                // Save model settings
                if (modelSelect && window.conversations) {
                    window.conversations.selectedModel = modelSelect.value;
                }
                
                if (temperatureSlider && window.conversations) {
                    window.conversations.currentTemperature = parseFloat(temperatureSlider.value);
                }
                
                if (enableThinking && window.conversations) {
                    window.conversations.isThinkingModeEnabled = enableThinking.checked;
                }
                
                if (enableWebSearch && window.conversations) {
                    window.conversations.isWebSearchEnabled = enableWebSearch.checked;
                }
                
                // Show success message
                alert('Model settings saved successfully!');
            });
        }
    }
    
    // Account Settings
    const accountSettings = document.getElementById('accountSettings');
    if (accountSettings) {
        accountSettings.innerHTML = `
            <div class="settings-section">
                <div class="settings-section-title">Account Information</div>
                <div class="settings-option">
                    <label>Email</label>
                    <input type="text" id="userEmail" value="user@example.com" disabled>
                </div>
                <div class="settings-option">
                    <label>Plan</label>
                    <input type="text" id="userPlan" value="Pro" disabled>
                </div>
            </div>
            
            <div class="settings-section">
                <div class="settings-section-title">Data & Privacy</div>
                <div class="settings-option">
                    <input type="checkbox" id="saveHistory" checked>
                    <label for="saveHistory">Save conversation history</label>
                </div>
                <div class="settings-option">
                    <input type="checkbox" id="allowAnalytics">
                    <label for="allowAnalytics">Allow anonymous usage analytics</label>
                </div>
                <div class="settings-option">
                    <button id="saveAccountSettings" class="settings-button primary">Save Changes</button>
                </div>
                <div class="settings-option">
                    <button id="deleteAllData" class="settings-button danger">Delete All Data</button>
                </div>
            </div>
            
            <div class="settings-section">
                <div class="settings-section-title">Compliance</div>
                <div class="compliance-logos">
                    <span>HIPAA</span>
                    <span>SOC2</span>
                    <span>GDPR</span>
                </div>
            </div>
        `;
        
        // Add event listeners for account settings
        const saveHistory = document.getElementById('saveHistory');
        const allowAnalytics = document.getElementById('allowAnalytics');
        const saveAccountSettings = document.getElementById('saveAccountSettings');
        const deleteAllData = document.getElementById('deleteAllData');
        
        if (saveHistory) {
            saveHistory.checked = localStorage.getItem('saveHistory') !== 'false';
        }
        
        if (allowAnalytics) {
            allowAnalytics.checked = localStorage.getItem('allowAnalytics') === 'true';
        }
        
        if (saveAccountSettings) {
            saveAccountSettings.addEventListener('click', () => {
                // Save account settings
                if (saveHistory) {
                    localStorage.setItem('saveHistory', saveHistory.checked);
                }
                
                if (allowAnalytics) {
                    localStorage.setItem('allowAnalytics', allowAnalytics.checked);
                }
                
                // Show success message
                alert('Account settings saved successfully!');
            });
        }
        
        if (deleteAllData) {
            deleteAllData.addEventListener('click', () => {
                if (confirm('Are you sure you want to delete all your data? This action cannot be undone.')) {
                    // Clear localStorage
                    localStorage.clear();
                    
                    // Show success message
                    alert('All data has been deleted. The page will now reload.');
                    
                    // Reload the page
                    window.location.reload();
                }
            });
        }
    }
}
