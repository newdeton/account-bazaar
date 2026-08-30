import { useEffect, useMemo, useState } from "react";
import {
  FiMail,
  FiSend,
  FiMessageCircle,
  FiX,
  FiArrowLeft,
  FiUser,
  FiShield,
} from "react-icons/fi";

import "./Contact.css";

/* =========================================================
   STORAGE KEYS
========================================================= */

const CUSTOMER_STORAGE_KEY = "accountBazaarCustomer";
const MESSAGES_STORAGE_KEY = "accountBazaarMessages";

/* =========================================================
   CUSTOMER ID GENERATOR
========================================================= */

const generateCustomerId = () => {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `CUS-${crypto.randomUUID()}`;
  }

  return `CUS-${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)
    .toUpperCase()}`;
};

/* =========================================================
   GET OR CREATE CUSTOMER IDENTITY
========================================================= */

const getCustomerIdentity = () => {
  try {
    const savedCustomer = localStorage.getItem(
      CUSTOMER_STORAGE_KEY
    );

    if (savedCustomer) {
      const parsedCustomer = JSON.parse(savedCustomer);

      if (
        parsedCustomer &&
        typeof parsedCustomer === "object" &&
        parsedCustomer.customerId
      ) {
        return parsedCustomer;
      }
    }
  } catch (error) {
    console.error(
      "Failed to load customer identity:",
      error
    );
  }

  const customer = {
    customerId: generateCustomerId(),
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(
      CUSTOMER_STORAGE_KEY,
      JSON.stringify(customer)
    );
  } catch (error) {
    console.error(
      "Failed to save customer identity:",
      error
    );
  }

  return customer;
};

/* =========================================================
   SAFE STORAGE READER
========================================================= */

const readMessages = () => {
  try {
    const saved = localStorage.getItem(
      MESSAGES_STORAGE_KEY
    );

    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(
      "Failed to read customer messages:",
      error
    );

    return [];
  }
};

/* =========================================================
   SAVE MESSAGES
========================================================= */

const saveMessages = (messages) => {
  try {
    localStorage.setItem(
      MESSAGES_STORAGE_KEY,
      JSON.stringify(messages)
    );

    return true;
  } catch (error) {
    console.error(
      "Failed to save customer messages:",
      error
    );

    return false;
  }
};

/* =========================================================
   NORMALIZE VALUE
========================================================= */

const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

/* =========================================================
   CONTACT COMPONENT
========================================================= */

function Contact() {
  const [customer, setCustomer] = useState(null);

  const [messages, setMessages] = useState([]);

  const [selectedMessage, setSelectedMessage] =
    useState(null);

  const [reply, setReply] = useState("");

  const [subject, setSubject] = useState("");

  const [newMessage, setNewMessage] =
    useState("");

  const [showNewMessage, setShowNewMessage] =
    useState(false);

  const [sending, setSending] = useState(false);

  /* =======================================================
     LOAD CUSTOMER
  ======================================================= */

  useEffect(() => {
    const identity = getCustomerIdentity();

    setCustomer(identity);
  }, []);

  /* =======================================================
     CUSTOMER IDENTIFIERS
  ======================================================= */

  const customerId = useMemo(
    () =>
      normalizeValue(
        customer?.customerId
      ),
    [customer]
  );

  const customerEmail = useMemo(
    () =>
      normalizeValue(
        customer?.email ||
          customer?.customerEmail
      ),
    [customer]
  );

  /* =======================================================
     CHECK MESSAGE OWNERSHIP
  ======================================================= */

  const belongsToCustomer = (message) => {
    if (!message) {
      return false;
    }

    const messageCustomerId =
      normalizeValue(
        message.customerId
      );

    const messageEmail =
      normalizeValue(
        message.customerEmail ||
          message.email
      );

    /*
     * PRIMARY OWNERSHIP
     *
     * Customer ID is the strongest identifier.
     */

    if (
      customerId &&
      messageCustomerId &&
      messageCustomerId === customerId
    ) {
      return true;
    }

    /*
     * EMAIL FALLBACK
     *
     * Supports messages created before
     * customerId was introduced.
     */

    if (
      customerEmail &&
      messageEmail &&
      messageEmail === customerEmail
    ) {
      return true;
    }

    return false;
  };

  /* =======================================================
     LOAD CUSTOMER MESSAGES
  ======================================================= */

  const loadMessages = () => {
    if (!customer) {
      setMessages([]);
      return;
    }

    const allMessages = readMessages();

    const customerMessages = allMessages
      .filter(belongsToCustomer)
      .map((message) => ({
        ...message,
        replies: Array.isArray(message.replies)
          ? message.replies
          : [],
      }));

    setMessages(customerMessages);

    /*
     * Keep opened conversation synchronized.
     */

    if (selectedMessage) {
      const updatedSelected =
        customerMessages.find(
          (message) =>
            message.id === selectedMessage.id
        );

      if (updatedSelected) {
        setSelectedMessage(updatedSelected);
      } else {
        setSelectedMessage(null);
      }
    }
  };

  /* =======================================================
     LISTEN FOR MESSAGE CHANGES
  ======================================================= */

  useEffect(() => {
    if (!customer) {
      return undefined;
    }

    loadMessages();

    const handleStorageChange = () => {
      loadMessages();
    };

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    /*
     * LocalStorage does not fire the storage event
     * in the same browser tab, so keep the inbox
     * synchronized.
     */

    const interval = setInterval(
      loadMessages,
      1000
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );

      clearInterval(interval);
    };
  }, [
    customer,
    customerId,
    customerEmail,
    selectedMessage,
  ]);

  /* =======================================================
     UNREAD ADMIN REPLIES
  ======================================================= */

  const hasUnreadAdminReply = (message) => {
    const replies = Array.isArray(
      message?.replies
    )
      ? message.replies
      : [];

    return replies.some(
      (replyItem) =>
        String(
          replyItem.sender || ""
        ).toLowerCase() === "admin" &&
        !replyItem.customerRead
    );
  };

  const unreadReplies = messages.filter(
    hasUnreadAdminReply
  ).length;

  /* =======================================================
     SEND NEW MESSAGE
  ======================================================= */

  const sendMessage = (event) => {
    event.preventDefault();

    if (sending) {
      return;
    }

    const cleanSubject = subject.trim();
    const cleanMessage = newMessage.trim();

    if (!cleanSubject || !cleanMessage) {
      return;
    }

    const identity =
      customer || getCustomerIdentity();

    const now = new Date().toISOString();

    const message = {
      /*
       * Message identity
       */

      id: `MSG-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`,

      /*
       * CUSTOMER IDENTITY
       */

      customerId:
        identity.customerId,

      customerName:
        identity.name ||
        identity.fullName ||
        "Customer",

      customerEmail:
        identity.email ||
        identity.customerEmail ||
        "",

      /*
       * MESSAGE
       */

      subject: cleanSubject,

      message: cleanMessage,

      date: now,

      /*
       * Admin inbox status
       */

      read: false,

      /*
       * Conversation thread
       */

      replies: [],

      /*
       * Metadata
       */

      createdAt: now,

      updatedAt: now,
    };

    setSending(true);

    try {
      const existingMessages =
        readMessages();

      const updatedMessages = [
        message,
        ...existingMessages,
      ];

      const saved =
        saveMessages(updatedMessages);

      if (!saved) {
        throw new Error(
          "Message could not be saved."
        );
      }

      setMessages((current) => [
        message,
        ...current,
      ]);

      setSubject("");
      setNewMessage("");
      setShowNewMessage(false);
    } catch (error) {
      console.error(
        "Failed to send message:",
        error
      );

      alert(
        "We couldn't send your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  /* =======================================================
     OPEN CONVERSATION
  ======================================================= */

  const openConversation = (message) => {
    if (!message) {
      return;
    }

    const updatedReplies = (
      message.replies || []
    ).map((replyItem) => {
      if (
        String(
          replyItem.sender || ""
        ).toLowerCase() === "admin"
      ) {
        return {
          ...replyItem,
          customerRead: true,
        };
      }

      return replyItem;
    });

    const updatedMessage = {
      ...message,
      replies: updatedReplies,
      updatedAt: new Date().toISOString(),
    };

    const existingMessages =
      readMessages();

    const updatedMessages =
      existingMessages.map((item) =>
        item.id === message.id
          ? updatedMessage
          : item
      );

    saveMessages(updatedMessages);

    setMessages((current) =>
      current.map((item) =>
        item.id === message.id
          ? updatedMessage
          : item
      )
    );

    setSelectedMessage(
      updatedMessage
    );

    setReply("");
  };

  /* =======================================================
     SEND CUSTOMER REPLY
  ======================================================= */

  const sendReply = () => {
    const cleanReply = reply.trim();

    if (
      !cleanReply ||
      !selectedMessage
    ) {
      return;
    }

    const identity =
      customer || getCustomerIdentity();

    const newReply = {
      id: `REP-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()}`,

      message: cleanReply,

      date: new Date().toISOString(),

      sender: "Customer",

      customerRead: true,

      customerId:
        identity.customerId,

      customerName:
        identity.name ||
        identity.fullName ||
        "Customer",

      customerEmail:
        identity.email ||
        identity.customerEmail ||
        "",
    };

    const updatedMessage = {
      ...selectedMessage,

      /*
       * Preserve customer ownership.
       */

      customerId:
        selectedMessage.customerId ||
        identity.customerId,

      customerName:
        selectedMessage.customerName ||
        identity.name ||
        identity.fullName ||
        "Customer",

      customerEmail:
        selectedMessage.customerEmail ||
        identity.email ||
        identity.customerEmail ||
        "",

      replies: [
        ...(selectedMessage.replies || []),
        newReply,
      ],

      updatedAt:
        new Date().toISOString(),
    };

    try {
      const existingMessages =
        readMessages();

      const updatedMessages =
        existingMessages.map(
          (message) =>
            message.id ===
            selectedMessage.id
              ? updatedMessage
              : message
        );

      const saved =
        saveMessages(updatedMessages);

      if (!saved) {
        throw new Error(
          "Reply could not be saved."
        );
      }

      setMessages((current) =>
        current.map((message) =>
          message.id ===
          selectedMessage.id
            ? updatedMessage
            : message
        )
      );

      setSelectedMessage(
        updatedMessage
      );

      setReply("");
    } catch (error) {
      console.error(
        "Failed to send reply:",
        error
      );

      alert(
        "We couldn't send your reply. Please try again."
      );
    }
  };

  /* =======================================================
     REPLY KEYBOARD SHORTCUT
  ======================================================= */

  const handleReplyKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      (event.ctrlKey || event.metaKey)
    ) {
      event.preventDefault();

      sendReply();
    }
  };

  /* =======================================================
     FORMAT DATE
  ======================================================= */

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    const value = new Date(date);

    if (Number.isNaN(value.getTime())) {
      return "";
    }

    return value.toLocaleString(
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
     CUSTOMER DISPLAY NAME
  ======================================================= */

  const customerDisplayName =
    customer?.name ||
    customer?.fullName ||
    "Customer";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="contact-page">

      {/* =================================================
          CONTACT HEADER
      ================================================= */}

      <section className="contact-hero">

        <span>GET IN TOUCH</span>

        <h1>Contact Us</h1>

        <p>
          Have a question or need help?
          Send us a message and our team
          will get back to you.
        </p>

      </section>

      {/* =================================================
          CONTACT AREA
      ================================================= */}

      <section className="contact-content">

        {/* =================================================
            CONTACT INFORMATION
        ================================================= */}

        <div className="contact-info">

          <div className="contact-info-card">

            <FiMail />

            <div>

              <h3>
                Email Us
              </h3>

              <p>
                support@accountbazaar.com
              </p>

            </div>

          </div>

          <div className="contact-info-card">

            <FiMessageCircle />

            <div>

              <h3>
                Customer Support
              </h3>

              <p>
                We're available to help
                with your purchases and
                services.
              </p>

            </div>

          </div>

        </div>

        {/* =================================================
            CUSTOMER MESSAGES
        ================================================= */}

        <div className="customer-messages">

          {/* CUSTOMER IDENTITY */}
          {customer && (
            <div className="contact-customer-identity">

              <div className="contact-customer-icon">
                <FiShield />
              </div>

              <div>

                <small>
                  YOUR CUSTOMER IDENTITY
                </small>

                <strong>
                  {customerDisplayName}
                </strong>

                <span>
                  {customer.customerId}
                </span>

              </div>

            </div>
          )}

          {/* =================================================
              MESSAGE HEADER
          ================================================= */}

          <div className="customer-messages-header">

            <div>

              <span>
                YOUR COMMUNICATIONS
              </span>

              <h2>

                Messages

                {unreadReplies > 0 && (
                  <b className="new-message-count">
                    {unreadReplies}
                  </b>
                )}

              </h2>

              <p>
                View your conversations
                and replies from our team.
              </p>

            </div>

            <button
              type="button"
              className="new-message-button"
              onClick={() =>
                setShowNewMessage(true)
              }
            >
              <FiSend />
              New Message
            </button>

          </div>

          {/* =================================================
              MESSAGE LIST
          ================================================= */}

          {!selectedMessage && (

            <div className="customer-message-list">

              {messages.length > 0 ? (

                messages.map((message) => {

                  const unread =
                    hasUnreadAdminReply(
                      message
                    );

                  const replies =
                    message.replies || [];

                  const latestReply =
                    replies.length > 0
                      ? replies[
                          replies.length - 1
                        ]
                      : null;

                  return (
                    <button
                      type="button"
                      key={message.id}
                      className={`customer-message-card ${
                        unread
                          ? "has-new-reply"
                          : ""
                      }`}
                      onClick={() =>
                        openConversation(
                          message
                        )
                      }
                    >

                      <div className="customer-message-icon">
                        <FiMessageCircle />
                      </div>

                      <div className="customer-message-main">

                        <div className="customer-message-top">

                          <strong>
                            {message.subject ||
                              "No Subject"}
                          </strong>

                          {unread && (
                            <span className="new-reply-badge">
                              New Reply
                            </span>
                          )}

                        </div>

                        <p>
                          {latestReply
                            ? latestReply.message
                            : message.message}
                        </p>

                        <small>
                          {formatDate(
                            latestReply?.date ||
                              message.date
                          )}
                        </small>

                      </div>

                    </button>
                  );
                })

              ) : (

                <div className="no-customer-messages">

                  <FiMessageCircle />

                  <h3>
                    No messages yet
                  </h3>

                  <p>
                    Start a conversation
                    with our support team.
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      setShowNewMessage(
                        true
                      )
                    }
                  >
                    Send a Message
                  </button>

                </div>

              )}

            </div>
          )}

          {/* =================================================
              CONVERSATION
          ================================================= */}

          {selectedMessage && (

            <div className="customer-conversation">

              <div className="conversation-header">

                <button
                  type="button"
                  onClick={() => {
                    setSelectedMessage(
                      null
                    );

                    setReply("");
                  }}
                  aria-label="Back to messages"
                >
                  <FiArrowLeft />
                </button>

                <div>

                  <strong>
                    {selectedMessage.subject ||
                      "No Subject"}
                  </strong>

                  <span>
                    {formatDate(
                      selectedMessage.date
                    )}
                  </span>

                </div>

              </div>

              <div className="conversation-body">

                {/* ORIGINAL MESSAGE */}

                <div className="conversation-message customer">

                  <span>
                    You
                  </span>

                  <div className="conversation-bubble">
                    {selectedMessage.message}
                  </div>

                  <small>
                    {formatDate(
                      selectedMessage.date
                    )}
                  </small>

                </div>

                {/* REPLY THREAD */}

                {(selectedMessage.replies || [])
                  .map((replyItem) => {

                    const isAdmin =
                      String(
                        replyItem.sender ||
                          ""
                      ).toLowerCase() ===
                      "admin";

                    return (
                      <div
                        className={`conversation-message ${
                          isAdmin
                            ? "admin"
                            : "customer"
                        }`}
                        key={replyItem.id}
                      >

                        <span>
                          {isAdmin
                            ? "Admin"
                            : "You"}
                        </span>

                        <div className="conversation-bubble">
                          {replyItem.message}
                        </div>

                        <small>
                          {formatDate(
                            replyItem.date
                          )}
                        </small>

                      </div>
                    );
                  })}

              </div>

              {/* =================================================
                  REPLY BOX
              ================================================= */}

              <div className="customer-reply-box">

                <textarea
                  value={reply}
                  onChange={(event) =>
                    setReply(
                      event.target.value
                    )
                  }
                  onKeyDown={
                    handleReplyKeyDown
                  }
                  placeholder="Write your reply..."
                  rows="3"
                />

                <div>

                  <span>
                    Press Ctrl + Enter to send
                  </span>

                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={
                      !reply.trim()
                    }
                  >
                    <FiSend />
                    Send Reply
                  </button>

                </div>

              </div>

            </div>
          )}

        </div>

      </section>

      {/* =================================================
          NEW MESSAGE MODAL
      ================================================= */}

      {showNewMessage && (

        <div
          className="contact-message-overlay"
          onClick={() =>
            setShowNewMessage(false)
          }
        >

          <div
            className="contact-message-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div className="contact-message-modal-header">

              <div>

                <span>
                  NEW MESSAGE
                </span>

                <h2>
                  Contact Support
                </h2>

                <p>
                  Send a message to our
                  support team.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setShowNewMessage(
                    false
                  )
                }
                aria-label="Close"
              >
                <FiX />
              </button>

            </div>

            {/* CUSTOMER IDENTITY */}

            {customer && (
              <div className="contact-modal-customer">

                <FiUser />

                <div>

                  <small>
                    Sending as
                  </small>

                  <strong>
                    {customerDisplayName}
                  </strong>

                  <span>
                    {customer.customerId}
                  </span>

                </div>

              </div>
            )}

            {/* FORM */}

            <form
              className="contact-message-form"
              onSubmit={sendMessage}
            >

              <label>
                Subject
              </label>

              <input
                type="text"
                value={subject}
                onChange={(event) =>
                  setSubject(
                    event.target.value
                  )
                }
                placeholder="What is your message about?"
                maxLength={120}
                required
              />

              <label>
                Message
              </label>

              <textarea
                value={newMessage}
                onChange={(event) =>
                  setNewMessage(
                    event.target.value
                  )
                }
                placeholder="Write your message here..."
                rows="6"
                maxLength={3000}
                required
              />

              <div className="contact-message-actions">

                <button
                  type="button"
                  onClick={() =>
                    setShowNewMessage(
                      false
                    )
                  }
                  disabled={sending}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    sending ||
                    !subject.trim() ||
                    !newMessage.trim()
                  }
                >
                  <FiSend />

                  {sending
                    ? "Sending..."
                    : "Send Message"}
                </button>

              </div>

            </form>

          </div>

        </div>
      )}

    </div>
  );
}

export default Contact;