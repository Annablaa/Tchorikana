# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS
- React Query (TanStack Query) for data fetching
- Backend API integration

## Backend API Integration

This UI is connected to a backend API. The API endpoints are defined in `src/lib/api.ts`.

### Configuration

1. Create a `.env` file in the root directory (or copy from `.env.example`):
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```

2. Update the `VITE_API_BASE_URL` to match your backend server URL.

### CORS Configuration

**Important**: The backend must be configured to allow CORS requests from the frontend origin.

#### Development (Vite Proxy)
In development, Vite is configured with a proxy that forwards `/api/*` requests to your backend, which helps avoid CORS issues. The proxy is configured in `vite.config.ts`.

#### Backend CORS Setup
Your backend needs to allow requests from the frontend origin. Here are examples for common frameworks:

**Express.js:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: ['http://localhost:8080', 'http://172.17.0.1:8080'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
}));
```

**FastAPI (Python):**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://172.17.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Flask (Python):**
```python
from flask_cors import CORS

CORS(app, origins=["http://localhost:8080", "http://172.17.0.1:8080"])
```

**For production**, configure CORS to allow your production frontend domain.

### API Endpoints

The application uses the following backend endpoints:

- **Users**: `/api/users` (GET, POST, PUT, DELETE)
- **Conversations**: `/api/conversations` (GET, POST, PUT, DELETE)
- **Messages**: `/api/messages` (GET, POST, PUT, DELETE)
- **Tasks**: `/api/tasks` (GET, POST, PUT, DELETE)

All API calls are handled through the `api` client in `src/lib/api.ts`, which provides type-safe methods for interacting with the backend.

### Current User

The application uses `localStorage` to store the current user ID. In production, this should be replaced with proper authentication. The current user ID is used when creating messages and tasks.

To set up a user:
1. Create a user via the backend API
2. Store the user ID in `localStorage` with key `currentUserId`

### Data Flow

1. **Conversations**: Fetched on mount, displayed in the sidebar
2. **Messages**: Fetched when a conversation is selected
3. **Tasks**: Fetched on mount, displayed in the task panel
4. **Users**: Fetched to map user IDs to display names

All data fetching uses React Query for caching, error handling, and automatic refetching.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
