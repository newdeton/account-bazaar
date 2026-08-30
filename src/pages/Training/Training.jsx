import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiClock,
  FiUsers,
  FiArrowRight,
  FiX,
  FiRefreshCw,
} from "react-icons/fi";

import "./Training.css";

const API_URL = "http://localhost:5000/api";

function Training() {
  const navigate = useNavigate();

  const [trainings, setTrainings] = useState([]);
  const [selectedTraining, setSelectedTraining] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =================================================
     LOAD TRAINING PRODUCTS FROM MONGODB
  ================================================= */

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/products?category=training&active=true`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Failed to load training programs."
        );
      }

      /*
       * Only training products with stock greater
       * than 0 are available for booking.
       */
      const availableTrainings = (
        Array.isArray(data.products)
          ? data.products
          : []
      ).filter(
        (product) => Number(product?.stock || 0) > 0
      );

      setTrainings(availableTrainings);
    } catch (err) {
      console.error("Training loading error:", err);

      setError(
        "Unable to load training programs right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  /* =================================================
     NORMALIZE TRAINING DATA
  ================================================= */

  const normalizedTrainings = useMemo(() => {
    return trainings.map((product) => ({
      ...product,

      id:
        product.productId ||
        product._id,

      title:
        product.name ||
        product.title ||
        "Training Program",

      category:
        product.type ||
        product.metadata?.type ||
        product.deliveryType ||
        "Training",

      description:
        product.description ||
        "Practical training designed to help you develop valuable digital skills.",

      duration:
        product.duration ||
        product.metadata?.duration ||
        "Flexible",

      price:
        Number(product.price || 0),

      students:
        Number(
          product.students ||
          product.metadata?.students ||
          0
        ),

      level:
        product.level ||
        product.metadata?.level ||
        "Beginner",

      stock:
        Number(product.stock || 0),
    }));
  }, [trainings]);

  /* =================================================
     TRAINING TYPES
  ================================================= */

  const types = useMemo(() => {
    const uniqueTypes = normalizedTrainings
      .map((training) => training.category)
      .filter(Boolean);

    return ["All", ...new Set(uniqueTypes)];
  }, [normalizedTrainings]);

  /* =================================================
     BOOK TRAINING
  ================================================= */

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    if (!selectedTraining) {
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    /*
     * Prevent booking unavailable training.
     */
    if (Number(selectedTraining.stock || 0) <= 0) {
      alert(
        "This training is currently unavailable. Please refresh and try again."
      );

      setSelectedTraining(null);
      fetchTrainings();

      return;
    }

    /*
     * Existing temporary local booking check.
     */
    const bookings = JSON.parse(
      localStorage.getItem("trainingBookings") || "[]"
    );

    const alreadyBooked = bookings.some(
      (booking) =>
        booking.training === selectedTraining.title &&
        booking.status !== "Cancelled" &&
        booking.status !== "Completed"
    );

    if (alreadyBooked) {
      alert(
        "You already have an active booking for this training. Please check My Bookings."
      );

      return;
    }

    /*
     * Temporary booking object.
     *
     * The actual order/booking should eventually
     * be created by the backend after successful
     * payment.
     */
    const pendingBooking = {
      id: Date.now(),

      productId:
        selectedTraining.productId ||
        selectedTraining._id,

      training:
        selectedTraining.title,

      category:
        selectedTraining.category,

      price:
        Number(selectedTraining.price || 0),

      name:
        formData.get("name"),

      email:
        formData.get("email"),

      phone:
        formData.get("phone"),

      date:
        formData.get("date"),

      time:
        formData.get("time"),

      level:
        formData.get("level"),

      message:
        formData.get("message"),

      status:
        "Awaiting Payment",

      createdAt:
        new Date().toISOString(),
    };

    localStorage.setItem(
      "pendingTrainingBooking",
      JSON.stringify(pendingBooking)
    );

    setSelectedTraining(null);

    navigate("/payment");
  };

  /* =================================================
     RENDER
  ================================================= */

  return (
    <div className="training-page">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="training-hero">
        <div className="container">

          <span className="training-label">
            ACCOUNT BAZAAR TRAINING
          </span>

          <h1>
            Learn. Build. <span>Grow.</span>
          </h1>

          <p>
            Practical online training designed to help
            you develop valuable digital skills and build
            your online business.
          </p>

        </div>
      </section>

      {/* =================================================
          TRAINING PROGRAMS
      ================================================= */}

      <section className="training-programs">
        <div className="container">

          <div className="training-section-heading">

            <div>
              <span>
                AVAILABLE PROGRAMS
              </span>

              <h2>
                Choose Your Training
              </h2>
            </div>

            <p>
              Select a program and book your preferred
              training.
            </p>

          </div>

          {/* =================================================
              REFRESH
          ================================================= */}

          <div className="training-toolbar">

            <div className="training-filter">
              <select
                value="All"
                disabled
              >
                <option value="All">
                  All Training Programs
                </option>
              </select>
            </div>

            <button
              type="button"
              className="training-refresh"
              onClick={fetchTrainings}
              disabled={loading}
              title="Refresh training programs"
              aria-label="Refresh training programs"
            >
              <FiRefreshCw
                className={
                  loading
                    ? "refresh-spinning"
                    : ""
                }
              />
            </button>

          </div>

          {/* =================================================
              LOADING
          ================================================= */}

          {loading && (
            <div className="no-products">

              <h3>
                Loading training programs...
              </h3>

              <p>
                Please wait while we load the
                available training programs.
              </p>

            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {!loading && error && (
            <div className="no-products">

              <h3>
                Unable to load training
              </h3>

              <p>
                {error}
              </p>

              <button
                type="button"
                onClick={fetchTrainings}
              >
                <FiRefreshCw />
                Try Again
              </button>

            </div>
          )}

          {/* =================================================
              TRAINING GRID
          ================================================= */}

          {!loading &&
            !error &&
            normalizedTrainings.length > 0 && (

              <div className="training-grid">

                {normalizedTrainings.map(
                  (training) => (

                    <div
                      className="training-card"
                      key={training.id}
                    >

                      <div className="training-card-top">

                        <div className="training-icon">
                          <FiBookOpen />
                        </div>

                        <span className="training-category">
                          {training.category}
                        </span>

                      </div>

                      <h3>
                        {training.title}
                      </h3>

                      <p>
                        {training.description}
                      </p>

                      <div className="training-meta">

                        <span>
                          <FiClock />
                          {training.duration}
                        </span>

                        <span>
                          <FiUsers />
                          {training.students} students
                        </span>

                      </div>

                      <div className="training-bottom">

                        <div className="training-price">

                          <small>
                            From
                          </small>

                          <strong>
                            $
                            {training.price.toLocaleString()}
                          </strong>

                        </div>

                        <button
                          type="button"
                          onClick={() =>
                            setSelectedTraining(
                              training
                            )
                          }
                        >
                          Book Training
                          <FiArrowRight />
                        </button>

                      </div>

                    </div>

                  )
                )}

              </div>
            )}

          {/* =================================================
              EMPTY
          ================================================= */}

          {!loading &&
            !error &&
            normalizedTrainings.length === 0 && (

              <div className="no-products">

                <h3>
                  No training programs available
                </h3>

                <p>
                  There are currently no training
                  programs available for booking.
                </p>

                <button
                  type="button"
                  onClick={fetchTrainings}
                >
                  <FiRefreshCw />
                  Refresh
                </button>

              </div>
            )}

        </div>
      </section>

      {/* =================================================
          BOOKING MODAL
      ================================================= */}

      {selectedTraining && (

        <div className="training-modal-overlay">

          <div className="training-booking-modal">

            <div className="training-modal-header">

              <div>

                <span>
                  TRAINING BOOKING
                </span>

                <h2>
                  Book Training
                </h2>

                <p>
                  {selectedTraining.title}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedTraining(null)
                }
              >
                <FiX />
              </button>

            </div>

            <form
              className="training-booking-form"
              onSubmit={handleBookingSubmit}
            >

              <div className="training-form-row">

                <div className="training-form-group">

                  <label>
                    Full Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    required
                  />

                </div>

                <div className="training-form-group">

                  <label>
                    Email Address
                  </label>

                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    required
                  />

                </div>

              </div>

              <div className="training-form-row">

                <div className="training-form-group">

                  <label>
                    Phone / WhatsApp
                  </label>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="+254..."
                    required
                  />

                </div>

                <div className="training-form-group">

                  <label>
                    Preferred Date
                  </label>

                  <input
                    type="date"
                    name="date"
                    required
                  />

                </div>

              </div>

              <div className="training-form-group">

                <label>
                  Preferred Time
                </label>

                <input
                  type="time"
                  name="time"
                  required
                />

              </div>

              <div className="training-form-group">

                <label>
                  Experience Level
                </label>

                <select
                  name="level"
                  defaultValue={
                    selectedTraining.level
                  }
                >

                  <option value="Beginner">
                    Beginner
                  </option>

                  <option value="Intermediate">
                    Intermediate
                  </option>

                  <option value="Advanced">
                    Advanced
                  </option>

                </select>

              </div>

              <div className="training-form-group">

                <label>
                  Additional Message
                </label>

                <textarea
                  name="message"
                  rows="4"
                  placeholder="Tell us anything we should know..."
                />

              </div>

              <div className="training-booking-actions">

                <button
                  type="button"
                  className="training-cancel"
                  onClick={() =>
                    setSelectedTraining(null)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="training-submit"
                >
                  Continue to Payment
                  <FiArrowRight />
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Training;