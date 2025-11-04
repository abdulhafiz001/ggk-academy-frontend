# Hol Result Platform Frontend

A comprehensive student result management system built with React and Laravel.

## Features

### Student Management System

The platform implements a sophisticated role-based student management system with the following permissions:

#### Admin Users
- **Full Access**: Can view, create, edit, and delete all students in the school
- **Class Management**: Can assign students to any class
- **System Administration**: Complete control over the platform

#### Form Teachers
- **Class Management**: Can view, edit, and delete students in classes where they are assigned as form teachers
- **Student Operations**: Full CRUD operations for their assigned classes
- **Limited Scope**: Cannot manage students outside their assigned classes

#### Regular Teachers
- **View Only**: Can view students in classes where they teach subjects
- **No Management**: Cannot edit, delete, or create students
- **Score Management**: Can manage scores for subjects they teach

### Key Components

#### Students.jsx
- **Role-based UI**: Different interfaces based on user permissions
- **Dynamic Filtering**: Filter students by class, search terms, and other criteria
- **Grid/Table Views**: Toggle between different display modes
- **Permission Indicators**: Visual indicators showing form teacher status

#### EditStudentModal.jsx
- **Comprehensive Form**: All student fields with validation
- **Role-based Access**: Only form teachers and admins can edit
- **Dynamic Class Selection**: Teachers only see their assigned classes

### API Integration

#### Backend Endpoints
- `GET /api/admin/students` - Admin access to all students
- `GET /api/teacher/students` - Teacher access to assigned students
- `PUT /api/teacher/students/{id}` - Update student (form teachers only)
- `DELETE /api/teacher/students/{id}` - Delete student (form teachers only)

#### Response Structure
Teachers receive additional metadata:
```json
{
  "students": [...],
  "is_form_teacher": true,
  "form_teacher_classes": [1, 2, 3]
}
```

### Database Schema

#### Users Table
- `is_form_teacher` - Boolean flag for form teacher status
- `role` - User role (admin/teacher)

#### Classes Table
- `form_teacher_id` - Foreign key to users table for form teacher assignment

#### Teacher Subjects Table
- Links teachers to specific subjects and classes
- Determines which students a teacher can view

### Security Features

- **Role-based Middleware**: API endpoints protected by role middleware
- **Permission Validation**: Backend validates all operations against user permissions
- **Form Teacher Checks**: Ensures teachers can only manage their assigned classes

### Usage Examples

#### For Admins
1. Navigate to `/admin/students`
2. Full access to all student management features
3. Can assign form teachers to classes

#### For Form Teachers
1. Navigate to `/teacher/students` or `/admin/students`
2. Can manage students in their assigned classes
3. Edit and delete permissions for their students

#### For Regular Teachers
1. Navigate to `/teacher/students` or `/admin/students`
2. View-only access to students they teach
3. Cannot modify student records

## Getting Started

1. Install dependencies: `npm install`
2. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
3. Configure the API endpoint in `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:8000/api
   ```
4. Run development server: `npm run dev`

## Environment Variables

The application uses the following environment variables:

- `VITE_API_BASE_URL`: The base URL for the backend API (default: http://localhost:8000/api)
- `VITE_NODE_ENV`: The environment mode (development/production)

### Environment Files

- `.env` - Local environment variables (not committed to git)
- `.env.example` - Example environment file (committed to git)
- `.env.local` - Local overrides (not committed to git)
- `.env.development.local` - Development overrides (not committed to git)
- `.env.production.local` - Production overrides (not committed to git)

## Backend Requirements

- Laravel 10+
- MySQL/PostgreSQL
- User authentication with Sanctum
- Proper role middleware setup

## Contributing

Please ensure all new features maintain the role-based permission system and include proper validation.
