# API Documentation

## Base URL
```
http://localhost:8001/api
```

## Authentication
Use JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Health Check
```
GET /health
```
Response: `{ status: "ok" }`

### Schemes

#### Get All Schemes
```
GET /schemes
```
Query Parameters:
- `category` - Filter by category
- `search` - Search by name/description
- `page` - Pagination (default: 1)
- `limit` - Items per page (default: 10)

#### Get Scheme by ID
```
GET /schemes/:id
```

### Applications

#### Submit Application
```
POST /apply
Authorization: Required
```

### Eligibility

#### Check Eligibility
```
POST /eligibility
```

### Chat

#### Send Message to Chatbot
```
POST /chat
```

### Statistics

#### Get Statistics
```
GET /stats
```

### Authentication

#### Register
```
POST /auth/register
```

#### Login
```
POST /auth/login
```

## Error Responses

- 400 Bad Request
- 401 Unauthorized
- 404 Not Found
- 500 Server Error

## Rate Limiting

API endpoints are rate-limited to 100 requests per 15 minutes per IP.
