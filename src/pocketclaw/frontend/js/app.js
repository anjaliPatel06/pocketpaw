/**
 * PocketPaw Main Application
 * Alpine.js component for the dashboard
 */

function app() {
    return {
        // View state
        view: 'chat',
        showSettings: false,
        showScreenshot: false,
        showFileBrowser: false,
        screenshotSrc: '',

        // File browser state
        filePath: '~',
        files: [],
        fileLoading: false,
        fileError: null,
        
        // Agent state
        agentActive: false,
        isStreaming: false,
        streamingContent: '',
        streamingMessageId: null,
        hasShownWelcome: false,
        
        // Messages
        messages: [],
        logs: [],
        inputText: '',
        
        // System status
        status: {
            cpu: '—',
            ram: '—',
            disk: '—',
            battery: '—'
        },
        
        // Settings
        settings: {
            agentBackend: 'open_interpreter',
            llmProvider: 'auto'
        },
        
        // API Keys (not persisted client-side)
        apiKeys: {
            anthropic: '',
            openai: ''
        },

        /**
         * Initialize the app
         */
        init() {
            this.log('PocketPaw Dashboard initialized', 'info');

            // Register event handlers first
            this.setupSocketHandlers();

            // Connect WebSocket (singleton - will only connect once)
            socket.connect();

            // Start status polling (low frequency)
            this.startStatusPolling();

            // Refresh Lucide icons after initial render
            this.$nextTick(() => {
                if (window.refreshIcons) window.refreshIcons();
            });
        },

        /**
         * Set up WebSocket event handlers
         */
        setupSocketHandlers() {
            // Clear existing handlers to prevent duplicates
            socket.clearHandlers();
            
            const onConnected = () => {
                this.log('Connected to PocketPaw Engine', 'success');
                // Fetch initial status
                socket.runTool('status');
            };
            
            socket.on('connected', onConnected);
            
            // If already connected, trigger manually
            if (socket.isConnected) {
                onConnected();
            }
            
            socket.on('disconnected', () => {
                this.log('Disconnected from server', 'error');
            });
            
            socket.on('message', (data) => this.handleMessage(data));
            socket.on('notification', (data) => this.handleNotification(data));
            socket.on('status', (data) => this.handleStatus(data));
            socket.on('screenshot', (data) => this.handleScreenshot(data));
            socket.on('code', (data) => this.handleCode(data));
            socket.on('error', (data) => this.handleError(data));
            socket.on('stream_start', () => this.startStreaming());
            socket.on('stream_end', () => this.endStreaming());
            socket.on('files', (data) => this.handleFiles(data));
        },

        /**
         * Handle notification
         */
        handleNotification(data) {
            const content = data.content || '';
            
            // Skip duplicate connection messages
            if (content.includes('Connected to PocketPaw') && this.hasShownWelcome) {
                return;
            }
            if (content.includes('Connected to PocketPaw')) {
                this.hasShownWelcome = true;
            }
            
            this.showToast(content, 'info');
            this.log(content, 'info');
        },

        /**
         * Handle incoming message
         */
        handleMessage(data) {
            const content = data.content || '';
            
            // Check if it's a status update (don't show in chat)
            if (content.includes('System Status') || content.includes('🧠 CPU:')) {
                this.status = Tools.parseStatus(content);
                return;
            }
            
            // Handle streaming vs complete messages
            if (this.isStreaming) {
                this.streamingContent += content;
            } else {
                this.addMessage('assistant', content);
            }
            
            this.log(content.substring(0, 80) + (content.length > 80 ? '...' : ''), 'info');
        },

        /**
         * Handle status updates
         */
        handleStatus(data) {
            if (data.content) {
                this.status = Tools.parseStatus(data.content);
            }
        },

        /**
         * Handle screenshot
         */
        handleScreenshot(data) {
            if (data.image) {
                this.screenshotSrc = `data:image/png;base64,${data.image}`;
                this.showScreenshot = true;
            }
        },

        /**
         * Handle code blocks
         */
        handleCode(data) {
            const content = data.content || '';
            if (this.isStreaming) {
                this.streamingContent += '\n```\n' + content + '\n```\n';
            } else {
                this.addMessage('assistant', '```\n' + content + '\n```');
            }
        },

        /**
         * Handle errors
         */
        handleError(data) {
            const content = data.content || 'Unknown error';
            this.addMessage('assistant', '❌ ' + content);
            this.log(content, 'error');
            this.showToast(content, 'error');
            this.endStreaming();

            // If file browser is open, show error there
            if (this.showFileBrowser) {
                this.fileLoading = false;
                this.fileError = content;
            }
        },

        /**
         * Handle file browser data
         */
        handleFiles(data) {
            this.fileLoading = false;
            this.fileError = null;

            if (data.error) {
                this.fileError = data.error;
                return;
            }

            this.filePath = data.path || '~';
            this.files = data.files || [];

            // Refresh Lucide icons after Alpine renders
            this.$nextTick(() => {
                if (window.refreshIcons) window.refreshIcons();
            });
        },

        /**
         * Start streaming mode
         */
        startStreaming() {
            this.isStreaming = true;
            this.streamingContent = '';
        },

        /**
         * End streaming mode
         */
        endStreaming() {
            if (this.isStreaming && this.streamingContent) {
                this.addMessage('assistant', this.streamingContent);
            }
            this.isStreaming = false;
            this.streamingContent = '';
        },

        /**
         * Add a message to the chat
         */
        addMessage(role, content) {
            this.messages.push({
                role,
                content,
                time: Tools.formatTime()
            });
            
            // Auto scroll to bottom
            this.$nextTick(() => {
                if (this.$refs.messages) {
                    this.$refs.messages.scrollTop = this.$refs.messages.scrollHeight;
                }
            });
        },

        /**
         * Send a chat message
         */
        sendMessage() {
            const text = this.inputText.trim();
            if (!text) return;
            
            // Add user message
            this.addMessage('user', text);
            this.inputText = '';
            
            // Start streaming indicator
            this.startStreaming();
            
            // Send to server
            socket.chat(text);
            
            this.log(`You: ${text}`, 'info');
        },

        /**
         * Run a tool
         */
        runTool(tool) {
            this.log(`Running tool: ${tool}`, 'info');

            // Special handling for file browser
            if (tool === 'fetch') {
                this.openFileBrowser();
                return;
            }

            socket.runTool(tool);
        },

        /**
         * Open file browser modal
         */
        openFileBrowser() {
            this.showFileBrowser = true;
            this.fileLoading = true;
            this.fileError = null;
            this.files = [];
            this.filePath = '~';

            // Refresh icons after modal renders
            this.$nextTick(() => {
                if (window.refreshIcons) window.refreshIcons();
            });

            socket.send('browse', { path: '~' });
        },

        /**
         * Navigate to a directory
         */
        navigateTo(path) {
            this.fileLoading = true;
            this.fileError = null;
            socket.send('browse', { path });
        },

        /**
         * Navigate up one directory
         */
        navigateUp() {
            const parts = this.filePath.split('/').filter(s => s);
            parts.pop();
            const newPath = parts.length > 0 ? parts.join('/') : '~';
            this.navigateTo(newPath);
        },

        /**
         * Navigate to a path segment (breadcrumb click)
         */
        navigateToSegment(index) {
            const parts = this.filePath.split('/').filter(s => s);
            const newPath = parts.slice(0, index + 1).join('/');
            this.navigateTo(newPath || '~');
        },

        /**
         * Select a file or folder
         */
        selectFile(item) {
            if (item.isDir) {
                // Navigate into directory
                const newPath = this.filePath === '~'
                    ? item.name
                    : `${this.filePath}/${item.name}`;
                this.navigateTo(newPath);
            } else {
                // File selected - could download or preview
                this.log(`Selected file: ${item.name}`, 'info');
                this.showToast(`Selected: ${item.name}`, 'info');
                // TODO: Add file download/preview functionality
            }
        },

        /**
         * Toggle agent mode
         */
        toggleAgent() {
            socket.toggleAgent(this.agentActive);
            this.log(`Switched Agent Mode: ${this.agentActive ? 'ON' : 'OFF'}`, 'info');
        },

        /**
         * Save settings
         */
        saveSettings() {
            socket.saveSettings(this.settings.agentBackend, this.settings.llmProvider);
            this.log('Settings updated', 'info');
            this.showToast('Settings saved', 'success');
        },

        /**
         * Save API key
         */
        saveApiKey(provider) {
            const key = this.apiKeys[provider];
            if (!key) {
                this.showToast('Please enter an API key', 'error');
                return;
            }
            
            socket.saveApiKey(provider, key);
            this.apiKeys[provider] = ''; // Clear input
            this.log(`Saved ${provider} API key`, 'success');
            this.showToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved!`, 'success');
        },

        /**
         * Start polling for system status (every 10 seconds, only when connected)
         */
        startStatusPolling() {
            setInterval(() => {
                if (socket.isConnected) {
                    socket.runTool('status');
                }
            }, 10000); // Poll every 10 seconds, not 3
        },

        /**
         * Add log entry
         */
        log(message, level = 'info') {
            this.logs.push({
                time: Tools.formatTime(),
                message,
                level
            });
            
            // Keep only last 100 logs
            if (this.logs.length > 100) {
                this.logs.shift();
            }
            
            // Auto scroll terminal
            this.$nextTick(() => {
                if (this.$refs.terminal) {
                    this.$refs.terminal.scrollTop = this.$refs.terminal.scrollHeight;
                }
            });
        },

        /**
         * Format message content
         */
        formatMessage(content) {
            return Tools.formatMessage(content);
        },

        /**
         * Get current time string
         */
        currentTime() {
            return Tools.formatTime();
        },

        /**
         * Show toast notification
         */
        showToast(message, type = 'info') {
            Tools.showToast(message, type, this.$refs.toasts);
        }
    };
}
