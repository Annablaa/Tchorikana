# Choricana - Fullstack Chat Application

A modern fullstack chat application with semantic search capabilities, built with Next.js, React, and Supabase.

## 🚀 Features

- **Real-time Chat**: Create conversations, send messages, and manage users
- **Semantic Search**: AI-powered search using vector embeddings to find messages by meaning, not just keywords
- **Task Management**: Create and manage tasks with proposals and status tracking
- **Vector Similarity Search**: Uses cosine similarity to find semantically similar messages
- **AI-Enhanced Results**: Google AI generates summaries of search results
- **RESTful API**: Complete API with Swagger documentation
- **Modern UI**: Built with shadcn/ui components and Tailwind CSS

## 🏗️ Architecture

### Backend (`Chat-Backend/`)
- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL with pgvector extension)
- **API Documentation**: Swagger UI
- **AI Integration**: Google AI for embeddings and text generation

### Frontend (`Chat-UI/`)
- **Framework**: React 18 with Vite
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router

## 📚 Key Libraries

### Backend
- `next` - React framework for production
- `@supabase/supabase-js` - Supabase client library
- `swagger-ui-react` - API documentation UI
- Google AI SDK - For embeddings and text generation

### Frontend
- `react` & `react-dom` - UI library
- `@tanstack/react-query` - Data fetching and caching
- `@radix-ui/*` - Accessible UI primitives
- `tailwindcss` - Utility-first CSS framework
- `lucide-react` - Icon library
- `zod` - Schema validation

## 🔍 Semantic Search

The application features advanced semantic search powered by vector embeddings:

1. **Embedding Generation**: Messages are automatically converted to 768-dimensional vectors using Google AI
2. **Vector Storage**: Embeddings stored in PostgreSQL using pgvector extension
3. **Similarity Search**: Uses cosine similarity to find semantically similar messages
4. **AI Enhancement**: Search results include AI-generated summaries for better context

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Google AI API key (for semantic search)

### Backend Setup

1. Navigate to backend directory:
```bash
cd Chat-Backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_AI_API_KEY=your_google_ai_api_key
```

4. Set up database:
   - Enable pgvector extension in Supabase
   - Run the SQL schema (see `Chat-UI/simple_schema.sql`)
   - Add `embedding vector(768)` column to messages table

5. Start development server:
```bash
npm run dev
```

Backend runs on `http://localhost:3000`
- API: `http://localhost:3000/api/*`
- Swagger Docs: `http://localhost:3000/api-docs`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd Chat-UI
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file (optional):
```env
VITE_API_BASE_URL=http://localhost:3000
```

4. Start development server:
```bash
npm run dev
```

Frontend runs on `http://localhost:8080`

## 📖 API Endpoints

- `GET /api/health` - Health check
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/conversations` - List conversations
- `POST /api/conversations` - Create conversation
- `GET /api/messages` - List messages
- `POST /api/messages` - Create message (auto-generates embedding)
- `POST /api/search` - Semantic search
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create task

View full API documentation at `/api-docs` when backend is running.

## 🔐 Environment Variables

### Backend (`Chat-Backend/.env.local`)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret!)
- `GOOGLE_AI_API_KEY` - Google AI API key for embeddings

### Frontend (`Chat-UI/.env.local`)
- `VITE_API_BASE_URL` - Backend API URL (defaults to Vercel deployment)

## 🚢 Deployment

### Backend (Vercel)
1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Frontend (Vercel)
1. Set build command: `npm run build`
2. Set output directory: `dist`
3. Set environment variable: `VITE_API_BASE_URL` to your backend URL

## 📝 Project Structure

```
chorikana/
├── Chat-Backend/          # Next.js backend API
│   ├── app/api/          # API routes
│   ├── lib/              # Utilities and helpers
│   │   ├── ai/           # AI/embedding functions
│   │   ├── cors.ts       # CORS configuration
│   │   └── swagger.ts    # API documentation
│   └── package.json
├── Chat-UI/              # React frontend
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── lib/          # API client
│   │   └── pages/        # Page components
│   └── package.json
└── README.md
```

## 🧪 Testing

### Backfill Embeddings
If you have existing messages without embeddings:

```bash
# Get statistics
curl http://localhost:3000/api/messages/backfill

# Backfill messages
curl -X POST http://localhost:3000/api/messages/backfill \
  -H "Content-Type: application/json" \
  -d '{"batchSize": 10, "limit": 100}'
```

## 📄 License

Private project

## 🤝 Contributing

This is a private project. For questions or issues, contact the repository owner.

