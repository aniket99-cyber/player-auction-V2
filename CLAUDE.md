# Player Auction System - Architecture & Guidelines

## Project Overview
A production-ready, real-time Player Auction System inspired by IPL Auction and UEFA Champions League Draft systems. Enterprise-grade implementation with clean architecture, SOLID principles, and scalable design patterns.

## Technology Stack

### Frontend
- Angular 20 (latest)
- Angular Material
- SCSS (structured, component-scoped)
- GSAP Animations
- Lottie (vector animations)
- ApexCharts (data visualization)
- Angular Signals (state management)
- RxJS (reactive streams)
- Socket.io Client (real-time communication)

### Backend
- NodeJS 20+
- Express (API framework)
- MongoDB (primary datastore)
- Mongoose (ODM)
- Socket.io (WebSocket layer)
- JWT Authentication
- Multer (file uploads)
- Cloudinary (media storage)

## Architecture Principles

### Core Patterns
1. **Feature-Based Architecture** - Organized by features, not technical layers
2. **Repository Pattern** - Data access abstraction layer
3. **Event-Driven Architecture** - Decoupled modules via events
4. **Clean Architecture** - Independence of frameworks, UI, and DB
5. **SOLID Principles** - Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion

### Code Quality Standards
- Production-level code only
- No beginner patterns or shortcuts
- Every decision must be scalable
- Type-safe throughout (TS strict mode)
- Proper error handling and validation
- Comprehensive logging

### Responsive Design
- Dark sport theme (premium feel)
- Mobile-first approach
- Angular Material breakpoints
- Accessibility compliance

## Frontend Project Structure
```
src/
├── app/
│   ├── core/                 # Core module (singleton services)
│   │   ├── services/         # HTTP, Auth, WebSocket
│   │   ├── guards/          # Route guards
│   │   ├── interceptors/    # HTTP interceptors
│   │   ├── models/          # Core interfaces
│   │   └── core.module.ts
│   ├── shared/              # Shared module
│   │   ├── components/      # Reusable components
│   │   ├── pipes/           # Custom pipes
│   │   ├── directives/      # Custom directives
│   │   ├── utils/           # Helper functions
│   │   └── shared.module.ts
│   ├── features/            # Feature modules
│   │   ├── auction/         # Auction feature
│   │   ├── players/         # Players feature
│   │   ├── teams/           # Teams feature
│   │   └── dashboard/       # Dashboard feature
│   ├── layout/              # Layout components
│   └── app.component.ts
└── assets/
```

## Backend Project Structure
```
src/
├── config/              # Configuration files
├── middleware/          # Express middleware
├── controllers/         # Request handlers
├── services/            # Business logic
├── models/              # Mongoose schemas
├── repositories/        # Data access layer
├── routes/              # API routes
├── events/              # Event handlers
├── utils/               # Helpers
├── constants/           # App constants
└── index.ts            # Entry point
```

## Key Features to Implement

### Auction Management
- Real-time auction workflow
- Player bidding system
- Team management
- Live updates via WebSocket

### Player Management
- Player CRUD operations
- Player statistics
- Player categorization (Base Price, Reserve Price)
- Performance metrics

### Team Management
- Team registration
- Budget allocation
- Team composition
- Captain/Vice-captain selection

### Real-Time Communication
- WebSocket layer for live updates
- Event broadcasting
- Connection state management
- Reconnection handling

### Authentication & Authorization
- JWT-based auth
- Role-based access control (Admin, Team Manager, Viewer)
- Secure token refresh
- Session management

### Media Management
- Player images via Cloudinary
- Dynamic avatar handling
- Responsive image optimization

## Development Workflow

### Before Writing Code
1. Understand the feature requirements
2. Design the data models
3. Plan the API contracts
4. Define WebSocket events
5. Create component structure

### Code Review Checklist
- ✓ Adheres to SOLID principles
- ✓ Type-safe (no `any`)
- ✓ Proper error handling
- ✓ Scalable architecture
- ✓ Responsive design
- ✓ Performance optimized
- ✓ Accessibility compliant

## Important Notes
- All decisions should prioritize scalability
- Always explain architecture before writing code
- Generate production-level code only
- No shortcuts or technical debt
- Comprehensive testing expected
- Real-time communication is critical
