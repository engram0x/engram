import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer>
      <Link to="/" className="footer-logo">
        <img
          src="./engram-logo.png"
          alt="Engram"
          style={{ width: 24, height: 24, objectFit: "contain" }}
        />
        <span>Engram</span>
      </Link>
      <ul className="footer-links">
        <li><a href="https://twitter.com/0xEngram" target="_blank" rel="noreferrer">@0xEngram</a></li>
        <li><a href="#">Telegram</a></li>
        <li><a href="#">GitHub</a></li>
        <li><a href="#">Docs</a></li>
      </ul>
      <div className="footer-right">© 2025 Engram · 0xengram.xyz · Base Chain</div>
    </footer>
  );
}
