# CPR Training Application

A comprehensive CPR training management system with instructor and organization portals, featuring enterprise-grade error handling, network resilience, and user feedback systems.

## 🎯 Overview

This application provides a complete solution for managing CPR training courses, instructor availability, student attendance, and organizational oversight. Built with modern web technologies and designed for reliability and user experience.

## 🏗️ Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Material-UI (MUI)** for consistent, accessible UI components
- **React Query** for efficient data fetching and caching
- **React Router** for client-side routing
- **Vite** for fast development and optimized builds

### Backend
- **Node.js** with Express framework
- **PostgreSQL** database for data persistence
- **JWT** authentication and authorization
- **RESTful API** design

## 🚀 Key Features

### Multi-Portal System
- **Instructor Portal**: Availability management, class scheduling, attendance tracking
- **Organization Portal**: Course management, instructor oversight, reporting
- **Admin Portals**: System administration and accounting functions

### Enterprise-Grade Resilience
- **Advanced Error Handling**: Smart retry logic with exponential backoff
- **Network Awareness**: Offline detection and queue management
- **Toast Notification System**: Comprehensive user feedback with priority queuing
- **Analytics Integration**: Performance monitoring and user behavior tracking

### User Experience
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Accessibility**: WCAG compliant with screen reader support
- **Real-time Updates**: Live data synchronization across sessions
- **Offline Capabilities**: Continue working when connection is lost

## 📁 Project Structure

```
cpr-may18/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── common/        # Shared components (ErrorBoundary, ToastSystem, etc.)
│   │   │   ├── portals/       # Portal-specific components
│   │   │   └── views/         # Page-level components
│   │   ├── contexts/          # React contexts (Auth, Toast, Network)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── services/          # API services and utilities
│   │   └── utils/             # Helper functions and utilities
│   ├── public/                # Static assets
│   └── package.json
├── backend/                    # Node.js backend API
│   ├── src/
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Database models
│   │   └── utils/             # Backend utilities
│   └── package.json
└── docs/                      # Project documentation
```

## 🎨 Recent Enhancements

### Toast Notification System ✨
A comprehensive user feedback system with enterprise-grade features:

- **Priority-Based Queuing**: Critical, High, Normal, Low priority levels
- **Smart Auto-Dismiss**: Configurable durations with visual progress indicators
- **Network Awareness**: Offline detection and connection quality adaptation
- **Action Buttons**: Retry, contact support, and custom actions
- **Persistent Storage**: Critical notifications survive page refreshes
- **Analytics Integration**: Track user interactions and system performance

**Demo Available**: Visit `/instructor/toast-demo` to test all features

### Enhanced Error Handling
- **Smart Retry Logic**: Exponential backoff with jitter for failed requests
- **Error Categorization**: Network, authentication, permission, and server errors
- **User-Friendly Messages**: Clear, actionable error descriptions
- **Automatic Recovery**: Self-healing capabilities for transient issues

### Network Resilience
- **Offline Queue Management**: Continue working without internet connection
- **Connection Quality Detection**: Adapt behavior based on network speed
- **Automatic Sync**: Resume operations when connection is restored
- **Performance Optimization**: Intelligent caching and request batching

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cpr-may18
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd frontend
   npm install
   
   # Backend
   cd ../backend
   npm install
   ```

3. **Environment setup**
   ```bash
   # Copy environment templates
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup**
   ```bash
   # Run database migrations
   npm run migrate
   
   # Seed initial data
   npm run seed
   ```

5. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually:
   # Frontend (port 5173): npm run dev:frontend
   # Backend (port 3001): npm run dev:backend
   ```

### Quick Start Scripts
- `start-dev.bat` - Start both servers (Windows)
- `stop-dev.bat` - Stop all servers (Windows)

## 🧪 Testing

### Frontend Testing
```bash
cd frontend
npm run test          # Run unit tests
npm run test:coverage # Run with coverage report
npm run test:e2e      # Run end-to-end tests
```

### Backend Testing
```bash
cd backend
npm run test          # Run API tests
npm run test:integration # Run integration tests
```

## 📊 Monitoring & Analytics

The application includes comprehensive monitoring:

- **Performance Metrics**: Page load times, API response times
- **User Behavior**: Feature usage, error rates, session duration
- **System Health**: Network status, error frequency, retry success rates
- **Toast Analytics**: Notification effectiveness and user interactions

## 🔧 Configuration

### Toast System Configuration
```typescript
<ToastProvider
  maxToasts={5}
  defaultDuration={5000}
  position="top-right"
  enablePersistence={true}
  enableAnalytics={true}
>
```

### Network Monitoring
```typescript
<NetworkProvider
  enableOfflineQueue={true}
  maxQueueSize={50}
  syncInterval={30000}
>
```

## 📚 Documentation

- **[Toast System Implementation](./TOAST_SYSTEM_IMPLEMENTATION.md)** - Comprehensive guide to the notification system
- **[API Documentation](./docs/api.md)** - Backend API reference
- **[Component Library](./docs/components.md)** - Frontend component documentation
- **[Deployment Guide](./docs/deployment.md)** - Production deployment instructions

## 🚀 Deployment

### Production Build
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm run build
```

### Environment Variables
Required environment variables for production:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `NODE_ENV=production`
- `FRONTEND_URL` - Frontend application URL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Use conventional commit messages
- Ensure accessibility compliance

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `/docs` folder

---

**Status**: 🟢 **Active Development**

The application is under active development with regular updates and new features. The toast notification system and enhanced error handling represent the latest improvements to user experience and system reliability.
