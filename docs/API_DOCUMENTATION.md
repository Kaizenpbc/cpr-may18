# API Documentation

## Base URL
```
http://localhost:3001
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <jwt_token>
```

### Authentication Endpoints

#### POST /login
Login with username and password.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "token": "jwt_access_token",
  "refreshToken": "jwt_refresh_token",
  "user": {
    "id": "number",
    "username": "string",
    "role": "string",
    "organizationId": "number",
    "organizationName": "string"
  }
}
```

#### POST /logout
Logout current user.

#### POST /refresh
Refresh access token using refresh token.

#### GET /me
Get current user information.

**Response:**
```json
{
  "id": "number",
  "username": "string",
  "role": "string",
  "organizationId": "number",
  "organizationName": "string"
}
```

## Organization Endpoints

### Course Management

#### POST /organization/course-request
Create a new course request.

**Request Body:**
```json
{
  "courseType": "string",
  "preferredDate": "YYYY-MM-DD",
  "classSize": "number",
  "location": "string",
  "notes": "string"
}
```

#### GET /organization/courses
Get all courses for the organization.

**Response:**
```json
[
  {
    "id": "number",
    "courseType": "string",
    "dateRequested": "ISO_DATE",
    "preferredDate": "YYYY-MM-DD",
    "classSize": "number",
    "location": "string",
    "status": "pending|confirmed|completed|cancelled",
    "instructorName": "string",
    "notes": "string"
  }
]
```

### Analytics

#### GET /organization/analytics/course-requests
Get course request analytics.

**Query Parameters:**
- `timeframe`: 3|6|12|24 (months)

**Response:**
```json
{
  "volumeTrends": [
    {
      "month_label": "string",
      "request_count": "number"
    }
  ],
  "courseTypePreferences": [
    {
      "course_type": "string",
      "request_count": "number",
      "percentage": "number"
    }
  ],
  "seasonalPatterns": [
    {
      "month_name": "string",
      "request_count": "number"
    }
  ],
  "leadTimeAnalysis": [
    {
      "lead_time_range": "string",
      "request_count": "number",
      "avg_days": "number"
    }
  ]
}
```

#### GET /organization/analytics/student-participation
Get student participation analytics.

**Query Parameters:**
- `timeframe`: 3|6|12|24 (months)

**Response:**
```json
{
  "summaryStats": {
    "total_courses_requested": "number",
    "total_courses_completed": "number",
    "total_students_attended": "number",
    "overall_attendance_rate": "number"
  },
  "attendanceRates": [
    {
      "course_type": "string",
      "attendance_rate": "number",
      "total_registered": "number",
      "total_attended": "number"
    }
  ],
  "noShowPatterns": [
    {
      "month_label": "string",
      "no_show_rate": "number"
    }
  ],
  "classSizeOptimization": [
    {
      "requested_size": "number",
      "actual_registered": "number",
      "actual_attended": "number"
    }
  ],
  "completionRates": [
    {
      "course_type": "string",
      "completion_rate": "number",
      "total_courses": "number",
      "completed_courses": "number"
    }
  ]
}
```

### Student Management

#### GET /organization/courses/:courseId/students
Get students for a specific course.

#### POST /organization/courses/:courseId/students
Add students to a course.

**Request Body:**
```json
{
  "students": [
    {
      "name": "string",
      "email": "string",
      "phone": "string"
    }
  ]
}
```

## Instructor Endpoints

### Availability Management

#### GET /availability
Get instructor availability.

#### POST /availability
Set instructor availability.

**Request Body:**
```json
{
  "date": "YYYY-MM-DD",
  "available": "boolean"
}
```

#### DELETE /availability/:date
Remove availability for a specific date.

### Class Management

#### GET /classes
Get all classes for instructor.

#### GET /classes/upcoming
Get upcoming classes.

#### GET /classes/today
Get today's classes.

#### GET /classes/:classId/students
Get students for a class.

#### POST /classes/:classId/students
Add students to a class.

#### PUT /classes/:classId/students/:studentId/attendance
Update student attendance.

**Request Body:**
```json
{
  "attended": "boolean"
}
```

#### PUT /classes/:classId/complete
Mark class as completed.

#### GET /classes/completed
Get completed classes.

## Admin Endpoints

### Course Management

#### GET /courses/pending
Get pending courses requiring instructor assignment.

#### GET /courses/confirmed
Get confirmed courses.

#### GET /courses/completed
Get completed courses.

#### PUT /courses/:id/cancel
Cancel a course.

#### PUT /courses/:id/schedule
Schedule a course.

**Request Body:**
```json
{
  "scheduledDate": "YYYY-MM-DD",
  "instructorId": "number"
}
```

#### PUT /courses/:id/assign-instructor
Assign instructor to a course.

**Request Body:**
```json
{
  "instructorId": "number"
}
```

### Instructor Management

#### GET /instructors
Get all instructors.

#### GET /instructors/:id/schedule
Get instructor schedule.

#### GET /instructors/:id/availability
Get instructor availability.

### Dashboard

#### GET /admin/instructor-stats
Get instructor statistics.

#### GET /admin/dashboard-summary
Get admin dashboard summary.

#### GET /admin/logs
Get system logs.

## Accounting Endpoints

### Dashboard

#### GET /accounting/dashboard
Get accounting dashboard data.

### Course Pricing

#### GET /accounting/course-pricing
Get course pricing information.

#### PUT /accounting/course-pricing/:id
Update course pricing.

#### POST /accounting/course-pricing
Create new course pricing.

### Organizations

#### GET /accounting/organizations
Get organizations for accounting.

### Course Types

#### GET /accounting/course-types
Get available course types.

### Billing

#### GET /accounting/billing-queue
Get courses ready for billing.

### Invoices

#### POST /accounting/invoices
Create new invoice.

#### GET /accounting/invoices
Get all invoices.

#### GET /accounting/invoices/:id
Get specific invoice.

#### PUT /accounting/invoices/:id
Update invoice.

#### POST /accounting/invoices/:id/email
Email invoice to customer.

### Payments

#### GET /accounting/invoices/:id/payments
Get payments for an invoice.

#### POST /accounting/invoices/:id/payments
Add payment to an invoice.

### Reports

#### GET /accounting/reports/revenue
Get revenue reports.

**Query Parameters:**
- `startDate`: YYYY-MM-DD
- `endDate`: YYYY-MM-DD
- `groupBy`: month|quarter|year

## System Admin Endpoints

### Course Management

#### GET /sysadmin/courses
Get all courses in system.

#### POST /sysadmin/courses
Create new course.

#### PUT /sysadmin/courses/:id
Update course.

#### DELETE /sysadmin/courses/:id
Delete course.

### User Management

#### GET /sysadmin/users
Get all users.

#### POST /sysadmin/users
Create new user.

#### PUT /sysadmin/users/:id
Update user.

#### DELETE /sysadmin/users/:id
Delete user.

### Organization Management

#### GET /sysadmin/organizations
Get all organizations.

#### POST /sysadmin/organizations
Create new organization.

#### PUT /sysadmin/organizations/:id
Update organization.

#### DELETE /sysadmin/organizations/:id
Delete organization.

### Vendor Management

#### GET /sysadmin/vendors
Get all vendors.

#### POST /sysadmin/vendors
Create new vendor.

#### PUT /sysadmin/vendors/:id
Update vendor.

#### DELETE /sysadmin/vendors/:id
Delete vendor.

### Dashboard

#### GET /sysadmin/dashboard
Get system admin dashboard.

## General Endpoints

#### GET /users
Get users (role-based access).

#### GET /users/:id
Get specific user.

#### GET /certifications
Get certifications.

#### GET /certifications/:id
Get specific certification.

#### GET /course-types
Get available course types.

#### GET /debug
Debug endpoint for system information.

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "error": "Invalid request data",
  "details": "Specific error message"
}
```

### 401 Unauthorized
```json
{
  "error": "Authentication required",
  "message": "Please log in to access this resource"
}
```

### 403 Forbidden
```json
{
  "error": "Access denied",
  "message": "Insufficient permissions"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found",
  "message": "The requested resource does not exist"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- **General endpoints**: 100 requests per minute
- **Authentication endpoints**: 10 requests per minute
- **Analytics endpoints**: 20 requests per minute

## Data Formats

### Date Formats
- **Date only**: YYYY-MM-DD (e.g., "2025-01-15")
- **DateTime**: ISO 8601 format (e.g., "2025-01-15T10:30:00Z")

### Status Values
- **Course Status**: pending, confirmed, completed, cancelled
- **User Roles**: instructor, organization, admin, accounting, sysadmin
- **Attendance**: present, absent, excused

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Filtering and Sorting

Many endpoints support filtering and sorting:

**Query Parameters:**
- `filter[field]`: Filter by field value
- `sort`: Sort field (prefix with - for descending)
- `search`: Text search across relevant fields

**Example:**
```
GET /courses?filter[status]=pending&sort=-dateRequested&search=CPR
``` 