// 固定API（config.js で window.API_BASE を定義）
const API = (window.API_BASE || "").replace(/\/+$/, "");

const $ = (s) => document.querySelector(s);
function setNote(msg) { const el = $("#note"); if (el) el.textContent = msg || ""; }

const state = { chart: null, types: [] };

async function loadTypes() {
  if (!API) { setNote("APIのURLが設定されていません。/web/config.js の window.API_BASE を設定してください。"); return; }
  const selA = $("#typeA"), selB = $("#typeB");
  selA.innerHTML = `<option value="" disabled selected>読み込み中...</option>`;
  selB.innerHTML = selA.innerHTML;
  try {
    const res = await fetch(`${API}/types`);
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) {
      setNote("タイプが読み込めません。APIのデータ配置やRender稼働を確認してください。");
      selA.innerHTML = `<option value="" disabled selected>（読み込み不可）</option>`;
      selB.innerHTML = selA.innerHTML;
      return;
    }
    state.types = arr;
    const optsA = [`<option value="" disabled selected>あなたのラブタイプを選択</option>`]
      .concat(arr.map(t => `<option value="${t}">${t}</option>`)).join("");
    const optsB = [`<option value="" disabled selected>お相手のラブタイプを選択</option>`]
      .concat(arr.map(t => `<option value="${t}">${t}</option>`)).join("");
    selA.innerHTML = optsA; selB.innerHTML = optsB;
    setNote("");
  } catch (e) {
    setNote("APIに接続できません。RenderのURL/CORS/稼働状況を確認してください。");
  }
}

function ensureRadar(scores) {
  const ctx = $("#radarCanvas");
  const data = {
    labels: ["共感","調和","依存","刺激","信頼"],
    datasets: [{
      label: "合算スコア",
      data: [scores["共感"], scores["調和"], scores["依存"], scores["刺激"], scores["信頼"]],
      borderWidth: 2,
      fill: true,
      borderColor: "rgba(255,106,165,0.9)",
      backgroundColor: "rgba(255,106,165,0.25)",
      pointBackgroundColor: "rgba(255,106,165,1)"
    }]
  };
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        suggestedMin: 0, suggestedMax: 200,
        grid: { color: "rgba(0,0,0,.14)" },
        angleLines: { color: "rgba(0,0,0,.18)" },
        pointLabels: { color: "rgba(0,0,0,.55)", font: { size: 12 } },
        ticks: { backdropColor: "transparent", showLabelBackdrop: false, color: "rgba(0,0,0,.55)" }
      }
    },
    plugins: { legend: { display: false } }
  };
  if (state.chart) { state.chart.data = data; state.chart.update(); }
  else { state.chart = new Chart(ctx, { type: "radar", data, options }); }
}

function splitBody(text) {
  if (!text) return ["", ""];
  const dividers = ["\n—\n", "\n---\n", "\n◇\n", "\n■注意", "注意：", "【注意】"];
  for (const d of dividers) {
    const idx = text.indexOf(d);
    if (idx > 0) return [text.slice(0, idx).trim(), text.slice(idx).replace(d, "").trim()];
  }
  if (text.length <= 140) return [text, ""];
  const mid = Math.floor(text.length / 2);
  return [text.slice(0, mid).trim(), text.slice(mid).trim()];
}

function renderResult(payload) {
  // タイトル＆キャッチ
  const macroTop = payload?.macro?.top || "-";
  const micro = payload?.micro?.type || "-";
  $("#summaryTitle").textContent = `${macroTop} / ${micro}`;
  $("#summaryCatch").textContent = payload?.copy?.catch || "";

  // ハイブリッド傾向：ある時だけ文字を出し、無い時は要素自体を隠す
  const second = payload?.macro?.second;
  const margin = payload?.macro?.margin;
  const hasHybrid = !!(second && margin !== null && margin <= 0.06);
  const metaEl = $("#summaryMeta");
  if (metaEl) {
    if (hasHybrid) {
      metaEl.textContent = "ハイブリッド傾向";
      metaEl.style.display = "block";
    } else {
      metaEl.textContent = "";
      metaEl.style.display = "none";
    }
  }

  // レーダー
  ensureRadar(payload.scores || {共感:0,調和:0,依存:0,刺激:0,信頼:0});

  // 本文 → 強み/注意
  const body = payload?.copy?.body || "";
  const [strongs, cautions] = splitBody(body);
  $("#cardStrengths").textContent = strongs || "—";
  $("#cardCautions").textContent = cautions || "—";

  // 確信度（%バーのみ）
  let conf = Number(payload?.confidence || 0);
  conf = Math.max(0, Math.min(100, conf));
  $("#barFill").style.width = conf + "%";
  $("#confNum").textContent = conf + "%";
  const hybridSpan = $("#hybrid");
  if (hybridSpan) hybridSpan.textContent = ""; // 使わないので空
}

async function runScore() {
  const a = $("#typeA").value, b = $("#typeB").value;
  if (!API) { setNote("APIのURLが設定されていません。/web/config.js を確認してください。"); return; }
  if (!a || !b) { setNote("タイプA/Bを選択してください。"); return; }
  setNote("診断中…");
  try {
    const res = await fetch(`${API}/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typeA: a, typeB: b })
    });
    const payload = await res.json();
    if (!res.ok) { setNote(`エラー: ${payload.detail || "unknown"}`); return; }
    setNote(""); renderResult(payload);
  } catch {
    setNote("通信エラーです。Renderの稼働やCORSを確認してください。");
  }
}

function init() {
  if (!API) { setNote("APIのURLが設定されていません。/web/config.js の window.API_BASE を設定してください。"); return; }
  $("#run").addEventListener("click", runScore);
  loadTypes();
}

document.addEventListener("DOMContentLoaded", init);
document.addEventListener("DOMContentLoaded", init);
