# CPR Training Management System

A comprehensive, commercial-grade CPR training management platform built with React, Node.js, TypeScript, and PostgreSQL.

## 🏢 Overview

This enterprise-level application manages CPR training operations for organizations, instructors, administrators, and accounting departments. It features multi-tenant architecture, real-time analytics, and commercial-grade error handling.

## ✨ Key Features

### 🔐 Multi-Portal Architecture
- **Organization Portal**: Course scheduling, student management, analytics
- **Instructor Portal**: Availability management, class tracking, profile management
- **Admin Portal**: System oversight, instructor management, course coordination
- **Accounting Portal**: Billing, invoicing, financial reporting
- **System Admin Portal**: User management, organization setup, system configuration

### 📊 Analytics & Reporting
- **Course Request Analytics**: Volume trends, seasonal patterns, lead time analysis
- **Student Participation**: Attendance rates, no-show patterns, completion tracking
- **Interactive Dashboards**: Real-time charts and metrics
- **Time-based Filtering**: 3, 6, 12, 24-month views

### 🛡️ Enterprise-Grade Reliability
- **Smart Error Handling**: Exponential backoff retry logic with jitter
- **Network Monitoring**: Real-time connection status and offline queue management
- **Global Error Boundary**: Graceful error recovery and user feedback
- **Toast Notification System**: Priority-based messaging with persistence

### 🚀 Performance Optimization
- **Lazy Loading**: Component-level code splitting
- **React Query Caching**: Intelligent data management
- **Loading States**: Professional loading indicators
- **Memory Management**: Optimized resource usage

## 🏗️ Architecture

### Frontend Stack
- **React 18** with TypeScript
- **Material-UI (MUI)** for design system
- **React Query** for data management
- **React Router** for navigation
- **Recharts** for analytics visualization
- **Vite** for build tooling

### Backend Stack
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database
- **JWT** authentication
- **CORS** security
- **Helmet** for security headers

### Database Schema
- **Users**: Multi-role user management
- **Organizations**: Tenant isolation
- **Courses**: Training course management
- **Students**: Participant tracking
- **Instructors**: Instructor profiles and availability

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd cpr-may18
```

2. **Install dependencies**
```bash
npm install
```

3. **Database Setup**
```bash
# Create PostgreSQL database
createdb cpr_may18

# Configure environment variables
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials
```

4. **Start Development Servers**
```bash
# Option 1: Use the startup script (Windows)
.\start-dev.bat

# Option 2: Manual startup
npm run dev
```

5. **Access the Application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Default Login Credentials

| Portal | Username | Password | Email |
|--------|----------|----------|-------|
| Organization | `orguser` | `test123` | org@cpr.com |
| Instructor | `instructor` | `test123` | instructor@cpr.com |
| Admin | `admin` | `test123` | admin@cpr.com |
| Accounting | `accountant` | `test123` | accounting@cpr.com |

## 📖 User Guide

### Organization Portal

#### Course Scheduling
1. Navigate to "Schedule Course"
2. Select course type (CPR, First Aid, AED, etc.)
3. Choose preferred date and class size
4. Submit request for instructor assignment

#### Student Management
1. Go to "Class Management" 
2. View confirmed courses with assigned instructors
3. Upload student lists via CSV
4. Track attendance and completion

#### Analytics Dashboard
1. Access "Analytics" section
2. View course request trends and patterns
3. Monitor student participation metrics
4. Analyze seasonal training patterns

### Instructor Portal

#### Availability Management
1. Use "Schedule Availability" calendar
2. Mark available dates for teaching
3. View scheduled classes and conflicts
4. Manage recurring availability

#### Class Management
1. View "My Classes" for upcoming sessions
2. Take attendance during classes
3. Mark classes as completed
4. Access student rosters

#### Profile Management
1. Update personal information
2. Manage certifications
3. Configure notification preferences
4. View teaching statistics

### Admin Portal

#### Course Coordination
1. View "Pending Courses" requiring instructor assignment
2. Assign qualified instructors to courses
3. Monitor "Confirmed Courses" status
4. Track "Completed Courses" for billing

#### Instructor Management
1. View instructor availability
2. Monitor instructor workload
3. Track instructor statistics
4. Manage instructor profiles

### Accounting Portal

#### Billing Management
1. Access "Ready for Billing" queue
2. Generate invoices for completed courses
3. Track "Accounts Receivable"
4. Process payments and adjustments

#### Financial Reporting
1. View revenue reports by time period
2. Monitor course pricing and profitability
3. Track payment status and aging
4. Generate financial summaries

## 🔧 Configuration

### Environment Variables

Create `backend/.env` with:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=cpr_may18

# JWT Configuration
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Server Configuration
PORT=3001
NODE_ENV=development
```

### Database Initialization

The application automatically initializes database tables and sample data on first run. To manually reset:

```bash
cd backend
npm run db:reset  # If available, or restart the server
```

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
cd frontend
npm test

# Backend tests
cd backend
npm test

# End-to-end tests
npm run test:e2e
```

### Test Accounts
The system includes comprehensive test data:
- 6 sample course requests for organization testing
- Multiple instructor profiles with availability
- Student data for attendance tracking
- Financial records for accounting features

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd frontend
npm run build

# Build backend
cd backend
npm run build

# Start production server
npm start
```

### Environment Setup
1. Configure production database
2. Set secure JWT secrets
3. Configure CORS for production domains
4. Set up SSL certificates
5. Configure reverse proxy (nginx/Apache)

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Portal-specific permissions
- **CORS Protection**: Cross-origin request security
- **Input Validation**: Server-side data validation
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Content Security Policy headers

## 📊 Monitoring & Analytics

### Built-in Analytics
- User interaction tracking
- Performance monitoring
- Error logging and reporting
- Network status monitoring
- Real-time usage metrics

### Health Checks
- Database connectivity monitoring
- API endpoint health checks
- Frontend error boundary reporting
- Network quality assessment

## 🛠️ Development

### Project Structure
```
cpr-may18/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── contexts/        # React contexts (Auth, Toast, Network)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service layer
│   │   └── utils/           # Utility functions
├── backend/                 # Node.js backend API
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Express middleware
│   │   ├── utils/           # Backend utilities
│   │   └── database/        # Database configuration
└── docs/                    # Additional documentation
```

### Adding New Features
1. Create feature branch from main
2. Implement frontend components
3. Add backend API endpoints
4. Update database schema if needed
5. Add tests for new functionality
6. Update documentation

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Conventional commits for git history

## 🐛 Troubleshooting

### Common Issues

**Port Already in Use**
```bash
# Kill existing processes
npm run cleanup
# Or manually kill processes on ports 3001 and 5173
```

**Database Connection Issues**
- Verify PostgreSQL is running
- Check database credentials in .env
- Ensure database exists

**Frontend Build Issues**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Authentication Problems**
- Clear browser localStorage
- Check JWT token expiration
- Verify user credentials in database

### Getting Help
1. Check the troubleshooting section above
2. Review error logs in browser console
3. Check backend server logs
4. Verify database connectivity

## 📈 Performance Metrics

### Current Performance Standards
- **Page Load Time**: < 2 seconds
- **API Response Time**: < 500ms average
- **Error Rate**: < 0.1%
- **Uptime**: 99.9% target
- **Memory Usage**: Optimized for production

### Monitoring Tools
- Built-in error boundary reporting
- Network status monitoring
- Real-time performance metrics
- User interaction analytics

## 🔄 Updates & Maintenance

### Regular Maintenance
- Database backup and cleanup
- Log rotation and archival
- Security patch updates
- Performance optimization reviews

### Version Updates
- Follow semantic versioning
- Maintain backward compatibility
- Document breaking changes
- Provide migration guides

## 📞 Support

For technical support or questions:
- Review this documentation
- Check troubleshooting section
- Review error logs and console output
- Contact system administrator

---

## 📄 License

This project is proprietary software developed for CPR training management.

## 🙏 Acknowledgments

Built with modern web technologies and best practices for enterprise-grade applications.

---

**Version**: 1.0.0  
**Last Updated**: January 2025  
**Status**: Production Ready ✅
