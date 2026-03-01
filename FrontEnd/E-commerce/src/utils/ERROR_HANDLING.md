# Error Handling System (Frontend)

## Overview

Your frontend now has a professional error handling system that mirrors your backend AppError structure. This allows you to:

- Parse and handle backend AppError responses
- Display validation errors from the API
- Distinguish between client (4xx) and server (5xx) errors
- Access detailed error information in your components

---

## Core Concepts

### AppError Class

The frontend `AppError` class matches your backend structure:

```typescript
{
  message: string;           // Human-readable error message
  statusCode: number;        // HTTP status code (400, 401, 404, 500, etc.)
  status: "fail" | "error";  // "fail" for 4xx, "error" for 5xx
  errors?: Array<{           // Optional validation errors
    field?: string;          // Field name (e.g., "email")
    message: string;         // Error message for that field
  }>;
  isOperational: boolean;    // Always true for operational errors
}
```

### Error Flow

```
Backend sends AppError
    ↓
Axios interceptor catches response
    ↓
parseAxiosError() extracts error details
    ↓
Zustand store stores AppError in state
    ↓
Components access error via useUsersStore()
    ↓
Display to user with proper formatting
```

---

## API Reference

### `handleApiError(error: unknown): AppError`

Converts any error to an AppError instance.

```typescript
try {
  await userAPI.createUser(data);
} catch (error) {
  const appError = handleApiError(error);
  console.log(appError.message);
  console.log(appError.statusCode);
}
```

### `parseAxiosError(error: unknown): AppError`

Low-level function to parse axios errors specifically.

```typescript
import { parseAxiosError } from "@/utils";

const error = parseAxiosError(axiosError);
```

### `getErrorMessage(error: AppError | unknown): string`

Extract user-friendly error message.

```typescript
const message = getErrorMessage(error);
// Returns: "User not found" or generic message
```

### `getValidationErrors(error: AppError | unknown): string[]`

Get formatted validation error messages.

```typescript
const errors = getValidationErrors(error);
// Returns: ["email: Invalid email format", "password: Too short"]
```

---

## Usage in Zustand Store

The `useUsersStore` automatically handles errors:

```typescript
const { error, isLoading, createUser } = useUsersStore();

try {
  await createUser({
    email: "test@example.com",
    firstName: "John",
    lastName: "Doe",
    password: "password123",
  });
} catch (err) {
  // Error is already in state.error
  console.log(error?.message);
  console.log(error?.statusCode);
}
```

---

## Component Examples

### Basic Error Display

```typescript
import { useUsersStore } from "@/store/useUsersStore";

function MyComponent() {
  const { users, error, isLoading, fetchAllUsers } = useUsersStore();

  useEffect(() => {
    fetchAllUsers();
  }, [fetchAllUsers]);

  if (isLoading) return <div>Loading...</div>;

  if (error) {
    return (
      <div className="alert alert-error">
        <h3>Error ({error.statusCode})</h3>
        <p>{error.message}</p>
        {error.errors && (
          <ul>
            {error.errors.map((e) => (
              <li key={e.field}>{e.field}: {e.message}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>{user.email}</li>
      ))}
    </ul>
  );
}
```

### Error with Field-Specific Validation

```typescript
function RegistrationForm() {
  const { createUser, error } = useUsersStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createUser(formData);
      // Success
    } catch (err) {
      // Error already in state
    }
  };

  // Get validation errors grouped by field
  const validationErrors = getValidationErrors(error);

  return (
    <form onSubmit={handleSubmit}>
      <input name="email" />
      {error && error.errors?.find(e => e.field === "email") && (
        <span className="error">
          {error.errors.find(e => e.field === "email")?.message}
        </span>
      )}

      <input name="password" />
      {error && error.errors?.find(e => e.field === "password") && (
        <span className="error">
          {error.errors.find(e => e.field === "password")?.message}
        </span>
      )}

      <button type="submit">Register</button>
    </form>
  );
}
```

### Error Toast Notification

```typescript
import { useUsersStore } from "@/store/useUsersStore";

function ErrorToast() {
  const { error, clearError } = useUsersStore();

  if (!error) return null;

  return (
    <div className={`toast toast-${error.status}`}>
      <div>
        <span>{error.message}</span>
        {error.statusCode && <span>[{error.statusCode}]</span>}
      </div>
      <button onClick={clearError}>✕</button>
    </div>
  );
}

// Use in App.tsx
export function App() {
  return (
    <>
      <ErrorToast />
      {/* Your app */}
    </>
  );
}
```

---

## Error Status Helpers

### Check Error Type

```typescript
if (error?.isClientError()) {
  // 4xx error - user's fault (invalid input, not found, etc.)
  alert("Please check your input");
}

if (error?.isServerError()) {
  // 5xx error - server's fault
  alert("Server error. Please try again later");
}
```

### Check Specific Status

```typescript
const isUnauthorized = error?.statusCode === 401;
const isNotFound = error?.statusCode === 404;
const isBadRequest = error?.statusCode === 400;
const isServerError = error?.statusCode === 500;
```

---

## Common Error Scenarios

### 401 - Unauthorized (Token Expired)

Handled automatically by axios interceptor - token refresh happens without UI changes.

```typescript
// Your action that gets 401
// → axios interceptor calls /auth/refresh
// → token updated
// → request retried automatically
// → user sees success response
```

### 400 - Bad Request (Validation Error)

Display field-specific errors:

```typescript
function handleRegistrationError() {
  if (error?.statusCode === 400) {
    error.errors?.forEach((err) => {
      setFieldError(err.field, err.message);
    });
  }
}
```

### 404 - Not Found

```typescript
if (error?.statusCode === 404) {
  return <div>User not found</div>;
}
```

### 500 - Server Error

```typescript
if (error?.isServerError()) {
  return (
    <div>
      <p>Server error. Please try again later.</p>
      <button onClick={() => retry()}>Retry</button>
    </div>
  );
}
```

---

## Best Practices

✅ **Do:**

- Use the store's error state: `const { error } = useUsersStore()`
- Display validation errors by field
- Show user-friendly messages
- Distinguish between client and server errors
- Clear errors after user acknowledges them

❌ **Don't:**

- Log sensitive information from errors
- Display raw stack traces to users
- Store errors in localStorage
- Ignore 401 errors (let interceptor handle it)
- Use generic "Something went wrong" messages

---

## Error Message Examples

### Backend Validation Error (400)

```json
{
  "status": "fail",
  "message": "Validation failed",
  "statusCode": 400,
  "errors": [
    { "field": "email", "message": "Invalid email format" },
    { "field": "password", "message": "Password must be at least 8 characters" }
  ]
}
```

Frontend receives:

```typescript
error.statusCode === 400;
error.message === "Validation failed";
error.errors[0].field === "email";
error.errors[0].message === "Invalid email format";
```

### Backend Operational Error (404)

```json
{
  "status": "fail",
  "message": "User not found",
  "statusCode": 404
}
```

Frontend receives:

```typescript
error.statusCode === 404;
error.message === "User not found";
error.errors === undefined;
```

### Server Error (500)

```json
{
  "status": "error",
  "message": "Internal server error",
  "statusCode": 500
}
```

Frontend receives:

```typescript
error.statusCode === 500;
error.status === "error";
error.message === "Internal server error";
```

---

## Debugging

Enable Redux DevTools to see:

1. Error state changes
2. When errors occur
3. Error details
4. Previous state

```typescript
// Open Redux DevTools in browser
// Look for UsersStore
// Check "error" property in state
```

---

## API Reference Summary

| Function                | Purpose                        | Returns    |
| ----------------------- | ------------------------------ | ---------- |
| `handleApiError()`      | Convert any error to AppError  | `AppError` |
| `parseAxiosError()`     | Parse axios error specifically | `AppError` |
| `getErrorMessage()`     | Get message string             | `string`   |
| `getValidationErrors()` | Get field errors as array      | `string[]` |
| `error.isClientError()` | Check if 4xx                   | `boolean`  |
| `error.isServerError()` | Check if 5xx                   | `boolean`  |
| `error.toJSON()`        | Get error object               | `object`   |

---

## Integration Checklist

- ✅ AppError utility created in `/src/utils/AppError.ts`
- ✅ Zustand store updated to use AppError
- ✅ Error handling integrated in all API calls
- ✅ Axios interceptor handles token refresh
- ✅ Examples provided in UserAPIExamples.tsx
- ✅ Ready to use in components!

All backend AppError responses are now automatically parsed and available in your Zustand store.
