import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import axios from "axios";

/* =========================================================
   API
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

/* =========================================================
   AXIOS INSTANCE
========================================================= */

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext = createContext(null);

/* =========================================================
   AUTH PROVIDER
========================================================= */

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD CURRENT USER
  ======================================================= */

  const loadUser = useCallback(async () => {
    try {
      setError("");

      const response = await api.get("/api/auth/me");

      if (response.data?.success) {
        setUser(response.data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      /*
       * 401 simply means the customer is not logged in.
       * This is not treated as an application error.
       */

      if (err.response?.status === 401) {
        setUser(null);
      } else {
        console.error(
          "Failed to load authenticated user:",
          err
        );

        setUser(null);
        setError(
          err.response?.data?.message ||
            "Unable to verify your account."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  /* =======================================================
     INITIAL AUTH CHECK
  ======================================================= */

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  /* =======================================================
     REGISTER
  ======================================================= */

  const register = useCallback(
    async ({ name, email, password }) => {
      try {
        setError("");

        const response = await api.post(
          "/api/auth/register",
          {
            name,
            email,
            password,
          }
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Registration failed."
          );
        }

        const registeredUser =
          response.data.user;

        setUser(registeredUser);

        return {
          success: true,
          user: registeredUser,
          message:
            response.data.message ||
            "Account created successfully.",
        };
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Unable to create your account.";

        setError(message);

        return {
          success: false,
          message,
        };
      }
    },
    []
  );

  /* =======================================================
     LOGIN
  ======================================================= */

  const login = useCallback(
    async ({ email, password }) => {
      try {
        setError("");

        const response = await api.post(
          "/api/auth/login",
          {
            email,
            password,
          }
        );

        if (!response.data?.success) {
          throw new Error(
            response.data?.message ||
              "Login failed."
          );
        }

        const loggedInUser =
          response.data.user;

        setUser(loggedInUser);

        return {
          success: true,
          user: loggedInUser,
          message:
            response.data.message ||
            "Login successful.",
        };
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Unable to log in.";

        setError(message);

        return {
          success: false,
          message,
        };
      }
    },
    []
  );

  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout = useCallback(async () => {
    try {
      setError("");

      await api.post("/api/auth/logout");
    } catch (err) {
      console.error(
        "Logout request failed:",
        err
      );
    } finally {
      /*
       * Clear frontend authentication state even
       * if the server request fails.
       */

      setUser(null);
    }

    return {
      success: true,
    };
  }, []);

  /* =======================================================
     REFRESH USER
  ======================================================= */

  const refreshUser = useCallback(async () => {
    setLoading(true);
    await loadUser();
  }, [loadUser]);

  /* =======================================================
     AUTH STATE
  ======================================================= */

  const isAuthenticated = Boolean(user);

  const isAdmin =
    Boolean(user) &&
    user.role === "admin";

  /* =======================================================
     CONTEXT VALUE
  ======================================================= */

  const value = useMemo(
    () => ({
      user,
      loading,
      error,

      isAuthenticated,
      isAdmin,

      register,
      login,
      logout,
      refreshUser,

      api,
    }),
    [
      user,
      loading,
      error,
      isAuthenticated,
      isAdmin,
      register,
      login,
      logout,
      refreshUser,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/* =========================================================
   HOOK
========================================================= */

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}

/* =========================================================
   EXPORT API
========================================================= */

export { api };

export default AuthContext;