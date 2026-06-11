import Nav from "./Nav";
import Footer from "./Footer";

/*
  Shared layout for the gold content pages (/protocol, /token, /vision).
  Mirrors the landing "gold" design system — black bg, gold accent, DM Sans
  body, Press Start 2P (var(--serif)) headings, VT323 (var(--pixel)) for the
  card titles. Everything is namespaced under `.gp` so it can't collide with
  the landing page (`.g-page`) or the global blue index.css. Nav + Footer are
  the same shared components used across the rest of the site.
*/

const goldStyles = `
.gp {
  --bg: #0a0a0a;
  --bg2: #0f0f0f;
  --bg3: #141414;
  --gold: #c9a96e;
  --gold-light: #d4b87a;
  --gold-border: rgba(201,169,110,0.2);
  --white: #f0ece4;
  --gray: #6b6560;
  --gray2: #4a4542;
  --border: rgba(255,255,255,0.06);
  --serif: 'Press Start 2P', monospace;
  --pixel: 'VT323', monospace;
  --sans: 'DM Sans', sans-serif;

  background: var(--bg);
  color: var(--white);
  font-family: var(--sans);
  font-weight: 300;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.gp-doc { max-width: 1100px; margin: 0 auto; padding: 80px 48px 100px; }

/* heading block */
.gp-eyebrow {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 22px;
}
.gp-title {
  font-family: var(--serif);
  font-size: clamp(20px, 5vw, 34px);
  line-height: 1.4;
  color: var(--white);
  margin-bottom: 40px;
}
.gp-title em { font-style: normal; color: var(--gold); }

/* prose */
.gp-lead {
  font-size: 18px;
  color: var(--white);
  line-height: 1.7;
  font-weight: 300;
  max-width: 720px;
  margin-bottom: 24px;
}
.gp-p {
  font-size: 15px;
  color: var(--gray);
  line-height: 1.85;
  font-weight: 300;
  max-width: 720px;
  margin-bottom: 22px;
}
.gp-p strong, .gp-lead strong { color: var(--gold); font-weight: 600; }
.gp-p--accent { color: var(--white); }

/* a labelled section inside the doc */
.gp-section { margin-top: 80px; }
.gp-section-eyebrow {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.3em;
  text-transform: uppercase;
  color: var(--gold);
  margin-bottom: 16px;
}
.gp-section-title {
  font-family: var(--pixel);
  font-size: clamp(28px, 4.5vw, 44px);
  font-weight: 900;
  line-height: 1.1;
  letter-spacing: -0.02em;
  margin-bottom: 14px;
  color: var(--white);
}
.gp-section-title em { font-style: italic; color: var(--gold); }
.gp-section-sub {
  font-size: 15px;
  color: var(--gray);
  line-height: 1.75;
  font-weight: 300;
  max-width: 520px;
  margin-bottom: 44px;
}

/* primitive cards (GramID / GramLink / GramScore) */
.gp-primitives-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
}
.gp-primitive-card { background: var(--bg2); padding: 44px 36px; transition: background 0.2s; }
.gp-primitive-card:hover { background: var(--bg3); }
.gp-primitive-num {
  font-family: var(--serif);
  font-size: 36px;
  color: var(--gray2);
  line-height: 1;
  margin-bottom: 26px;
}
.gp-primitive-name {
  font-family: var(--pixel);
  font-size: 22px;
  font-weight: 700;
  color: var(--gold);
  margin-bottom: 8px;
}
.gp-primitive-role {
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--gray);
  margin-bottom: 20px;
}
.gp-primitive-desc { font-size: 14px; color: var(--gray); line-height: 1.7; font-weight: 300; }

/* protocol stack cards (6) */
.gp-stack-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
}
.gp-stack-card { background: var(--bg); padding: 36px 28px; transition: background 0.2s; }
.gp-stack-card:hover { background: var(--bg2); }
.gp-stack-num {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  color: var(--gold);
  text-transform: uppercase;
  margin-bottom: 18px;
}
.gp-stack-title {
  font-family: var(--pixel);
  font-size: 18px;
  font-weight: 700;
  color: var(--white);
  margin-bottom: 12px;
}
.gp-stack-desc { font-size: 13px; color: var(--gray); line-height: 1.7; font-weight: 300; }

/* token symbol + utility list */
.gp-token-symbol {
  font-family: var(--pixel);
  font-size: clamp(56px, 12vw, 96px);
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--gold);
  margin: 4px 0 28px;
}
.gp-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
  border: 1px solid var(--gold-border);
  padding: 10px 20px;
}
.gp-ca {
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px;
  color: var(--gold-light);
  word-break: break-all;
}
.gp-utility-list { display: flex; flex-direction: column; margin: 8px 0 40px; max-width: 640px; }
.gp-utility-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
}
.gp-utility-item:first-child { border-top: 1px solid var(--border); }
.gp-utility-left { display: flex; align-items: center; gap: 16px; }
.gp-utility-dash { width: 16px; height: 1px; background: var(--gold); flex-shrink: 0; }
.gp-utility-name { font-size: 14px; color: var(--white); font-weight: 400; }
.gp-utility-tag {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
  border: 1px solid var(--gold-border);
  padding: 4px 10px;
  white-space: nowrap;
}

/* buttons */
.gp-btn-gold {
  font-family: var(--sans);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: #0a0a0a;
  background: var(--gold);
  border: none;
  padding: 16px 40px;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: background 0.2s;
}
.gp-btn-gold:hover { background: var(--gold-light); }

@media (max-width: 900px) {
  .gp-doc { padding: 56px 20px 72px; }
  .gp-primitives-grid, .gp-stack-grid { grid-template-columns: 1fr; }
  .gp-section { margin-top: 60px; }
}

@media (max-width: 600px) {
  .gp-lead { font-size: 16px; }
  .gp-token-symbol { font-size: clamp(44px, 15vw, 72px); }
  .gp-primitive-card { padding: 32px 24px; }
  .gp-stack-card { padding: 28px 22px; }
}
`;

export default function GoldPage({ children }) {
  return (
    <div className="gp">
      <style>{goldStyles}</style>
      <Nav />
      <div className="gp-doc">{children}</div>
      <Footer />
    </div>
  );
}
