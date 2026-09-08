import { useEffect, useState, useMemo } from "react";
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
   API
========================================================= */

const API_URL =
  `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api`;

/* =========================================================
   ACCOUNT CATEGORIES
========================================================= */

const ACCOUNT_CATEGORIES = {
  "Chat Moderation": [
    "Cloudworkers",
    "The Texting Factory",
    "Muzio",
    "E-Moderators",
    "Chatwork",
  ],
  "AI Training": [
    "Handshake",
    "Outlier",
    "Snorkel",
    "Mindrift",
    "Remotasks",
  ],
  Surveys: [
    "Prolific",
    "CloudResearch Connect",
  ],
  "Academic Writing": [
    "Atlantic Writers",
    "Academia-Research",
    "Writers Hub",
    "Writedom",
    "WriterBay",
    "StudyPool",
  ],
  Transcription: [
    "GoTranscript",
    "TranscribeMe",
    "Scribie",
  ],
};

const LEGACY_PLATFORMS = [
  "Google",
  "Instagram",
  "Facebook",
  "Twitter / X",
  "TikTok",
];

const ACCOUNT_PLATFORMS = Object.values(ACCOUNT_CATEGORIES).flat();

const getCategoryForPlatform = (platform) => {
  const value = String(platform || "").trim();

  for (const [category, platforms] of Object.entries(
    ACCOUNT_CATEGORIES
  )) {
    if (platforms.includes(value)) {
      return category;
    }
  }

  return "Other";
};

const getPlatformsForCategory = (category) => {
  if (ACCOUNT_CATEGORIES[category]) {
    return ACCOUNT_CATEGORIES[category];
  }

  return LEGACY_PLATFORMS;
};

/* =========================================================
   EMPTY FORM
========================================================= */

const emptyForm = {
  category: "Chat Moderation",
  platform: "Cloudworkers",
  name: "",
  username: "",
  password: "",
  price: "",
  status: "Available",
  image: "",
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
  const [accounts, setAccounts] = useState([]);

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
     LOAD DATABASE DATA
  ======================================================= */

  const getProductIdentifier = (product) =>
    product?._id ||
    product?.productId ||
    product?.id ||
    "";

  const getAccountStatus = (account) => {
    const storedStatus =
      account?.metadata?.accountStatus ||
      account?.status;

    if (storedStatus) {
      return storedStatus;
    }

    return Number(account?.stock || 0) > 0
      ? "Available"
      : "Sold";
  };

  const normalizeAccount = (product) => ({
    ...product,
    id:
      product?._id ||
      product?.productId ||
      product?.id,
    category:
      product?.metadata?.accountCategory ||
      product?.accountCategory ||
      getCategoryForPlatform(
        product?.metadata?.platform ||
          product?.platform
      ),
    platform:
      product?.metadata?.platform ||
      product?.platform ||
      "Unknown",
    username:
      product?.metadata?.username ||
      product?.username ||
      "",
    password:
      product?.metadata?.password ||
      product?.password ||
      "",
    status: getAccountStatus(product),
    image:
      product?.image ||
      product?.images?.[0] ||
      "",
  });

  const loadAccounts = async () => {
    try {
      const response = await fetch(
        `${API_URL}/products?category=accounts`
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load accounts."
        );
      }

      const databaseAccounts =
        Array.isArray(data.products)
          ? data.products
              .filter(
                (product) =>
                  String(
                    product?.category || ""
                  ).toLowerCase() ===
                  "accounts"
              )
              .map(normalizeAccount)
          : [];

      setAccounts(databaseAccounts);
    } catch (error) {
      console.error(
        "Load accounts error:",
        error
      );

      setAccounts([]);

      throw error;
    }
  };

  const loadPurchases = async () => {
    try {
      const response = await fetch(
        `${API_URL}/payments/orders`
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to load customer orders."
        );
      }

      const orders =
        Array.isArray(data.orders)
          ? data.orders
          : [];

      const accountOrders =
        orders.filter((order) => {
          const items = Array.isArray(
            order?.items
          )
            ? order.items
            : [];

          return items.some((item) => {
            const category = String(
              item?.category ||
                item?.productCategory ||
                item?.type ||
                ""
            )
              .trim()
              .toLowerCase();

            return (
              category === "account" ||
              category === "accounts"
            );
          });
        });

      setCustomerPurchases(
        accountOrders
      );
    } catch (error) {
      console.error(
        "Load customer orders error:",
        error
      );

      setCustomerPurchases([]);
    }
  };

  /* =======================================================
     REFRESH DATA
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      try {
        await Promise.all([
          loadAccounts(),
          loadPurchases(),
        ]);
      } catch {
        if (cancelled) return;
      }
    };

    refresh();

    const interval = setInterval(
      refresh,
      10000
    );

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

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

      const category = String(
        account.category || getCategoryForPlatform(account.platform)
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        name.includes(searchValue) ||
        username.includes(searchValue) ||
        platform.includes(searchValue) ||
        category.includes(searchValue);

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
      category:
        account.category ||
        account.metadata?.accountCategory ||
        getCategoryForPlatform(
          account.platform ||
            account.metadata?.platform
        ),
      platform:
        account.platform ||
        account.metadata?.platform ||
        getPlatformsForCategory(
          account.category ||
            account.metadata?.accountCategory ||
            "Other"
        )[0],
      name: account.name || "",
      username:
        account.username ||
        account.metadata?.username ||
        "",
      password: "",
      price: account.price ?? "",
      status:
        getAccountStatus(account),
      image:
        account.image ||
        account.images?.[0] ||
        "",
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

    if (name === "category") {
      const platforms = getPlatformsForCategory(value);

      setForm((current) => ({
        ...current,
        category: value,
        platform: platforms[0] || "",
      }));

      return;
    }

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

  const handleSubmit = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const username = form.username.trim();
    const password = form.password.trim();
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

    if (!editingAccount && !password) {
      alert(
        "Please enter the account password."
      );
      return;
    }

    const category =
      form.category ||
      getCategoryForPlatform(
        form.platform
      );

    const platform =
      form.platform || "";

    const status =
      form.status || "Available";

    const existingMetadata =
      editingAccount?.metadata &&
      typeof editingAccount.metadata ===
        "object"
        ? editingAccount.metadata
        : {};

    const metadata = {
      ...existingMetadata,
      accountCategory: category,
      platform,
      username,
      accountStatus: status,
    };

    if (password) {
      metadata.password = password;
    }

    const slugBase =
      `${name}-${platform}`
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          "");

    const payload = {
      name,
      description:
        `${name} - ${platform} account`,
      category: "accounts",
      price,
      currency: "USD",
      image: form.image || "",
      images: form.image
        ? [form.image]
        : [],
      stock:
        normalizeStatus(status) ===
        "available"
          ? 1
          : 0,
      unlimitedStock: false,
      featured: false,
      deliveryType: "digital",
      metadata,
    };

    try {
      let response;

      if (editingAccount) {
        const identifier =
          getProductIdentifier(
            editingAccount
          );

        if (!identifier) {
          throw new Error(
            "Unable to identify the account."
          );
        }

        response = await fetch(
          `${API_URL}/products/${encodeURIComponent(
            identifier
          )}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              ...payload,
              // Keep the existing slug so
              // editing never creates a
              // duplicate-slug error.
              slug:
                editingAccount.slug ||
                slugBase,
            }),
          }
        );
      } else {
        response = await fetch(
          `${API_URL}/products`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              ...payload,
              slug: slugBase,
            }),
          }
        );
      }

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to save account."
        );
      }

      await loadAccounts();
      closeForm();

      alert(
        editingAccount
          ? "Account updated successfully."
          : "Account added successfully."
      );
    } catch (error) {
      console.error(
        "Save account error:",
        error
      );

      alert(
        error.message ||
          "Unable to save the account. Please try again."
      );
    }
  };

  /* =======================================================
     DELETE ACCOUNT
  ======================================================= */

  const deleteAccount = async (id) => {
    const account = accounts.find(
      (item) =>
        String(
          getProductIdentifier(item)
        ) === String(id)
    );

    if (!account) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${account.name}" from the marketplace inventory?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const identifier =
        getProductIdentifier(account);

      if (!identifier) {
        throw new Error(
          "Unable to identify the account."
        );
      }

      const response = await fetch(
        `${API_URL}/products/${encodeURIComponent(
          identifier
        )}`,
        {
          method: "DELETE",
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to delete account."
        );
      }

      await loadAccounts();

      alert(
        "Account removed successfully."
      );
    } catch (error) {
      console.error(
        "Delete account error:",
        error
      );

      alert(
        error.message ||
          "Unable to delete the account. Please try again."
      );
    }
  };

  /* =======================================================
     UPDATE ACCOUNT STATUS
  ======================================================= */

  const updateAccountStatus = async (
    id,
    status
  ) => {
    const account = accounts.find(
      (item) =>
        String(
          getProductIdentifier(item)
        ) === String(id)
    );

    if (!account) {
      return;
    }

    try {
      const identifier =
        getProductIdentifier(account);

      const metadata =
        account.metadata &&
        typeof account.metadata ===
          "object"
          ? account.metadata
          : {};

      const response = await fetch(
        `${API_URL}/products/${encodeURIComponent(
          identifier
        )}`,
        {
          method: "PUT",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            stock:
              normalizeStatus(status) ===
              "available"
                ? 1
                : 0,
            metadata: {
              ...metadata,
              accountStatus: status,
            },
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to update account status."
        );
      }

      await loadAccounts();
    } catch (error) {
      console.error(
        "Update account status error:",
        error
      );

      alert(
        error.message ||
          "Unable to update the account status."
      );

      await loadAccounts();
    }
  };

  /* =======================================================
     PURCHASE STATUS
  ======================================================= */

  const updatePurchaseStatus = async (
    purchaseId,
    status
  ) => {
    const normalizedStatus =
      String(status || "")
        .trim()
        .toLowerCase();

    try {
      const response = await fetch(
        `${API_URL}/payments/orders/${encodeURIComponent(
          purchaseId
        )}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            status:
              normalizedStatus,
          }),
        }
      );

      let data;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The server returned an invalid response."
        );
      }

      if (!response.ok || !data?.success) {
        throw new Error(
          data?.message ||
            "Unable to update order status."
        );
      }

      await loadPurchases();

      setSelectedPurchase(
        (current) =>
          current
            ? {
                ...current,
                status:
                  normalizedStatus,
              }
            : null
      );
    } catch (error) {
      console.error(
        "Update purchase status error:",
        error
      );

      alert(
        error.message ||
          "Unable to update the purchase status."
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
            placeholder="Search by name, username, platform or category..."
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

            {Object.entries(ACCOUNT_CATEGORIES).map(
              ([category, platforms]) => (
                <optgroup
                  key={category}
                  label={category}
                >
                  {platforms.map((platform) => (
                    <option
                      key={platform}
                      value={platform.toLowerCase()}
                    >
                      {platform}
                    </option>
                  ))}
                </optgroup>
              )
            )}

            <optgroup label="Legacy / Other">
              {LEGACY_PLATFORMS.map((platform) => (
                <option
                  key={platform}
                  value={platform.toLowerCase()}
                >
                  {platform}
                </option>
              ))}
            </optgroup>
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
            loadAccounts();
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
                <th>Category</th>
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

                    <tr key={getProductIdentifier(account)}>

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
                          {account.category ||
                            getCategoryForPlatform(account.platform)}
                        </span>
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
                              getProductIdentifier(account),
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
                                getProductIdentifier(account)
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
                    colSpan="8"
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

                    const purchaseItem =
                      Array.isArray(purchase?.items)
                        ? purchase.items.find((item) => {
                            const category = String(
                              item?.category ||
                                item?.productCategory ||
                                item?.type ||
                                ""
                            )
                              .trim()
                              .toLowerCase();

                            return (
                              category === "account" ||
                              category === "accounts"
                            );
                          }) || purchase.items[0]
                        : null;

                    const purchaseId =
                      purchase.orderId ||
                      purchase.id ||
                      `purchase-${index}`;

                    const status =
                      purchase.status ||
                      "pending";

                    const paymentStatus =
                      purchase.paymentStatus ||
                      purchase.payment?.status ||
                      "pending";

                    const customerName =
                      purchase.customer?.name ||
                      "Customer";

                    const customerEmail =
                      purchase.customer?.email ||
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
                            {purchaseItem?.name ||
                              purchaseItem?.productName ||
                              "Account"}
                          </strong>

                        </td>

                        <td>
                          {purchaseItem?.metadata?.username ||
                            purchaseItem?.username ||
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
                              purchaseItem?.priceUSD ??
                                purchase.totalUSD
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
                            <option value="pending">
                              Pending
                            </option>

                            <option value="processing">
                              Processing
                            </option>

                            <option value="shipped">
                              Shipped
                            </option>

                            <option value="completed">
                              Completed
                            </option>

                            <option value="cancelled">
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
                    Category
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {Object.keys(ACCOUNT_CATEGORIES).map(
                      (category) => (
                        <option
                          key={category}
                          value={category}
                        >
                          {category}
                        </option>
                      )
                    )}

                    <option value="Other">
                      Other / Legacy
                    </option>
                  </select>

                </div>

                <div className="account-form-group">

                  <label>
                    Platform
                  </label>

                  <select
                    name="platform"
                    value={form.platform}
                    onChange={handleChange}
                  >
                    {getPlatformsForCategory(
                      form.category
                    ).map((platform) => (
                      <option
                        key={platform}
                        value={platform}
                      >
                        {platform}
                      </option>
                    ))}
                  </select>

                </div>

              </div>

              <div className="account-form-row">

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
                    {selectedPurchase.customer?.name ||
                      "Customer"}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Email
                  </span>

                  <strong>
                    {selectedPurchase.customer?.email ||
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
                    {selectedPurchase.items?.[0]?.name ||
                      selectedPurchase.items?.[0]?.productName ||
                      "Account"}
                  </strong>

                </div>

                <div className="purchase-detail-row">

                  <span>
                    Username
                  </span>

                  <strong>
                    {selectedPurchase.items?.[0]?.metadata?.username ||
                      selectedPurchase.items?.[0]?.username ||
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
                      (selectedPurchase.items?.[0]?.priceUSD ??
                      selectedPurchase.totalUSD)
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
                      selectedPurchase.createdAt
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
                        selectedPurchase.orderId ||
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