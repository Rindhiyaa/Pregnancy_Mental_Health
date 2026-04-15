import { useState, useEffect } from "react";
import {
  Mail, Bell, Calendar, ClipboardCheck, Settings, User,
  Pin, Loader2, Inbox, Circle, FileText
} from "lucide-react";
import PatientSidebar from "../../components/PatientSidebar";
import { api } from "../../utils/api";
import { useTheme } from "../../ThemeContext";
import { PageTitle, Divider, Card, Badge, PrimaryBtn } from "../../components/UI";
import useContentWidth from "../../hooks/useContentWidth";
import jsPDF from "jspdf";

const getTypeConfig = (theme) => ({
  assessment: {
    icon: <ClipboardCheck size={16} />,
    color: theme.dangerText,
    bg: theme.dangerBg,
    label: "Assessment",
  },
  reminder: {
    icon: <Bell size={16} />,
    color: theme.warningText,
    bg: theme.warningBg,
    label: "Reminder",
  },
  system: {
    icon: <Settings size={16} />,
    color: theme.textMuted,
    bg: theme.border,
    label: "System",
  },
  appointment: {
    icon: <Calendar size={16} />,
    color: theme.successText,
    bg: theme.successBg,
    label: "Appointment",
  },
});

export default function PatientMessages() {
  const { theme } = useTheme();
  const { ref: mainRef, isMobile } = useContentWidth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const TYPE_CONFIG = getTypeConfig(theme);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await api.get("/messages/patient");
        if (Array.isArray(data)) {
          const normalized = data.map((m) => ({
            id: m.id,
            from: m.from_name || "Care Team",
            role: m.from_role || "Clinician",
            subject: m.subject || "Message from Care Team",
            body: m.content || "",
            date: m.created_at
              ? new Date(m.created_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "",
            time: m.created_at
              ? new Date(m.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
            read: Boolean(m.is_read),
            type: (m.subject || "").toLowerCase().includes("appointment") ? "appointment" : "system",
          }));
          setMessages(normalized);
        } else {
          setMessages([]);
        }
      } catch (err) {
        console.error("Failed to load messages", err);
        setMessages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, []);

  const unreadCount = messages.filter((m) => !m.read).length;
  const selectedMsg = messages.find((m) => m.id === selected) || null;

  const exportMessageToPDF = (msg) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(msg.subject, 14, 22);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`From: ${msg.from} — ${msg.role}`, 14, 34);
    doc.text(`Date: ${msg.date} at ${msg.time}`, 14, 42);

    doc.setLineWidth(0.5);
    doc.line(14, 48, 196, 48);

    const lines = doc.splitTextToSize(msg.body || "", 180);
    doc.text(lines, 14, 58);

    doc.save(`message-${msg.id}.pdf`);
  };

  const handleOpen = (msg) => {
    setSelected(msg.id);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msg.id ? { ...m, read: true } : m
      )
    );
    api.post(`/messages/${msg.id}/read`, {}).catch(() => {});
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          overflow: "hidden",
          width: "100%",
          background: theme.pageBg,
          fontFamily: theme.fontBody,
        }}
      >
        <PatientSidebar />
        <main
          className="portal-main"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.pageBg,
          }}
        >
          <div style={{ textAlign: "center" }}>
            <Loader2
              className="animate-spin"
              size={40}
              color={theme.primary}
              style={{ marginBottom: 16 }}
            />
            <div style={{ color: theme.textMuted, fontWeight: 500 }}>
              Loading messages...
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        width: "100%",
        background: theme.pageBg,
        fontFamily: theme.fontBody,
      }}
    >
      <PatientSidebar />

      <main 
        ref={mainRef}
        className="portal-main" 
        style={{ 
          background: theme.pageBg,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 8,
            flexShrink: 0,
          }}
        >
          <PageTitle
            title="Messages"
            subtitle="Secure communication with your care team"
          />
          {unreadCount > 0 && (
            <Badge type="danger">{unreadCount} New Messages</Badge>
          )}
        </div>
        <Divider />

        {/* READ ONLY NOTICE */}
        <Card
          style={{
            background: theme.primaryBg,
            border: `1px solid ${theme.primary}20`,
            display: "flex",
            gap: 16,
            alignItems: "center",
            marginBottom: 24,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
            }}
          >
            <Pin size={18} color={theme.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: theme.primary,
                marginBottom: 2,
              }}
            >
              Read-only inbox
            </div>
            <div style={{ fontSize: 13, color: theme.textSecondary }}>
              To reply or ask a question, please call the hospital directly at{" "}
              <strong style={{ color: theme.primary }}>044-XXXXXXXX</strong>.
            </div>
          </div>
        </Card>

        {/* RESPONSIVE LAYOUT */}
        {isMobile ? (
          /* MOBILE: STACKED LAYOUT */
          <Card
            style={{
              padding: 0,
              overflowY: "auto",
              background: theme.cardBg,
              height: "100%",
            }}
          >
            {messages.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: "center",
                  color: theme.textMuted,
                }}
              >
                <Inbox
                  size={48}
                  style={{ marginBottom: 16, opacity: 0.5 }}
                />
                <div>No messages yet</div>
              </div>
            ) : (
              messages.map((msg) => {
                const isSelected = selected === msg.id;
                return (
                  <div key={msg.id} style={{ borderBottom: `1px solid ${theme.border}` }}>
                    {/* Message Header */}
                    <div
                      onClick={() => setSelected(isSelected ? null : msg.id)}
                      style={{
                        padding: "16px",
                        cursor: "pointer",
                        background: isSelected ? theme.primaryBg : "transparent",
                        borderLeft: `4px solid ${
                          isSelected ? theme.primary : msg.read ? "transparent" : theme.border
                        }`,
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: theme.textPrimary,
                          }}
                        >
                          {msg.from}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: theme.textMuted,
                          }}
                        >
                          {msg.date}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: msg.read ? 500 : 700,
                          color: theme.textPrimary,
                          marginBottom: 6,
                        }}
                      >
                        {msg.subject}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                          display: isSelected ? "none" : "block",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {(msg.body || "").replace(/\n/g, " ")}
                      </div>
                    </div>
                    {/* Expanded Message Content */}
                    {isSelected && (
                      <div
                        style={{
                          background: theme.innerBg,
                          borderTop: `1px solid ${theme.border}`,
                        }}
                      >
                        <div style={{ padding: "20px 16px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 12,
                              marginBottom: 16,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: "50%",
                                background: theme.cardBg,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: theme.primary,
                              }}
                            >
                              <User size={16} />
                            </div>
                            <div>
                              <div
                                style={{
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: theme.textPrimary,
                                }}
                              >
                                {msg.from}
                              </div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: theme.textMuted,
                                }}
                              >
                                {msg.role} • {msg.time}
                              </div>
                            </div>
                          </div>
                          
                          <Badge type={msg.type} style={{ marginBottom: 16 }}>
                            {TYPE_CONFIG[msg.type]?.label || "Message"}
                          </Badge>

                          <div
                            style={{
                              fontSize: 14,
                              color: theme.textSecondary,
                              lineHeight: 1.6,
                              whiteSpace: "pre-wrap",
                              marginBottom: 16,
                            }}
                          >
                            {msg.body}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              paddingTop: 16,
                              borderTop: `1px solid ${theme.border}`,
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 12,
                                color: theme.primary,
                              }}
                            >
                              <Circle size={8} fill={theme.primary} />
                              Need help? Call support
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                exportMessageToPDF(msg);
                              }}
                              style={{
                                background: theme.primary,
                                color: "white",
                                border: "none",
                                borderRadius: 6,
                                padding: "8px 12px",
                                fontSize: 12,
                                fontWeight: 600,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 6,
                              }}
                            >
                              <FileText size={14} />
                              Export
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </Card>
        ) : (
          /* DESKTOP/TABLET: TWO-COLUMN LAYOUT */
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 2fr",
              gap: 24,
              height: "100%",
              minHeight: 0,
            }}
          >
            {/* LEFT: MESSAGE LIST */}
            <Card
              style={{
                padding: 0,
                overflowY: "auto",
                background: theme.cardBg,
                height: "100%",
              }}
            >
              {messages.length === 0 ? (
                <div
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: theme.textMuted,
                  }}
                >
                  <Inbox
                    size={48}
                    style={{ marginBottom: 16, opacity: 0.5 }}
                  />
                  <div>No messages yet</div>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    onClick={() => handleOpen(msg)}
                    style={{
                      padding: "16px 20px",
                      borderBottom: `1px solid ${theme.border}`,
                      cursor: "pointer",
                      background: selected === msg.id ? theme.primaryBg : "transparent",
                      borderLeft: `4px solid ${
                        selected === msg.id ? theme.primary : msg.read ? "transparent" : theme.warning
                      }`,
                      transition: "all 0.2s",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: theme.textPrimary,
                        }}
                      >
                        {msg.from}
                      </span>
                      <span
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                        }}
                      >
                        {msg.time}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: msg.read ? 500 : 700,
                        color: theme.textPrimary,
                        marginBottom: 6,
                      }}
                    >
                      {msg.subject}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: theme.textMuted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {(msg.body || "").replace(/\n/g, " ")}
                    </div>
                  </div>
                ))
              )}
            </Card>

            {/* RIGHT: MESSAGE DETAIL */}
            <Card
              style={{
                padding: 0,
                background: theme.cardBg,
                height: "100%",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {selectedMsg ? (
                <>
                  {/* Message Header */}
                  <div
                    style={{
                      padding: "24px 32px",
                      borderBottom: `2px solid ${theme.border}`,
                      background: theme.innerBg,
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          background: theme.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        {selectedMsg.from.charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 18,
                            fontWeight: 800,
                            color: theme.textPrimary,
                            marginBottom: 4,
                          }}
                        >
                          {selectedMsg.from}
                        </div>
                        <div
                          style={{
                            fontSize: 14,
                            color: theme.textMuted,
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <span>{selectedMsg.role}</span>
                          <Circle size={4} fill={theme.textMuted} />
                          <span>{selectedMsg.date} at {selectedMsg.time}</span>
                        </div>
                      </div>
                      <Badge type={selectedMsg.type}>
                        {TYPE_CONFIG[selectedMsg.type]?.icon}
                        <span style={{ marginLeft: 6 }}>
                          {TYPE_CONFIG[selectedMsg.type]?.label || "Message"}
                        </span>
                      </Badge>
                    </div>
                    <h2
                      style={{
                        fontSize: 20,
                        fontWeight: 800,
                        color: theme.textPrimary,
                        margin: 0,
                      }}
                    >
                      {selectedMsg.subject}
                    </h2>
                  </div>

                  {/* Message Content */}
                  <div
                    style={{
                      padding: "32px",
                      flex: 1,
                      overflowY: "auto",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 16,
                        color: theme.textSecondary,
                        lineHeight: 1.7,
                        whiteSpace: "pre-wrap",
                        marginBottom: 32,
                      }}
                    >
                      {selectedMsg.body}
                    </div>
                  </div>

                  {/* Message Footer */}
                  <div
                    style={{
                      padding: "20px 32px",
                      borderTop: `2px solid ${theme.border}`,
                      background: theme.innerBg,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        color: theme.primary,
                        fontWeight: 600,
                      }}
                    >
                      <Circle size={8} fill={theme.primary} />
                      Need help? Call support at 044-XXXXXXXX
                    </div>
                    <PrimaryBtn
                      onClick={() => exportMessageToPDF(selectedMsg)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 14,
                        padding: "12px 20px",
                      }}
                    >
                      <FileText size={16} />
                      Export PDF
                    </PrimaryBtn>
                  </div>
                </>
              ) : (
                /* No Message Selected */
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    textAlign: "center",
                    color: theme.textMuted,
                  }}
                >
                  <div>
                    <Mail size={64} style={{ marginBottom: 24, opacity: 0.3 }} />
                    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                      Select a message to read
                    </div>
                    <div style={{ fontSize: 14 }}>
                      Choose a message from the list to view its contents
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}