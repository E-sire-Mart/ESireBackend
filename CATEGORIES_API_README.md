# Categories API Documentation

## Overview
The Categories API provides full CRUD operations for managing product categories with hierarchical tree structure support.

## Features
- ✅ Hierarchical category management (parent-child relationships)
- ✅ Tree structure API endpoints
- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Category reordering and moving
- ✅ SEO-friendly metadata support
- ✅ Automatic level calculation
- ✅ Validation and error handling

## API Endpoints

### 1. Get All Categories (Tree Structure)
```
GET /api/v1/categories
```
Returns all categories organized in a hierarchical tree structure.

### 2. Get Category by ID
```
GET /api/v1/categories/:id
```
Returns a specific category by its ID.

### 3. Create Category
```
POST /api/v1/categories
```
Creates a new category.

**Request Body:**
```json
{
  "name": "Category Name",
  "slug": "category-slug",
  "description": "Category description",
  "parentId": "parent-category-id", // optional
  "isActive": true,
  "sortOrder": 1,
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description",
  "metaKeywords": "seo, keywords"
}
```

### 4. Update Category
```
PUT /api/v1/categories/:id
```
Updates an existing category.

### 5. Delete Category
```
DELETE /api/v1/categories/:id
```
Deletes a category (only if it has no child categories).

### 6. Get Categories by Parent
```
GET /api/v1/categories/parent/:parentId
```
Returns categories that belong to a specific parent.

### 7. Get Root Categories
```
GET /api/v1/categories/root
```
Returns all top-level categories (no parent).

### 8. Move Category
```
PATCH /api/v1/categories/:id/move
```
Moves a category to a different parent.

**Request Body:**
```json
{
  "parentId": "new-parent-id" // or null for root level
}
```

### 9. Reorder Categories
```
PATCH /api/v1/categories/reorder
```
Reorders categories based on the provided array.

**Request Body:**
```json
{
  "categoryIds": ["id1", "id2", "id3"]
}
```

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the backend root directory:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/bellybasket

# Server Configuration
PORT=3003
NODE_ENV=development

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 2. Install Dependencies
```bash
cd Bellybasket_backend
npm install
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# Start MongoDB service
mongod
```

### 4. Start the Backend
```bash
npm start
```

The server will start on port 3003 and automatically seed initial categories.

### 5. Test the API
Run the test script to verify all endpoints work:
```bash
node test-categories.js
```

## Data Model

### Category Schema
```javascript
{
  name: String,           // Required: Category name
  slug: String,           // Required: URL-friendly identifier
  description: String,    // Optional: Category description
  parentId: ObjectId,     // Optional: Parent category reference
  isActive: Boolean,      // Default: true
  sortOrder: Number,      // Default: 0
  metaTitle: String,      // Optional: SEO title
  metaDescription: String, // Optional: SEO description
  metaKeywords: String,   // Optional: SEO keywords
  level: Number,          // Auto-calculated: Hierarchy level
  createdAt: Date,        // Auto-generated
  updatedAt: Date         // Auto-generated
}
```

## Frontend Integration

The frontend is already configured to use this API. The categories service expects:
- Base URL: `http://localhost:3003/api/v1`
- Authentication: Bearer token in Authorization header
- Response format: `{ success: boolean, data?: any, message?: string, error?: string }`

## Error Handling

All endpoints return consistent error responses:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message"
}
```

## Security

- All endpoints require authentication via JWT token
- Input validation and sanitization
- MongoDB injection protection via Mongoose
- CORS enabled for frontend integration

## Testing

The API includes comprehensive test coverage:
- CRUD operations
- Tree structure building
- Parent-child relationships
- Validation rules
- Error scenarios

Run tests with: `node test-categories.js`
