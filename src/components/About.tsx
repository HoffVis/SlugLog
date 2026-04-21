import { SlugMood } from "./SlugMood";
import type { SlugMoodType } from "./SlugMood";
import slugLogo from "../assets/slug-logo.png";
import "./About.css";

const SLUG_STATES: { mood: SlugMoodType; label: string; trigger: string }[] = [
  { mood: "amazed", label: "Amazed", trigger: "8+ hours logged" },
  { mood: "impressed", label: "Impressed", trigger: "6–8 hours logged" },
  { mood: "happy", label: "Happy", trigger: "4–6 hours logged" },
  { mood: "worried", label: "Worried", trigger: "1 working day without logging" },
  { mood: "judgemental", label: "Judgemental", trigger: "2 days without logging" },
  { mood: "existential", label: "Existential Crisis", trigger: "3 days without logging" },
  { mood: "hungry", label: "Hungry", trigger: "4–5 days without logging" },
  { mood: "dying", label: "Dying", trigger: "6–9 days without logging" },
  { mood: "ghost", label: "Ghost", trigger: "10+ days without logging" },
  { mood: "vacation", label: "Vacation", trigger: "Vacation mode" },
];

export function About() {
  return (
    <div className="about">
      {/* Hero */}
      <div className="about-hero">
        <img src={slugLogo} alt="SlugLog" className="about-hero-logo" />
        <div>
          <h1 className="about-title">SlugLog</h1>
          <p className="about-version">v0.1.0 — Dev Journal & Timetracker</p>
        </div>
      </div>

      <p className="about-tagline">
        For people who do great work but forget to write it down.
        A dev journal that doubles as a timesheet cheat-sheet — because
        "what did I even do this week?" shouldn't be a Friday crisis.
      </p>

      {/* How it works */}
      <section className="about-section">
        <h2>How it works</h2>
        <div className="about-features">
          <div className="about-feature">
            <div className="about-feature-icon">sLog</div>
            <h3>Weekly Timeline</h3>
            <p>Your week at a glance — entries shown as a git-graph style timeline. Click any day to see details and edit entries. Use the quick-add bar to log something in seconds.</p>
          </div>
          <div className="about-feature">
            <div className="about-feature-icon">sBoard</div>
            <h3>Ticket Board</h3>
            <p>Simple kanban board — To Do, In Progress, Done. Start a timer on any ticket, and when you stop it, the hours are automatically logged to the sLog. One timer at a time, auto-stops the previous.</p>
          </div>
          <div className="about-feature">
            <div className="about-feature-icon">sProjects</div>
            <h3>Project Config</h3>
            <p>Set up your projects with names, project numbers, and default task areas. When a ticket is linked to a project, the details carry over to the log entry automatically.</p>
          </div>
        </div>
      </section>

      {/* The Slug */}
      <section className="about-section">
        <h2>The Slug</h2>
        <p className="about-text">
          Every timetracker you've tried felt like homework. The slug is different.
          It doesn't nag you with notifications or guilt-trip you with dashboards.
          It just sits there, slowly dying if you don't feed it. Turns out, that's
          the only motivation that actually works — not a system to follow, but a
          creature to keep alive.
        </p>
      </section>

      {/* Slug Gallery */}
      <section className="about-section">
        <h2>Slug Moods</h2>
        <div className="slug-gallery">
          {SLUG_STATES.map((s) => (
            <div key={s.mood} className="slug-gallery-item">
              <SlugMood mood={s.mood} showMessage={false} size="small" />
              <div className="slug-gallery-label">{s.label}</div>
              <div className="slug-gallery-trigger">{s.trigger}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Slug Budget */}
      <section className="about-section">
        <h2>Slug Budget</h2>
        <p className="about-text">
          When you stop a timer, the slug doesn't just log the raw elapsed time.
          It checks your daily budget (default 8h with 1h air) and caps the proposed
          hours to fit. Because nobody actually works 8 focused hours in a day, and
          pretending otherwise helps no one. The slug keeps it honest, so you don't
          have to feel bad about being human.
        </p>
      </section>

      {/* Synced indicator */}
      <section className="about-section">
        <h2>Sync Indicator</h2>
        <p className="about-text">
          Hover over any entry in the timeline to see a small checkbox. Click it to mark
          the entry as "synced" — meaning you've transferred it to your timesheet,
          invoice, or wherever it needs to go. Synced entries fade out so you can see
          at a glance what's been handled and what hasn't.
        </p>
      </section>

      {/* Tray */}
      <section className="about-section">
        <h2>Tray Popup</h2>
        <p className="about-text">
          The slug lives in your menu bar. Click it for a quick-add popup — log something
          in seconds without opening the full app. See today's entries and the week bar
          at a glance. The app stays running when you close the window.
        </p>
      </section>

      <div className="about-philosophy">
        <h2>Philosophy</h2>
        <div className="about-philosophy-items">
          <div className="about-philosophy-item">
            <strong>Two fields, not twenty.</strong> Description and hours. Everything else is optional. If logging feels like work, you won't do it.
          </div>
          <div className="about-philosophy-item">
            <strong>Messy is fine.</strong> Forgot the project name? Log it anyway. You can fix it later. A vague entry is infinitely better than no entry.
          </div>
          <div className="about-philosophy-item">
            <strong>Not a system. A companion.</strong> No workflows to learn. No processes to follow. Just you, a slug, and whatever you managed to get done today.
          </div>
        </div>
      </div>

      <div className="about-faq">
        <em>"But why a slug?"</em> — If you're asking that, you're asking the only wrong question.
      </div>

      <div className="about-footer">
        Made with caffeine and a pirate slug.
      </div>
    </div>
  );
}
