import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import PatientSidebar from "../../components/PatientSidebar";
import { api } from "../../utils/api";
import toast from "react-hot-toast";
import {
  Frown,
  Meh,
  Smile,
  TrendingUp,
  TrendingDown,
  Minus,
  Heart,
  Info
} from'lucide-react';
import { useTheme } from "../../ThemeContext";
import { PageTitle, Divider, Card, Badge, PrimaryBtn } from "../../components/UI";

const getMoods = (theme) => [
  { score: 1, icon: <Frown size={28} />, label: "Very Sad",  color: theme.dangerText, bg: theme.dangerBg },
  { score: 2, icon: <Frown size={28} />, label: "Sad",       color: "#F97316", bg: theme.isDark ? "rgba(249, 115, 22, 0.2)" : "#FFF7ED" },
  { score: 3, icon: <Meh size={28} />,   label: "Neutral",   color: theme.textMuted, bg: theme.border },
  { score: 4, icon: <Smile size={28} />, label: "Good",      color: theme.primary, bg: theme.primaryBg },
  { score: 5, icon: <Smile size={28} />, label: "Great",     color: theme.primary, bg: theme.innerBg },
];

const CustomTooltip = ({ active, payload, label, theme, moods }) => {
  if (active && payload?.length) {
    const score = payload[0].value;
    const mood = moods.find(m => m.score === score);
    return (
      <Card style={{ padding: "10px 14px", border: `1px solid ${theme.border}`, background: theme.cardBg, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
        <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: mood?.color, display: "flex", alignItems: "center", gap: 8 }}>
          {mood?.label}
        </div>
      </Card>
    );
  }
  return null;
};

export default function MoodTracker() {
  const { theme } = useTheme();
  const MOODS = getMoods(theme);

  const [selected, setSelected]   = useState(null);
  const [note, setNote]           = useState("");
  const [saved, setSaved]         = useState(false);
  const [savedMood, setSavedMood] = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.get("/patient/mood/history");
        const dataArray = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
          ? data.data
          : [];
        if (dataArray.length) {
          // Expecting each item like { date: '18 Mar', score: 3 } or with ISO date
          const normalized = dataArray.map(item => {
            if (item.date) return item;
            if (item.created_at) {
              const d = new Date(item.created_at);
              return {
                ...item,
                date: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
              };
            }
            return item;
          });
          setHistory(normalized);
        } else {
          setHistory([]);
        }
      } catch (err) {
        console.error("Failed to load mood history", err);
        toast.error("Failed to load mood history");
        setHistory([]);
      }
    };
    fetchHistory();
  }, []);

  const handleSave = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const { data } = await api.post("/patient/mood", {
        mood_score: selected,
        note: note,
      });
      // If backend enforces "once per day", it should return a clear detail; otherwise this is success
      setSaved(true);
      setSavedMood(MOODS.find(m => m.score === selected));
      toast.success("Mood logged!");

      const today = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      setHistory(prev => [...prev, { date: today, score: selected }]);
    } catch (err) {
      try {
        const parsed = JSON.parse(err.message || "{}");
        if (parsed.detail && typeof parsed.detail === "string" && parsed.detail.toLowerCase().includes("already")) {
          toast("You already logged your mood today");
          setSaved(true);
        } else {
          toast.error("Could not save mood.");
        }
      } catch {
        toast.error("Could not save mood.");
      }
    } finally {
      setLoading(false);
    }
  };

  const avgScore = history.length
    ? (history.reduce((s, h) => s + h.score, 0) / history.length).toFixed(1)
    : null;
  const avgMood  = avgScore ? MOODS.find(m => m.score === Math.round(avgScore)) : null;
  const last5    = history.slice(-5);
  const trend    = last5.length >= 2
    ? last5[last5.length - 1].score - last5[0].score
    : 0;

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <PatientSidebar />

      <main className="portal-main" style={{ background: theme.pageBg }}>
        <PageTitle
          title="Mood Tracker"
          subtitle="Tracking your mood helps your care team understand your progress"
        />
        <Divider />

        <div className="dashboard-grid" style={{ gap: 32 }}>
          {/* LEFT: TODAY'S CHECK-IN */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.primaryBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Heart size={18} color={theme.primary} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Daily Check-in</h3>
              </div>

              {!saved ? (
                <>
                  <p style={{ fontSize: 15, fontWeight: 600, color: theme.textSecondary, marginBottom: 20 }}>
                    How are you feeling right now?
                  </p>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: 24 }}>
                    {MOODS.map(m => (
                      <button
                        key={m.score}
                        style={{
                          display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "16px 8px",
                          borderRadius: 12, border: `2px solid ${selected === m.score ? m.color : theme.border}`,
                          background: selected === m.score ? m.bg : (theme.isDark ? "rgba(255,255,255,0.02)" : "transparent"),
                          cursor: "pointer", transition: "all 0.2s"
                        }}
                        onClick={() => setSelected(m.score)}
                      >
                        <span style={{ color: selected === m.score ? m.color : theme.textMuted }}>{m.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: selected === m.score ? m.color : theme.textMuted, textTransform: "uppercase" }}>
                          {m.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  <textarea
                    style={{
                      width: "100%", padding: "14px", borderRadius: 12, border: `1px solid ${theme.border}`,
                      fontFamily: theme.fontBody, fontSize: 14, marginBottom: 20, resize: "none", boxSizing: "border-box",
                      background: theme.inputBg, color: theme.textPrimary
                    }}
                    placeholder="Add a brief note about your day... (optional)"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={4}
                  />

                  <PrimaryBtn
                    style={{ width: "100%", padding: "14px" }}
                    onClick={handleSave}
                    disabled={!selected || loading}
                  >
                    {loading ? "Logging..." : "Log My Mood"}
                  </PrimaryBtn>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ marginBottom: 16, color: savedMood?.color }}>
                    {savedMood?.icon ? React.cloneElement(savedMood.icon, { size: 64 }) : <Heart size={64} />}
                  </div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: theme.textPrimary, marginBottom: 8 }}>Mood Logged!</h3>
                  <p style={{ fontSize: 14, color: theme.textSecondary, marginBottom: 24 }}>
                    You're feeling <strong>{savedMood?.label}</strong> today.
                  </p>
                  <Card style={{ background: theme.primaryBg, border: "none", marginBottom: 24 }}>
                    <p style={{ fontSize: 13, color: theme.primary, fontStyle: "italic", margin: 0 }}>
                      "Self-care is how you take your power back."
                    </p>
                  </Card>
                  <div style={{ fontSize: 12, color: theme.textMuted }}>
                    Logged at {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              )}
            </Card>

            <Card style={{ background: theme.heroGradient, color: "white", border: "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <Info size={20} />
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>Why track your mood?</h4>
              </div>
              <p style={{ fontSize: 13, opacity: 0.9, lineHeight: 1.6, margin: 0 }}>
                Consistent tracking helps your doctor spot patterns early and adjust your care plan to ensure you're getting the best support possible.
              </p>
            </Card>
          </div>

          {/* RIGHT: HISTORY & TRENDS */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
                  Average Mood
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: theme.textPrimary }}>{avgScore ?? "—"}</div>
                  {avgMood && <Badge type="warning">{avgMood.label}</Badge>}
                </div>
              </Card>
              <Card>
                <div style={{ fontSize: 12, fontWeight: 700, color: theme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
                  Weekly Trend
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {trend > 0 ? (
                    <TrendingUp color={theme.successText} />
                  ) : trend < 0 ? (
                    <TrendingDown color={theme.dangerText} />
                  ) : (
                    <Minus color={theme.textMuted} />
                  )}
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: trend > 0 ? theme.successText : trend < 0 ? theme.dangerText : theme.textMuted,
                    }}
                  >
                    {trend > 0 ? "Improving" : trend < 0 ? "Declining" : "Stable"}
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Mood History</h3>
                <Badge type="warning">Last 14 Entries</Badge>
              </div>
              <div style={{ width: "100%", height: 300 }}>
                <ResponsiveContainer>
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.border} />
                    <XAxis
                      dataKey="date"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.textMuted, fontSize: 11 }}
                    />
                    <YAxis
                      domain={[1, 5]}
                      ticks={[1, 2, 3, 4, 5]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: theme.textMuted, fontSize: 11 }}
                    />
                    <Tooltip content={<CustomTooltip theme={theme} moods={MOODS} />} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke={theme.primary}
                      strokeWidth={4}
                      dot={{ r: 4, fill: theme.primary, strokeWidth: 0 }}
                      activeDot={{ r: 6, fill: theme.primary, stroke: "#fff", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, marginBottom: 16 }}>Mood Insights</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: theme.primary, marginTop: 6 }} />
                  <p style={{ fontSize: 13, color: theme.textSecondary, margin: 0 }}>
                    Your mood trends over time will appear here as you log entries.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}