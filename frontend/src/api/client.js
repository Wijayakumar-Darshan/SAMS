```javascript
// API Base URL
// Local development:
//   Uses Vite proxy with relative URLs.
//
// Production (Vercel):
//   Uses the Render backend directly.

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const storage = {
  getAccess() {
    return localStorage.getItem("accessToken") || "";
  },

  getRefresh() {
    return localStorage.getItem("refreshToken") || "";
  },

  setTokens({ accessToken, refreshToken }) {
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    }

    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    }
  },

  clear() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("role");
    localStorage.removeItem("teacherPasswordSet");
  },
};


// Build the final URL
function buildUrl(url) {
  // If URL is already absolute, don't modify it
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }

  return `${API_BASE_URL}${url}`;
}


// Raw fetch
async function rawFetch(url, options = {}) {
  const finalUrl = buildUrl(url);

  const res = await fetch(finalUrl, options);

  const text = await res.text();

  let data;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { res, data };
}


// Refresh access token
async function refreshAccessToken() {
  const refreshToken = storage.getRefresh();

  if (!refreshToken) {
    return null;
  }

  const { res, data } = await rawFetch("/api/auth/refresh", {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      refreshToken,
    }),
  });

  if (!res.ok) {
    return null;
  }

  if (data?.accessToken) {
    storage.setTokens({
      accessToken: data.accessToken,
    });
  }

  return data?.accessToken || null;
}


// Main request function
async function request(
  method,
  url,
  body,
  extraHeaders = {},
  retry = true
) {
  const headers = {
    ...extraHeaders,
  };


  // Add JWT access token
  const accessToken = storage.getAccess();

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }


  let payload = undefined;


  // FormData
  if (body instanceof FormData) {
    payload = body;
  }

  // JSON body
  else if (body !== undefined && body !== null) {
    headers["Content-Type"] = "application/json";

    payload = JSON.stringify(body);
  }


  const { res, data } = await rawFetch(url, {
    method,
    headers,
    body: payload,
  });


  // Access token expired
  if (res.status === 401 && retry) {
    const newAccess = await refreshAccessToken();

    if (!newAccess) {
      storage.clear();

      throw {
        status: 401,
        data: {
          error: "UNAUTHORIZED",
          message: "Please login again.",
        },
      };
    }

    // Retry original request with new token
    return request(
      method,
      url,
      body,
      extraHeaders,
      false
    );
  }


  // Other errors
  if (!res.ok) {
    throw {
      status: res.status,
      data,
    };
  }


  return data;
}


// Export API
export const api = {
  storage,


  // Generic requests
  get: (url) =>
    request("GET", url),

  post: (url, body) =>
    request("POST", url, body),

  put: (url, body) =>
    request("PUT", url, body),

  del: (url) =>
    request("DELETE", url),


  // Authentication
  auth: {

    studentRegister: (payload) =>
      request(
        "POST",
        "/api/auth/student/register",
        payload
      ),

    studentLogin: (payload) =>
      request(
        "POST",
        "/api/auth/student/login",
        payload
      ),

    parentLogin: (payload) =>
      request(
        "POST",
        "/api/auth/parent/login",
        payload
      ),

    teacherLoginOtp: (payload) =>
      request(
        "POST",
        "/api/auth/teacher/login-otp",
        payload
      ),

    teacherLoginPassword: (payload) =>
      request(
        "POST",
        "/api/auth/teacher/login",
        payload
      ),

    teacherSetPassword: (payload) =>
      request(
        "POST",
        "/api/auth/teacher/set-password",
        payload
      ),

    adminLogin: (payload) =>
      request(
        "POST",
        "/api/auth/admin/login",
        payload
      ),

    logout: (payload) =>
      request(
        "POST",
        "/api/auth/logout",
        payload
      ),
  },
};
```
