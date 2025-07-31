import React, { useState, useEffect } from "react";


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
  const [words, setWords] = useState([]); // 例文カード
  const [order, setOrder] = useState([]);
  const [wordCards, setWordCards] = useState([]); // 単語カード
  const [wordOrder, setWordOrder] = useState([]); 
  const [randomOrder, setRandomOrder] = useState([]); // ランダム順保存用
  const [randomWordOrder, setRandomWordOrder] = useState([]);
  const [randomPinyinOrder, setRandomPinyinOrder] = useState([]);
  const [randomJpOrder, setRandomJpOrder] = useState([]);
  const [pinyinCards, setPinyinCards] = useState([]); // 拼音カード
  const [pinyinOrder, setPinyinOrder] = useState([]);
  const [jpCards, setJpCards] = useState([]); // 日本語訳カード
  const [jpOrder, setJpOrder] = useState([]);
  const [status, setStatus] = useState({}); // サーバーから取得
  const [show, setShow] = useState({});
  const [filter, setFilter] = useState([true, true, true, true, true]); // 5段階トグル
  const [sortType, setSortType] = useState("json"); // "json" | "random" | "status"
  const [search, setSearch] = useState(""); // 追加: 検索ワード
  const [tab, setTab] = useState("sentence"); // sentence, word, pinyin, jp
  // 保存完了通知
  const [saveStatus, setSaveStatus] = useState(false);


  // サーバーから単語データ・暗記度データを取得
  useEffect(() => {
    // 単語データ
    fetch("/api/words")
      .then(res => res.json())
      .then(data => {
        // 例文カード
        let items = [];
        data.forEach((entry, idx) => {
          (entry.登場例文 || []).forEach((ex, exIdx) => {
            items.push({
              単語: entry.単語,
              拼音: entry.拼音,
              品詞: entry.品詞,
              日本語訳: entry.日本語訳,
              ...ex,
              id: `${idx}_${exIdx}`
            });
          });
        });
        setWords(items);
        setOrder(items.map((item) => item.id));
        setRandomOrder([]);
        // 単語カード
        let wordItems = data.map((entry, idx) => ({
          単語: entry.単語,
          拼音: entry.拼音,
          品詞: entry.品詞,
          日本語訳: entry.日本語訳,
          id: `w_${idx}`
        }));
        setWordCards(wordItems);
        setWordOrder(wordItems.map((item) => item.id));
        setRandomWordOrder([]);
        // 拼音カード
        let pinyinItems = data.map((entry, idx) => ({
          拼音: entry.拼音,
          単語: entry.単語,
          品詞: entry.品詞,
          日本語訳: entry.日本語訳,
          id: `p_${idx}`
        }));
        setPinyinCards(pinyinItems);
        setPinyinOrder(pinyinItems.map((item) => item.id));
        setRandomPinyinOrder([]);
        // 日本語訳カード
        let jpItems = data.map((entry, idx) => ({
          日本語訳: entry.日本語訳,
          単語: entry.単語,
          拼音: entry.拼音,
          品詞: entry.品詞,
          id: `j_${idx}`
        }));
        setJpCards(jpItems);
        setJpOrder(jpItems.map((item) => item.id));
        setRandomJpOrder([]);
        setShow({});
      });
    // 暗記度データ
    fetch("/api/status")
      .then(res => res.json())
      .then(data => setStatus(data || {}));
  }, []);

  const handleShow = (id) => setShow((s) => ({ ...s, [id]: !s[id] }));

  // 暗記度変更時はサーバーへ保存＋保存完了通知
  const handleStatus = (id, val) => {
    setStatus((s) => {
      const next = { ...s, [id]: val };
      // サーバーへ保存
      fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next)
      })
        .then(res => res.json())
        .then(() => {
          setSaveStatus(true);
          setTimeout(() => setSaveStatus(false), 1000); // 1秒表示
        });
      return next;
    });
  };


  // 並べ替え機能は削除


  // 例文カード用フィルタ
  let filteredOrder = order.filter((id) => {
    const item = words.find((w) => w.id === id);
    if (!item) return false;
    const st = status[id] ?? -1;
    if (!filter[st] && st !== -1) return false;
    if (search && !(
      item.中国語?.includes(search) ||
      (item.拼音 && item.拼音.includes(search)) ||
      (item.日本語訳 && item.日本語訳.includes(search)) ||
      (item.単語 && item.単語.includes(search))
    )) return false;
    return true;
  });
  if (sortType === "status") {
    filteredOrder.sort((a, b) => {
      const sa = status[a] ?? 99;
      const sb = status[b] ?? 99;
      return sa - sb;
    });
  } else if (sortType === "random") {
    const baseOrder = randomOrder.length === order.length ? randomOrder : order;
    filteredOrder = baseOrder.filter((id) => filteredOrder.includes(id));
  }

  // 単語カード用フィルタ
  let filteredWordOrder = wordOrder.filter((id) => {
    const item = wordCards.find((w) => w.id === id);
    if (!item) return false;
    const st = status[id] ?? -1;
    if (!filter[st] && st !== -1) return false;
    if (search && !(
      item.単語?.includes(search) ||
      (item.拼音 && item.拼音.includes(search)) ||
      (item.日本語訳 && item.日本語訳.includes(search))
    )) return false;
    return true;
  });
  if (sortType === "status") {
    filteredWordOrder.sort((a, b) => {
      const sa = status[a] ?? 99;
      const sb = status[b] ?? 99;
      return sa - sb;
    });
  } else if (sortType === "random") {
    const baseOrder = randomWordOrder.length === wordOrder.length ? randomWordOrder : wordOrder;
    filteredWordOrder = baseOrder.filter((id) => filteredWordOrder.includes(id));
  }

  // 拼音カード用フィルタ
  let filteredPinyinOrder = pinyinOrder.filter((id) => {
    const item = pinyinCards.find((w) => w.id === id);
    if (!item) return false;
    const st = status[id] ?? -1;
    if (!filter[st] && st !== -1) return false;
    if (search && !(
      item.拼音?.includes(search) ||
      (item.単語 && item.単語.includes(search)) ||
      (item.日本語訳 && item.日本語訳.includes(search))
    )) return false;
    return true;
  });
  if (sortType === "status") {
    filteredPinyinOrder.sort((a, b) => {
      const sa = status[a] ?? 99;
      const sb = status[b] ?? 99;
      return sa - sb;
    });
  } else if (sortType === "random") {
    const baseOrder = randomPinyinOrder.length === pinyinOrder.length ? randomPinyinOrder : pinyinOrder;
    filteredPinyinOrder = baseOrder.filter((id) => filteredPinyinOrder.includes(id));
  }

  // 日本語訳カード用フィルタ
  let filteredJpOrder = jpOrder.filter((id) => {
    const item = jpCards.find((w) => w.id === id);
    if (!item) return false;
    const st = status[id] ?? -1;
    if (!filter[st] && st !== -1) return false;
    if (search && !(
      item.日本語訳?.includes(search) ||
      (item.単語 && item.単語.includes(search)) ||
      (item.拼音 && item.拼音.includes(search))
    )) return false;
    return true;
  });
  if (sortType === "status") {
    filteredJpOrder.sort((a, b) => {
      const sa = status[a] ?? 99;
      const sb = status[b] ?? 99;
      return sa - sb;
    });
  } else if (sortType === "random") {
    const baseOrder = randomJpOrder.length === jpOrder.length ? randomJpOrder : jpOrder;
    filteredJpOrder = baseOrder.filter((id) => filteredJpOrder.includes(id));
  }

  return (
    <div>
      {/* 保存完了通知 */}
      {saveStatus && (
        <div style={{
          position: "fixed",
          top: 20,
          left: "50%",
          transform: "translateX(-50%)",
          background: "#1976d2",
          color: "#fff",
          padding: "8px 24px",
          borderRadius: 8,
          boxShadow: "0 2px 8px #0002",
          zIndex: 1000
        }}>
          保存しました
        </div>
      )}
      {/* ...existing code... */}
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredOrder.map((id) => {
            const item = words.find((w) => w.id === id);
            if (!item) return null;
            return (
              <li
                key={id}
                style={{
                  background: "#f9f9f9",
                  margin: "8px 0",
                  padding: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 4px #0001"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 18 }}>{item.中国語}</div>
                <button onClick={() => handleShow(id)} style={{ margin: "8px 0" }}>
                  {show[id] ? "隠す" : "ピンイン・訳を表示"}
                </button>
                {show[id] && (
                  <div style={{ margin: "8px 0" }}>
                    <div>拼音: {item.拼音}</div>
                    <div>日本語訳: {item.日本語訳}</div>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  {STATUS_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => handleStatus(id, i)}
                      style={{
                        marginRight: 8,
                        background: status[id] === i ? "#1976d2" : "#eee",
                        color: status[id] === i ? "#fff" : "#333",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 10px"
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  単語: {item.単語} / 品詞: {item.品詞}
                </div>
              </li>
            );
          })}
        </ul>
      ) : tab === "word" ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredWordOrder.map((id) => {
            const item = wordCards.find((w) => w.id === id);
            if (!item) return null;
            return (
              <li
                key={id}
                style={{
                  background: "#f9f9f9",
                  margin: "8px 0",
                  padding: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 4px #0001"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 18 }}>{item.単語}</div>
                <button onClick={() => handleShow(id)} style={{ margin: "8px 0" }}>
                  {show[id] ? "隠す" : "ピンイン・訳を表示"}
                </button>
                {show[id] && (
                  <div style={{ margin: "8px 0" }}>
                    <div>拼音: {item.拼音}</div>
                    <div>日本語訳: {item.日本語訳}</div>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  {STATUS_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => handleStatus(id, i)}
                      style={{
                        marginRight: 8,
                        background: status[id] === i ? "#1976d2" : "#eee",
                        color: status[id] === i ? "#fff" : "#333",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 10px"
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  品詞: {item.品詞}
                </div>
              </li>
            );
          })}
        </ul>
      ) : tab === "pinyin" ? (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredPinyinOrder.map((id) => {
            const item = pinyinCards.find((w) => w.id === id);
            if (!item) return null;
            return (
              <li
                key={id}
                style={{
                  background: "#f9f9f9",
                  margin: "8px 0",
                  padding: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 4px #0001"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 18 }}>{item.拼音}</div>
                <button onClick={() => handleShow(id)} style={{ margin: "8px 0" }}>
                  {show[id] ? "隠す" : "単語・訳を表示"}
                </button>
                {show[id] && (
                  <div style={{ margin: "8px 0" }}>
                    <div>単語: {item.単語}</div>
                    <div>日本語訳: {item.日本語訳}</div>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  {STATUS_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => handleStatus(id, i)}
                      style={{
                        marginRight: 8,
                        background: status[id] === i ? "#1976d2" : "#eee",
                        color: status[id] === i ? "#fff" : "#333",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 10px"
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  品詞: {item.品詞}
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {filteredJpOrder.map((id) => {
            const item = jpCards.find((w) => w.id === id);
            if (!item) return null;
            return (
              <li
                key={id}
                style={{
                  background: "#f9f9f9",
                  margin: "8px 0",
                  padding: 16,
                  borderRadius: 8,
                  boxShadow: "0 1px 4px #0001"
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 18 }}>{item.日本語訳}</div>
                <button onClick={() => handleShow(id)} style={{ margin: "8px 0" }}>
                  {show[id] ? "隠す" : "単語・拼音を表示"}
                </button>
                {show[id] && (
                  <div style={{ margin: "8px 0" }}>
                    <div>単語: {item.単語}</div>
                    <div>拼音: {item.拼音}</div>
                  </div>
                )}
                <div style={{ marginTop: 8 }}>
                  {STATUS_LABELS.map((label, i) => (
                    <button
                      key={i}
                      onClick={() => handleStatus(id, i)}
                      style={{
                        marginRight: 8,
                        background: status[id] === i ? "#1976d2" : "#eee",
                        color: status[id] === i ? "#fff" : "#333",
                        border: "none",
                        borderRadius: 4,
                        padding: "4px 10px"
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
                  品詞: {item.品詞}
                </div>
              </li>
            );
          })}
        </ul>
      )
    </div>
  );
}
