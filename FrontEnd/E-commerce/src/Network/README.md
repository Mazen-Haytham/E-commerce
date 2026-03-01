# Axios Instance & Token Management Documentation

## Overview

This setup provides a professional, enterprise-grade solution for:

- Global axios instance with automatic token management
- HTTP-only cookie support for refresh tokens
- Access token refresh on expiration
- Secure token storage (in-memory during session)
- Request/Response interceptors

---

## Files

1. **axiosInstance.ts** - Core axios configuration with interceptors
2. **authService.ts** - Authentication service for login/logout
3. **.env** - Environment variables (API base URL)

---

## How It Works

### Token Management Flow

```
User Login
    ↓
/auth/login endpoint returns accessToken
    ↓
Response Interceptor extracts & stores accessToken in TokenManager (memory)
    ↓
RefreshToken stored automatically as HttpOnly cookie by server
    ↓
Request Interceptor adds "Authorization: Bearer {accessToken}" to all requests
    ↓
Server returns 401 (token expired)
    ↓
Response Interceptor calls /auth/refresh (includes HttpOnly cookie automatically)
    ↓
New accessToken received & stored
    ↓
Original request retried with new token
```

---

## Usage Examples

### 1. Login User

```typescript
import { authService } from "@/Network/authService";

const handleLogin = async () => {
  try {
    const response = await authService.login("user@example.com", "password123");
    console.log("Login successful:", response);
    // Access token is automatically stored - no manual handling needed
  } catch (error) {
    console.error("Login failed:", error);
  }
};
```

### 2. Make Authenticated API Request

```typescript
import axiosInstance from "@/Network/axiosInstance";

const fetchCategories = async () => {
  try {
    const response = await axiosInstance.get("/categories");
    console.log("Categories:", response.data);
    // Authorization header with token is automatically added
  } catch (error) {
    console.error("Failed to fetch categories:", error);
  }
};
```

### 3. Make API Request with Custom Headers

```typescript
import axiosInstance from "@/Network/axiosInstance";

const createProduct = async (productData: any) => {
  try {
    const response = await axiosInstance.post("/catalog/", productData, {
      headers: {
        "Content-Type": "application/json", // Already set by default
      },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create product:", error);
  }
};
```

### 4. Check Authentication Status

```typescript
import { authService } from "@/Network/authService";

const isUserLoggedIn = authService.isAuthenticated();
if (isUserLoggedIn) {
  console.log("User is authenticated");
} else {
  console.log("User needs to login");
}
```

### 5. Logout User

```typescript
import { authService } from "@/Network/authService";

const handleLogout = () => {
  authService.logout();
  // Access token is cleared
  // User should be redirected to login page
};
```

### 6. Get Current Access Token

```typescript
import { authService } from "@/Network/authService";

const token = authService.getAccessToken();
console.log("Current token:", token);
```

---

## Key Features Explained

### 1. Token Storage (Professional Approach)

- **Access Token**: Stored in-memory (TokenManager class) - Only exists during current session
- **Refresh Token**: Stored as HttpOnly cookie by server - Automatically sent with requests
- **Advantage**: More secure than localStorage, no XSS vulnerability for access token

### 2. Request Interceptor

Automatically adds access token to every request:

```typescript
Authorization: Bearer<accessToken>;
```

### 3. Response Interceptor

Handles three scenarios:

- **Success (2xx)**: Extracts access token from login/refresh responses
- **Token Expired (401)**: Automatically calls `/auth/refresh` to get new token
- **Refresh Failed**: Clears token and rejects request

### 4. Concurrent Request Handling

If multiple requests fail with 401 simultaneously:

- First request triggers refresh
- Other requests wait for refresh to complete
- All requests retry with new token after refresh succeeds

### 5. HttpOnly Cookie Support

Configured with `withCredentials: true`:

- Browser automatically sends HttpOnly cookies
- Server can set new cookies in response
- Refresh token is secured against JavaScript access

---

## Environment Configuration

Edit `.env` to change API base URL:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

In production:

```env
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

---

## Integration with Components

### Example: Login Component

```typescript
import { useState } from "react";
import { authService } from "@/Network/authService";
import { useNavigate } from "react-router-dom";

export function LoginComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await authService.login(email, password);
      navigate("/dashboard");
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

### Example: Protected Route

```typescript
import { authService } from "@/Network/authService";
import { Navigate } from "react-router-dom";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
```

---

## Error Handling

### Handle 401 Errors (Token Expired)

The interceptor handles this automatically, but you can add custom logic:

```typescript
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token refresh will happen automatically
      // If refresh fails, you can redirect to login
    }
    return Promise.reject(error);
  },
);
```

### Handle Network Errors

```typescript
import axiosInstance from "@/Network/axiosInstance";

try {
  const response = await axiosInstance.get("/categories");
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error("Error status:", error.response.status);
    console.error("Error message:", error.response.data.message);
  } else if (error.request) {
    // Request made but no response
    console.error("No response from server");
  } else {
    // Error in request setup
    console.error("Request error:", error.message);
  }
}
```

---

## Security Best Practices

✅ **Done:**

- Access token stored in-memory (no XSS risk)
- Refresh token in HttpOnly cookie (no JavaScript access)
- CORS credentials enabled (`withCredentials: true`)
- Content-Type set to application/json by default

🔒 **Additional recommendations:**

- Use HTTPS in production
- Implement CSRF protection on backend
- Set appropriate cookie flags (SameSite, Secure)
- Implement token expiration timeout
- Clear token on logout and handle cleanup

---

## Troubleshooting

### Token not being sent with requests

- Check if token is stored: `authService.getAccessToken()`
- Verify Authorization header is being added
- Check browser network tab for Authorization header

### Infinite refresh loop

- Usually means refresh endpoint is also returning 401
- Check refresh endpoint implementation on backend
- Verify refresh token cookie is being sent

### CORS errors

- Ensure backend is configured to accept credentials
- Verify `withCredentials: true` is set
- Check Access-Control-Allow-Credentials header from server

### HttpOnly cookies not being sent

- Verify `withCredentials: true` is enabled
- Check SameSite cookie attribute on server
- Ensure frontend and backend are on correct domains
