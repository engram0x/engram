import { Link, useLocation } from "react-router-dom";
import WalletConnect from "./WalletConnect";

export default function Nav() {
  const { pathname } = useLocation();
  const onLanding = pathname === "/";

  return (
    <nav>
      <Link to="/" className="nav-logo">
        <div className="nav-logo-icon">
          <img src="./engram-logo.png" alt="Engram" />
        </div>
        <span>Engram</span>
      </Link>

      <ul className="nav-links">
        {onLanding ? (
          <>
            <li><a href="#primitives">Protocol</a></li>
            <li><a href="#token">Token</a></li>
            <li><a href="#vision">Vision</a></li>
          </>
        ) : (
          <>
            <li><Link to="/app">App</Link></li>
            <li><Link to="/protocol">Protocol</Link></li>
            <li><Link to="/">Home</Link></li>
          </>
        )}
      </ul>

      <div className="nav-right">
        {onLanding ? (
          <>
            <Link to="/app" className="btn-ghost-sm">Launch App</Link>
            <WalletConnect />
          </>
        ) : (
          <WalletConnect />
        )}
      </div>
    </nav>
  );
}
