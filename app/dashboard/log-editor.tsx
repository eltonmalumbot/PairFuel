"use client";

import { useEffect, useMemo, useState } from "react";

type FoodLog = {
  id: string;
  logged_at: string;
  meal: string;
  food_name: string;
  calories: number | string;
  protein: number | string;
  carbs: number | string;
  fat: number | string;
};

type WaterLog = { id: string; logged_on: string; amount_ml: number | string };
type WeightLog = { id: string; logged_on: string; weight: number | string };
type LogsPayload = { food: FoodLog[]; water: WaterLog[]; weight: WeightLog[] };
type Tab = "food" | "water" | "weight";

type EditState =
  | { type: "food"; item: FoodLog }
  | { type: "water"; item: WaterLog }
  | { type: "weight"; item: WeightLog }
  | null;

function jakartaInputValue(value: string) {
  const date = new Date(value);
  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return formatter.format(date).replace(" ", "T");
}

function dateOnly(value: string) {
  return String(value).slice(0, 10);
}

export default function LogEditor() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("food");
  const [logs, setLogs] = useState<LogsPayload>({ food: [], water: [], weight: [] });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [edit, setEdit] = useState<EditState>(null);

  const items = useMemo(() => logs[tab], [logs, tab]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError("");
    fetch("/api/logs", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as LogsPayload & { error?: string };
        if (!response.ok) throw new Error(data.error || "Could not load logs.");
        setLogs({ food: data.food || [], water: data.water || [], weight: data.weight || [] });
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load logs."))
      .finally(() => setLoading(false));
  }, [open]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!edit || saving) return;
    const form = new FormData(event.currentTarget);
    const payload: Record<string, unknown> = { type: edit.type, id: edit.item.id };

    if (edit.type === "food") {
      payload.foodName = form.get("editFoodName");
      payload.meal = form.get("editMeal");
      payload.calories = form.get("editCalories");
      payload.protein = form.get("editProtein");
      payload.carbs = form.get("editCarbs");
      payload.fat = form.get("editFat");
      payload.loggedAt = form.get("editLoggedAt");
    } else if (edit.type === "water") {
      payload.amountMl = form.get("editAmountMl");
      payload.loggedOn = form.get("editLoggedOn");
    } else {
      payload.weight = form.get("editWeight");
      payload.loggedOn = form.get("editLoggedOn");
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/logs", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "Could not save changes.");

      setMessage("Log updated successfully.");
      setEdit(null);
      const refreshed = await fetch("/api/logs", { cache: "no-store" });
      const refreshedData = await refreshed.json() as LogsPayload;
      setLogs(refreshedData);
      window.setTimeout(() => window.location.reload(), 250);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save changes.");
    } finally {
      setSaving(false);
    }
  }

  function close() {
    setOpen(false);
    setEdit(null);
    setError("");
    setMessage("");
  }

  return <>
    <button type="button" className="ghost dashboard-tool-button" onClick={() => setOpen(true)} aria-label="Edit saved PairFuel logs">
      Edit Logs ✏️
    </button>

    {open && <div className="ai-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) close();
    }}>
      <section className="ai-modal log-editor-modal" role="dialog" aria-modal="true" aria-labelledby="log-editor-title">
        <header className="ai-modal-head">
          <div>
            <div className="muted">Correct previously saved entries</div>
            <h2 id="log-editor-title">Edit Logs ✏️</h2>
          </div>
          <button type="button" className="ghost ai-close-button" onClick={close} aria-label="Close log editor">✕</button>
        </header>

        <div className="tabs log-editor-tabs">
          {(["food", "water", "weight"] as Tab[]).map((key) => <button key={key} type="button" className={`tab ${tab === key ? "active" : ""}`} onClick={() => { setTab(key); setEdit(null); }}>
            {key === "food" ? "Food & Macros" : key === "water" ? "Water" : "Weight"}
          </button>)}
        </div>

        {error && <div className="error ai-error">{error}</div>}
        {message && <div className="notice ai-error">{message}</div>}

        {loading ? <p className="muted">Loading logs...</p> : <div className="log-editor-list">
          {items.length === 0 && <p className="muted">No saved entries yet.</p>}

          {tab === "food" && (items as FoodLog[]).map((item) => <div className="log-editor-row" key={item.id}>
            <div>
              <b>{item.food_name}</b>
              <div className="muted">{item.meal} · {new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jakarta", dateStyle: "medium", timeStyle: "short" }).format(new Date(item.logged_at))} WIB</div>
              <div className="muted">{item.calories} kcal · P {item.protein}g · C {item.carbs}g · F {item.fat}g</div>
            </div>
            <button type="button" className="ghost" onClick={() => setEdit({ type: "food", item })}>Edit</button>
          </div>)}

          {tab === "water" && (items as WaterLog[]).map((item) => <div className="log-editor-row" key={item.id}>
            <div><b>{item.amount_ml} ml</b><div className="muted">{dateOnly(item.logged_on)}</div></div>
            <button type="button" className="ghost" onClick={() => setEdit({ type: "water", item })}>Edit</button>
          </div>)}

          {tab === "weight" && (items as WeightLog[]).map((item) => <div className="log-editor-row" key={item.id}>
            <div><b>{item.weight} kg</b><div className="muted">{dateOnly(item.logged_on)}</div></div>
            <button type="button" className="ghost" onClick={() => setEdit({ type: "weight", item })}>Edit</button>
          </div>)}
        </div>}

        {edit && <form className="log-edit-form" onSubmit={save}>
          <h3>Edit {edit.type === "food" ? "Food & Macros" : edit.type === "water" ? "Water" : "Weight"}</h3>

          {edit.type === "food" && <>
            <label className="field">Food<input name="editFoodName" defaultValue={edit.item.food_name} required /></label>
            <label className="field">Meal<select name="editMeal" defaultValue={edit.item.meal}><option>Breakfast</option><option>Lunch</option><option>Dinner</option><option>Snack</option><option>First Meal</option></select></label>
            <div className="form-row">
              <label className="field">Calories<input name="editCalories" type="number" min="0" defaultValue={String(edit.item.calories)} required /></label>
              <label className="field">Date & time (WIB)<input name="editLoggedAt" type="datetime-local" defaultValue={jakartaInputValue(edit.item.logged_at)} required /></label>
            </div>
            <div className="form-row">
              <label className="field">Protein (g)<input name="editProtein" type="number" step="0.1" min="0" defaultValue={String(edit.item.protein)} required /></label>
              <label className="field">Carbs (g)<input name="editCarbs" type="number" step="0.1" min="0" defaultValue={String(edit.item.carbs)} required /></label>
            </div>
            <label className="field">Fat (g)<input name="editFat" type="number" step="0.1" min="0" defaultValue={String(edit.item.fat)} required /></label>
          </>}

          {edit.type === "water" && <div className="form-row">
            <label className="field">Water total (ml)<input name="editAmountMl" type="number" min="0" defaultValue={String(edit.item.amount_ml)} required /></label>
            <label className="field">Date<input name="editLoggedOn" type="date" defaultValue={dateOnly(edit.item.logged_on)} required /></label>
          </div>}

          {edit.type === "weight" && <div className="form-row">
            <label className="field">Weight (kg)<input name="editWeight" type="number" step="0.1" min="1" defaultValue={String(edit.item.weight)} required /></label>
            <label className="field">Date<input name="editLoggedOn" type="date" defaultValue={dateOnly(edit.item.logged_on)} required /></label>
          </div>}

          <div className="log-edit-actions">
            <button type="button" className="ghost" onClick={() => setEdit(null)}>Cancel</button>
            <button className="button" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
          </div>
        </form>}
      </section>
    </div>}
  </>;
}
