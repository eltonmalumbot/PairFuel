"use client";

import { useEffect, useMemo, useState } from "react";

type StoryType = "daily" | "together";
type Theme = "green" | "pink" | "blue";

type StoryShareProps = {
  showTogether: boolean;
};

export default function StoryShare({ showTogether }: StoryShareProps) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<StoryType>("daily");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [previewNonce, setPreviewNonce] = useState(0);
  const [theme, setTheme] = useState<Theme>("green");

  const url = `/api/story/${type}?theme=${theme}`;
  const previewUrl = useMemo(() => `${url}&preview=${previewNonce}`, [url, previewNonce]);

  useEffect(() => {
    if (!open) setMessage("");
  }, [open]);

  useEffect(() => {
    function syncTheme() {
      const current = document.documentElement.dataset.theme;
      if (current === "green" || current === "pink" || current === "blue") setTheme(current);
    }

    syncTheme();
    window.addEventListener("pairfuel-theme-change", syncTheme);
    return () => window.removeEventListener("pairfuel-theme-change", syncTheme);
  }, []);

  function chooseType(nextType: StoryType) {
    setType(nextType);
    setPreviewNonce((value) => value + 1);
    setMessage("");
  }

  async function fetchStoryBlob() {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`Could not generate story (${response.status})`);
    return response.blob();
  }

  async function downloadStory() {
    setBusy(true);
    setMessage("");
    try {
      const blob = await fetchStoryBlob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `pairfuel-${type}-story.png`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);
      setMessage("Story image downloaded ✓");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not download story");
    } finally {
      setBusy(false);
    }
  }

  async function shareStory() {
    setBusy(true);
    setMessage("");
    try {
      const blob = await fetchStoryBlob();
      const file = new File([blob], `pairfuel-${type}-story.png`, { type: "image/png" });
      const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };

      if (navigator.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
        await navigator.share({
          title: "PairFuel Story",
          text: type === "daily" ? "My PairFuel progress 💚" : "Our PairFuel progress 💑",
          files: [file],
        });
        setMessage("Share sheet opened ✓");
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = objectUrl;
        anchor.download = `pairfuel-${type}-story.png`;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        URL.revokeObjectURL(objectUrl);
        setMessage("Direct image sharing is not supported here, so the PNG was downloaded instead.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage(error instanceof Error ? error.message : "Could not share story");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="panel story-launcher">
        <div>
          <div className="pill">IG Story</div>
          <h2>Flex your progress 📸</h2>
          <p className="muted">Preview a 9:16 PairFuel story card, then download or share it from your device.</p>
        </div>
        <button className="button" type="button" onClick={() => { setOpen(true); setPreviewNonce((value) => value + 1); }}>Create Story</button>
      </div>

      {open && (
        <div className="story-modal-backdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <div className="story-modal" role="dialog" aria-modal="true" aria-label="PairFuel story preview" onMouseDown={(event) => event.stopPropagation()}>
            <div className="story-modal-head">
              <div>
                <div className="pill">PairFuel Story Studio</div>
                <h2>Preview your story</h2>
              </div>
              <button className="ghost" type="button" onClick={() => setOpen(false)}>Close</button>
            </div>

            <div className="story-type-switcher">
              <button className={`tab ${type === "daily" ? "active" : ""}`} type="button" onClick={() => chooseType("daily")}>Daily Progress 🔥</button>
              <button className={`tab ${type === "together" ? "active" : ""}`} type="button" onClick={() => chooseType("together")} disabled={!showTogether}>Together 💑</button>
            </div>

            {!showTogether && type === "daily" && <p className="muted">Connect a partner to unlock Together Story.</p>}

            <div className="story-preview-shell">
              <img className="story-preview-image" src={previewUrl} alt={`${type} PairFuel story preview`} />
            </div>

            <div className="story-modal-actions">
              <button className="ghost" type="button" onClick={() => setPreviewNonce((value) => value + 1)} disabled={busy}>Refresh preview</button>
              <a className="ghost" href={url} target="_blank" rel="noreferrer">Open full image</a>
              <button className="ghost" type="button" onClick={downloadStory} disabled={busy}>{busy ? "Working..." : "Download PNG"}</button>
              <button className="button" type="button" onClick={shareStory} disabled={busy}>{busy ? "Working..." : "Share Story"}</button>
            </div>
            {message && <div className="notice story-message">{message}</div>}
          </div>
        </div>
      )}
    </>
  );
}
