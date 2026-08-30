import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiClock,
  FiUsers,
  FiArrowRight,
  FiX,
} from "react-icons/fi";

import "./Training.css";

function Training() {
  const navigate = useNavigate();
  const [selectedTraining, setSelectedTraining] = useState(null);

  const trainings = [
    {
      id: 1,
      title: "Social Media Account Management",
      category: "Social Media",
      description:
        "Learn how to create, manage, grow and maintain professional social media accounts.",
      duration: "4 Weeks",
      price: 150,
      students: 12,
      level: "Beginner",
    },
    {
      id: 2,
      title: "Proxy Management & Setup",
      category: "Proxies",
      description:
        "Learn proxy fundamentals, setup, configuration and practical proxy management.",
      duration: "2 Weeks",
      price: 100,
      students: 8,
      level: "Intermediate",
    },
    {
      id: 3,
      title: "Online Account Business",
      category: "Business",
      description:
        "Learn how to source, manage and build a business around legitimate online accounts and digital services.",
      duration: "4 Weeks",
      price: 200,
      students: 15,
      level: "Beginner",
    },
    {
      id: 4,
      title: "Digital Marketing",
      category: "Marketing",
      description:
        "Learn practical digital marketing strategies for promoting products, services and businesses online.",
      duration: "6 Weeks",
      price: 250,
      students: 10,
      level: "Intermediate",
    },
  ];

  const handleBookingSubmit = (e) => {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

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

    // Store booking temporarily.
    // It will NOT become an actual booking until payment succeeds.
    const pendingBooking = {
      id: Date.now(),
      training: selectedTraining.title,
      category: selectedTraining.category,
      price: selectedTraining.price,

      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      date: formData.get("date"),
      time: formData.get("time"),
      level: formData.get("level"),
      message: formData.get("message"),

      status: "Awaiting Payment",
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      "pendingTrainingBooking",
      JSON.stringify(pendingBooking)
    );

    setSelectedTraining(null);

    // Go directly to payment
    navigate("/payment");
  };

  return (
    <div className="training-page">

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

      <section className="training-programs">
        <div className="container">

          <div className="training-section-heading">
            <div>
              <span>AVAILABLE PROGRAMS</span>

              <h2>
                Choose Your Training
              </h2>
            </div>

            <p>
              Select a program and book your preferred
              training.
            </p>
          </div>

          <div className="training-grid">

            {trainings.map((training) => (
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
                      ${training.price}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTraining(training)
                    }
                  >
                    Book Training
                    <FiArrowRight />
                  </button>

                </div>

              </div>
            ))}

          </div>
        </div>
      </section>

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
                  <label>Full Name</label>

                  <input
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    required
                  />
                </div>

                <div className="training-form-group">
                  <label>Email Address</label>

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
                  <label>Phone / WhatsApp</label>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="+254..."
                    required
                  />
                </div>

                <div className="training-form-group">
                  <label>Preferred Date</label>

                  <input
                    type="date"
                    name="date"
                    required
                  />
                </div>

              </div>

              <div className="training-form-group">
                <label>Preferred Time</label>

                <input
                  type="time"
                  name="time"
                  required
                />
              </div>

              <div className="training-form-group">
                <label>Experience Level</label>

                <select
                  name="level"
                  defaultValue={selectedTraining.level}
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
                <label>Additional Message</label>

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