import React, { useState, useEffect, useMemo } from "react";

const STATUS_LABELS = [
  "◎", // 完全に覚えた
  "⚪︎", // だいたいOK
  "△", // 微妙
  "×", // 全くダメ
  "-"  // 重要でないから無視する
];
const STATUS_LABELS_TEXT = [
  "◎ 完全に覚えた",
  "⚪︎ だいたいOK",
  "△ 微妙",
  "× 全くダメ",
  "- 重要でないから無視する"
];

export default function WordList() {
  const [data, setData] = useState([]); // Raw data from JSON
  const [status, setStatus] = useState({}); // Status data from server
  const [show, setShow] = useState({}); // Visibility state for answers
  const [filter, setFilter] = useState([true, true, true, true, true]); // 5-level filter
  const [sortType, setSortType] = useState("json"); // "json" | "random" | "status"
  const [search, setSearch] = useState(""); // Search query
  const [tab, setTab] = useState("sentence"); // sentence, word, pinyin, jp
  
  // Notifications
  const [saveStatus, setSaveStatus] = useState(false);
  const [saveError, setSaveError] = useState(false);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [wordsRes, statusRes] = await Promise.all([
          fetch(import.meta.env.VITE_API_BASE_URL + "/words"),
          fetch(import.meta.env.VITE_API_BASE_URL + "/status")
        ]);

        if (wordsRes.ok) {
          const wordsData = await wordsRes.json();
          if (Array.isArray(wordsData)) {
            setData(wordsData);
          }
        }

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setStatus(statusData || {});
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };
    fetchData();
  }, []);

  const handleShow = (id) => setShow((s) => ({ ...s, [id]: !s[id] }));

  const handleStatus = async (id, val) => {
    const nextStatus = { ...status, [id]: val };
    setStatus(nextStatus);

    try {
      const res = await fetch(import.meta.env.VITE_API_BASE_URL + "/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextStatus)
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus(true);
      setTimeout(() => setSaveStatus(false), 1000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveError(true);
      setTimeout(() => setSaveError(false), 1000);
    }
  };

  // Flatten data based on tab
  const items = useMemo(() => {
    if (!data.length) return [];
    
    let flatItems = [];
    if (tab === "sentence") {
      data.forEach((entry, idx) => {
        (entry.登場例文 || []).forEach((ex, exIdx) => {
          flatItems.push({
            id: `${idx}_${exIdx}`,
            primary: ex.中国語,
            secondary: (
              <div>
                <div>拼音: {ex.拼音}</div>
                <div>日本語訳: {ex.日本語訳}</div>
              </div>
            ),
            meta: `単語: ${entry.単語} / 品詞: ${entry.品詞}`,
            searchTarget: [ex.中国語, ex.拼音, ex.日本語訳, entry.単語].join(" "),
            original: { ...ex, parent: entry }
          });
        });
      });
    } else {
      const prefixes = { word: "w", pinyin: "p", jp: "j" };
      flatItems = data.map((entry, idx) => {
        const id = `${prefixes[tab]}_${idx}`;
        let primary, secondary;
        
        if (tab === "word") {
          primary = entry.単語;
          secondary = (
             <div style={{ color: "#555" }}>
                <span style={{ marginRight: 16 }}>拼音: <b>{entry.拼音}</b></span>
                <span style={{ marginRight: 16 }}>日本語訳: <b>{entry.日本語訳}</b></span>
                <span>品詞: <b>{entry.品詞}</b></span>
             </div>
          );
        } else if (tab === "pinyin") {
          primary = entry.拼音;
          secondary = (
            <div>
              <div>単語: {entry.単語}</div>
              <div>日本語訳: {entry.日本語訳}</div>
            </div>
          );
        } else if (tab === "jp") {
          primary = entry.日本語訳;
          secondary = (
            <div>
              <div>単語: {entry.単語}</div>
              <div>拼音: {entry.拼音}</div>
            </div>
          );
        }

        return {
          id,
          primary,
          secondary,
          meta: `品詞: ${entry.品詞}`,
          searchTarget: [entry.単語, entry.拼音, entry.日本語訳].join(" "),
          original: entry
        };
      });
    }
    return flatItems;
  }, [data, tab]);

  // Stable Random Sort
  const [randomSeed, setRandomSeed] = useState(0);

  useEffect(() => {
    if (sortType === "random") {
      setRandomSeed(Math.random());
    }
  }, [sortType]);

  const shuffledItems = useMemo(() => {
    if (sortType !== "random") return [];
    const shuffled = [...items];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [items, randomSeed, sortType]);

  // Filter and Sort
  const displayItems = useMemo(() => {
    let baseList = items;
    if (sortType === "random") {
      baseList = shuffledItems;
    }

    let result = baseList.filter(item => {
      const st = status[item.id] ?? -1;
      // Filter by status
      if (!filter[st] && st !== -1) return false;
      // Filter by search
      if (search && !item.searchTarget.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });

    if (sortType === "status") {
      result.sort((a, b) => {
        const sa = status[a.id] ?? 99;
        const sb = status[b.id] ?? 99;
        return sa - sb;
      });
    }
    
    return result;
  }, [items, shuffledItems, status, filter, search, sortType]);

  // Reset show state on tab change
  useEffect(() => {
    setShow({});
  }, [tab]);

  return (
    <div>
      {/* Notifications */}
      {saveStatus && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#1976d2", color: "#fff", padding: "8px 24px", borderRadius: 8,
          boxShadow: "0 2px 8px #0002", zIndex: 1000
        }}>
          保存しました
        </div>
      )}
      {saveError && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)",
          background: "#d32f2f", color: "#fff", padding: "8px 24px", borderRadius: 8,
          boxShadow: "0 2px 8px #0002", zIndex: 1000
        }}>
          保存に失敗しました
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { key: "sentence", label: "例文" },
          { key: "word", label: "単語" },
          { key: "pinyin", label: "拼音" },
          { key: "jp", label: "日本語訳" }
        ].map(t => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            style={{
              background: tab === t.key ? "#1976d2" : "#eee",
              color: tab === t.key ? "#fff" : "#333",
              border: "none", borderRadius: 4, padding: "6px 16px", cursor: "pointer"
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ marginRight: 8 }}>並び替え:</label>
        <select
          value={sortType}
          onChange={e => setSortType(e.target.value)}
          style={{ padding: "4px 12px", fontSize: 16, borderRadius: 4, border: "1px solid #ccc" }}
        >
          <option value="json">json順</option>
          <option value="random">ランダム</option>
          <option value="status">暗記度順</option>
        </select>
      </div>

      {/* Filter */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        {STATUS_LABELS.map((label, i) => (
          <button
            key={i}
            onClick={() => setFilter(f => f.map((v, idx) => idx === i ? !v : v))}
            style={{
              background: filter[i] ? "#1976d2" : "#eee",
              color: filter[i] ? "#fff" : "#333",
              border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer"
            }}
            title={STATUS_LABELS_TEXT[i]}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="検索ワードを入力"
          style={{ width: "100%", padding: "8px", fontSize: 16, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box" }}
        />
      </div>

      {/* List */}
      <ul style={{ listStyle: "none", padding: 0 }}>
        {displayItems.map((item) => (
          <li key={item.id} style={{ background: "#f9f9f9", margin: "8px 0", padding: 16, borderRadius: 8, boxShadow: "0 1px 4px #0001" }}>
            <div style={{ fontWeight: "bold", fontSize: 18 }}>{item.primary}</div>
            <button onClick={() => handleShow(item.id)} style={{ margin: "8px 0", cursor: "pointer" }}>
              {show[item.id] ? "隠す" : "詳細を表示"}
            </button>
            {show[item.id] && (
              <div style={{ margin: "8px 0" }}>
                {item.secondary}
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              {STATUS_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => handleStatus(item.id, i)}
                  style={{
                    marginRight: 8,
                    background: status[item.id] === i ? "#1976d2" : "#eee",
                    color: status[item.id] === i ? "#fff" : "#333",
                    border: "none", borderRadius: 4, padding: "4px 10px", cursor: "pointer"
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {item.meta && <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>{item.meta}</div>}
          </li>
        ))}
      </ul>
    </div>
  );
}
