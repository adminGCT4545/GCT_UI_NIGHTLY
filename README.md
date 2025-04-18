# KYNSEY AI Chat Interface with Ollama Integration

This project is a sophisticated chat interface that connects to Ollama for LLM capabilities. It allows users to chat with any LLM model installed on their local Ollama instance.

## Features

- **Chat Interface**: Modern, responsive chat UI with markdown support
- **Ollama Integration**: Connect to locally running Ollama models
- **Model Selection**: Dynamically load and select from available Ollama models
- **Conversation Management**: Save, load, and manage multiple conversations
- **Streaming Responses**: Real-time streaming of model responses
- **Settings Management**: Configure model parameters like temperature
- **Markdown Support**: Rich text formatting in responses with syntax highlighting
- **Responsive Design**: Works on desktop and mobile devices

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or higher)
- [Ollama](https://ollama.ai/) installed and running on your machine

## Setup Instructions

### 1. Install Ollama

If you haven't already, install Ollama by following the instructions at [ollama.ai](https://ollama.ai/).

### 2. Pull Models

Pull the models you want to use with Ollama. For example:

```bash
ollama pull llama3
ollama pull mistral
ollama pull codellama
```

### 3. Start Ollama

Make sure Ollama is running on your machine:

```bash
ollama serve
```

By default, Ollama runs on port 11434.

### 4. Install Backend Dependencies

Navigate to the backend directory and install the required dependencies:

```bash
cd backend
npm install
```

### 5. Start the Backend Server

Start the backend server:

```bash
cd backend
npm start
```

The server will start on port 3000 by default.

### 6. Open the Application

Open the `index.html` file in your browser or serve it using a static file server.

If you have Python installed, you can use:

```bash
# Python 3
python -m http.server

# Python 2
python -m SimpleHTTPServer
```

Then navigate to `http://localhost:8000` in your browser.

## Usage

1. **Chat**: Type your message in the input box and press Enter or click Send
2. **Model Selection**: Open Settings (gear icon) and select a model from the dropdown
3. **New Conversation**: Click the + button in the sidebar to start a new conversation
4. **Adjust Parameters**: Change temperature and other settings in the Settings panel

## Project Structure

- `backend/`: Node.js backend server that connects to Ollama
  - `server.js`: Main server file
  - `package.json`: Backend dependencies
- `css/`: CSS files for styling
- `js/`: JavaScript files for the frontend
  - `utils/`: Utility functions
  - `components/`: UI components
- `index.html`: Main HTML file

## Troubleshooting

- **No models showing up?** Make sure Ollama is running (`ollama serve`) and you've pulled at least one model (`ollama pull llama3`)
- **Connection errors?** Check that the backend server is running on port 3000
- **Slow responses?** Larger models require more resources. Try using a smaller model or adjusting the temperature

## License

This project is open source and available under the MIT License.

## Acknowledgements

- [Ollama](https://ollama.ai/) for providing the local LLM runtime
- [Socket.io](https://socket.io/) for real-time communication
- [Marked](https://marked.js.org/) for Markdown parsing
- [Highlight.js](https://highlightjs.org/) for syntax highlighting
# GCT_UI_NIGHTLY
# GCT_UI_NIGHTLY
# GCT_UI_NIGHTLY
