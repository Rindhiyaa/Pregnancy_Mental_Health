import React, { useState } from "react";
import PatientSidebar from "../../components/PatientSidebar";
import {
  Brain,
  Wind,
  Moon,
  MessageCircle,
  Apple,
  Sparkles,
  Phone,
  Heart,
  Info
} from 'lucide-react';
import { useTheme } from "../../ThemeContext";
import { PageTitle, Divider, Card, Badge, PrimaryBtn, OutlineBtn } from "../../components/UI";

const RESOURCES = [
  {
    id: 1,
    tag: "Education",
    title: "What is PPD?",
    desc: "Understanding postpartum depression and its common symptoms.",
    icon: <Brain size={26} color="#8B5CF6" />,
    content: `Postpartum depression is a mood disorder affecting mothers after childbirth. It goes beyond "baby blues" — it includes persistent sadness, fatigue, anxiety, and difficulty bonding. It is very treatable and you are absolutely not alone in this.`,
  },
  {
    id: 2,
    tag: "Coping",
    title: "Breathing Exercises",
    desc: "5 simple techniques for anxiety relief during pregnancy.",
    icon: <Wind size={26} color="#3B82F6" />,
    content: `Try the 4-7-8 method: Inhale 4 seconds, hold 7 seconds, exhale 8 seconds. Repeat 4 times. Box breathing also helps — 4 seconds each for inhale, hold, exhale, hold. Practice twice daily for best results.`,
  },
  {
    id: 3,
    tag: "Health",
    title: "Sleep Tips",
    desc: "How to get better rest while your body is changing.",
    icon: <Moon size={26} color="#F59E0B" />,
    content: `Sleep on your left side to improve blood flow. Use a pregnancy pillow for support. Avoid screens 1 hour before bed. Keep a consistent sleep schedule. Short 20-minute naps during the day are safe and helpful.`,
  },
  {
    id: 4,
    tag: "Relationships",
    title: "Talk to Your Partner",
    desc: "How to express your feelings and ask for support.",
    icon: <MessageCircle size={26} color="#EF4444" />,
    content: `Share feelings honestly using "I feel..." statements. Ask for specific help — "Can you handle the 2am feed?" works better than vague requests. Schedule daily check-ins with your partner. Connection is healing.`,
  },
  {
    id: 5,
    tag: "Nutrition",
    title: "Mood-Boosting Foods",
    desc: "Foods that naturally support your mental wellbeing.",
    icon: <Apple size={26} color="#10B981" />,
    content: `Omega-3 rich foods like salmon and walnuts reduce depression symptoms. Dark leafy greens boost folate. Bananas increase serotonin naturally. Stay well hydrated — dehydration worsens anxiety significantly.`,
  },
  {
    id: 6,
    tag: "Mindfulness",
    title: "5-Minute Meditation",
    desc: "Simple mindfulness practices for busy new mothers.",
    icon: <Sparkles size={26} color="#EC4899" />,
    content: `Sit comfortably, close your eyes. Focus only on your breath — each inhale and exhale. When thoughts arise, gently return to breathing. Just 5 minutes daily significantly reduces anxiety and improves mood over time.`,
  },
];

const HELPLINES = [
  { name: "iCall", number: "9152987821", lang: "English / Hindi" },
  { name: "Vandrevala Found.", number: "1860-2662-345", lang: "24/7 all languages" },
  { name: "AASRA", number: "9820466627", lang: "24/7" },
  { name: "iCall Tamil", number: "044-24640050", lang: "Tamil" },
];

export default function Resources() {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: theme.pageBg, fontFamily: theme.fontBody }}>
      <PatientSidebar />

      <main style={{
        flex: 1,
        marginLeft: 260,
        padding: "40px 48px",
        width: "calc(100% - 260px)",
        boxSizing: "border-box"
      }}>

        <PageTitle
          title="Resources For You"
          subtitle="Curated support for your mental health journey"
        />
        <Divider />

        {/* ── RESOURCE GRID ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 40 }}>
          {RESOURCES.map((r) => (
            <Card key={r.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: theme.pageBg, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${theme.cardBorder}` }}>
                  {r.icon}
                </div>
                <Badge type="warning">{r.tag}</Badge>
              </div>

              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.textPrimary, margin: "0 0 8px 0" }}>{r.title}</h3>
                <p style={{ fontSize: 12, color: theme.textSecondary, margin: 0, lineHeight: 1.5 }}>{r.desc}</p>
              </div>

              {expanded === r.id && (
                <div style={{ fontSize: 13, color: theme.textPrimary, lineHeight: 1.6, padding: "12px", background: theme.primaryBg, borderRadius: 8, border: `1px solid ${theme.primaryLight}30` }}>
                  {r.content}
                </div>
              )}

              <OutlineBtn
                style={{ width: "100%", padding: "8px 16px", fontSize: 12 }}
                onClick={() => setExpanded(expanded === r.id ? null : r.id)}
              >
                {expanded === r.id ? "Show Less ↑" : "Read More →"}
              </OutlineBtn>
            </Card>
          ))}
        </div>

        {/* ── HELPLINE SECTION ── */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: theme.dangerBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Phone size={18} color={theme.dangerText} />
            </div>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.textPrimary, margin: 0 }}>Need Immediate Help?</h3>
              <p style={{ fontSize: 13, color: theme.textMuted, margin: 0 }}>Reach out — support is always available 24/7</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20 }}>
            {HELPLINES.map((h) => (
              <Card key={h.name} style={{ textAlign: "center", padding: "24px 16px" }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: theme.textPrimary, marginBottom: 4 }}>{h.name}</div>
                <div style={{ fontSize: 16, fontWeight: 800, color: theme.primary, marginBottom: 4 }}>{h.number}</div>
                <div style={{ fontSize: 11, color: theme.textMuted, marginBottom: 16 }}>{h.lang}</div>
                <PrimaryBtn style={{ width: "100%", padding: "8px", fontSize: 11 }} onClick={() => window.location.href = `tel:${h.number}`}>
                  Call Now
                </PrimaryBtn>
              </Card>
            ))}
          </div>
        </div>

        {/* ── BOTTOM MESSAGE ── */}
        <Card style={{ background: theme.primaryBg, border: `1.5px dashed ${theme.primary}50`, textAlign: "center", padding: "32px" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: theme.cardBg, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
            <Heart size={24} color={theme.primary} />
          </div>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: theme.primary, marginBottom: 8 }}>You are taking a brave step</h3>
          <p style={{ fontSize: 14, color: theme.textSecondary, margin: 0 }}>By learning and seeking support, you are prioritizing your wellbeing. <strong style={{ color: theme.primary }}>You are not alone.</strong></p>
        </Card>

      </main>
    </div>
  );
}



