import { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiMail,
  FiTrash2,
  FiEye,
  FiX,
  FiCheck,
  FiMessageCircle,
  FiSend,
  FiExternalLink,
  FiShield,
  FiUser,
  FiHash,
} from "react-icons/fi";

import "./Messages.css";

const STORAGE_KEY = "accountBazaarMessages";
const CUSTOMER_STORAGE_KEY = "accountBazaarCustomer";

const defaultMessages = [
  {
    id: 1,
    customerId: "CUS-1001",
    customerName: "John Doe",
    customerEmail: "john@example.com",
    subject: "Account purchase question",
    message:
      "Hi, I would like to know if the Instagram account is still available before purchasing.",
    date: new Date().toISOString(),
    read: false,
    replies: [],
  },
  {
    id: 2,
    customerId: "CUS-1002",
    customerName: "Sarah Kim",
    customerEmail: "sarah@example.com",
    subject: "Payment confirmation",
    message:
      "I have completed the payment for my account. Please confirm that my order has been received.",
    date: new Date(Date.now() - 86400000).toISOString(),
    read: true,
    replies: [],
  },
  {
    id: 3,
    customerId: "CUS-1003",
    customerName: "Michael Smith",
    customerEmail: "michael@example.com",
    subject: "Service inquiry",
    message:
      "I am interested in your social media management service. Can you provide more details?",
    date: new Date(Date.now() - 172800000).toISOString(),
    read: false,
    replies: [],
  },
];

/* =========================================================
   NORMALIZE MESSAGE
========================================================= */

const normalizeMessage = (message, index = 0) => {
  const replies = Array.isArray(message?.replies)
    ? message.replies
    : [];

  return {
    ...message,

    id:
      message?.id ??
      message?.messageId ??
      `MSG-${Date.now()}-${index}`,

    customerId:
      message?.customerId ||
      message?.customer?.customerId ||
      "",

    customerName:
      message?.customerName ||
      message?.customer?.name ||
      message?.customer?.fullName ||
      "Customer",

    customerEmail:
      message?.customerEmail ||
      message?.email ||
      message?.customer?.email ||
      "",

    subject:
      message?.subject ||
      "No Subject",

    message:
      message?.message ||
      "",

    date:
      message?.date ||
      message?.createdAt ||
      new Date().toISOString(),

    read:
      Boolean(message?.read),

    replies: replies.map((reply, replyIndex) => ({
      ...reply,

      id:
        reply?.id ??
        `REPLY-${Date.now()}-${replyIndex}`,

      sender:
        reply?.sender ||
        "Admin",

      message:
        reply?.message ||
        "",

      date:
        reply?.date ||
        new Date().toISOString(),

      customerId:
        reply?.customerId ||
        message?.customerId ||
        "",
    })),
  };
};

/* =========================================================
   CUSTOMER IDENTITY HELPERS
========================================================= */

const normalizeIdentity = (identity) => {
  if (!identity) {
    return null;
  }

  return {
    customerId: String(
      identity.customerId || ""
    )
      .trim()
      .toLowerCase(),

    name:
      identity.name ||
      identity.fullName ||
      "Customer",

    email: String(
      identity.email ||
      identity.customerEmail ||
      ""
    )
      .trim()
      .toLowerCase(),
  };
};

const getMessageCustomerKey = (message) => {
  const customerId = String(
    message?.customerId || ""
  )
    .trim()
    .toLowerCase();

  const email = String(
    message?.customerEmail ||
    message?.email ||
    ""
  )
    .trim()
    .toLowerCase();

  if (customerId) {
    return `id:${customerId}`;
  }

  if (email) {
    return `email:${email}`;
  }

  return `message:${message?.id || ""}`;
};

/* =========================================================
   COMPONENT
========================================================= */

function Messages() {
  /* =======================================================
     CUSTOMER IDENTITY
  ======================================================= */

  const [customerIdentity, setCustomerIdentity] =
    useState(() => {
      try {
        const saved = localStorage.getItem(
          CUSTOMER_STORAGE_KEY
        );

        if (!saved) {
          return null;
        }

        return normalizeIdentity(
          JSON.parse(saved)
        );
      } catch (error) {
        console.error(
          "Failed to load customer identity:",
          error
        );

        return null;
      }
    });

  /* =======================================================
     MESSAGES
  ======================================================= */

  const [messages, setMessages] = useState(() => {
    try {
      const saved =
        localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (Array.isArray(parsed)) {
          return parsed.map(normalizeMessage);
        }
      }

      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(defaultMessages)
      );

      return defaultMessages.map(normalizeMessage);
    } catch (error) {
      console.error(
        "Failed to load messages:",
        error
      );

      return defaultMessages.map(normalizeMessage);
    }
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");

  const [selectedMessage, setSelectedMessage] =
    useState(null);

  const [replyText, setReplyText] = useState("");

  /* =======================================================
     LOAD CUSTOMER IDENTITY
  ======================================================= */

  useEffect(() => {
    const loadIdentity = () => {
      try {
        const saved = localStorage.getItem(
          CUSTOMER_STORAGE_KEY
        );

        if (!saved) {
          setCustomerIdentity(null);
          return;
        }

        setCustomerIdentity(
          normalizeIdentity(
            JSON.parse(saved)
          )
        );
      } catch (error) {
        console.error(
          "Failed to reload customer identity:",
          error
        );

        setCustomerIdentity(null);
      }
    };

    loadIdentity();

    window.addEventListener(
      "storage",
      loadIdentity
    );

    const interval = setInterval(
      loadIdentity,
      1000
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadIdentity
      );

      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     SAVE MESSAGES
  ======================================================= */

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages)
      );
    } catch (error) {
      console.error(
        "Failed to save messages:",
        error
      );
    }
  }, [messages]);

  /* =======================================================
     SYNC MESSAGES
  ======================================================= */

  useEffect(() => {
    const loadMessages = () => {
      try {
        const saved =
          localStorage.getItem(STORAGE_KEY);

        if (!saved) {
          setMessages([]);
          return;
        }

        const parsed = JSON.parse(saved);

        if (!Array.isArray(parsed)) {
          setMessages([]);
          return;
        }

        setMessages(
          parsed.map(normalizeMessage)
        );
      } catch (error) {
        console.error(
          "Failed to reload messages:",
          error
        );
      }
    };

    window.addEventListener(
      "storage",
      loadMessages
    );

    const interval = setInterval(
      loadMessages,
      1000
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadMessages
      );

      clearInterval(interval);
    };
  }, []);

  /* =======================================================
     KEEP OPEN CONVERSATION SYNCHRONIZED
  ======================================================= */

  useEffect(() => {
    if (!selectedMessage) {
      return;
    }

    const latestMessage = messages.find(
      (message) =>
        String(message.id) ===
        String(selectedMessage.id)
    );

    if (
      latestMessage &&
      JSON.stringify(latestMessage) !==
        JSON.stringify(selectedMessage)
    ) {
      setSelectedMessage(latestMessage);
    }
  }, [messages, selectedMessage]);

  /* =======================================================
     CUSTOMER IDENTITY SUMMARY
  ======================================================= */

  const customerIdentityLabel = useMemo(() => {
    if (!customerIdentity) {
      return "All Customers";
    }

    return (
      customerIdentity.name ||
      customerIdentity.email ||
      "Customer"
    );
  }, [customerIdentity]);

  /* =======================================================
     SEARCH + FILTER
  ======================================================= */

  const filteredMessages = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return messages
      .filter((message) => {
        const searchableText = [
          message.customerName,
          message.customerEmail,
          message.customerId,
          message.subject,
          message.message,
          ...(message.replies || []).map(
            (reply) => reply.message
          ),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        const matchesSearch =
          !query ||
          searchableText.includes(query);

        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "unread" &&
            !message.read) ||
          (statusFilter === "read" &&
            message.read);

        return (
          matchesSearch &&
          matchesStatus
        );
      })
      .sort(
        (a, b) =>
          new Date(b.date).getTime() -
          new Date(a.date).getTime()
      );
  }, [messages, search, statusFilter]);

  /* =======================================================
     MESSAGE STATISTICS
  ======================================================= */

  const unreadCount = useMemo(
    () =>
      messages.filter(
        (message) => !message.read
      ).length,
    [messages]
  );

  const customerCount = useMemo(() => {
    const customers = new Set();

    messages.forEach((message) => {
      customers.add(
        getMessageCustomerKey(message)
      );
    });

    return customers.size;
  }, [messages]);

  const replyCount = useMemo(
    () =>
      messages.reduce(
        (total, message) =>
          total +
          (message.replies?.length || 0),
        0
      ),
    [messages]
  );

  /* =======================================================
     DATE FORMATTERS
  ======================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);

    if (
      Number.isNaN(
        messageDate.getTime()
      )
    ) {
      return "";
    }

    return messageDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
  };

  const formatDateTime = (date) => {
    if (!date) {
      return "";
    }

    const messageDate = new Date(date);

    if (
      Number.isNaN(
        messageDate.getTime()
      )
    ) {
      return "";
    }

    return messageDate.toLocaleString(
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

  /* =======================================================
     OPEN MESSAGE
  ======================================================= */

  const openMessage = (message) => {
    const updatedMessage = {
      ...normalizeMessage(message),
      read: true,
    };

    setSelectedMessage(updatedMessage);

    setReplyText("");

    setMessages((currentMessages) =>
      currentMessages.map((item) =>
        String(item.id) ===
        String(message.id)
          ? updatedMessage
          : item
      )
    );
  };

  /* =======================================================
     CLOSE MESSAGE
  ======================================================= */

  const closeMessage = () => {
    setSelectedMessage(null);
    setReplyText("");
  };

  /* =======================================================
     TOGGLE READ
  ======================================================= */

  const toggleReadStatus = (id) => {
    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        String(message.id) === String(id)
          ? {
              ...message,
              read: !message.read,
            }
          : message
      )
    );

    setSelectedMessage((current) => {
      if (
        !current ||
        String(current.id) !== String(id)
      ) {
        return current;
      }

      return {
        ...current,
        read: !current.read,
      };
    });
  };

  /* =======================================================
     DELETE MESSAGE
  ======================================================= */

  const deleteMessage = (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this conversation?"
    );

    if (!confirmed) {
      return;
    }

    setMessages((currentMessages) =>
      currentMessages.filter(
        (message) =>
          String(message.id) !== String(id)
      )
    );

    if (
      selectedMessage &&
      String(selectedMessage.id) ===
        String(id)
    ) {
      closeMessage();
    }
  };

  /* =======================================================
     SEND ADMIN REPLY
  ======================================================= */

  const sendReply = () => {
    const text = replyText.trim();

    if (
      !text ||
      !selectedMessage
    ) {
      return;
    }

    const newReply = {
      id: `REPLY-${Date.now()}`,
      message: text,
      date: new Date().toISOString(),
      sender: "Admin",

      customerId:
        selectedMessage.customerId ||
        "",
    };

    const updatedMessage = {
      ...selectedMessage,

      read: true,

      replies: [
        ...(selectedMessage.replies || []),
        newReply,
      ],
    };

    setMessages((currentMessages) =>
      currentMessages.map((message) =>
        String(message.id) ===
        String(selectedMessage.id)
          ? updatedMessage
          : message
      )
    );

    setSelectedMessage(updatedMessage);

    setReplyText("");
  };

  /* =======================================================
     EXTERNAL EMAIL
  ======================================================= */

  const replyExternally = () => {
    const email =
      selectedMessage?.customerEmail;

    if (!email) {
      return;
    }

    const subject = `Re: ${
      selectedMessage.subject ||
      "Your message"
    }`;

    const body =
      "Hello " +
      (selectedMessage.customerName ||
        "Customer") +
      ",\n\n";

    window.location.href =
      `mailto:${email}` +
      `?subject=${encodeURIComponent(
        subject
      )}` +
      `&body=${encodeURIComponent(body)}`;
  };

  /* =======================================================
     REPLY KEYBOARD SHORTCUT
  ======================================================= */

  const handleReplyKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      (e.ctrlKey || e.metaKey)
    ) {
      e.preventDefault();
      sendReply();
    }
  };

  /* =======================================================
     CUSTOMER ID DISPLAY
  ======================================================= */

  const getCustomerIdDisplay = (message) => {
    if (message.customerId) {
      return message.customerId;
    }

    return "Identity not assigned";
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="admin-messages">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="messages-heading">

        <div>
          <span>
            CUSTOMER COMMUNICATION
          </span>

          <h1>Messages</h1>

          <p>
            Manage customer conversations,
            replies, and identity-linked
            communication.
          </p>
        </div>

        <div className="messages-summary">

          <div className="messages-summary-icon">
            <FiMail />
          </div>

          <div>
            <strong>
              {unreadCount}
            </strong>

            <span>
              Unread
            </span>
          </div>

        </div>

      </div>

      {/* =================================================
          IDENTITY SUMMARY
      ================================================= */}

      <div className="messages-identity-bar">

        <div className="messages-identity-icon">
          <FiShield />
        </div>

        <div className="messages-identity-info">

          <small>
            CUSTOMER IDENTITY SYSTEM
          </small>

          <strong>
            {customerIdentityLabel}
          </strong>

          <span>
            Messages are linked to customer
            identity using customer ID and
            email fallback.
          </span>

        </div>

        <div className="messages-identity-stats">

          <div>
            <FiUser />

            <strong>
              {customerCount}
            </strong>

            <span>
              Customers
            </span>
          </div>

          <div>
            <FiMail />

            <strong>
              {messages.length}
            </strong>

            <span>
              Conversations
            </span>
          </div>

          <div>
            <FiMessageCircle />

            <strong>
              {replyCount}
            </strong>

            <span>
              Replies
            </span>
          </div>

        </div>

      </div>

      {/* =================================================
          TOOLBAR
      ================================================= */}

      <div className="messages-toolbar">

        <div className="messages-search">

          <FiSearch />

          <input
            type="text"
            placeholder="Search customers, IDs, subjects or messages..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              aria-label="Clear search"
            >
              <FiX />
            </button>
          )}

        </div>

        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value
            )
          }
        >
          <option value="all">
            All Messages
          </option>

          <option value="unread">
            Unread
          </option>

          <option value="read">
            Read
          </option>
        </select>

      </div>

      {/* =================================================
          RESULTS SUMMARY
      ================================================= */}

      <div className="messages-results-bar">

        <span>
          Showing{" "}
          <strong>
            {filteredMessages.length}
          </strong>{" "}
          of{" "}
          <strong>
            {messages.length}
          </strong>{" "}
          conversations
        </span>

        {search && (
          <span>
            Search:{" "}
            <strong>
              "{search}"
            </strong>
          </span>
        )}

      </div>

      {/* =================================================
          TABLE
      ================================================= */}

      <div className="messages-table-wrapper">

        <table className="messages-table">

          <thead>
            <tr>
              <th>Customer</th>
              <th>Identity</th>
              <th>Subject</th>
              <th>Message</th>
              <th>Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>

            {filteredMessages.length > 0 ? (
              filteredMessages.map(
                (message) => (

                  <tr
                    key={message.id}
                    className={
                      !message.read
                        ? "unread-message"
                        : ""
                    }
                  >

                    {/* CUSTOMER */}

                    <td>

                      <div className="message-customer">

                        <div className="message-avatar">
                          {message.customerName
                            ?.charAt(0)
                            ?.toUpperCase() ||
                            "C"}
                        </div>

                        <div>

                          <strong>
                            {message.customerName ||
                              "Customer"}
                          </strong>

                          <small>
                            {message.customerEmail ||
                              "No email"}
                          </small>

                        </div>

                      </div>

                    </td>

                    {/* IDENTITY */}

                    <td>

                      <div className="message-customer-identity">

                        <FiHash />

                        <span>
                          {getCustomerIdDisplay(
                            message
                          )}
                        </span>

                      </div>

                    </td>

                    {/* SUBJECT */}

                    <td>

                      <strong className="message-subject">
                        {message.subject ||
                          "No Subject"}
                      </strong>

                    </td>

                    {/* MESSAGE */}

                    <td>

                      <span className="message-preview">
                        {message.message ||
                          "No message content"}
                      </span>

                    </td>

                    {/* DATE */}

                    <td>

                      <span className="message-date">
                        {formatDate(
                          message.date
                        )}
                      </span>

                    </td>

                    {/* STATUS */}

                    <td>

                      <span
                        className={`message-status ${
                          message.read
                            ? "read"
                            : "unread"
                        }`}
                      >
                        {message.read
                          ? "Read"
                          : "New"}
                      </span>

                    </td>

                    {/* ACTIONS */}

                    <td>

                      <div className="message-actions">

                        <button
                          type="button"
                          title="View Conversation"
                          onClick={() =>
                            openMessage(
                              message
                            )
                          }
                        >
                          <FiEye />
                        </button>

                        <button
                          type="button"
                          title={
                            message.read
                              ? "Mark as unread"
                              : "Mark as read"
                          }
                          onClick={() =>
                            toggleReadStatus(
                              message.id
                            )
                          }
                        >
                          <FiMail />
                        </button>

                        <button
                          type="button"
                          title="Delete"
                          onClick={() =>
                            deleteMessage(
                              message.id
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
                  className="messages-empty"
                >

                  <FiMail />

                  <strong>
                    No messages found
                  </strong>

                  <span>
                    Try changing your search
                    or message filter.
                  </span>

                </td>

              </tr>

            )}

          </tbody>

        </table>

      </div>

      {/* =================================================
          MESSAGE MODAL
      ================================================= */}

      {selectedMessage && (

        <div
          className="message-modal-overlay"
          onClick={closeMessage}
        >

          <div
            className="message-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="message-modal-header">

              <div>

                <span>
                  CUSTOMER CONVERSATION
                </span>

                <h2>
                  {selectedMessage.subject ||
                    "No Subject"}
                </h2>

              </div>

              <button
                type="button"
                onClick={closeMessage}
                aria-label="Close conversation"
              >
                <FiX />
              </button>

            </div>

            {/* BODY */}

            <div className="message-modal-body">

              {/* CUSTOMER IDENTITY */}

              <div className="message-customer-details">

                <div className="message-avatar large">

                  {selectedMessage.customerName
                    ?.charAt(0)
                    ?.toUpperCase() ||
                    "C"}

                </div>

                <div>

                  <strong>
                    {selectedMessage.customerName ||
                      "Customer"}
                  </strong>

                  <span>
                    {selectedMessage.customerEmail ||
                      "No email provided"}
                  </span>

                  <small>
                    <FiHash />

                    {getCustomerIdDisplay(
                      selectedMessage
                    )}
                  </small>

                </div>

                <div className="message-detail-date">

                  {formatDate(
                    selectedMessage.date
                  )}

                </div>

              </div>

              {/* ORIGINAL MESSAGE */}

              <div className="message-thread">

                <div className="message-thread-label">
                  Customer
                </div>

                <div className="message-content">

                  <p>
                    {selectedMessage.message}
                  </p>

                  <small>
                    {formatDateTime(
                      selectedMessage.date
                    )}
                  </small>

                </div>

              </div>

              {/* REPLIES */}

              {selectedMessage.replies?.length >
                0 && (

                <div className="message-replies">

                  {selectedMessage.replies.map(
                    (reply) => (

                      <div
                        className={`admin-reply ${
                          reply.sender ===
                          "Admin"
                            ? "from-admin"
                            : "from-customer"
                        }`}
                        key={reply.id}
                      >

                        <div className="message-thread-label">

                          {reply.sender ===
                          "Admin"
                            ? "Admin"
                            : "Customer"}

                        </div>

                        <div className="message-content">

                          <p>
                            {reply.message}
                          </p>

                          <small>
                            {formatDateTime(
                              reply.date
                            )}
                          </small>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

              {/* REPLY BOX */}

              <div className="message-reply-box">

                <div className="message-reply-label">

                  <FiMessageCircle />

                  Reply to{" "}

                  {selectedMessage.customerName ||
                    "customer"}

                </div>

                <textarea
                  value={replyText}
                  onChange={(e) =>
                    setReplyText(
                      e.target.value
                    )
                  }
                  onKeyDown={
                    handleReplyKeyDown
                  }
                  placeholder="Write your reply here..."
                  rows="5"
                />

                <div className="message-reply-hint">

                  Press Ctrl + Enter to send

                </div>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="message-modal-actions">

              <button
                type="button"
                className="message-secondary-button"
                onClick={() =>
                  toggleReadStatus(
                    selectedMessage.id
                  )
                }
              >

                <FiCheck />

                {selectedMessage.read
                  ? "Mark Unread"
                  : "Mark Read"}

              </button>

              <button
                type="button"
                className="message-delete-button"
                onClick={() =>
                  deleteMessage(
                    selectedMessage.id
                  )
                }
              >

                <FiTrash2 />

                Delete

              </button>

              <button
                type="button"
                className="message-external-button"
                onClick={replyExternally}
                disabled={
                  !selectedMessage.customerEmail
                }
              >

                <FiExternalLink />

                External Email

              </button>

              <button
                type="button"
                className="message-reply-button"
                onClick={sendReply}
                disabled={!replyText.trim()}
              >

                <FiSend />

                Send Reply

              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default Messages;