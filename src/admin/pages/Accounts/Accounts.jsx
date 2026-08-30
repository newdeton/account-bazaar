import { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiBox,
  FiCheckCircle,
  FiEdit2,
  FiEye,
  FiEyeOff,
  FiFilter,
  FiPackage,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiShield,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi";

import "./Accounts.css";

/* =========================================================
   STORAGE
========================================================= */

const ACCOUNTS_STORAGE_KEY = "accountBazaarAccounts";
const PURCHASES_STORAGE_KEY = "purchases";

/* =========================================================
   DEFAULT INVENTORY
========================================================= */

const defaultAccounts = [
  {
    id: 1,
    platform: "Google",
    name: "Google Workspace Account",
    username: "account001@gmail.com",
    password: "",
    price: 25,
    status: "Available",
    image: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    platform: "Instagram",
    name: "Instagram Account",
    username: "@account_store01",
    password: "",
    price: 20,
    status: "Available",
    image: "",
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    platform: "Facebook",
    name: "Facebook Account",
    username: "facebook.account01",
    password: "",
    price: 18,
    status: "Sold",
    image: "",
    createdAt: new Date().toISOString(),
  },
];

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm = {
  platform: "Google",
  name: "",
  username: "",
  password: "",
  price: "",
  status: "Available",
  image: "",
};

/* =========================================================
   SAFE STORAGE READER
========================================================= */

const readStorageArray = (key) => {
  try {
    const saved = localStorage.getItem(key);

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Failed to read ${key}:`, error);
    return [];
  }
};

/* =========================================================
   STORAGE WRITER
========================================================= */

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to write ${key}:`, error);
    return false;
  }
};

/* =========================================================
   ID GENERATOR
========================================================= */

const generateAccountId = () => {
  return `ACC-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 7)
    .toUpperCase()}`;
};

/* =========================================================
   NORMALIZE STATUS
========================================================= */

const normalizeStatus = (status) => {
  return String(status || "Pending")
    .trim()
    .toLowerCase();
};

/* =========================================================
   STATUS CLASS
========================================================= */

const getStatusClass = (status) => {
  return normalizeStatus(status).replace(/\s+/g, "-");
};

/* =========================================================
   ACCOUNTS COMPONENT
========================================================= */

function Accounts() {
  const [accounts, setAccounts] = useState(() => {
    const saved = readStorageArray(ACCOUNTS_STORAGE_KEY);

    if (saved.length > 0) {
      return saved;
    }

    writeStorage(
      ACCOUNTS_STORAGE_KEY,
      defaultAccounts
    );

    return defaultAccounts;
  });

  const [customerPurchases, setCustomerPurchases] =
    useState([]);

  const [showForm, setShowForm] = useState(false);

  const [editingAccount, setEditingAccount] =
    useState(null);

  const [selectedPurchase, setSelectedPurchase] =
    useState(null);

  const [showPurchaseDetails, setShowPurchaseDetails] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [search, setSearch] = useState("");

  const [platformFilter, setPlatformFilter] =
    useState("all");

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [form, setForm] = useState(emptyForm);

  /* =======================================================
     LOAD PURCHASES
  ======================================================= */

  const loadPurchases = () => {
    const savedPurchases = readStorageArray(
      PURCHASES_STORAGE_KEY
    );

    const accountPurchases = savedPurchases.filter(
      (purchase) => {
        const category = String(
          purchase.category || ""
        )
          .trim()
          .toLowerCase();

        const productType = String(
          purchase.productType || ""
        )
          .trim()
          .toLowerCase();

        return (
          category === "account" ||
          category === "accounts" ||
          productType === "account" ||
          productType === "accounts"
        );
      }
    );

    setCustomerPurchases(accountPurchases);
  };

  /* =======================================================
     REFRESH DATA
  ======================================================= */

  useEffect(() => {
    loadPurchases();

    const handleStorageChange = () => {
      const savedAccounts = readStorageArray(
        ACCOUNTS_STORAGE_KEY
      );

      if (savedAccounts.length > 0) {
        setAccounts(savedAccounts);
      }

      loadPurchases();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    const interval = setInterval(() => {
      loadPurchases();
    }, 1500);

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     SAVE INVENTORY
  ======================================================= */

  useEffect(() => {
    writeStorage(
      ACCOUNTS_STORAGE_KEY,
      accounts
    );
  }, [accounts]);

  /* =======================================================
     ACCOUNT STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    const available = accounts.filter(
      (account) =>
        normalizeStatus(account.status) ===
        "available"
    ).length;

    const sold = accounts.filter(
      (account) =>
        normalizeStatus(account.status) ===
        "sold"
    ).length;

    const reserved = accounts.filter(
      (account) =>
        normalizeStatus(account.status) ===
        "reserved"
    ).length;

    const disabled = accounts.filter(
      (account) =>
        normalizeStatus(account.status) ===
        "disabled"
    ).length;

    const inventoryValue = accounts.reduce(
      (sum, account) =>
        sum + Number(account.price || 0),
      0
    );

    return {
      total: accounts.length,
      available,
      sold,
      reserved,
      disabled,
      inventoryValue,
    };
  }, [accounts]);

  /* =======================================================
     FILTER ACCOUNTS
  ======================================================= */

  const filteredAccounts = useMemo(() => {
    const searchValue =
      search.trim().toLowerCase();

    return accounts.filter((account) => {
      const name = String(
        account.name || ""
      ).toLowerCase();

      const username = String(
        account.username || ""
      ).toLowerCase();

      const platform = String(
        account.platform || ""
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        username.includes(searchValue) ||
        platform.includes(searchValue);

      const matchesPlatform =
        platformFilter === "all" ||
        platform === platformFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" ||
        normalizeStatus(account.status) ===
          statusFilter.toLowerCase();

      return (
        matchesSearch &&
        matchesPlatform &&
        matchesStatus
      );
    });
  }, [
    accounts,
    search,
    platformFilter,
    statusFilter,
  ]);

  /* =======================================================
     FORM ACTIONS
  ======================================================= */

  const openAddForm = () => {
    setEditingAccount(null);
    setForm({
      ...emptyForm,
    });
    setShowPassword(false);
    setShowForm(true);
  };

  const openEditForm = (account) => {
    setEditingAccount(account);

    setForm({
      platform: account.platform || "Google",
      name: account.name || "",
      username: account.username || "",
      password: "",
      price: account.price ?? "",
      status: account.status || "Available",
      image: account.image || "",
    });

    setShowPassword(false);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingAccount(null);
    setForm({
      ...emptyForm,
    });
    setShowPassword(false);
  };

  const handleChange = (event) => {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /* =======================================================
     IMAGE UPLOAD
  ======================================================= */

  const handleImageChange = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert(
        "Please select a valid image file."
      );
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(
        "Image is too large. Please use an image below 2MB."
      );
      return;
    }

    const reader = new FileReader();

    reader.onloadend = () => {
      setForm((current) => ({
        ...current,
        image: reader.result,
      }));
    };

    reader.onerror = () => {
      alert(
        "Unable to read the selected image."
      );
    };

    reader.readAsDataURL(file);
  };

  /* =======================================================
     SAVE ACCOUNT
  ======================================================= */

  const handleSubmit = (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const username = form.username.trim();
    const price = Number(form.price);

    if (!name) {
      alert("Please enter an account name.");
      return;
    }

    if (!username) {
      alert(
        "Please enter the account username or email."
      );
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      alert(
        "Please enter a valid account price."
      );
      return;
    }

    if (
      !editingAccount &&
      !form.password.trim()
    ) {
      alert(
        "Please enter the account password."
      );
      return;
    }

    const accountId =
      editingAccount?.id ||
      generateAccountId();

    const updatedAccount = {
      id: accountId,
      platform: form.platform,
      name,
      username,
      price,
      status: form.status,
      image: form.image || "",
      createdAt:
        editingAccount?.createdAt ||
        new Date().toISOString(),
      updatedAt:
        new Date().toISOString(),
    };

    if (editingAccount) {
      setAccounts((current) =>
        current.map((account) =>
          account.id === editingAccount.id
            ? {
                ...account,
                ...updatedAccount,

                password:
                  form.password.trim() ||
                  account.password ||
                  "",
              }
            : account
        )
      );

      alert(
        "Account updated successfully."
      );
    } else {
      setAccounts((current) => [
        updatedAccount,
        ...current,
      ]);

      alert(
        "Account added successfully."
      );
    }

    closeForm();
  };

  /* =======================================================
     DELETE ACCOUNT
  ======================================================= */

  const deleteAccount = (id) => {
    const account = accounts.find(
      (item) => item.id === id
    );

    if (!account) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${account.name}" from the inventory?`
    );

    if (!confirmed) {
      return;
    }

    setAccounts((current) =>
      current.filter(
        (item) => item.id !== id
      )
    );
  };

  /* =======================================================
     UPDATE ACCOUNT STATUS
  ======================================================= */

  const updateAccountStatus = (
    id,
    status
  ) => {
    setAccounts((current) =>
      current.map((account) =>
        account.id === id
          ? {
              ...account,
              status,
              updatedAt:
                new Date().toISOString(),
            }
          : account
      )
    );
  };

  /* =======================================================
     PURCHASE STATUS
  ======================================================= */

  const updatePurchaseStatus = (
    purchaseId,
    status
  ) => {
    const purchases = readStorageArray(
      PURCHASES_STORAGE_KEY
    );

    const updatedPurchases =
      purchases.map((purchase) => {
        const id =
          purchase.purchaseId ||
          purchase.id;

        if (String(id) !== String(purchaseId)) {
          return purchase;
        }

        return {
          ...purchase,
          status,
          updatedAt:
            new Date().toISOString(),
        };
      });

    if (
      writeStorage(
        PURCHASES_STORAGE_KEY,
        updatedPurchases
      )
    ) {
      loadPurchases();

      setSelectedPurchase((current) =>
        current
          ? {
              ...current,
              status,
            }
          : null
      );
    }
  };

  /* =======================================================
     PURCHASE DETAILS
  ======================================================= */

  const openPurchaseDetails = (
    purchase
  ) => {
    setSelectedPurchase(purchase);
    setShowPurchaseDetails(true);
  };

  const closePurchaseDetails = () => {
    setSelectedPurchase(null);
    setShowPurchaseDetails(false);
  };

  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "Unknown";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "Unknown";
    }

    return value.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  /* =======================================================
     FORMAT MONEY
  ======================================================= */

  const formatMoney = (amount) => {
    return Number(
      amount || 0
    ).toFixed(2);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-accounts">

      {/* =================================================
          PAGE HEADER
      ================================================= */}

      <div className="accounts-heading">

        <div>
          <span>ACCOUNT INVENTORY</span>

          <h1>Accounts</h1>

          <p>
            Manage your marketplace account
            inventory and customer purchases.
          </p>
        </div>

        <button
          type="button"
          className="add-account-button"
          onClick={openAddForm}
        >
          <FiPlus />
          Add Account
        </button>

      </div>

      {/* =================================================
          STATISTICS
      ================================================= */}

      <div className="accounts-stats">

        <div className="accounts-stat-card">

          <div className="accounts-stat-icon">
            <FiBox />
          </div>

          <div>
            <span>Total Accounts</span>
            <strong>
              {statistics.total}
            </strong>
          </div>

        </div>

        <div className="accounts-stat-card">

          <div className="accounts-stat-icon">
            <FiCheckCircle />
          </div>

          <div>
            <span>Available</span>
            <strong>
              {statistics.available}
            </strong>
          </div>

        </div>

        <div className="accounts-stat-card">

          <div className="accounts-stat-icon">
            <FiPackage />
          </div>

          <div>
            <span>Sold</span>
            <strong>
              {statistics.sold}
            </strong>
          </div>

        </div>

        <div className="accounts-stat-card">

          <div className="accounts-stat-icon">
            <FiUsers />
          </div>

          <div>
            <span>Customer Orders</span>
            <strong>
              {customerPurchases.length}
            </strong>
          </div>

        </div>

        <div className="accounts-stat-card">

          <div className="accounts-stat-icon">
            <FiShield />
          </div>

          <div>
            <span>Inventory Value</span>
            <strong>
              $
              {formatMoney(
                statistics.inventoryValue
              )}
            </strong>
          </div>

        </div>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="accounts-toolbar">

        <div className="accounts-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search by name, username or platform..."
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              title="Clear search"
            >
              <FiX />
            </button>
          )}

        </div>

        <div className="accounts-filter">

          <FiFilter />

          <select
            value={platformFilter}
            onChange={(event) =>
              setPlatformFilter(
                event.target.value
              )
            }
          >
            <option value="all">
              All Platforms
            </option>

            <option value="google">
              Google
            </option>

            <option value="instagram">
              Instagram
            </option>

            <option value="facebook">
              Facebook
            </option>

            <option value="twitter / x">
              Twitter / X
            </option>

            <option value="tiktok">
              TikTok
            </option>
          </select>

        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value
            )
          }
        >
          <option value="all">
            All Statuses
          </option>

          <option value="available">
            Available
          </option>

          <option value="sold">
            Sold
          </option>

          <option value="reserved">
            Reserved
          </option>

          <option value="disabled">
            Disabled
          </option>
        </select>

        <button
          type="button"
          className="refresh-accounts-button"
          onClick={() => {
            const savedAccounts =
              readStorageArray(
                ACCOUNTS_STORAGE_KEY
              );

            if (
              savedAccounts.length > 0
            ) {
              setAccounts(
                savedAccounts
              );
            }

            loadPurchases();
          }}
          title="Refresh"
        >
          <FiRefreshCw />
        </button>

      </div>

      {/* =================================================
          INVENTORY TABLE
      ================================================= */}

      <div className="accounts-table-section">

        <div className="accounts-table-header">

          <div>
            <span>INVENTORY</span>

            <h2>
              Marketplace Accounts
            </h2>
          </div>

          <strong>
            {filteredAccounts.length}{" "}
            {filteredAccounts.length === 1
              ? "Account"
              : "Accounts"}
          </strong>

        </div>

        <div className="accounts-table-wrapper">

          <table className="accounts-table">

            <thead>
              <tr>
                <th>Account</th>
                <th>Platform</th>
                <th>Username</th>
                <th>Price</th>
                <th>Status</th>
                <th>Added</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {filteredAccounts.length > 0 ? (
                filteredAccounts.map(
                  (account) => (

                    <tr key={account.id}>

                      <td>

                        <div className="account-name">

                          {account.image ? (
                            <img
                              src={account.image}
                              alt={
                                account.name ||
                                "Account"
                              }
                              className="account-table-image"
                            />
                          ) : (
                            <div className="account-placeholder">
                              {String(
                                account.platform ||
                                  "A"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>
                          )}

                          <div>
                            <strong>
                              {account.name ||
                                "Unnamed Account"}
                            </strong>

                            <small>
                              {account.id}
                            </small>
                          </div>

                        </div>

                      </td>

                      <td>
                        <span className="platform-badge">
                          {account.platform ||
                            "Unknown"}
                        </span>
                      </td>

                      <td>
                        {account.username ||
                          "Not provided"}
                      </td>

                      <td>
                        <strong>
                          $
                          {formatMoney(
                            account.price
                          )}
                        </strong>
                      </td>

                      <td>

                        <select
                          className={`account-status-select ${getStatusClass(
                            account.status
                          )}`}
                          value={
                            account.status ||
                            "Available"
                          }
                          onChange={(event) =>
                            updateAccountStatus(
                              account.id,
                              event.target.value
                            )
                          }
                        >
                          <option>
                            Available
                          </option>

                          <option>
                            Sold
                          </option>

                          <option>
                            Reserved
                          </option>

                          <option>
                            Disabled
                          </option>
                        </select>

                      </td>

                      <td>
                        {formatDate(
                          account.createdAt
                        )}
                      </td>

                      <td>

                        <div className="account-actions">

                          <button
                            type="button"
                            title="Edit Account"
                            onClick={() =>
                              openEditForm(
                                account
                              )
                            }
                          >
                            <FiEdit2 />
                          </button>

                          <button
                            type="button"
                            title="Delete Account"
                            onClick={() =>
                              deleteAccount(
                                account.id
                              )
                            }
                          >
                            <FiTrash2 />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )
              ) : (

                <tr>
                  <td
                    colSpan="7"
                    className="accounts-empty"
                  >
                    <FiAlertCircle />

                    <strong>
                      No accounts found
                    </strong>

                    <span>
                      Try changing your
                      search or filters.
                    </span>
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          CUSTOMER PURCHASES
      ================================================= */}

      <div className="customer-purchases-section">

        <div className="accounts-table-header">

          <div>
            <span>CUSTOMER ORDERS</span>

            <h2>
              Purchased Accounts
            </h2>

            <p>
              Review customer purchases and
              manage fulfillment status.
            </p>
          </div>

          <strong>
            {customerPurchases.length}{" "}
            {customerPurchases.length === 1
              ? "Purchase"
              : "Purchases"}
          </strong>

        </div>

        <div className="accounts-table-wrapper">

          <table className="accounts-table">

            <thead>
              <tr>
                <th>Customer</th>
                <th>Account</th>
                <th>Username</th>
                <th>Order ID</th>
                <th>Price</th>
                <th>Payment</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {customerPurchases.length > 0 ? (
                customerPurchases.map(
                  (purchase, index) => {

                    const purchaseId =
                      purchase.purchaseId ||
                      purchase.id ||
                      `purchase-${index}`;

                    const status =
                      purchase.status ||
                      "Pending";

                    const paymentStatus =
                      purchase.paymentStatus ||
                      "Paid";

                    const customerName =
                      purchase.customerName ||
                      purchase.name ||
                      "Customer";

                    const customerEmail =
                      purchase.customerEmail ||
                      purchase.email ||
                      "";

                    return (
                      <tr
                        key={purchaseId}
                      >

                        <td>

                          <div className="account-name">

                            <div className="account-placeholder">
                              {customerName
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {customerName}
                              </strong>

                              {customerEmail && (
                                <small>
                                  {customerEmail}
                                </small>
                              )}
                            </div>

                          </div>

                        </td>

                        <td>

                          <strong>
                            {purchase.productName ||
                              purchase.name ||
                              "Account"}
                          </strong>

                        </td>

                        <td>
                          {purchase.username ||
                            "Pending"}
                        </td>

                        <td>
                          #
                          {String(
                            purchase.orderId ||
                              purchaseId
                          ).split(".")[0]}
                        </td>

                        <td>
                          <strong>
                            $
                            {formatMoney(
                              purchase.price
                            )}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={`account-status ${getStatusClass(
                              paymentStatus
                            )}`}
                          >
                            {paymentStatus}
                          </span>
                        </td>

                        <td>

                          <select
                            className={`account-status-select ${getStatusClass(
                              status
                            )}`}
                            value={status}
                            onChange={(event) =>
                              updatePurchaseStatus(
                                purchaseId,
                                event.target.value
                              )
                            }
                          >
                            <option>
                              Pending
                            </option>

                            <option>
                              Processing
                            </option>

                            <option>
                              Shipped
                            </option>

                            <option>
                              Completed
                            </option>

                            <option>
                              Cancelled
                            </option>
                          </select>

                        </td>

                        <td>

                          <button
                            type="button"
                            className="view-purchase-button"
                            onClick={() =>
                              openPurchaseDetails(
                                purchase
                              )
                            }
                            title="View Purchase"
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
                    colSpan="8"
                    className="accounts-empty"
                  >
                    <FiPackage />

                    <strong>
                      No customer purchases yet
                    </strong>

                    <span>
                      Completed account orders
                      will appear here.
                    </span>

                  </td>

                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>

      {/* =================================================
          ADD / EDIT ACCOUNT MODAL
      ================================================= */}

      {showForm && (

        <div
          className="account-modal-overlay"
          onClick={closeForm}
        >

          <div
            className="account-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="account-modal-header">

              <div>

                <span>
                  ACCOUNT INVENTORY
                </span>

                <h2>
                  {editingAccount
                    ? "Edit Account"
                    : "Add Account"}
                </h2>

                <p>
                  {editingAccount
                    ? "Update the account information below."
                    : "Add a new account to your marketplace inventory."}
                </p>

              </div>

              <button
                type="button"
                onClick={closeForm}
                title="Close"
              >
                <FiX />
              </button>

            </div>

            <form
              className="account-form"
              onSubmit={handleSubmit}
            >

              <div className="account-form-row">

                <div className="account-form-group">

                  <label>
                    Platform
                  </label>

                  <select
                    name="platform"
                    value={form.platform}
                    onChange={handleChange}
                  >
                    <option>
                      Google
                    </option>

                    <option>
                      Instagram
                    </option>

                    <option>
                      Facebook
                    </option>

                    <option>
                      Twitter / X
                    </option>

                    <option>
                      TikTok
                    </option>
                  </select>

                </div>

                <div className="account-form-group">

                  <label>
                    Account Name
                  </label>

                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="e.g. Premium Instagram"
                    required
                  />

                </div>

              </div>

              {/* IMAGE */}

              <div className="account-form-group">

                <label>
                  Account Image
                  <span className="optional-label">
                    Optional
                  </span>
                </label>

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                />

                {form.image && (

                  <div className="account-image-preview">

                    <img
                      src={form.image}
                      alt="Account preview"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setForm(
                          (current) => ({
                            ...current,
                            image: "",
                          })
                        )
                      }
                    >
                      <FiX />
                      Remove Image
                    </button>

                  </div>

                )}

              </div>

              {/* USERNAME */}

              <div className="account-form-group">

                <label>
                  Username / Email
                </label>

                <input
                  type="text"
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="Account username or email"
                  required
                />

              </div>

              {/* PASSWORD + PRICE */}

              <div className="account-form-row">

                <div className="account-form-group">

                  <label>
                    Password
                  </label>

                  <div className="password-input-wrapper">

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      name="password"
                      value={form.password}
                      onChange={
                        handleChange
                      }
                      placeholder={
                        editingAccount
                          ? "Leave blank to keep current"
                          : "Account password"
                      }
                      required={
                        !editingAccount
                      }
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) =>
                            !current
                        )
                      }
                      title={
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

                  <small className="form-security-note">
                    Sensitive credentials should
                    ultimately be stored securely on
                    the server, not in browser storage.
                  </small>

                </div>

                <div className="account-form-group">

                  <label>
                    Price ($)
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="25"
                    min="0"
                    step="0.01"
                    required
                  />

                </div>

              </div>

              {/* STATUS */}

              <div className="account-form-group">

                <label>
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option>
                    Available
                  </option>

                  <option>
                    Sold
                  </option>

                  <option>
                    Reserved
                  </option>

                  <option>
                    Disabled
                  </option>
                </select>

              </div>

              {/* ACTIONS */}

              <div className="account-form-actions">

                <button
                  type="button"
                  className="cancel-account"
                  onClick={closeForm}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="save-account"
                >
                  {editingAccount ? (
                    <>
                      <FiEdit2 />
                      Save Changes
                    </>
                  ) : (
                    <>
                      <FiPlus />
                      Add Account
                    </>
                  )}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* =================================================
          PURCHASE DETAILS MODAL
      ================================================= */}

      {showPurchaseDetails &&
        selectedPurchase && (

          <div
            className="account-modal-overlay"
            onClick={
              closePurchaseDetails
            }
          >

            <div
              className="account-modal purchase-details-modal"
              onClick={(event) =>
                event.stopPropagation()
              }
            >

              <div className="account-modal-header">

                <div>

                  <span>
                    CUSTOMER ORDER
                  </span>

                  <h2>
                    Purchase Details
                  </h2>

                  <p>
                    Review the customer
                    purchase information.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closePurchaseDetails
                  }
                >
                  <FiX />
                </button>

              </div>

              <div className="purchase-details">

                <div className="purchase-detail-row">

                  <span>
                    Customer
                  </span>

                  <strong>
                    {selectedPurchase.customerName ||
                      "Customer"}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Email
                  </span>

                  <strong>
                    {selectedPurchase.customerEmail ||
                      selectedPurchase.email ||
                      "Not provided"}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Customer ID
                  </span>

                  <strong>
                    {selectedPurchase.customerId ||
                      "Not available"}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Product
                  </span>

                  <strong>
                    {selectedPurchase.productName ||
                      selectedPurchase.name ||
                      "Account"}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Username
                  </span>

                  <strong>
                    {selectedPurchase.username ||
                      "Pending"}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Order ID
                  </span>

                  <strong>
                    #
                    {String(
                      selectedPurchase.purchaseId ||
                        selectedPurchase.orderId ||
                        selectedPurchase.id ||
                        ""
                    ).split(".")[0]}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Amount
                  </span>

                  <strong>
                    $
                    {formatMoney(
                      selectedPurchase.price
                    )}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Payment
                  </span>

                  <strong>
                    {selectedPurchase.paymentStatus ||
                      "Paid"}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Purchased
                  </span>

                  <strong>
                    {formatDate(
                      selectedPurchase.purchasedAt
                    )}
                  </strong>

                </div>

                <div className="purchase-detail-status">

                  <label>
                    Fulfillment Status
                  </label>

                  <select
                    value={
                      selectedPurchase.status ||
                      "Pending"
                    }
                    onChange={(event) =>
                      updatePurchaseStatus(
                        selectedPurchase.purchaseId ||
                          selectedPurchase.id,
                        event.target.value
                      )
                    }
                  >
                    <option>
                      Pending
                    </option>

                    <option>
                      Processing
                    </option>

                    <option>
                      Shipped
                    </option>

                    <option>
                      Completed
                    </option>

                    <option>
                      Cancelled
                    </option>
                  </select>

                </div>

              </div>

              <div className="account-form-actions">

                <button
                  type="button"
                  className="cancel-account"
                  onClick={
                    closePurchaseDetails
                  }
                >
                  Close
                </button>

              </div>

            </div>

          </div>

        )}

    </div>
  );
}

export default Accounts;