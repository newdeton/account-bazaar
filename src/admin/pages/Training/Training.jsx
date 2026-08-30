import { useState } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiCalendar,
  FiClock,
  FiMail,
  FiPhone,
  FiBookOpen,
} from "react-icons/fi";

import "./Training.css";

function Training() {
  const [activeTab, setActiveTab] = useState("training");

  const [trainings, setTrainings] = useState(() =>
    JSON.parse(
      localStorage.getItem("adminTrainings") || "[]"
    )
  );

  const [bookings, setBookings] = useState(() =>
    JSON.parse(
      localStorage.getItem("trainingBookings") || "[]"
    )
  );

  const [showForm, setShowForm] = useState(false);

  const [editingTraining, setEditingTraining] =
    useState(null);

  const [form, setForm] = useState({
    title: "",
    category: "Social Media",
    description: "",
    duration: "",
    price: "",
    level: "Beginner",
  });

  /* ---------------- TRAINING ---------------- */

  const openAddForm = () => {
    setEditingTraining(null);

    setForm({
      title: "",
      category: "Social Media",
      description: "",
      duration: "",
      price: "",
      level: "Beginner",
    });

    setShowForm(true);
  };

  const openEditForm = (training) => {
    setEditingTraining(training);

    setForm({
      title: training.title,
      category: training.category,
      description: training.description,
      duration: training.duration,
      price: training.price,
      level: training.level,
    });

    setShowForm(true);
  };

  const handleTrainingSubmit = (e) => {
    e.preventDefault();

    let updated;

    if (editingTraining) {
      updated = trainings.map((training) =>
        training.id === editingTraining.id
          ? {
              ...training,
              ...form,
              price: Number(form.price),
            }
          : training
      );
    } else {
      const newTraining = {
        id: Date.now(),
        ...form,
        price: Number(form.price),
      };

      updated = [...trainings, newTraining];
    }

    setTrainings(updated);

    localStorage.setItem(
      "adminTrainings",
      JSON.stringify(updated)
    );

    setShowForm(false);
  };

  const deleteTraining = (id) => {
    if (
      !window.confirm(
        "Delete this training program?"
      )
    ) {
      return;
    }

    const updated = trainings.filter(
      (training) => training.id !== id
    );

    setTrainings(updated);

    localStorage.setItem(
      "adminTrainings",
      JSON.stringify(updated)
    );
  };

  /* ---------------- BOOKINGS ---------------- */

  const updateBookingStatus = (id, status) => {
    const updated = bookings.map((booking) =>
      booking.id === id
        ? { ...booking, status }
        : booking
    );

    setBookings(updated);

    localStorage.setItem(
      "trainingBookings",
      JSON.stringify(updated)
    );
  };

  const deleteBooking = (id) => {
    if (
      !window.confirm(
        "Delete this training booking?"
      )
    ) {
      return;
    }

    const updated = bookings.filter(
      (booking) => booking.id !== id
    );

    setBookings(updated);

    localStorage.setItem(
      "trainingBookings",
      JSON.stringify(updated)
    );
  };

  return (
    <div className="admin-training-page">

      {/* HEADER */}

      <div className="admin-training-header">

        <div>
          <span>TRAINING MANAGEMENT</span>

          <h1>Training</h1>

          <p>
            Manage training programs and customer
            bookings.
          </p>
        </div>

        {activeTab === "training" && (
          <button
            className="add-training-button"
            onClick={openAddForm}
          >
            <FiPlus />
            Add Training
          </button>
        )}

      </div>

      {/* TABS */}

      <div className="training-admin-tabs">

        <button
          className={
            activeTab === "training"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("training")
          }
        >
          <FiBookOpen />
          Training Programs
        </button>

        <button
          className={
            activeTab === "bookings"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab("bookings")
          }
        >
          <FiCalendar />
          Bookings

          {bookings.length > 0 && (
            <small>
              {bookings.length}
            </small>
          )}
        </button>

      </div>

      {/* TRAINING PROGRAMS */}

      {activeTab === "training" && (

        <div className="admin-training-grid">

          {trainings.length === 0 ? (

            <div className="training-empty">

              <FiBookOpen />

              <h3>
                No Training Programs
              </h3>

              <p>
                Add your first training program
                to get started.
              </p>

              <button
                onClick={openAddForm}
              >
                <FiPlus />
                Add Training
              </button>

            </div>

          ) : (

            trainings.map((training) => (

              <div
                className="admin-training-card"
                key={training.id}
              >

                <div className="admin-training-card-top">

                  <div className="admin-training-icon">
                    <FiBookOpen />
                  </div>

                  <span>
                    {training.category}
                  </span>

                </div>

                <h3>
                  {training.title}
                </h3>

                <p>
                  {training.description}
                </p>

                <div className="admin-training-info">

                  <span>
                    <FiClock />
                    {training.duration}
                  </span>

                  <span>
                    {training.level}
                  </span>

                </div>

                <div className="admin-training-bottom">

                  <strong>
                    ${training.price}
                  </strong>

                  <div>

                    <button
                      onClick={() =>
                        openEditForm(training)
                      }
                      title="Edit"
                    >
                      <FiEdit2 />
                    </button>

                    <button
                      onClick={() =>
                        deleteTraining(
                          training.id
                        )
                      }
                      title="Delete"
                    >
                      <FiTrash2 />
                    </button>

                  </div>

                </div>

              </div>

            ))

          )}

        </div>

      )}

      {/* BOOKINGS */}

      {activeTab === "bookings" && (

        <div className="admin-bookings-wrapper">

          {bookings.length === 0 ? (

            <div className="training-empty">

              <FiCalendar />

              <h3>
                No Training Bookings
              </h3>

              <p>
                Customer bookings will appear
                here.
              </p>

            </div>

          ) : (

            <div className="admin-bookings-table">

              <div className="admin-bookings-head">

                <span>Customer</span>
                <span>Training</span>
                <span>Schedule</span>
                <span>Level</span>
                <span>Price</span>
                <span>Status</span>
                <span>Action</span>

              </div>

              {bookings.map((booking) => (

                <div
                  className="admin-booking-row"
                  key={booking.id}
                >

                  <div className="admin-booking-customer">

                    <strong>
                      {booking.name ||
                        "Unknown Customer"}
                    </strong>

                    <small>
                      <FiMail />
                      {booking.email ||
                        "No email"}
                    </small>

                    <small>
                      <FiPhone />
                      {booking.phone ||
                        "No phone"}
                    </small>

                  </div>

                  <div className="admin-booking-training">

                    {booking.training}

                  </div>

                  <div className="admin-booking-schedule">

                    <span>
                      <FiCalendar />
                      {booking.date ||
                        "Not selected"}
                    </span>

                    <span>
                      <FiClock />
                      {booking.time ||
                        "Flexible"}
                    </span>

                  </div>

                  <div>

                    <span className="training-level-badge">
                      {booking.level ||
                        "Beginner"}
                    </span>

                  </div>

                  <strong className="admin-booking-price">
                    ${booking.price}
                  </strong>

                  <select
                    className={`admin-booking-status ${booking.status.toLowerCase()}`}
                    value={booking.status}
                    onChange={(e) =>
                      updateBookingStatus(
                        booking.id,
                        e.target.value
                      )
                    }
                  >
                    <option value="Pending">
                      Pending
                    </option>

                    <option value="Confirmed">
                      Confirmed
                    </option>

                    <option value="Completed">
                      Completed
                    </option>

                    <option value="Cancelled">
                      Cancelled
                    </option>

                  </select>

                  <button
                    className="admin-delete-booking"
                    onClick={() =>
                      deleteBooking(
                        booking.id
                      )
                    }
                    title="Delete booking"
                  >
                    <FiTrash2 />
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>

      )}

      {/* ADD / EDIT MODAL */}

      {showForm && (

        <div className="training-admin-modal-overlay">

          <div className="training-admin-modal">

            <div className="training-admin-modal-header">

              <div>

                <span>
                  TRAINING PROGRAM
                </span>

                <h2>
                  {editingTraining
                    ? "Edit Training"
                    : "Add Training"}
                </h2>

              </div>

              <button
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleTrainingSubmit}
              className="training-admin-form"
            >

              <div className="training-form-row">

                <div className="training-form-group">

                  <label>
                    Training Name
                  </label>

                  <input
                    value={form.title}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        title: e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="training-form-group">

                  <label>
                    Category
                  </label>

                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        category:
                          e.target.value,
                      })
                    }
                  >
                    <option>
                      Social Media
                    </option>

                    <option>
                      Proxies
                    </option>

                    <option>
                      Business
                    </option>

                    <option>
                      Marketing
                    </option>

                    <option>
                      Other
                    </option>

                  </select>

                </div>

              </div>

              <div className="training-form-group">

                <label>
                  Description
                </label>

                <textarea
                  rows="4"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  required
                />

              </div>

              <div className="training-form-row">

                <div className="training-form-group">

                  <label>
                    Duration
                  </label>

                  <input
                    placeholder="e.g. 4 Weeks"
                    value={form.duration}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        duration:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

                <div className="training-form-group">

                  <label>
                    Price
                  </label>

                  <input
                    type="number"
                    min="0"
                    value={form.price}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        price:
                          e.target.value,
                      })
                    }
                    required
                  />

                </div>

              </div>

              <div className="training-form-group">

                <label>
                  Level
                </label>

                <select
                  value={form.level}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      level:
                        e.target.value,
                    })
                  }
                >
                  <option>
                    Beginner
                  </option>

                  <option>
                    Intermediate
                  </option>

                  <option>
                    Advanced
                  </option>

                </select>

              </div>

              <div className="training-admin-form-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowForm(false)
                  }
                  className="training-cancel-button"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="training-save-button"
                >
                  {editingTraining
                    ? "Update Training"
                    : "Save Training"}
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