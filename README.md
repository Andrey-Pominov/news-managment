# Bilingual News Management

A comprehensive bilingual news management platform supporting English and Russian content with role-based access control and media management.

## 🚀 Quick Start

### Prerequisites
- .NET 8.0 SDK
- Node.js 18+ and npm
- SQL Server LocalDB or Docker
- Git

### Development Setup

 **Access the application:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Documentation: http://localhost:5000/swagger

## 🏗️ Architecture

### Backend (.NET 8)
- **API**: RESTful web API with Swagger documentation
- **Database**: SQL Server with Entity Framework Core
- **Authentication**: JWT-based authentication
- **File Storage**: Local file system with upload management

### Frontend (React 18)
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query + Context API
- **Internationalization**: react-i18next for bilingual support

### Database
- **Primary**: SQL Server LocalDB (development)
- **Production**: SQL Server
- **Migrations**: Entity Framework Core migrations

## 📁 Project Structure

```
news-management-system/
├── backend/                 # .NET 8 Web API
│   ├── Controllers/        # API controllers
│   ├── Models/            # Data models
│   ├── Services/          # Business logic
│   ├── Data/              # EF Core context
│   └── Migrations/        # Database migrations
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   └── utils/         # Utilities
│   └── public/           # Static assets
├── scripts/              # Development scripts
├── docs/                # Documentation
└── docker-compose.yml   # Docker development environment
```

## 🛠️ Development

### Environment Variables

Create `.env` files in both backend and frontend directories:

**Backend (.env):**
```
ConnectionStrings__DefaultConnection=Server=(localdb)\\mssqllocaldb;Database=NewsManagementDB;Trusted_Connection=true;
JWT_SECRET_KEY=your-super-secret-key-here
JWT_ISSUER=NewsManagementSystem
JWT_AUDIENCE=NewsManagementSystem
UPLOAD_PATH=./uploads
```

**Frontend (.env):**
```
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/uploads
```

### Database Setup

```bash
# Create and seed database
cd backend
dotnet ef database update
dotnet run --seed-data
```

### Running Tests

```bash
# Backend tests
cd backend
dotnet test

# Frontend tests
cd frontend
npm test
```

## 🐳 Docker Development

Use Docker Compose for a complete development environment:

```bash
docker-compose up -d
```

This starts:
- SQL Server container
- Backend API container
- Frontend development server
- File upload volume

## 📚 API Documentation

The API documentation is available at `/swagger` when running the backend. Key endpoints:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Files**: `/api/files/*`

## 🌐 Internationalization

The system supports English and Russian:

- **Backend**: Content stored in both languages
- **Frontend**: UI translated using react-i18next
- **Database**: Separate fields for English/Russian content

## 🔧 Configuration

### Development
- Hot reload enabled for both frontend and backend
- SQL Server LocalDB for database
- Local file storage for uploads

### Production
- Environment-specific configuration
- SQL Server database
- Cloud storage integration ready


### Database Connection Issues
```bash
# Reset LocalDB
sqllocaldb stop mssqllocaldb
sqllocaldb delete mssqllocaldb
sqllocaldb create mssqllocaldb
```

### Port Conflicts
- Backend: Change port in `Properties/launchSettings.json`
- Frontend: Change port with `PORT=3001 npm start`

### Node Modules Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

