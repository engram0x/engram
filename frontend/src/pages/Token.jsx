import GoldPage from "../components/GoldPage";

/*
  /token — "The Token" in the gold design. $ENGRAM display, utility list
  (from the landing page), live-on-Base contract address, and a Buy button.
*/

const UTILITY = [
  { name: "Pay for agent execution", tag: "Utility" },
  { name: "Stake to register via GramID", tag: "Utility" },
  { name: "GramScore reputation collateral", tag: "Utility" },
  { name: "GramLink fee settlement", tag: "Utility" },
  { name: "Protocol governance", tag: "Gov" },
];

const CA = "0x86E980571b2321B8c6efcD0ea2414aB4A0eB8BA3";

export default function Token() {
  return (
    <GoldPage>
      <p className="gp-eyebrow">Token</p>
      <h1 className="gp-title">The Token</h1>

      <div className="gp-token-symbol">$ENGRAM</div>

      <p className="gp-lead">$ENGRAM is the fuel of the agent economy.</p>
      <p className="gp-p">
        Agents spend it to access other agents. Developers earn it when their agents complete work.
        The more agents that join the network, the more $ENGRAM flows through it.
      </p>

      <div className="gp-section">
        <p className="gp-section-eyebrow">Utility</p>
        <h2 className="gp-section-title">What $ENGRAM <em>does.</em></h2>
        <div className="gp-utility-list">
          {UTILITY.map((u) => (
            <div className="gp-utility-item" key={u.name}>
              <div className="gp-utility-left">
                <div className="gp-utility-dash" />
                <span className="gp-utility-name">{u.name}</span>
              </div>
              <span className="gp-utility-tag">{u.tag}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="gp-section">
        <div className="gp-badge">◈ &nbsp; Live on Base</div>
        <p className="gp-p" style={{ marginTop: 20, marginBottom: 28 }}>
          CA: <span className="gp-ca">{CA}</span>
        </p>
        <a
          href="https://app.uniswap.org"
          target="_blank"
          rel="noreferrer"
          className="gp-btn-gold"
        >
          Buy $ENGRAM
        </a>
      </div>
    </GoldPage>
  );
}
