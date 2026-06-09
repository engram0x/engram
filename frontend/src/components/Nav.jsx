import { Link, useLocation } from "react-router-dom";
import WalletConnect from "./WalletConnect";

/*
  Shared top nav for the /app and /protocol pages, styled to match the gold
  landing design (black background, gold accent, Press Start 2P + DM Sans).
  Styles are self-contained and namespaced under `.egnav` (rendered on a <div>,
  not <nav>) so the global blue rules in index.css can't apply. The
  `.egnav .btn-primary-sm / .addr-pill` overrides recolor the WalletConnect
  button to gold without touching that component.
*/

const navStyles = `
.egnav {
  --gold: #c9a96e;
  --gold-light: #d4b87a;
  --gold-border: rgba(201,169,110,0.2);
  --white: #f0ece4;
  --gray: #6b6560;
  --border: rgba(255,255,255,0.06);

  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
  height: 68px;
  border-bottom: 1px solid var(--border);
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(10,10,10,0.95);
  backdrop-filter: blur(12px);
  font-family: 'DM Sans', sans-serif;
}

.egnav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}
.egnav-logo img { width: 28px; height: 28px; object-fit: contain; }
.egnav-logo-text {
  font-size: 13px;
  font-weight: 600;
  color: var(--white);
  letter-spacing: 0.25em;
  text-transform: uppercase;
}

.egnav-links { display: flex; gap: 40px; list-style: none; margin: 0; padding: 0; }
.egnav-links a {
  color: var(--gray);
  text-decoration: none;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  transition: color 0.2s;
  cursor: pointer;
}
.egnav-links a:hover { color: var(--gold); }

.egnav-right { display: flex; align-items: center; gap: 16px; }

/* Recolor the WalletConnect button (index.css classes) to gold inside the nav */
.egnav .btn-primary-sm {
  background: var(--gold);
  color: #0a0a0a;
  border: none;
  border-radius: 0;
  padding: 9px 20px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  font-family: 'DM Sans', sans-serif;
}
.egnav .btn-primary-sm:hover { background: var(--gold-light); transform: none; }

.egnav .addr-pill {
  background: transparent;
  border: 1px solid var(--gold-border);
  color: var(--white);
  border-radius: 0;
  padding: 9px 18px;
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  font-family: 'DM Sans', sans-serif;
}
.egnav .addr-pill .dot { background: var(--gold); }

@media (max-width: 900px) {
  .egnav { padding: 0 20px; }
  .egnav-links { display: none; }
}
`;

export default function Nav() {
  const { pathname } = useLocation();
  const onLanding = pathname === "/";

  return (
    <div className="egnav">
      <style>{navStyles}</style>

      <Link to="/" className="egnav-logo">
        <img src="./engram-logo.png" alt="Engram" />
        <span className="egnav-logo-text">Engram</span>
      </Link>

      <ul className="egnav-links">
        {onLanding ? (
          <>
            <li><a href="#primitives">Protocol</a></li>
            <li><a href="#token">Token</a></li>
            <li><a href="#vision">Vision</a></li>
          </>
        ) : (
          <>
            <li><Link to="/app">App</Link></li>
            <li><Link to="/terminal">Terminal</Link></li>
            <li><Link to="/protocol">Protocol</Link></li>
            <li><Link to="/">Home</Link></li>
          </>
        )}
      </ul>

      <div className="egnav-right">
        {onLanding ? (
          <>
            <Link to="/app" className="btn-primary-sm">Launch App</Link>
            <WalletConnect />
          </>
        ) : (
          <WalletConnect />
        )}
      </div>
    </div>
  );
}
