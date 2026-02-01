# PocketPaw Project Analysis

> Last updated: 2026-02-01

## Overview

**PocketPaw** is a self-hosted, cross-platform personal AI agent that runs locally and can be controlled via Telegram or a web dashboard. It's positioned as an OpenClaw competitor with a friendlier, more approachable identity.

**Tagline:** *"The AI agent that runs on your laptop, not a datacenter."*

> **Note:** The Python module is named `pocketclaw` for historical reasons, but the user-facing brand is **PocketPaw**.

**Current Version:** v0.1.0 (MVP)

---

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   User Input    │     │  PocketPaw      │     │   Your Machine  │
│  (Telegram/Web) │────▶│  Daemon          │────▶│  (Shell/Files)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │  Agent Backend   │
                        │  (OI / Claude)   │
                        └──────────────────┘
                               │
                               ▼
                        ┌──────────────────┐
                        │   LLM Router     │
                        │ (Ollama/OpenAI/  │
                        │  Anthropic)      │
                        └──────────────────┘
```

---

## Tech Stack

### Backend
| Component | Technology |
|-----------|------------|
| Language | Python 3.11+ |
| Package Manager | UV |
| Web Framework | FastAPI + Uvicorn |
| Telegram | python-telegram-bot (async) |
| LLM Clients | Open Interpreter, Anthropic SDK, OpenAI SDK, httpx (Ollama) |
| System Tools | psutil (stats), pyautogui (screenshots), Pillow |
| Config | Pydantic v2 + pydantic-settings |
| QR Codes | qrcode[pil] |

### Frontend
| Component | Technology |
|-----------|------------|
| Framework | Alpine.js 3.x |
| CSS | Custom + UnoCSS (runtime) |
| Icons | Lucide (CDN) |
| Communication | WebSocket |
| Design | Apple-inspired glassmorphism, dark theme |

---

## Project Structure

```
pocketclaw/
├── README.md                    # Main documentation
├── pyproject.toml               # UV config, dependencies
├── docs/
│   ├── PROJECT_ANALYSIS.md      # This file
│   ├── STATUS.md                # Development status
│   ├── idea.md                  # Original product vision
│   ├── openclaw.md              # Competitive analysis
│   ├── tech-spec.md             # Technical design document
│   └── open-claw/               # Use case documentation
│
├── src/pocketclaw/
│   ├── __init__.py
│   ├── __main__.py              # Entry point (--telegram or --web mode)
│   ├── config.py                # Settings management (JSON + env vars)
│   ├── bot_gateway.py           # Telegram bot handler
│   ├── web_server.py            # QR pairing server
│   ├── dashboard.py             # Web dashboard FastAPI server
│   │
│   ├── tools/
│   │   ├── status.py            # System stats (CPU, RAM, Disk, Battery)
│   │   ├── fetch.py             # File browser with jail security
│   │   └── screenshot.py        # Screen capture
│   │
│   ├── llm/
│   │   └── router.py            # LLM backend detection & routing
│   │
│   ├── agents/
│   │   ├── router.py            # Agent backend router
│   │   ├── open_interpreter.py  # Open Interpreter wrapper
│   │   └── claude_code.py       # Claude Code wrapper
│   │
│   └── frontend/                # Web dashboard UI
│       ├── index.html           # Alpine.js SPA
│       ├── js/
│       │   ├── app.js           # Main Alpine component
│       │   ├── websocket.js     # WebSocket singleton
│       │   └── tools.js         # Utility functions
│       └── css/
│           └── styles.css       # Custom styles (glassmorphism)
│
└── tests/
    └── test_tools.py            # 19 unit tests
```

---

## Key Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `dashboard.py` | Web dashboard FastAPI + WebSocket handlers | ~300 |
| `bot_gateway.py` | Telegram bot handler | ~334 |
| `agents/open_interpreter.py` | Open Interpreter wrapper with streaming | ~173 |
| `agents/claude_code.py` | Claude computer use integration | ~204 |
| `llm/router.py` | Multi-backend LLM router | ~142 |
| `config.py` | Settings management | ~92 |
| `frontend/index.html` | Alpine.js SPA dashboard | ~390 |
| `frontend/js/app.js` | Main Alpine component | ~380 |
| `frontend/css/styles.css` | Custom CSS | ~500 |

---

## Features Status

### Completed (v0.1.0)
- [x] Core infrastructure
- [x] Telegram bot with persistent keyboard
- [x] Web dashboard with real-time WebSocket
- [x] QR code pairing flow
- [x] Tools: Status, Fetch (file browser), Screenshot, Panic
- [x] LLM router with auto-detection (Ollama → OpenAI → Anthropic)
- [x] Agent backends: Open Interpreter, Claude Code
- [x] Settings modal (agent backend, LLM provider, API keys)
- [x] File browser modal with navigation
- [x] 19 passing unit tests

### Not Implemented (Future)
- [ ] "Hype Mode" (auto-record viral videos) - **NOT PLANNED**
- [ ] Screen recording + TTS voiceover
- [ ] Scheduled tasks (cron)
- [ ] Voice message support (Whisper)
- [ ] PyInstaller single-binary distribution
- [ ] Multi-user support
- [ ] Conversation history persistence

---

## Frontend Architecture

### Libraries (CDN)
```html
<!-- Alpine.js - Reactive framework -->
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.3/dist/cdn.min.js"></script>

<!-- UnoCSS Runtime - Utility CSS (Tailwind-compatible) -->
<script src="https://cdn.jsdelivr.net/npm/@unocss/runtime"></script>

<!-- Lucide Icons -->
<script src="https://unpkg.com/lucide@latest"></script>
```

### UnoCSS Configuration
```javascript
window.__unocss = {
  theme: {
    colors: {
      accent: '#0A84FF',
      success: '#30D158',
      danger: '#FF453A',
      warning: '#FF9F0A',
    }
  },
  shortcuts: {
    'glass': 'bg-white/10 backdrop-blur-xl border border-white/12 rounded-2xl',
    'glass-dark': 'bg-black/30 backdrop-blur-xl border border-white/12 rounded-2xl',
  }
}
```

### CSS Approach (Hybrid)
- **Custom CSS**: Glassmorphism effects, hover states, transitions, component-specific styling
- **UnoCSS utilities**: Layout (`flex`, `grid`, `gap-*`), spacing (`p-*`, `m-*`), typography (`text-*`, `font-*`)

### Icon Usage
```html
<!-- Static Lucide icon -->
<i data-lucide="folder" class="w-5 h-5"></i>

<!-- Dynamic icons (use inline SVG with x-show) -->
<svg x-show="item.isDir" ...>folder svg</svg>
<svg x-show="!item.isDir" ...>file svg</svg>
```

### Lucide Icon Refresh
```javascript
// Call after Alpine updates DOM
window.refreshIcons = () => {
  clearTimeout(iconTimeout);
  iconTimeout = setTimeout(() => lucide.createIcons(), 50);
};

// Usage in Alpine
this.$nextTick(() => {
  if (window.refreshIcons) window.refreshIcons();
});
```

---

## WebSocket Protocol

### Client → Server Actions
```javascript
// Run a tool
socket.send('tool', { tool: 'status' | 'screenshot' | 'fetch' | 'panic' });

// Browse files
socket.send('browse', { path: '~' | 'Documents' | 'Documents/folder' });

// Chat message
socket.send('chat', { message: 'Hello' });

// Toggle agent mode
socket.send('toggle_agent', { active: true | false });

// Save settings
socket.send('settings', { agent_backend: 'open_interpreter', llm_provider: 'auto' });

// Save API key
socket.send('save_api_key', { provider: 'anthropic' | 'openai', key: 'sk-...' });
```

### Server → Client Message Types
```javascript
{ type: 'notification', content: '...' }  // Toast notification
{ type: 'message', content: '...' }       // Chat message
{ type: 'status', content: '...' }        // System status update
{ type: 'screenshot', image: 'base64...' } // Screenshot data
{ type: 'files', path: '~', files: [...] } // File browser data
{ type: 'error', content: '...' }         // Error message
{ type: 'stream_start' }                  // Agent response starting
{ type: 'stream_end' }                    // Agent response complete
```

---

## Configuration

### Config File Location
`~/.pocketclaw/config.json`

### Settings Schema
```json
{
  "telegram_bot_token": "123456:ABC...",
  "allowed_user_id": 123456789,
  "agent_backend": "open_interpreter",
  "llm_provider": "auto",
  "ollama_host": "http://localhost:11434",
  "ollama_model": "llama3.2",
  "openai_api_key": "sk-...",
  "openai_model": "gpt-4o",
  "anthropic_api_key": "sk-ant-...",
  "anthropic_model": "claude-sonnet-4-20250514"
}
```

### Environment Variables
All settings can be overridden with `POCKETCLAW_` prefix:
```bash
POCKETCLAW_TELEGRAM_BOT_TOKEN=...
POCKETCLAW_LLM_PROVIDER=anthropic
```

---

## Running the Project

```bash
# Install dependencies
uv sync

# Run web dashboard (default)
uv run pocketclaw --web

# Run Telegram bot
uv run pocketclaw --telegram

# Run tests
uv run pytest -v
```

---

## Security Features

1. **Single-user lock**: Only one Telegram user ID can control the bot
2. **File jail**: Operations restricted to home directory by default
3. **Safe path validation**: Prevents directory traversal attacks
4. **Panic button**: Emergency stop for runaway agents
5. **Local-first option**: Keep everything on-device with Ollama

---

## Design System

### Colors (CSS Variables)
```css
--bg-color: #000000;
--glass-bg: rgba(28, 28, 30, 0.65);
--glass-border: rgba(255, 255, 255, 0.12);
--text-primary: #FFFFFF;
--text-secondary: rgba(235, 235, 245, 0.6);
--accent-color: #0A84FF;
--success-color: #30D158;
--danger-color: #FF453A;
```

### Border Radius
```css
--radius-lg: 18px;
--radius-md: 12px;
--radius-sm: 8px;
```

### Fonts
```css
--font-sans: -apple-system, BlinkMacSystemFont, "SF Pro Text", ...;
--font-mono: "SF Mono", "JetBrains Mono", Menlo, monospace;
```

---

## Common Tasks

### Adding a New Tool
1. Create `src/pocketclaw/tools/new_tool.py`
2. Add handler in `dashboard.py` → `handle_tool()`
3. Add button in `frontend/index.html` sidebar
4. Add WebSocket handler in `frontend/js/app.js` if needed

### Adding a New Modal
1. Add modal HTML in `index.html` (use `x-if` for conditional rendering)
2. Add state variable in `app.js` (e.g., `showNewModal: false`)
3. Add handler functions in `app.js`
4. Add any custom CSS in `styles.css`

### Modifying Settings
1. Add field to `Settings` class in `config.py`
2. Add to `save()` method's data dict
3. Add UI in settings modal (`index.html`)
4. Add handler in `dashboard.py` if needed

---

## Troubleshooting

### Icons not rendering
- Call `window.refreshIcons()` after DOM updates
- For dynamic icons in loops, use inline SVG with `x-show` instead of `:data-lucide`

### x-show showing multiple states
- Use `x-if` for mutually exclusive states (adds/removes from DOM)
- Use `x-show` only for simple show/hide (keeps in DOM)

### WebSocket not connecting
- Check if dashboard is running on correct port (default: 8888)
- Check browser console for errors
- Verify `socket.connect()` is called in `init()`
