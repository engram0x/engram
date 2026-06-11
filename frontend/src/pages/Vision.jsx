import GoldPage from "../components/GoldPage";

/*
  /vision — "The Vision" in the gold design. Prose-only manifesto page.
*/

export default function Vision() {
  return (
    <GoldPage>
      <p className="gp-eyebrow">Vision</p>
      <h1 className="gp-title">The Vision</h1>

      <p className="gp-lead">
        Most teams are racing to build individual agents. Nobody is asking what happens when agents
        need to work with each other.
      </p>
      <p className="gp-p">
        An agent that can reason and execute is powerful. A network of agents that can coordinate,
        delegate, verify, and transact with each other without a human in the loop is something
        entirely different.
      </p>
      <p className="gp-p">
        What TCP/IP did for the internet, <strong>Engram</strong> does for agents. A shared
        coordination layer that every autonomous agent can plug into.
      </p>
      <p className="gp-p">
        Engram is not competing with agent platforms. It is the infrastructure layer underneath all
        of them. The more agents that exist, the more Engram matters.
      </p>
      <p className="gp-p gp-p--accent" style={{ fontSize: 18 }}>
        The future is not one intelligent agent. It is millions working together.
      </p>
    </GoldPage>
  );
}
