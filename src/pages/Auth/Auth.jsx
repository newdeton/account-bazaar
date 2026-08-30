import { useEffect, useState } from "react";
import {
  FiArrowRight,
  FiCheckCircle,
  FiEye,
  FiEyeOff,
  FiLock,
  FiMail,
  FiShield,
  FiUser,
  FiXCircle,
} from "react-icons/fi";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

import "./Auth.css";

function Auth({ mode = "login" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    login,
    register,
    isAuthenticated,
  } = useAuth();

  const [isLogin, setIsLogin] = useState(
    mode !== "register"
  );

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState("");

  /* =========================================================
     SYNC MODE WITH ROUTE
  ========================================================= */

  useEffect(() => {
    setIsLogin(mode !== "register");
    setError("");
    setSuccess("");
  }, [mode]);

  /* =========================================================
     REDIRECT AUTHENTICATED USERS
  ========================================================= */

  useEffect(() => {
    if (isAuthenticated) {
      const destination =
        location.state?.from?.pathname ||
        "/";

      navigate(destination, {
        replace: true,
      });
    }
  }, [
    isAuthenticated,
    navigate,
    location.state,
  ]);

  /* =========================================================
     FORM CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  };

  /* =========================================================
     SWITCH MODE
  ========================================================= */

  const switchMode = () => {
    setIsLogin((current) => !current);

    setForm({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    });

    setError("");
    setSuccess("");
  };

  /* =========================================================
     VALIDATION
  ========================================================= */

  const validate = () => {
    if (!isLogin && !form.name.trim()) {
      return "Please enter your full name.";
    }

    if (!form.email.trim()) {
      return "Please enter your email address.";
    }

    if (!form.password) {
      return "Please enter your password.";
    }

    if (form.password.length < 8) {
      return "Password must contain at least 8 characters.";
    }

    if (
      !isLogin &&
      form.password !== form.confirmPassword
    ) {
      return "Passwords do not match.";
    }

    return "";
  };

  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const validationError = validate();

    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const result = isLogin
        ? await login({
            email: form.email.trim(),
            password: form.password,
          })
        : await register({
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
          });

      if (!result.success) {
        setError(result.message);
        return;
      }

      setSuccess(
        result.message ||
          (isLogin
            ? "Login successful."
            : "Account created successfully.")
      );

      /*
       * AuthContext updates isAuthenticated.
       * The effect above will redirect automatically.
       */
    } catch (err) {
      console.error(
        "Authentication error:",
        err
      );

      setError(
        "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     PAGE
  ========================================================= */

  return (
    <main className="auth-page">

      {/* =====================================================
          BACKGROUND
      ===================================================== */}

      <div className="auth-background">
        <div className="auth-orb auth-orb-one" />
        <div className="auth-orb auth-orb-two" />
        <div className="auth-grid" />
      </div>

      {/* =====================================================
          AUTH CONTAINER
      ===================================================== */}

      <section className="auth-container">

        {/* ===================================================
            BRAND / INTRO
        =================================================== */}

        <div className="auth-intro">

          <Link
            to="/"
            className="auth-brand"
          >
            <span className="auth-brand-mark">
              AB
            </span>

            <span>
              Account
              <strong>Bazaar</strong>
            </span>
          </Link>

          <div className="auth-intro-content">

            <span className="auth-eyebrow">
              <FiShield />
              SECURE MARKETPLACE
            </span>

            <h1>
              Your marketplace.
              <br />
              <span>
                Your account.
              </span>
            </h1>

            <p>
              Access your purchases, training
              bookings, account services and
              marketplace activity from one
              secure customer account.
            </p>

            <div className="auth-benefits">

              <div>
                <FiCheckCircle />
                <span>
                  Secure customer account
                </span>
              </div>

              <div>
                <FiCheckCircle />
                <span>
                  Track orders and bookings
                </span>
              </div>

              <div>
                <FiCheckCircle />
                <span>
                  Protected account identity
                </span>
              </div>

            </div>

          </div>

          <div className="auth-intro-footer">
            <span>
              © {new Date().getFullYear()}
              {" "}
              Account Bazaar
            </span>

            <span>
              Secure access
            </span>
          </div>

        </div>

        {/* ===================================================
            FORM PANEL
        =================================================== */}

        <div className="auth-panel">

          <div className="auth-panel-header">

            <span className="auth-panel-icon">
              {isLogin ? (
                <FiLock />
              ) : (
                <FiUser />
              )}
            </span>

            <div>

              <span>
                {isLogin
                  ? "WELCOME BACK"
                  : "GET STARTED"}
              </span>

              <h2>
                {isLogin
                  ? "Sign in to your account"
                  : "Create your account"}
              </h2>

            </div>

          </div>

          <p className="auth-panel-description">
            {isLogin
              ? "Enter your credentials to continue to Account Bazaar."
              : "Create your customer account to start shopping and managing your bookings."}
          </p>

          {/* =================================================
              ALERTS
          ================================================= */}

          {error && (
            <div className="auth-alert auth-alert-error">
              <FiXCircle />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="auth-alert auth-alert-success">
              <FiCheckCircle />
              <span>{success}</span>
            </div>
          )}

          {/* =================================================
              FORM
          ================================================= */}

          <form
            className="auth-form"
            onSubmit={handleSubmit}
          >

            {!isLogin && (
              <div className="auth-field">

                <label htmlFor="name">
                  Full name
                </label>

                <div className="auth-input-wrapper">

                  <FiUser />

                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={form.name}
                    onChange={handleChange}
                    autoComplete="name"
                    disabled={loading}
                  />

                </div>

              </div>
            )}

            <div className="auth-field">

              <label htmlFor="email">
                Email address
              </label>

              <div className="auth-input-wrapper">

                <FiMail />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  autoComplete="email"
                  disabled={loading}
                />

              </div>

            </div>

            <div className="auth-field">

              <label htmlFor="password">
                Password
              </label>

              <div className="auth-input-wrapper">

                <FiLock />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  autoComplete={
                    isLogin
                      ? "current-password"
                      : "new-password"
                  }
                  disabled={loading}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  aria-label={
                    showPassword
                      ? "Hide password"
                      : "Show password"
                  }
                >
                  {showPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>

              </div>

            </div>

            {!isLogin && (
              <div className="auth-field">

                <label htmlFor="confirmPassword">
                  Confirm password
                </label>

                <div className="auth-input-wrapper">

                  <FiLock />

                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={
                      showConfirmPassword
                        ? "text"
                        : "password"
                    }
                    placeholder="Confirm your password"
                    value={
                      form.confirmPassword
                    }
                    onChange={handleChange}
                    autoComplete="new-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() =>
                      setShowConfirmPassword(
                        (current) => !current
                      )
                    }
                    aria-label={
                      showConfirmPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <FiEyeOff />
                    ) : (
                      <FiEye />
                    )}
                  </button>

                </div>

              </div>
            )}

            {isLogin && (
              <div className="auth-form-options">

                <label className="auth-checkbox">
                  <input
                    type="checkbox"
                  />

                  <span>
                    Remember me
                  </span>
                </label>

                <button
                  type="button"
                  className="auth-forgot"
                  onClick={() =>
                    setError(
                      "Password recovery will be available soon."
                    )
                  }
                >
                  Forgot password?
                </button>

              </div>
            )}

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="auth-spinner" />
                  {isLogin
                    ? "Signing in..."
                    : "Creating account..."}
                </>
              ) : (
                <>
                  {isLogin
                    ? "Sign in"
                    : "Create account"}

                  <FiArrowRight />
                </>
              )}
            </button>

          </form>

          {/* =================================================
              SWITCH
          ================================================= */}

          <div className="auth-switch">

            <span>
              {isLogin
                ? "Don't have an account?"
                : "Already have an account?"}
            </span>

            <button
              type="button"
              onClick={switchMode}
            >
              {isLogin
                ? "Create account"
                : "Sign in"}
            </button>

          </div>

          <div className="auth-security">

            <FiShield />

            <span>
              Your credentials are protected
              with secure authentication.
            </span>

          </div>

        </div>

      </section>

    </main>
  );
}

export default Auth;