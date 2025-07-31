import React, { useState } from "react";
import WordList from "./WordList";

export default function App() {
  return (
    <div style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>単語例文ビューワー</h1>
      <WordList />
    </div>
  );
}
