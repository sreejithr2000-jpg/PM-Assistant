interface Props {
  crumb: string;
  title: string;
  phase: string;
  blurb: string;
}

// Temporary placeholder used by Phase-0 screen stubs.
// Each screen will be fleshed out in its planned build phase (see ARCHITECTURE.md §8).
export function PagePlaceholder({ crumb, title, phase, blurb }: Props) {
  return (
    <>
      <div className="topbar">
        <div>
          <div className="crumb">{crumb}</div>
          <div className="tt">{title}</div>
        </div>
      </div>
      <div className="content">
        <div className="card reveal d1" style={{ maxWidth: 560 }}>
          <span className="pill peach">{phase}</span>
          <p className="display" style={{ fontWeight: 600, fontSize: 20, letterSpacing: '-.01em', margin: '12px 0 6px' }}>
            {title} — coming together
          </p>
          <p style={{ color: 'var(--ink-2)', fontSize: 15 }}>{blurb}</p>
        </div>
      </div>
    </>
  );
}
