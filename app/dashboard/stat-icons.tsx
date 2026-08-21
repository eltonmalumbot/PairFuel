type StatIconKind = "calories" | "protein" | "water" | "partner";

export default function StatIcon({ kind }: { kind: StatIconKind }) {
  if (kind === "calories") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.7 2.2c.4 3-1.2 4.4-2.6 5.7-1.2 1.1-2.2 2.1-2.2 4 0 1 .5 1.9 1.3 2.5-.1-2 .7-3.4 2.6-4.8-.1 2.3 2.4 3.3 2.4 5.7 0 1.8-1.4 3.2-3.2 3.2A6.5 6.5 0 0 1 5.5 12c0-3.6 2.1-6.7 5.5-9.4-.1 2 .5 3 1.2 3.6.9-1.1 1.4-2.4 1.5-4Z" fill="currentColor"/><path d="M12.1 21.7a4.2 4.2 0 0 0 4.2-4.2c0-1.3-.5-2.4-1.5-3.5-.2 2.1-1.2 2.8-2.1 3.4-.7.5-1.3.9-1.3 1.9 0 .8.3 1.6.7 2.4Z" fill="currentColor" opacity=".58"/></svg>;
  }

  if (kind === "protein") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8.2v7.6M7 6.3v11.4M17 6.3v11.4M20 8.2v7.6M7 12h10" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"/></svg>;
  }

  if (kind === "water") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8S5.8 9.7 5.8 14.5a6.2 6.2 0 0 0 12.4 0C18.2 9.7 12 2.8 12 2.8Z" fill="currentColor"/><path d="M9 15.1c.3 1.7 1.3 2.6 3 2.8" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" opacity=".72"/></svg>;
  }

  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.5 4.2 13A5.2 5.2 0 0 1 11.6 5.7l.4.5.4-.5A5.2 5.2 0 1 1 19.8 13L12 20.5Z" fill="currentColor"/></svg>;
}
