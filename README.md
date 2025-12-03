# Kuralit Dashboard

Real-time monitoring and debugging tool for Kuralit AI Voice Agent servers. Monitor conversations, track metrics, and debug agent interactions in real-time.

Here's what the Kuralit Dashboard looks like in action:

<video src="https://github.com/user-attachments/assets/9272677c-0322-4991-9717-61be2bb45563" controls width="800"></video>

## Features

- **Real-time Monitoring**: Watch conversations as they happen
- **Metrics Tracking**: Monitor messages, tool calls, errors, and latency
- **Debugging Tools**: Inspect conversation history and agent responses
- **Session Management**: View and manage active sessions
- **Connection Status**: Monitor WebSocket connection health

## Prerequisites

- **Node.js** 18+ and npm
- **Python Server**: A running Kuralit Python WebSocket server
  - Server must be running on `localhost:8000` (default) or configured URL
  - Server must have the dashboard endpoint enabled (`/ws/dashboard`)

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/kuralit/kuralit-ui.git
cd kuralit-ui
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# WebSocket URL for connecting to the Python server
VITE_WEBSOCKET_URL=ws://localhost:8000/ws/dashboard

# Optional: API key for authentication (if your server requires it)
VITE_API_KEY=your-api-key-here
```

**Note**: 
- Default WebSocket URL is `ws://localhost:8000/ws/dashboard` if not specified
- API key is optional - only required if your server enforces authentication
- For production, use `wss://` (WebSocket Secure) instead of `ws://`

### 4. Start the Development Server

```bash
npm run dev
```

The dashboard will be available at `http://localhost:3000` (or the port shown in the terminal).

## Connecting to Your Python Server

### Step 1: Start Your Python Server

First, ensure your Kuralit Python WebSocket server is running. For example:

```bash
# Navigate to your Python SDK directory
cd python-sdk

# Run the minimal server example
python examples/minimal_server.py
```

Or using uvicorn directly:

```bash
uvicorn examples.minimal_server:app --host 0.0.0.0 --port 8000
```

The server should display:
```
🚀 Starting minimal WebSocket server...
   Host: 0.0.0.0
   Port: 8000
   Connect at: ws://0.0.0.0:8000/ws
```

### Step 2: Verify Dashboard Endpoint

The dashboard connects to the `/ws/dashboard` endpoint. This endpoint is automatically available when you use `create_app()` from `kuralit.server.websocket_server`.

### Step 3: Configure Dashboard Connection

#### Option A: Using Environment Variables (Recommended)

Create a `.env` file in the `kuralit-ui` directory:

```env
VITE_WEBSOCKET_URL=ws://localhost:8000/ws/dashboard
VITE_API_KEY=demo-api-key
```

#### Option B: Using Default Values

If you don't create a `.env` file, the dashboard will use:
- WebSocket URL: `ws://localhost:8000/ws/dashboard`
- API Key: None (if your server allows unauthenticated connections)

#### Option C: Custom Server URL

If your server is running on a different host or port:

```env
VITE_WEBSOCKET_URL=ws://your-server-host:8000/ws/dashboard
VITE_API_KEY=your-api-key
```

For production servers with SSL:

```env
VITE_WEBSOCKET_URL=wss://api.yourdomain.com/ws/dashboard
VITE_API_KEY=your-production-api-key
```

### Step 4: Start the Dashboard

```bash
npm run dev
```

The dashboard will automatically connect to your Python server when it loads.

## Usage

### Connection Status

- **Green "AGENT ACTIVE"** indicator: Dashboard is connected to the server
- **Red/Disconnected**: Check that your Python server is running and the WebSocket URL is correct

### Viewing Conversations

1. **History Panel** (Left): Lists all conversation sessions
2. **Timeline View** (Center): Shows the conversation flow with timestamps
3. **Details Panel** (Right): Displays detailed information about selected events

### Metrics

The telemetry bar shows:
- **Messages**: Total messages processed by the server
- **Tool Calls**: Total tool invocations
- **Errors**: Total errors encountered
- **Latency (p95)**: 95th percentile response latency

### Filtering

Use the filter checkboxes to show/hide:
- **USER**: User messages
- **AGENT**: Agent responses
- **TOOLS**: Tool call outputs

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory, ready to be deployed to any static hosting service.

## Troubleshooting

### Dashboard Won't Connect

1. **Check Python Server**: Ensure your Python server is running
   ```bash
   # Check if server is running
   curl http://localhost:8000/docs  # Should return FastAPI docs
   ```

2. **Verify WebSocket URL**: Check your `.env` file matches your server configuration
   ```env
   VITE_WEBSOCKET_URL=ws://localhost:8000/ws/dashboard
   ```

3. **Check API Key**: If your server requires authentication, ensure the API key matches
   ```env
   VITE_API_KEY=your-api-key
   ```

4. **Browser Console**: Open browser DevTools (F12) and check for WebSocket connection errors

5. **CORS Issues**: If connecting to a remote server, ensure CORS is properly configured

### No Data Showing

- **Check Server Logs**: Verify the server is receiving connections
- **Refresh Dashboard**: Try refreshing the browser
- **Check Filters**: Ensure USER, AGENT, and TOOLS filters are enabled

### Connection Drops

- The dashboard automatically attempts to reconnect
- Check server logs for disconnection reasons
- Verify network stability

## Development

### Project Structure

```
kuralit-ui/
├── src/
│   ├── hooks/
│   │   └── useDashboardState.ts    # Dashboard state management
│   ├── services/
│   │   └── websocketService.ts     # WebSocket connection service
│   └── utils/
│       └── dataTransformers.ts     # Data transformation utilities
├── components/
│   ├── Header.tsx                  # Top header with logo and status
│   ├── MetricsRow.tsx              # Telemetry metrics display
│   └── TimelineViewer.tsx          # Conversation timeline
├── App.tsx                          # Main application component
└── package.json                    # Dependencies and scripts
```

### Running in Development Mode

```bash
npm run dev
```

### Building

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## API Reference

### WebSocket Connection

The dashboard connects to: `ws://localhost:8000/ws/dashboard`

**Connection Parameters**:
- `api_key` (optional): Query parameter for authentication
  - Example: `ws://localhost:8000/ws/dashboard?api_key=your-key`

**Message Types**:
- `initial_state`: Server sends initial state on connection
- `event`: Real-time events (message_received, agent_response, etc.)
- `error`: Error messages
- `pong`: Keep-alive response

## License

This project is licensed under the same Non-Commercial License as the main Kuralit repository. See [LICENSE](LICENSE) for details.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on contributing to this project.

## Security

For security vulnerabilities, please see [SECURITY.md](SECURITY.md).

## Support

- **Documentation**: [Kuralit Docs](https://docs.kuralit.com)
- **Issues**: [GitHub Issues](https://github.com/kuralit/kuralit-ui/issues)
- **Email**: hello@kuralit.com

## Related

- **Main Repository**: [kuralit/kuralit](https://github.com/kuralit/kuralit)
- **Python SDK**: [python-sdk](https://github.com/kuralit/kuralit/tree/main/python-sdk)
- **Flutter SDK**: [flutter-sdk](https://github.com/kuralit/kuralit/tree/main/flutter-sdk)
