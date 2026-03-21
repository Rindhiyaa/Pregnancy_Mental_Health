import React, { useState, useEffect } from "react";
import {
  Mail, Bell, Calendar, ClipboardCheck, Settings, User, Bot,
  Phone, Pin, Info, Loader2, Inbox, MessageCircle,
  Circle
} from "lucide-react";
import PatientSidebar from "../../components/PatientSidebar";
import { api } from "../../utils/api";
import { THEME } from "../../theme";
import { PageTitle, Divider, Card, Badge, PrimaryBtn } from "../../components/UI";

const DUMMY_MESSAGES = [
  {
    id: 1,
    from: "Dr. Priya",
    role: "OB/GYN — City Hospital",
    avatar: <User size={20} />,
    subject: "Your Assessment Results are Ready",
    body: `Hello Rindhiyaa,\n\nYour PPD risk assessment has been reviewed. Based on your EPDS score and clinical factors, we recommend connecting with a mental health specialist at the earliest.\n\nPlease attend your scheduled follow-up on 25 March 2026 at 10:00 AM. Your care plan has been updated in the portal.\n\nRemember — you are not alone in this journey.\n\nTake care,\nDr. Priya`,
    date: "18 March 2026",
    time: "11:45 AM",
    read: false,
    type: "assessment",
  },
  {
    id: 2,
    from: "Dr. Priya",
    role: "OB/GYN — City Hospital",
    avatar: <User size={20} />,
    subject: "Reminder: Follow-up Appointment",
    body: `Hello Rindhiyaa,\n\nThis is a gentle reminder that your next follow-up is scheduled for 25 March 2026 at 10:00 AM at City Hospital, Maternity Ward.\n\nPlease continue logging your mood daily in the tracker — it helps us monitor your progress between visits.\n\nSee you soon,\nDr. Priya`,
    date: "15 March 2026",
    time: "09:00 AM",
    read: true,
    type: "reminder",
  },
];

const TYPE_CONFIG = {
  assessment: { icon: <ClipboardCheck size={16} />, color: THEME.dangerText, bg: THEME.dangerBg, label: "Assessment" },
  reminder: { icon: <Bell size={16} />, color: THEME.warningText, bg: THEME.warningBg, label: "Reminder" },
  system: { icon: <Settings size={16} />, color: THEME.textLight, bg: THEME.divider, label: "System" },
  appointment: { icon: <Calendar size={16} />, color: THEME.successText, bg: THEME.successBg, label: "Appointment" },
};

export default function PatientMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await api.get("/patient/messages");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const normalized = data.map(m => ({
              id: m.id,
              from: m.sender_name || "Care Team",
              role: m.sender_role || "Clinician",
              avatar: m.sender_role === 'System' ? <Bot size={20} /> : <User size={20} />,
              subject: m.subject || "Message from Care Team",
              body: m.content,
              date: new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              read: m.is_read,
              type: m.type || "system"
            }));
            setMessages(normalized);
          } else {
            setMessages(DUMMY_MESSAGES);
          }
        } else {
          setMessages(DUMMY_MESSAGES);
        }
      } catch {
        setMessages(DUMMY_MESSAGES);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();
  }, []);

  const unreadCount = messages.filter(m => !m.read).length;
  const selectedMsg = messages.find(m => m.id === selected);

  const handleOpen = (msg) => {
    setSelected(msg.id);
    setMessages(prev =>
      prev.map(m => m.id === msg.id ? { ...m, read: true } : m)
    );
    api.post(`/patient/messages/${msg.id}/read`, {}).catch(() => { });
  };

  if (loading) return (
    <div style={{ display: "flex", minHeight: "100vh", background: THEME.pageBg, fontFamily: THEME.fontBody }}>
      <PatientSidebar />
      <main style={{ flex: 1, marginLeft: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="animate-spin" size={40} color={THEME.primary} style={{ marginBottom: 16 }} />
          <div style={{ color: THEME.textMuted, fontWeight: 500 }}>Loading messages...</div>
        </div>
      </main>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: THEME.pageBg, fontFamily: THEME.fontBody }}>
      <PatientSidebar />

      <main style={{
        flex: 1,
        marginLeft: 260,
        padding: "40px 48px",
        width: "calc(100% - 260px)",
        boxSizing: "border-box"
      }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
          <PageTitle
            title="Messages"
            subtitle="Secure communication with your care team"
          />
          {unreadCount > 0 && <Badge type="danger">{unreadCount} New Messages</Badge>}
        </div>
        <Divider />

        {/* ── READ ONLY NOTICE ── */}
        <Card style={{ background: THEME.primaryBg, border: `1px solid ${THEME.primaryLight}30`, display: "flex", gap: 16, alignItems: "center", marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Pin size={18} color={THEME.primary} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: THEME.primary, marginBottom: 2 }}>Read-only inbox</div>
            <div style={{ fontSize: 13, color: THEME.textSecondary }}>
              To reply or ask a question, please call the hospital directly at <strong style={{ color: THEME.primary }}>044-XXXXXXXX</strong>.
            </div>
          </div>
        </Card>

        {/* ── TWO COLUMN LAYOUT ── */}
        <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: 24, height: "calc(100vh - 280px)" }}>

          {/* ── LEFT: MESSAGE LIST ── */}
          <Card style={{ padding: 0, overflowY: "auto", background: "white" }}>
            {messages.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: THEME.textMuted }}>
                <Inbox size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
                <div>No messages yet</div>
              </div>
            ) : (
              messages.map(msg => {
                const cfg = TYPE_CONFIG[msg.type] || TYPE_CONFIG.system;
                const isSelected = selected === msg.id;
                return (
                  <div
                    key={msg.id}
                    onClick={() => handleOpen(msg)}
                    style={{
                      padding: "20px",
                      cursor: "pointer",
                      borderBottom: `1px solid ${THEME.divider}`,
                      background: isSelected ? THEME.primaryBg : "transparent",
                      borderLeft: `4px solid ${isSelected ? THEME.primary : (msg.read ? "transparent" : THEME.primaryLight)}`,
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: THEME.textPrimary }}>{msg.from}</span>
                      <span style={{ fontSize: 11, color: THEME.textMuted }}>{msg.date}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: msg.read ? 500 : 700, color: THEME.textPrimary, marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {msg.subject}
                    </div>
                    <div style={{ fontSize: 12, color: THEME.textMuted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {msg.body.replace(/\n/g, " ")}
                    </div>
                  </div>
                );
              })
            )}
          </Card>

          {/* ── RIGHT: MESSAGE DETAIL ── */}
          <Card style={{ padding: 0, display: "flex", flexDirection: "column", background: "white" }}>
            {!selectedMsg ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: THEME.textMuted, padding: 40, textAlign: "center" }}>
                <Mail size={64} style={{ marginBottom: 20, opacity: 0.2 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: THEME.textSecondary, marginBottom: 8 }}>Select a message</div>
                <div style={{ fontSize: 14 }}>Choose a message from the list to view its contents.</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ padding: "32px 40px", borderBottom: `1px solid ${THEME.divider}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                    <div>
                      <h2 style={{ fontSize: 22, fontWeight: 800, color: THEME.textPrimary, margin: "0 0 8px 0" }}>{selectedMsg.subject}</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: THEME.primaryBg, display: "flex", alignItems: "center", justifyContent: "center", color: THEME.primary }}>
                          <User size={18} />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: THEME.textPrimary }}>{selectedMsg.from}</div>
                          <div style={{ fontSize: 12, color: THEME.textMuted }}>{selectedMsg.role}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: THEME.textPrimary }}>{selectedMsg.date}</div>
                      <div style={{ fontSize: 12, color: THEME.textMuted }}>{selectedMsg.time}</div>
                    </div>
                  </div>
                  <Badge type={selectedMsg.type}>{TYPE_CONFIG[selectedMsg.type]?.label || "Message"}</Badge>
                </div>

                <div style={{ flex: 1, padding: "40px", overflowY: "auto", fontSize: 15, color: THEME.textSecondary, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
                  {selectedMsg.body}
                </div>

                <div style={{ padding: "24px 40px", borderTop: `1px solid ${THEME.divider}`, background: THEME.primaryBg, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: THEME.primary }}>
                    <Info size={16} /> Need more help? Contact our support line.
                  </div>
                  <PrimaryBtn onClick={() => window.print()}>Print Message</PrimaryBtn>
                </div>
              </div>
            )}
          </Card>
        </div>

      </main>
    </div>
  );
}



