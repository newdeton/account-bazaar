import { useEffect, useMemo, useState } from "react";
import {
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiX,
  FiEye,
  FiUser,
  FiMail,
  FiCalendar,
  FiDollarSign,
  FiBriefcase,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
} from "react-icons/fi";

import "./Services.css";

const SERVICES_STORAGE_KEY = "accountBazaarServices";
const PURCHASE_STORAGE_KEY = "accountBazaarPurchases";

const defaultServices = [
  {
    id: 1,
    name: "Social Media Management",
    category: "Digital Marketing",
    description:
      "Professional management of social media accounts.",
    price: 100,
    status: "Active",
  },
  {
    id: 2,
    name: "Account Setup",
    category: "Account Services",
    description:
      "Setup and configuration of online accounts.",
    price: 30,
    status: "Active",
  },
  {
    id: 3,
    name: "Digital Marketing",
    category: "Marketing",
    description:
      "Digital marketing services for businesses.",
    price: 150,
    status: "Active",
  },
];

function Services() {
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const [search, setSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] =
    useState("all");

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  /* =====================================================
     SERVICES
  ===================================================== */

  const [services, setServices] = useState(() => {
    try {
      const saved = localStorage.getItem(
        SERVICES_STORAGE_KEY
      );

      if (saved) {
        return JSON.parse(saved);
      }

      localStorage.setItem(
        SERVICES_STORAGE_KEY,
        JSON.stringify(defaultServices)
      );

      return defaultServices;
    } catch (error) {
      console.error(
        "Failed to load services:",
        error
      );

      return defaultServices;
    }
  });

  useEffect(() => {
    localStorage.setItem(
      SERVICES_STORAGE_KEY,
      JSON.stringify(services)
    );
  }, [services]);

  /* =====================================================
     CUSTOMER PURCHASES
  ===================================================== */

  const [customerPurchases, setCustomerPurchases] =
    useState(() => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(
            PURCHASE_STORAGE_KEY
          ) || "[]"
        );

        return saved.filter(
          (purchase) =>
            String(
              purchase.category || ""
            ).toLowerCase() === "services"
        );
      } catch (error) {
        console.error(
          "Failed to load customer purchases:",
          error
        );

        return [];
      }
    });

  useEffect(() => {
    const loadPurchases = () => {
      try {
        const saved = JSON.parse(
          localStorage.getItem(
            PURCHASE_STORAGE_KEY
          ) || "[]"
        );

        const servicePurchases = saved.filter(
          (purchase) =>
            String(
              purchase.category || ""
            ).toLowerCase() === "services"
        );

        setCustomerPurchases(servicePurchases);
      } catch (error) {
        console.error(
          "Failed to reload customer purchases:",
          error
        );
      }
    };

    loadPurchases();

    window.addEventListener(
      "storage",
      loadPurchases
    );

    window.addEventListener(
      "accountBazaarPurchaseCreated",
      loadPurchases
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadPurchases
      );

      window.removeEventListener(
        "accountBazaarPurchaseCreated",
        loadPurchases
      );
    };
  }, []);

  /* =====================================================
     CUSTOMER IDENTITY NORMALIZATION
  ===================================================== */

  const getCustomerName = (purchase) => {
    return (
      purchase.customerName ||
      purchase.name ||
      purchase.customer?.name ||
      "Customer"
    );
  };

  const getCustomerEmail = (purchase) => {
    return (
      purchase.customerEmail ||
      purchase.email ||
      purchase.customer?.email ||
      "No email provided"
    );
  };

  const getCustomerId = (purchase) => {
    return (
      purchase.customerId ||
      purchase.userId ||
      purchase.customer?.id ||
      purchase.customer?.customerId ||
      purchase.id ||
      "N/A"
    );
  };

  const getPurchaseId = (purchase) => {
    return (
      purchase.purchaseId ||
      purchase.orderId ||
      purchase.id ||
      "N/A"
    );
  };

  const getServiceName = (purchase) => {
    return (
      purchase.productName ||
      purchase.serviceName ||
      purchase.name ||
      "Service"
    );
  };

  const getPurchaseDate = (purchase) => {
    return (
      purchase.date ||
      purchase.createdAt ||
      purchase.purchaseDate ||
      purchase.timestamp ||
      null
    );
  };

  const getPurchaseStatus = (purchase) => {
    return purchase.status || "Pending";
  };

  /* =====================================================
     CUSTOMER ORDER FILTERING
  ===================================================== */

  const filteredPurchases = useMemo(() => {
    const query = orderSearch.trim().toLowerCase();

    return customerPurchases.filter((purchase) => {
      const customerName =
        getCustomerName(purchase).toLowerCase();

      const customerEmail =
        getCustomerEmail(purchase).toLowerCase();

      const customerId =
        String(getCustomerId(purchase)).toLowerCase();

      const purchaseId =
        String(getPurchaseId(purchase)).toLowerCase();

      const serviceName =
        getServiceName(purchase).toLowerCase();

      const matchesSearch =
        !query ||
        customerName.includes(query) ||
        customerEmail.includes(query) ||
        customerId.includes(query) ||
        purchaseId.includes(query) ||
        serviceName.includes(query);

      const status =
        getPurchaseStatus(purchase).toLowerCase();

      const matchesStatus =
        orderStatusFilter === "all" ||
        status ===
          orderStatusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [
    customerPurchases,
    orderSearch,
    orderStatusFilter,
  ]);

  /* =====================================================
     ORDER STATISTICS
  ===================================================== */

  const orderStats = useMemo(() => {
    const total = customerPurchases.length;

    const pending = customerPurchases.filter(
      (purchase) =>
        getPurchaseStatus(purchase).toLowerCase() ===
        "pending"
    ).length;

    const completed = customerPurchases.filter(
      (purchase) =>
        getPurchaseStatus(purchase).toLowerCase() ===
        "completed"
    ).length;

    const revenue = customerPurchases.reduce(
      (totalAmount, purchase) =>
        totalAmount + Number(purchase.price || 0),
      0
    );

    return {
      total,
      pending,
      completed,
      revenue,
    };
  }, [customerPurchases]);

  /* =====================================================
     FORM
  ===================================================== */

  const emptyForm = {
    name: "",
    category: "Digital Marketing",
    description: "",
    price: "",
    status: "Active",
  };

  const [form, setForm] = useState(emptyForm);

  /* =====================================================
     SERVICE FILTER
  ===================================================== */

  const filteredServices = services.filter(
    (service) => {
      const query = search.toLowerCase();

      return (
        service.name
          .toLowerCase()
          .includes(query) ||
        service.category
          .toLowerCase()
          .includes(query) ||
        service.description
          .toLowerCase()
          .includes(query)
      );
    }
  );

  /* =====================================================
     FORM FUNCTIONS
  ===================================================== */

  const openAddForm = () => {
    setEditingService(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (service) => {
    setEditingService(service);

    setForm({
      name: service.name,
      category: service.category,
      description: service.description || "",
      price: service.price,
      status: service.status,
    });

    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingService(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    setForm((currentForm) => ({
      ...currentForm,
      [e.target.name]: e.target.value,
    }));
  };

  /* =====================================================
     SAVE SERVICE
  ===================================================== */

  const handleSubmit = (e) => {
    e.preventDefault();

    const updatedService = {
      id: editingService
        ? editingService.id
        : Date.now(),

      name: form.name.trim(),
      category: form.category,
      description: form.description.trim(),
      price: Number(form.price),
      status: form.status,
    };

    if (editingService) {
      setServices((currentServices) =>
        currentServices.map((service) =>
          service.id === editingService.id
            ? updatedService
            : service
        )
      );
    } else {
      setServices((currentServices) => [
        updatedService,
        ...currentServices,
      ]);
    }

    closeForm();
  };

  /* =====================================================
     DELETE SERVICE
  ===================================================== */

  const deleteService = (id) => {
    const service = services.find(
      (item) => item.id === id
    );

    const confirmed = window.confirm(
      `Are you sure you want to delete "${service?.name || "this service"}"?`
    );

    if (!confirmed) return;

    setServices((currentServices) =>
      currentServices.filter(
        (item) => item.id !== id
      )
    );
  };

  /* =====================================================
     CUSTOMER DETAILS
  ===================================================== */

  const openCustomer = (purchase) => {
    setSelectedCustomer(purchase);
  };

  const closeCustomer = () => {
    setSelectedCustomer(null);
  };

  /* =====================================================
     DATE FORMAT
  ===================================================== */

  const formatDate = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) return "Not available";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Not available";
    }

    return parsedDate.toLocaleString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  const getInitial = (name) => {
    return (
      name?.trim()?.charAt(0)?.toUpperCase() ||
      "C"
    );
  };

  return (
    <div className="admin-services">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="services-heading">

        <div>
          <span>SERVICE MANAGEMENT</span>

          <h1>Services</h1>

          <p>
            Manage marketplace services and monitor
            customer service orders.
          </p>
        </div>

        <button
          type="button"
          className="add-service-button"
          onClick={openAddForm}
        >
          <FiPlus />
          Add Service
        </button>

      </div>

      {/* =================================================
          CUSTOMER ORDER SUMMARY
      ================================================= */}

      <div className="service-order-stats">

        <div className="service-order-stat">
          <div className="service-order-stat-icon">
            <FiBriefcase />
          </div>

          <div>
            <span>Total Orders</span>
            <strong>{orderStats.total}</strong>
          </div>
        </div>

        <div className="service-order-stat">
          <div className="service-order-stat-icon">
            <FiClock />
          </div>

          <div>
            <span>Pending</span>
            <strong>{orderStats.pending}</strong>
          </div>
        </div>

        <div className="service-order-stat">
          <div className="service-order-stat-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Completed</span>
            <strong>{orderStats.completed}</strong>
          </div>
        </div>

        <div className="service-order-stat">
          <div className="service-order-stat-icon">
            <FiDollarSign />
          </div>

          <div>
            <span>Service Revenue</span>
            <strong>
              ${orderStats.revenue.toLocaleString()}
            </strong>
          </div>
        </div>

      </div>

      {/* =================================================
          SERVICE INVENTORY
      ================================================= */}

      <section className="service-management-panel">

        <div className="services-section-heading">

          <div>
            <span>MARKETPLACE CATALOG</span>

            <h2>Service Inventory</h2>

            <p>
              Manage the services available to customers.
            </p>
          </div>

          <div className="service-count">
            {filteredServices.length} services
          </div>

        </div>

        {/* TOOLBAR */}

        <div className="services-toolbar">

          <div className="services-search">

            <FiSearch />

            <input
              type="text"
              placeholder="Search services..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

        </div>

        {/* TABLE */}

        <div className="services-table-wrapper">

          <table className="services-table">

            <thead>
              <tr>
                <th>Service</th>
                <th>Category</th>
                <th>Description</th>
                <th>Price</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (

                  <tr key={service.id}>

                    <td>
                      <div className="service-name">

                        <div className="service-placeholder">
                          {getInitial(service.name)}
                        </div>

                        <div>
                          <strong>
                            {service.name}
                          </strong>

                          <small>
                            Service #{service.id}
                          </small>
                        </div>

                      </div>
                    </td>

                    <td>
                      <span className="service-category">
                        {service.category}
                      </span>
                    </td>

                    <td className="service-description">
                      {service.description}
                    </td>

                    <td>
                      <strong>
                        ${Number(service.price).toLocaleString()}
                      </strong>
                    </td>

                    <td>
                      <span
                        className={`service-status ${
                          service.status
                            .toLowerCase()
                            .replace(/\s+/g, "-")
                        }`}
                      >
                        {service.status}
                      </span>
                    </td>

                    <td>

                      <div className="service-actions">

                        <button
                          type="button"
                          title="Edit Service"
                          onClick={() =>
                            openEditForm(service)
                          }
                        >
                          <FiEdit2 />
                        </button>

                        <button
                          type="button"
                          title="Delete Service"
                          onClick={() =>
                            deleteService(service.id)
                          }
                        >
                          <FiTrash2 />
                        </button>

                      </div>

                    </td>

                  </tr>

                ))
              ) : (

                <tr>
                  <td
                    colSpan="6"
                    className="services-empty"
                  >
                    <FiBriefcase />

                    <strong>
                      No services found
                    </strong>

                    <span>
                      Try changing your search.
                    </span>
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* =================================================
          CUSTOMER ORDERS
      ================================================= */}

      <section className="customer-purchases-section">

        <div className="services-section-heading">

          <div>
            <span>CUSTOMER IDENTITY</span>

            <h2>Service Orders</h2>

            <p>
              Track services purchased by identified
              customers.
            </p>
          </div>

          <div className="service-count">
            {filteredPurchases.length} orders
          </div>

        </div>

        {/* ORDER TOOLBAR */}

        <div className="customer-orders-toolbar">

          <div className="services-search">

            <FiSearch />

            <input
              type="text"
              placeholder="Search customer, email, ID or service..."
              value={orderSearch}
              onChange={(e) =>
                setOrderSearch(e.target.value)
              }
            />

          </div>

          <select
            value={orderStatusFilter}
            onChange={(e) =>
              setOrderStatusFilter(e.target.value)
            }
          >
            <option value="all">
              All Statuses
            </option>

            <option value="pending">
              Pending
            </option>

            <option value="processing">
              Processing
            </option>

            <option value="completed">
              Completed
            </option>

            <option value="cancelled">
              Cancelled
            </option>
          </select>

        </div>

        {/* ORDER TABLE */}

        <div className="services-table-wrapper">

          <table className="services-table customer-orders-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Order ID</th>
                <th>Purchased</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {filteredPurchases.length > 0 ? (

                filteredPurchases.map(
                  (purchase, index) => {

                    const customerName =
                      getCustomerName(purchase);

                    const customerEmail =
                      getCustomerEmail(purchase);

                    const customerId =
                      getCustomerId(purchase);

                    const purchaseId =
                      getPurchaseId(purchase);

                    const serviceName =
                      getServiceName(purchase);

                    const purchaseDate =
                      getPurchaseDate(purchase);

                    const status =
                      getPurchaseStatus(purchase);

                    return (
                      <tr
                        key={
                          purchaseId !== "N/A"
                            ? purchaseId
                            : index
                        }
                      >

                        {/* CUSTOMER IDENTITY */}

                        <td>

                          <div className="service-customer">

                            <div className="service-customer-avatar">
                              {getInitial(
                                customerName
                              )}
                            </div>

                            <div className="service-customer-info">

                              <strong>
                                {customerName}
                              </strong>

                              <span>
                                <FiMail />
                                {customerEmail}
                              </span>

                              <small>
                                Customer ID:{" "}
                                {customerId}
                              </small>

                            </div>

                          </div>

                        </td>

                        {/* SERVICE */}

                        <td>

                          <div className="purchased-service">

                            <strong>
                              {serviceName}
                            </strong>

                            <small>
                              {purchase.category ||
                                "Services"}
                            </small>

                          </div>

                        </td>

                        {/* ORDER ID */}

                        <td>

                          <span className="service-order-id">
                            #{purchaseId}
                          </span>

                        </td>

                        {/* DATE */}

                        <td>

                          <span className="service-order-date">
                            <FiCalendar />
                            {formatDate(
                              purchaseDate
                            )}
                          </span>

                        </td>

                        {/* AMOUNT */}

                        <td>

                          <strong>
                            $
                            {Number(
                              purchase.price || 0
                            ).toLocaleString()}
                          </strong>

                        </td>

                        {/* STATUS */}

                        <td>

                          <span
                            className={`service-status ${
                              status
                                .toLowerCase()
                                .replace(
                                  /\s+/g,
                                  "-"
                                )
                            }`}
                          >
                            {status}
                          </span>

                        </td>

                        {/* ACTION */}

                        <td>

                          <button
                            type="button"
                            className="view-customer-button"
                            title="View Customer"
                            onClick={() =>
                              openCustomer(
                                purchase
                              )
                            }
                          >
                            <FiEye />
                          </button>

                        </td>

                      </tr>
                    );
                  }
                )

              ) : (

                <tr>

                  <td
                    colSpan="7"
                    className="services-empty"
                  >

                    <FiUser />

                    <strong>
                      No customer orders found
                    </strong>

                    <span>
                      Service purchases will appear
                      here when customers place orders.
                    </span>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* =================================================
          CUSTOMER IDENTITY MODAL
      ================================================= */}

      {selectedCustomer && (

        <div
          className="customer-identity-overlay"
          onClick={closeCustomer}
        >

          <div
            className="customer-identity-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="customer-identity-header">

              <div>

                <span>CUSTOMER IDENTITY</span>

                <h2>
                  Customer Profile
                </h2>

                <p>
                  Identity and order information
                  associated with this purchase.
                </p>

              </div>

              <button
                type="button"
                onClick={closeCustomer}
              >
                <FiX />
              </button>

            </div>

            {/* CUSTOMER PROFILE */}

            <div className="customer-identity-profile">

              <div className="customer-identity-avatar">
                {getInitial(
                  getCustomerName(
                    selectedCustomer
                  )
                )}
              </div>

              <div>

                <h3>
                  {getCustomerName(
                    selectedCustomer
                  )}
                </h3>

                <p>
                  {getCustomerEmail(
                    selectedCustomer
                  )}
                </p>

                <span>
                  Customer ID:{" "}
                  {getCustomerId(
                    selectedCustomer
                  )}
                </span>

              </div>

            </div>

            {/* IDENTITY DETAILS */}

            <div className="customer-identity-grid">

              <div className="identity-detail">

                <span>
                  <FiUser />
                  Customer
                </span>

                <strong>
                  {getCustomerName(
                    selectedCustomer
                  )}
                </strong>

              </div>

              <div className="identity-detail">

                <span>
                  <FiMail />
                  Email
                </span>

                <strong>
                  {getCustomerEmail(
                    selectedCustomer
                  )}
                </strong>

              </div>

              <div className="identity-detail">

                <span>
                  <FiBriefcase />
                  Customer ID
                </span>

                <strong>
                  {getCustomerId(
                    selectedCustomer
                  )}
                </strong>

              </div>

              <div className="identity-detail">

                <span>
                  <FiCalendar />
                  Order Date
                </span>

                <strong>
                  {formatDateTime(
                    getPurchaseDate(
                      selectedCustomer
                    )
                  )}
                </strong>

              </div>

            </div>

            {/* ORDER INFORMATION */}

            <div className="customer-order-details">

              <div className="customer-order-details-heading">

                <div>
                  <span>ORDER INFORMATION</span>

                  <h3>
                    Purchased Service
                  </h3>
                </div>

                <span
                  className={`service-status ${
                    getPurchaseStatus(
                      selectedCustomer
                    )
                      .toLowerCase()
                      .replace(
                        /\s+/g,
                        "-"
                      )
                  }`}
                >
                  {getPurchaseStatus(
                    selectedCustomer
                  )}
                </span>

              </div>

              <div className="customer-order-detail-row">

                <span>Order ID</span>

                <strong>
                  #{getPurchaseId(
                    selectedCustomer
                  )}
                </strong>

              </div>

              <div className="customer-order-detail-row">

                <span>Service</span>

                <strong>
                  {getServiceName(
                    selectedCustomer
                  )}
                </strong>

              </div>

              <div className="customer-order-detail-row">

                <span>Category</span>

                <strong>
                  {selectedCustomer.category ||
                    "Services"}
                </strong>

              </div>

              <div className="customer-order-detail-row">

                <span>Amount</span>

                <strong>
                  $
                  {Number(
                    selectedCustomer.price || 0
                  ).toLocaleString()}
                </strong>

              </div>

            </div>

            {/* FOOTER */}

            <div className="customer-identity-actions">

              <button
                type="button"
                className="customer-identity-close"
                onClick={closeCustomer}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          ADD / EDIT SERVICE MODAL
      ================================================= */}

      {showForm && (

        <div
          className="service-modal-overlay"
          onClick={closeForm}
        >

          <div
            className="service-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="service-modal-header">

              <div>

                <span>SERVICE MANAGEMENT</span>

                <h2>
                  {editingService
                    ? "Edit Service"
                    : "Add Service"}
                </h2>

                <p>
                  {editingService
                    ? "Update this marketplace service."
                    : "Add a new service to Account Bazaar."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeForm}
              >
                <FiX />
              </button>

            </div>

            <form
              className="service-form"
              onSubmit={handleSubmit}
            >

              <div className="service-form-group">

                <label>
                  Service Name
                </label>

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Social Media Management"
                  required
                />

              </div>

              <div className="service-form-row">

                <div className="service-form-group">

                  <label>
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >

                    <option>
                      Digital Marketing
                    </option>

                    <option>
                      Account Services
                    </option>

                    <option>
                      Marketing
                    </option>

                    <option>
                      Technical Services
                    </option>

                    <option>
                      Other
                    </option>

                  </select>

                </div>

                <div className="service-form-group">

                  <label>
                    Price ($)
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="100"
                    min="0"
                    step="0.01"
                    required
                  />

                </div>

              </div>

              <div className="service-form-group">

                <label>
                  Description
                </label>

                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe what this service includes..."
                  rows="5"
                  required
                />

              </div>

              <div className="service-form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >

                  <option>
                    Active
                  </option>

                  <option>
                    Inactive
                  </option>

                </select>

              </div>

              <div className="service-form-actions">

                <button
                  type="button"
                  className="cancel-service"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-service"
                >

                  {editingService ? (
                    <>
                      <FiEdit2 />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      Add Service
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
}

export default Services;