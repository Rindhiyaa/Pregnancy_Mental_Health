import React, { useState, useEffect } from "react";
import {
  Mail, Bell, Calendar, ClipboardCheck, Settings, User,
  Pin, Loader2, Inbox, Circle, FileText
} from "lucide-react";
import PatientSidebar from "../../components/PatientSidebar";
import { api } from "../../utils/api";
import { useTheme } from "../../ThemeContext";
import { PageTitle, Divider, Card, Badge, PrimaryBtn } from "../../components/UI";
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
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const TYPE_CONFIG = getTypeConfig(theme);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
       // inside useEffect in PatientMessages.jsx
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
          minHeight: "100vh",
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
        minHeight: "100vh",
        background: theme.pageBg,
        fontFamily: theme.fontBody,
      }}
    >
      <PatientSidebar />

      <main className="portal-main" style={{ background: theme.pageBg }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            marginBottom: 8,
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
            marginBottom: 32,
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

        {/* TWO COLUMN LAYOUT */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "350px 1fr",
            gap: 24,
            height: "calc(100vh - 280px)",
          }}
        >
          {/* LEFT: MESSAGE LIST */}
          <Card
            style={{
              padding: 0,
              overflowY: "auto",
              background: theme.cardBg,
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
                const cfg = TYPE_CONFIG[msg.type] || TYPE_CONFIG.system;
                const isSelected = selected === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleOpen(msg)}
                    style={{
                      padding: "20px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${theme.border}`,
                      background: isSelected
                        ? theme.primaryBg
                        : "transparent",
                      borderLeft: `4px solid ${
                        isSelected
                          ? theme.primary
                          : msg.read
                          ? "transparent"
                          : theme.border
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
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {msg.subject}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: theme.textMuted,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {(msg.body || "").replace(/\n/g, " ")}
                    </div>
                  </div>
                );
              })
            )}
          </Card>

          {/* RIGHT: MESSAGE DETAIL */}
          <Card
            style={{
              padding: 0,
              display: "flex",
              flexDirection: "column",
              background: theme.cardBg,
            }}
          >
            {!selectedMsg ? (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  color: theme.textMuted,
                  padding: 40,
                  textAlign: "center",
                }}
              >
                <Mail
                  size={64}
                  style={{ marginBottom: 20, opacity: 0.2 }}
                />
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: theme.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  Select a message
                </div>
                <div style={{ fontSize: 14 }}>
                  Choose a message from the list to view its contents.
                </div>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                <div
                  style={{
                    padding: "32px 40px",
                    borderBottom: `1px solid ${theme.border}`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: 24,
                    }}
                  >
                    <div>
                      <h2
                        style={{
                          fontSize: 22,
                          fontWeight: 800,
                          color: theme.textPrimary,
                          margin: "0 0 8px 0",
                        }}
                      >
                        {selectedMsg.subject}
                      </h2>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: theme.innerBg,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: theme.primary,
                          }}
                        >
                          <User size={18} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontSize: 14,
                              fontWeight: 700,
                              color: theme.textPrimary,
                            }}
                          >
                            {selectedMsg.from}
                          </div>
                          <div
                            style={{
                              fontSize: 12,
                              color: theme.textMuted,
                            }}
                          >
                            {selectedMsg.role}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: theme.textPrimary,
                        }}
                      >
                        {selectedMsg.date}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: theme.textMuted,
                        }}
                      >
                        {selectedMsg.time}
                      </div>
                    </div>
                  </div>
                  <Badge type={selectedMsg.type}>
                    {TYPE_CONFIG[selectedMsg.type]?.label || "Message"}
                  </Badge>
                </div>

                <div
                  style={{
                    flex: 1,
                    padding: "40px",
                    overflowY: "auto",
                    fontSize: 15,
                    color: theme.textSecondary,
                    lineHeight: 1.8,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {selectedMsg.body}
                </div>

                <div
                  style={{
                    padding: "24px 40px",
                    borderTop: `1px solid ${theme.border}`,
                    background: theme.innerBg,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 13,
                      color: theme.primary,
                    }}
                  >
                    <Circle size={10} fill={theme.primary} /> Need more help?
                    Contact our support line.
                  </div>
                  <PrimaryBtn onClick={() => exportMessageToPDF(selectedMsg)}>
                    <FileText
                      size={16}
                      style={{ marginRight: 6 }}
                    />{" "}
                    Export PDF
                  </PrimaryBtn>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}