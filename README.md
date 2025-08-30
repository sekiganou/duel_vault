# Duel Vault

A comprehensive deck management and tournament tracking application for trading card games. Built with Next.js 15 and HeroUI v2, Duel Vault helps players organize their decks, track match results, and manage tournament data.

## Features

- **Deck Management**: Create, edit, and organize your trading card game decks
- **Archetype Classification**: Categorize decks by strategic archetypes
- **Format Support**: Manage decks across different game formats (Speed Duel, Standard, Rush Duel)
- **Match Tracking**: Record wins, losses, and ties for each deck
- **Tournament Management**: Track tournament participation and results
- **Avatar Upload**: Add custom images to your decks via MinIO S3 storage
- **Modern UI**: Clean, responsive interface with dark/light theme support

## Technologies Used

- **Frontend**: [Next.js 15](https://nextjs.org/) with App Router
- **UI Library**: [HeroUI v2](https://heroui.com/) with [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/)
- **File Storage**: [MinIO](https://min.io/) S3-compatible object storage
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Validation**: [Zod](https://zod.dev/) for runtime type checking
- **Styling**: [Tailwind Variants](https://tailwind-variants.org), [Framer Motion](https://www.framer.com/motion/)
- **Theme**: [next-themes](https://github.com/pacocoursey/next-themes) for dark/light mode
- **Icons**: [Tabler Icons](https://tabler-icons.io/)
- **HTTP Client**: [Axios](https://axios-http.com/)
- **Containerization**: [Docker](https://www.docker.com/) with Docker Compose

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/get-started) and Docker Compose
- [Node.js 18+](https://nodejs.org/) (for local development)
- [Git](https://git-scm.com/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/duel_vault.git
   cd duel_vault
   ```

2. **Set up environment variables**

   Create a `.env.local` file in the root directory with your configuration:

   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/duelvault"
   POSTGRES_USER=username
   POSTGRES_PASSWORD=password
   POSTGRES_DB=duelvault

   # MinIO S3 Storage
   MINIO_ROOT_USER=minioadmin
   MINIO_ROOT_PASSWORD=minioadmin123
   MINIO_ENDPOINT=localhost
   MINIO_PORT=9000
   MINIO_USE_SSL=false
   MINIO_BUCKET_NAME=duelvault
   ```

3. **Start the development environment**

   ```bash
   make up
   ```

   This will start:

   - PostgreSQL database on port 5432
   - MinIO S3 storage on ports 9000 (API) and 9001 (Console)
   - Next.js application on port 3000

4. **Set up the database**

   ```bash
   # Run database migrations
   npx prisma migrate dev --name init

   # Seed initial data
   npm run seed
   ```

5. **Access the application**
   - **Web App**: http://localhost:3000
   - **MinIO Console**: http://localhost:9001

### Alternative: Local Development

If you prefer to run without Docker:

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start external services** (PostgreSQL and MinIO)

   ```bash
   docker compose -f docker-compose.dev.yml up db s3
   ```

3. **Run database setup**

   ```bash
   npx prisma migrate dev
   npm run seed
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

## Project Structure

```
duel_vault/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── archetypes/    # Archetype management
│   │   ├── decks/         # Deck CRUD operations
│   │   ├── formats/       # Format management
│   │   ├── matches/       # Match management
│   │   ├── tournaments/   # Tournament management
│   │   └── minio/         # File upload handling
│   ├── decks/             # Deck management pages
│   ├── matches/           # Match management pages
│   ├── tournaments/       # Tournament management pages
│   └── page.tsx           # Home page
├── components/            # Reusable UI components
├── lib/                   # Utilities and schemas
│   ├── api/              # Client-side API functions
│   ├── middlewares/      # Error handling middleware
│   └── schemas/          # Zod validation schemas
├── prisma/               # Database schema and migrations
├── types/                # TypeScript type definitions
├── public/               # Static assets
└── styles/               # Global styles
```

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with auto-fix
- `npm run seed` - Seed database with initial data

## Make Commands

- `make up` - Start all services
- `make down` - Stop all services
- `make build` - Rebuild Docker images for development
- `make build-prod` - Build production Docker image
- `make restart` - Restart all services
- `make migrate MIGRATION=<name>` - Create and run database migration
- `make prune` - Clean up Docker system

## Database Schema

The application uses the following main entities:

- **Decks**: Player deck configurations with archetype and format
- **Archetypes**: Strategic deck categories
- **Formats**: Game format types (Speed Duel, Standard, Rush Duel)
- **Tournaments**: Tournament events and metadata
- **Matches**: Individual game records between decks
- **TournamentDeckStats**: Performance statistics per tournament

## API Endpoints

- `GET/POST /api/decks` - Deck management
- `DELETE /api/decks?id=<id>` - Delete deck
- `GET/POST /api/archetypes` - Archetype management
- `GET/POST /api/formats` - Format management
- `GET/POST /api/tournaments` - Tournament management
- `GET/POST /api/matches` - Match management
- `POST /api/minio/upload` - File upload
- `DELETE /api/minio/delete` - File deletion

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm run lint`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Environment Variables

| Variable              | Description                  | Default      |
| --------------------- | ---------------------------- | ------------ |
| `DATABASE_URL`        | PostgreSQL connection string | -            |
| `POSTGRES_USER`       | Database username            | -            |
| `POSTGRES_PASSWORD`   | Database password            | -            |
| `POSTGRES_DB`         | Database name                | -            |
| `MINIO_ROOT_USER`     | MinIO admin username         | `minioadmin` |
| `MINIO_ROOT_PASSWORD` | MinIO admin password         | -            |
| `MINIO_ENDPOINT`      | MinIO server endpoint        | `localhost`  |
| `MINIO_PORT`          | MinIO server port            | `9000`       |
| `MINIO_USE_SSL`       | Use SSL for MinIO            | `false`      |
| `MINIO_BUCKET_NAME`   | S3 bucket name               | `duelvault`  |

## License

Licensed under the [MIT license](LICENSE).
