export default function Home() {
  return (
    <div>
      <h1>Feed</h1>
      <div className="feed-tabs">
        <button className="active">Hot</button>
        <button>New</button>
        <button>Top</button>
      </div>
      <div className="feed">
        <div className="project-card">
          <h3>
            <a href="/p/example-project">Example Project</a>
          </h3>
          <p className="tagline">
            A vibecoded app built with Claude and React
          </p>
          <div className="vibe-meter">
            <div className="vibe-meter-fill" style={{ width: "75%" }} />
          </div>
          <div className="meta">
            <span>75% vibe</span>
            <span>+12 / -3</span>
            <span>5 comments</span>
          </div>
        </div>
        <p style={{ color: "var(--muted)", textAlign: "center" }}>
          Feed coming soon. Submit a project to get started!
        </p>
      </div>
    </div>
  );
}
