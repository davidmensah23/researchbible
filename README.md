# ResearchBible

A Next.js-powered platform for academic research collaboration, combining manuscript editing, survey deployment, and social features for researchers.

## Features

### 📝 Manuscript Editor
- Rich text editor with academic formatting
- Real-time auto-save with Supabase
- Citation management (APA, MLA, Chicago)
- AI-powered content generation
- PDF/DOCX document upload and parsing

### 📊 Survey System
- Dynamic questionnaire builder
- Public survey deployment
- Real-time analytics dashboard
- CSV data export

### 👥 Social Platform
- User profiles with published works
- Project publishing workflow
- Real-time comments and discussions
- Like/clap system
- Follow researchers

### 📚 Research Tools
- Academic source search integration
- Automated citation formatting
- Document upload with text extraction
- Bibliography management

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage
- **Styling**: Tailwind CSS
- **AI**: Google Gemini API
- **Document Parsing**: mammoth (DOCX), pdf-parse (PDF)

## Getting Started

### Prerequisites
- Node.js 20+
- Supabase account
- Google AI API key

### Installation

1. Clone the repository:
```bash
git clone https://github.com/davidmensah23/researchbible.git
cd researchbible
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file with:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GOOGLE_AI_API_KEY=your_google_ai_key
```

4. Set up the database:
Run the SQL scripts in your Supabase SQL Editor:
- `supabase_schema.sql` - Core tables
- `supabase_responses.sql` - Social features and surveys
- `supabase_storage.sql` - Storage bucket setup

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

```
researchbible/
├── app/
│   ├── api/upload/          # File upload API
│   ├── auth/                # Authentication
│   ├── create/              # Project creation wizard
│   ├── dashboard/           # Project library
│   ├── project/[id]/        # Manuscript editor
│   ├── survey/[id]/         # Public survey page
│   └── u/[username]/        # User profiles
├── components/
│   └── social/              # Social features (Comments, Likes)
├── lib/
│   └── supabase/            # Supabase client utilities
├── services/
│   ├── geminiService.ts     # AI integration
│   └── sourceService.ts     # Citation formatting
└── types.ts                 # TypeScript definitions
```

## Database Schema

The application uses the following main tables:
- `profiles` - User information
- `projects` - Research projects and manuscripts
- `responses` - Survey submissions
- `comments` - Project discussions
- `project_likes` - Social engagement
- `follows` - User connections
- `bookmarks` - Saved projects

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details
