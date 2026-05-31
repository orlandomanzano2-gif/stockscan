import { useState, useEffect, useRef, useCallback } from "react";
import { db } from "./firebase";
import {
  collection, addDoc, updateDoc, doc, onSnapshot,
  query, orderBy, serverTimestamp, Timestamp
} from "firebase/firestore";

// ── Load jsQR from CDN ──────────────────────────────────────────────
const loadScript = (src) =>
  new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement("script");
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });

// ── Load Google Fonts ───────────────────────────────────────────────
const loadFont = () => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap";
  document.head.appendChild(link);
};
loadFont();

const TABS = [
  { label: "Dashboard", icon: "📊" },
  { label: "Escanear",  icon: "📷" },
  { label: "Productos", icon: "🗃️" },
  { label: "Movimientos", icon: "📋" },
];

const C = {
  bg: "#0a0f1e", card: "#0e1829", border: "#1a2d45",
  accent: "#00d4ff", accentDim: "#007a99",
  green: "#00e676", red: "#ff4444", yellow: "#ffc107",
  text: "#e8f4fd", muted: "#4a6a80",
};

// ── Styles ──────────────────────────────────────────────────────────
const G = `
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent;}
html,body{height:100%;overflow:hidden;}
body{background:${C.bg};color:${C.text};font-family:'DM Sans',sans-serif;overscroll-behavior:none;}
#root{height:100%;display:flex;flex-direction:column;}

/* scrollbar */
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:${C.bg};}
::-webkit-scrollbar-thumb{background:${C.border};border-radius:2px;}

.app{display:flex;flex-direction:column;height:100vh;height:100dvh;}

/* Header */
.hdr{
  padding:env(safe-area-inset-top,12px) 18px 12px;
  padding-top:calc(env(safe-area-inset-top,0px) + 12px);
  background:linear-gradient(180deg,#0d1828 0%,${C.bg} 100%);
  border-bottom:1px solid ${C.border};
  display:flex;align-items:center;gap:12px;flex-shrink:0;
}
.hdr-logo{
  width:36px;height:36px;border-radius:10px;
  background:linear-gradient(135deg,${C.accent},${C.accentDim});
  display:flex;align-items:center;justify-content:center;
  font-size:18px;box-shadow:0 0 18px ${C.accent}55;flex-shrink:0;
}
.hdr-title{font-family:'Orbitron',monospace;font-size:15px;font-weight:700;
  color:${C.accent};letter-spacing:2px;text-shadow:0 0 16px ${C.accent}66;}
.hdr-sub{font-size:10px;color:${C.muted};margin-top:1px;}
.hdr-live{
  margin-left:auto;display:flex;align-items:center;gap:5px;
  font-size:10px;color:${C.green};font-weight:600;letter-spacing:1px;
}
.live-dot{
  width:7px;height:7px;border-radius:50%;background:${C.green};
  box-shadow:0 0 6px ${C.green};
  animation:pulse 1.8s ease-in-out infinite;
}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);}}

/* Bottom Nav */
.nav{
  display:flex;background:${C.card};
  border-top:1px solid ${C.border};
  padding-bottom:env(safe-area-inset-bottom,0px);
  flex-shrink:0;
}
.nav-btn{
  flex:1;padding:10px 4px 8px;border:none;background:none;
  color:${C.muted};font-size:9px;font-weight:500;
  letter-spacing:.5px;cursor:pointer;
  display:flex;flex-direction:column;align-items:center;gap:3px;
  transition:color .2s;font-family:'DM Sans',sans-serif;
}
.nav-btn.active{color:${C.accent};}
.nav-btn .ico{font-size:20px;line-height:1;}
.nav-btn .lbl{font-size:9px;text-transform:uppercase;letter-spacing:.5px;}

/* Content */
.content{flex:1;overflow-y:auto;padding:16px;overscroll-behavior:contain;}

/* Stat grid */
.stat-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:18px;}
.stat{
  background:${C.card};border:1px solid ${C.border};
  border-radius:14px;padding:14px 12px;position:relative;overflow:hidden;
}
.stat::after{content:'';position:absolute;inset:0;
  background:radial-gradient(circle at top right, var(--clr)15, transparent 70%);}
.stat-lbl{font-size:10px;color:${C.muted};letter-spacing:.8px;text-transform:uppercase;}
.stat-val{font-family:'Orbitron',monospace;font-size:24px;font-weight:700;
  margin-top:4px;color:var(--clr);}
.stat-sub{font-size:10px;color:${C.muted};margin-top:2px;}
.stat-accent{position:absolute;top:0;left:0;right:0;height:2px;background:var(--clr);}

/* Section title */
.sec{
  font-family:'Orbitron',monospace;font-size:10px;color:${C.accent};
  letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;
  display:flex;align-items:center;gap:8px;
}
.sec::after{content:'';flex:1;height:1px;background:${C.border};}

/* Product row */
.prod-row{
  background:${C.card};border:1px solid ${C.border};
  border-radius:12px;padding:13px;margin-bottom:8px;
  display:flex;align-items:center;gap:11px;
  transition:border-color .2s,transform .15s;cursor:pointer;
  -webkit-user-select:none;user-select:none;
}
.prod-row:active{transform:scale(.98);border-color:${C.accent}44;}
.prod-ico{
  width:42px;height:42px;border-radius:10px;
  display:flex;align-items:center;justify-content:center;
  font-size:20px;flex-shrink:0;
}
.prod-info{flex:1;min-width:0;}
.prod-name{font-weight:500;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.prod-code{font-size:10px;color:${C.muted};font-family:monospace;margin-top:1px;}
.prod-badges{display:flex;gap:5px;margin-top:4px;flex-wrap:wrap;}
.prod-stock{font-family:'Orbitron',monospace;font-size:18px;font-weight:700;text-align:right;color:var(--clr);}
.prod-su{font-size:10px;color:${C.muted};text-align:right;}

/* Badge */
.bdg{
  display:inline-flex;align-items:center;padding:2px 7px;border-radius:20px;
  font-size:9px;font-weight:700;letter-spacing:.5px;
}
.bdg-ok{background:${C.green}18;color:${C.green};border:1px solid ${C.green}33;}
.bdg-mid{background:${C.yellow}18;color:${C.yellow};border:1px solid ${C.yellow}33;}
.bdg-low{background:${C.red}18;color:${C.red};border:1px solid ${C.red}33;}

/* Scanner */
.scan-wrap{
  background:${C.card};border:1px solid ${C.border};
  border-radius:16px;overflow:hidden;margin-bottom:14px;
  position:relative;aspect-ratio:4/3;
}
.scan-video{width:100%;height:100%;object-fit:cover;display:block;}
.scan-inactive{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:100%;gap:10px;
}
.scan-inactive-ico{font-size:52px;}
.scan-inactive-txt{color:${C.muted};font-size:12px;}
.scan-overlay{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;}
.scan-frame{width:200px;height:200px;position:relative;}
.sf-tl,.sf-tr,.sf-bl,.sf-br{
  position:absolute;width:28px;height:28px;
  border-color:${C.accent};border-style:solid;
}
.sf-tl{top:0;left:0;border-width:3px 0 0 3px;}
.sf-tr{top:0;right:0;border-width:3px 3px 0 0;}
.sf-bl{bottom:0;left:0;border-width:0 0 3px 3px;}
.sf-br{bottom:0;right:0;border-width:0 3px 3px 0;}
.scan-line{
  position:absolute;left:4px;right:4px;height:2px;
  background:linear-gradient(90deg,transparent,${C.accent},transparent);
  box-shadow:0 0 10px ${C.accent};
  animation:scanY 1.8s ease-in-out infinite;
}
@keyframes scanY{0%{top:8px;}50%{top:calc(100% - 10px);}100%{top:8px;}}

/* Buttons */
.btn{
  padding:12px 16px;border-radius:10px;font-weight:600;
  font-size:13px;cursor:pointer;border:none;
  font-family:'DM Sans',sans-serif;transition:all .2s;
  -webkit-user-select:none;user-select:none;
}
.btn:active{transform:scale(.97);}
.btn-p{background:${C.accent};color:${C.bg};box-shadow:0 0 18px ${C.accent}44;}
.btn-p:active{background:${C.accentDim};}
.btn-o{background:transparent;color:${C.accent};border:1px solid ${C.accent}44;}
.btn-o:active{background:${C.accent}15;border-color:${C.accent};}
.btn-g{background:${C.green};color:${C.bg};}
.btn-r{background:${C.red};color:#fff;}
.btn-row{display:flex;gap:8px;}

/* Input */
.igrp{margin-bottom:13px;}
.ilbl{font-size:10px;color:${C.muted};letter-spacing:.8px;text-transform:uppercase;margin-bottom:5px;display:block;}
.ifield{
  width:100%;padding:12px 14px;border-radius:10px;
  background:${C.bg};border:1px solid ${C.border};
  color:${C.text};font-size:14px;font-family:'DM Sans',sans-serif;
  transition:border-color .2s;outline:none;
}
.ifield:focus{border-color:${C.accent};box-shadow:0 0 0 2px ${C.accent}18;}
.irow{display:flex;gap:8px;}
.irow .igrp{flex:1;}

/* Modal */
.modal-bg{
  position:fixed;inset:0;background:#000b;
  display:flex;align-items:flex-end;justify-content:center;
  z-index:100;backdrop-filter:blur(6px);
}
.modal{
  background:${C.card};border:1px solid ${C.border};
  border-radius:20px 20px 0 0;padding:20px 18px 32px;
  width:100%;max-width:480px;
  padding-bottom:calc(env(safe-area-inset-bottom,0px) + 24px);
  animation:slideUp .28s ease;max-height:90vh;overflow-y:auto;
}
@keyframes slideUp{from{transform:translateY(100%);}to{transform:translateY(0);}}
.modal-handle{
  width:36px;height:4px;background:${C.border};
  border-radius:2px;margin:0 auto 18px;
}
.modal-title{
  font-family:'Orbitron',monospace;font-size:13px;color:${C.accent};
  margin-bottom:18px;letter-spacing:1px;
}

/* Movement row */
.mov-row{
  background:${C.card};border:1px solid ${C.border};
  border-radius:10px;padding:12px 13px;margin-bottom:7px;
  display:flex;align-items:center;gap:10px;
}
.mov-dot{width:9px;height:9px;border-radius:50%;flex-shrink:0;}
.mov-info{flex:1;min-width:0;}
.mov-prod{font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mov-meta{font-size:10px;color:${C.muted};margin-top:1px;}
.mov-qty{font-family:'Orbitron',monospace;font-size:14px;font-weight:700;}

/* Period tabs */
.ptabs{display:flex;gap:6px;margin-bottom:14px;overflow-x:auto;scrollbar-width:none;}
.ptabs::-webkit-scrollbar{display:none;}
.ptab{
  padding:6px 14px;border-radius:20px;font-size:11px;cursor:pointer;
  border:1px solid ${C.border};color:${C.muted};background:none;
  font-family:'DM Sans',sans-serif;white-space:nowrap;transition:all .2s;
}
.ptab.active{background:${C.accent}18;border-color:${C.accent};color:${C.accent};}

/* Toast */
.toast{
  position:fixed;bottom:90px;left:50%;transform:translateX(-50%);
  padding:10px 20px;border-radius:10px;font-weight:600;font-size:13px;
  z-index:200;animation:toastIn .3s ease;white-space:nowrap;
  max-width:85vw;text-align:center;
}
.toast-ok{background:${C.green};color:${C.bg};box-shadow:0 4px 18px ${C.green}44;}
.toast-err{background:${C.red};color:#fff;box-shadow:0 4px 18px ${C.red}44;}
@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px);}}

/* chart bars */
.bar-row{display:flex;align-items:center;gap:8px;margin-bottom:7px;}
.bar-lbl{font-size:11px;color:${C.muted};width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex-shrink:0;}
.bar-track{flex:1;height:7px;background:${C.border};border-radius:4px;overflow:hidden;}
.bar-fill{height:100%;border-radius:4px;transition:width .5s ease;}
.bar-val{font-size:11px;font-family:'Orbitron',monospace;width:28px;text-align:right;flex-shrink:0;}

/* Empty */
.empty{text-align:center;padding:36px 16px;color:${C.muted};}
.empty-ico{font-size:42px;margin-bottom:10px;}
.empty p{font-size:13px;}

/* scanned card */
.scan-card{
  background:${C.accent}0e;border:1px solid ${C.accent}33;
  border-radius:12px;padding:14px;margin-bottom:14px;
}
.scan-card-lbl{font-size:10px;color:${C.muted};letter-spacing:.8px;text-transform:uppercase;margin-bottom:4px;}
.scan-card-code{font-family:monospace;font-size:12px;color:${C.accent};word-break:break-all;}

/* type toggle */
.type-toggle{display:flex;gap:8px;margin-bottom:14px;}
.type-btn{
  flex:1;padding:11px 8px;border-radius:10px;border:1px solid ${C.border};
  font-size:13px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;
  background:none;color:${C.muted};transition:all .2s;
}
.type-btn.active-in{background:${C.green}22;border-color:${C.green};color:${C.green};}
.type-btn.active-out{background:${C.red}22;border-color:${C.red};color:${C.red};}

/* divider */
.divider{
  text-align:center;color:${C.muted};font-size:11px;
  margin:14px 0;position:relative;
}
.divider::before,.divider::after{
  content:'';position:absolute;top:50%;
  width:calc(50% - 22px);height:1px;background:${C.border};
}
.divider::before{left:0;}.divider::after{right:0;}

/* loading */
.loading{
  display:flex;flex-direction:column;align-items:center;justify-content:center;
  height:100vh;gap:16px;
}
.spin{
  width:40px;height:40px;border:3px solid ${C.border};
  border-top-color:${C.accent};border-radius:50%;
  animation:spin .8s linear infinite;
}
@keyframes spin{to{transform:rotate(360deg);}}
.loading-txt{font-family:'Orbitron',monospace;font-size:12px;color:${C.accent};letter-spacing:2px;}
`;

// ── Helpers ─────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return "hace un momento";
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
  return d.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function stockBadge(stock, min) {
  if (stock <= min) return { cls: "bdg-low", label: "Stock bajo" };
  if (stock <= min * 2) return { cls: "bdg-mid", label: "Stock medio" };
  return { cls: "bdg-ok", label: "OK" };
}

function getEmoji(cat = "") {
  const m = { bebidas: "💧", lácteos: "🥛", panadería: "🍞", carne: "🥩", frutas: "🍎", verduras: "🥦", limpieza: "🧹", farmacia: "💊", electrónica: "📱" };
  return m[cat.toLowerCase()] || "📦";
}

function toDate(ts) {
  if (!ts) return new Date(0);
  return ts.toDate ? ts.toDate() : new Date(ts);
}

// ── Main App ─────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const [products, setProducts] = useState(null); // null = loading
  const [movements, setMovements] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scannedCode, setScannedCode] = useState("");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [period, setPeriod] = useState("dia");
  const [newProd, setNewProd] = useState({ name: "", code: "", category: "", minStock: 10 });
  const [movData, setMovData] = useState({ type: "entrada", qty: 1, note: "", productId: "" });
  const [selProd, setSelProd] = useState(null);
  const [saving, setSaving] = useState(false);
  const [jsQRReady, setJsQRReady] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);

  // ── Load jsQR ──
  useEffect(() => {
    loadScript("https://cdnjs.cloudflare.com/ajax/libs/jsqr/1.4.0/jsQR.min.js")
      .then(() => setJsQRReady(true)).catch(() => {});
  }, []);

  // ── Firestore listeners ──
  useEffect(() => {
    const unsub1 = onSnapshot(
      query(collection(db, "products"), orderBy("createdAt", "desc")),
      (snap) => setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    const unsub2 = onSnapshot(
      query(collection(db, "movements"), orderBy("date", "desc")),
      (snap) => setMovements(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => { unsub1(); unsub2(); };
  }, []);

  const showToast = (msg, err = false) => {
    setToast({ msg, err });
    setTimeout(() => setToast(null), 2800);
  };

  // ── Camera ──
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !window.jsQR) { rafRef.current = requestAnimationFrame(tick); return; }
    const ctx = canvas.getContext("2d");
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = window.jsQR(img.data, img.width, img.height);
      if (code) {
        stopCamera();
        setScanning(false);
        handleQRResult(code.data);
        return;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [products]);

  useEffect(() => {
    if (!scanning) { stopCamera(); return; }
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          tick();
        }
      } catch {
        showToast("No se pudo acceder a la cámara", true);
        setScanning(false);
      }
    })();
    return () => stopCamera();
  }, [scanning]);

  const handleQRResult = (code) => {
    setScannedCode(code);
    const existing = (products || []).find((p) => p.code === code);
    if (existing) {
      setSelProd(existing);
      setMovData({ type: "entrada", qty: 1, note: "", productId: existing.id });
      setModal("movement");
      showToast(`✓ ${existing.name}`);
    } else {
      setNewProd((p) => ({ ...p, code }));
      setModal("add");
      showToast("QR leído — nuevo producto");
    }
  };

  // ── Add product ──
  const addProduct = async () => {
    if (!newProd.name || !newProd.code) { showToast("Nombre y código requeridos", true); return; }
    setSaving(true);
    try {
      await addDoc(collection(db, "products"), {
        code: newProd.code,
        name: newProd.name,
        category: newProd.category || "General",
        stock: 0,
        minStock: parseInt(newProd.minStock) || 10,
        emoji: getEmoji(newProd.category),
        color: C.accent,
        createdAt: serverTimestamp(),
      });
      setModal(null);
      setNewProd({ name: "", code: "", category: "", minStock: 10 });
      setScannedCode("");
      showToast(`✓ ${newProd.name} agregado`);
    } catch (e) {
      showToast("Error al guardar", true);
    } finally { setSaving(false); }
  };

  // ── Save movement ──
  const saveMovement = async () => {
    const qty = parseInt(movData.qty);
    if (!qty || qty < 1) { showToast("Cantidad inválida", true); return; }
    const pid = selProd?.id || movData.productId;
    if (!pid) { showToast("Selecciona un producto", true); return; }
    const prod = (products || []).find((p) => p.id === pid);
    if (!prod) { showToast("Producto no encontrado", true); return; }
    setSaving(true);
    try {
      const newStock = Math.max(0, prod.stock + (movData.type === "entrada" ? qty : -qty));
      await Promise.all([
        addDoc(collection(db, "movements"), {
          productId: pid,
          productName: prod.name,
          type: movData.type,
          qty,
          note: movData.note || "",
          date: serverTimestamp(),
        }),
        updateDoc(doc(db, "products", pid), { stock: newStock }),
      ]);
      setModal(null);
      setSelProd(null);
      setScannedCode("");
      showToast(`✓ Movimiento guardado`);
    } catch {
      showToast("Error al guardar", true);
    } finally { setSaving(false); }
  };

  // ── Filter movements by period ──
  const filteredMovs = (movements || []).filter((m) => {
    const diff = (Date.now() - toDate(m.date)) / (1000 * 60 * 60);
    if (period === "dia") return diff <= 24;
    if (period === "semana") return diff <= 168;
    if (period === "mes") return diff <= 720;
    return true;
  });

  // ── Stats ──
  const prods = products || [];
  const movs = movements || [];
  const totalStock = prods.reduce((a, p) => a + (p.stock || 0), 0);
  const lowStockCount = prods.filter((p) => (p.stock || 0) <= (p.minStock || 0)).length;
  const entradas = filteredMovs.filter((m) => m.type === "entrada").reduce((a, m) => a + m.qty, 0);
  const salidas = filteredMovs.filter((m) => m.type === "salida").reduce((a, m) => a + m.qty, 0);

  const topProds = [...prods]
    .map((p) => ({ ...p, total: movs.filter((m) => m.productId === p.id).reduce((a, m) => a + m.qty, 0) }))
    .sort((a, b) => b.total - a.total).slice(0, 5);
  const maxTop = topProds[0]?.total || 1;

  // ── Loading ──
  if (products === null || movements === null) {
    return (
      <>
        <style>{G}</style>
        <div className="loading">
          <div className="spin" />
          <div className="loading-txt">CONECTANDO...</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{G}</style>
      <div className="app">

        {/* Header */}
        <div className="hdr">
          <div className="hdr-logo">📦</div>
          <div>
            <div className="hdr-title">STOCKSCAN</div>
            <div className="hdr-sub">Inventario en tiempo real</div>
          </div>
          <div className="hdr-live"><div className="live-dot" />EN VIVO</div>
        </div>

        {/* Content */}
        <div className="content">

          {/* ── DASHBOARD ── */}
          {tab === 0 && (
            <>
              <div className="stat-grid">
                <div className="stat" style={{"--clr": C.accent}}>
                  <div className="stat-accent" />
                  <div className="stat-lbl">Productos</div>
                  <div className="stat-val">{prods.length}</div>
                  <div className="stat-sub">SKUs registrados</div>
                </div>
                <div className="stat" style={{"--clr": C.green}}>
                  <div className="stat-accent" />
                  <div className="stat-lbl">En stock</div>
                  <div className="stat-val">{totalStock.toLocaleString()}</div>
                  <div className="stat-sub">Unidades totales</div>
                </div>
                <div className="stat" style={{"--clr": C.red}}>
                  <div className="stat-accent" />
                  <div className="stat-lbl">Stock bajo</div>
                  <div className="stat-val">{lowStockCount}</div>
                  <div className="stat-sub">Necesitan restock</div>
                </div>
                <div className="stat" style={{"--clr": C.yellow}}>
                  <div className="stat-accent" />
                  <div className="stat-lbl">Movimientos</div>
                  <div className="stat-val">{movs.length}</div>
                  <div className="stat-sub">Registrados</div>
                </div>
              </div>

              <div className="sec">Más movidos</div>
              {topProds.length === 0 ? (
                <div className="empty"><div className="empty-ico">📦</div><p>Sin movimientos aún</p></div>
              ) : topProds.map((p) => (
                <div className="bar-row" key={p.id}>
                  <div className="bar-lbl">{p.emoji} {p.name}</div>
                  <div className="bar-track">
                    <div className="bar-fill" style={{ width: `${(p.total / maxTop) * 100}%`, background: p.color || C.accent }} />
                  </div>
                  <div className="bar-val" style={{ color: p.color || C.accent }}>{p.total}</div>
                </div>
              ))}

              {lowStockCount > 0 && (
                <>
                  <div className="sec" style={{ marginTop: 18 }}>⚠️ Alertas</div>
                  {prods.filter((p) => (p.stock || 0) <= (p.minStock || 0) * 2).map((p) => {
                    const b = stockBadge(p.stock, p.minStock);
                    return (
                      <div className="prod-row" key={p.id} onClick={() => { setSelProd(p); setMovData({ type: "entrada", qty: 1, note: "", productId: p.id }); setModal("movement"); }}>
                        <div className="prod-ico" style={{ background: (p.color || C.accent) + "22" }}>{p.emoji || "📦"}</div>
                        <div className="prod-info">
                          <div className="prod-name">{p.name}</div>
                          <div className="prod-badges"><span className={`bdg ${b.cls}`}>{b.label} — mín {p.minStock}</span></div>
                        </div>
                        <div>
                          <div className="prod-stock" style={{"--clr": p.stock <= p.minStock ? C.red : C.yellow}}>{p.stock}</div>
                          <div className="prod-su">uds.</div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </>
          )}

          {/* ── ESCANEAR ── */}
          {tab === 1 && (
            <>
              <div className="scan-wrap">
                {scanning ? (
                  <>
                    <video ref={videoRef} className="scan-video" playsInline muted />
                    <canvas ref={canvasRef} style={{ display: "none" }} />
                    <div className="scan-overlay">
                      <div className="scan-frame">
                        <div className="sf-tl" /><div className="sf-tr" />
                        <div className="sf-bl" /><div className="sf-br" />
                        <div className="scan-line" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="scan-inactive">
                    <div className="scan-inactive-ico">📷</div>
                    <div className="scan-inactive-txt">Cámara inactiva</div>
                  </div>
                )}
              </div>

              <div className="btn-row" style={{ marginBottom: 12 }}>
                <button
                  className={`btn ${scanning ? "btn-r" : "btn-p"}`}
                  style={{ flex: 1 }}
                  onClick={() => setScanning((s) => !s)}
                >
                  {scanning ? "⏹ Detener" : "▶ Iniciar escáner QR"}
                </button>
                <button className="btn btn-o" onClick={() => { setNewProd({ name: "", code: "", category: "", minStock: 10 }); setScannedCode(""); setModal("add"); }}>
                  ＋
                </button>
              </div>

              {scannedCode && (
                <div className="scan-card">
                  <div className="scan-card-lbl">Último QR escaneado</div>
                  <div className="scan-card-code">{scannedCode}</div>
                </div>
              )}

              <div className="divider">o registra un movimiento directo</div>
              <button className="btn btn-o" style={{ width: "100%" }}
                onClick={() => { setSelProd(null); setMovData({ type: "entrada", qty: 1, note: "", productId: "" }); setModal("movement"); }}>
                📋 Registrar movimiento manual
              </button>
            </>
          )}

          {/* ── PRODUCTOS ── */}
          {tab === 2 && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div className="sec" style={{ margin: 0 }}>Inventario ({prods.length})</div>
                <button className="btn btn-p" style={{ padding: "8px 14px", fontSize: 12 }}
                  onClick={() => { setNewProd({ name: "", code: "", category: "", minStock: 10 }); setScannedCode(""); setModal("add"); }}>
                  ＋ Agregar
                </button>
              </div>
              {prods.length === 0 ? (
                <div className="empty"><div className="empty-ico">📦</div><p>Sin productos — escanea o agrega uno</p></div>
              ) : prods.map((p) => {
                const b = stockBadge(p.stock, p.minStock);
                return (
                  <div className="prod-row" key={p.id}
                    onClick={() => { setSelProd(p); setMovData({ type: "entrada", qty: 1, note: "", productId: p.id }); setModal("movement"); }}>
                    <div className="prod-ico" style={{ background: (p.color || C.accent) + "22" }}>{p.emoji || "📦"}</div>
                    <div className="prod-info">
                      <div className="prod-name">{p.name}</div>
                      <div className="prod-code">{p.code}</div>
                      <div className="prod-badges">
                        <span className={`bdg ${b.cls}`}>{b.label}</span>
                        <span className="bdg" style={{ background: C.border + "88", color: C.muted }}>{p.category}</span>
                      </div>
                    </div>
                    <div>
                      <div className="prod-stock" style={{"--clr": p.color || C.accent}}>{p.stock}</div>
                      <div className="prod-su">uds.</div>
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── MOVIMIENTOS ── */}
          {tab === 3 && (
            <>
              <div className="ptabs">
                {[["dia","Hoy"],["semana","Semana"],["mes","Mes"],["todo","Todo"]].map(([k,l]) => (
                  <button key={k} className={`ptab${period === k ? " active" : ""}`} onClick={() => setPeriod(k)}>{l}</button>
                ))}
              </div>

              <div className="stat-grid" style={{ marginBottom: 14 }}>
                <div className="stat" style={{"--clr": C.green}}>
                  <div className="stat-accent" />
                  <div className="stat-lbl">Entradas</div>
                  <div className="stat-val">{entradas}</div>
                </div>
                <div className="stat" style={{"--clr": C.red}}>
                  <div className="stat-accent" />
                  <div className="stat-lbl">Salidas</div>
                  <div className="stat-val">{salidas}</div>
                </div>
              </div>

              <div className="sec">Historial</div>
              {filteredMovs.length === 0 ? (
                <div className="empty"><div className="empty-ico">📋</div><p>Sin movimientos en este período</p></div>
              ) : filteredMovs.map((m) => (
                <div className="mov-row" key={m.id}>
                  <div className="mov-dot" style={{ background: m.type === "entrada" ? C.green : C.red }} />
                  <div className="mov-info">
                    <div className="mov-prod">{m.productName || "Producto"}</div>
                    <div className="mov-meta">{m.note ? m.note + " · " : ""}{formatDate(m.date)}</div>
                  </div>
                  <div className="mov-qty" style={{ color: m.type === "entrada" ? C.green : C.red }}>
                    {m.type === "entrada" ? "+" : "-"}{m.qty}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Bottom Nav */}
        <nav className="nav">
          {TABS.map((t, i) => (
            <button key={t.label} className={`nav-btn${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>
              <span className="ico">{t.icon}</span>
              <span className="lbl">{t.label}</span>
            </button>
          ))}
        </nav>

        {/* ── MODAL: Agregar producto ── */}
        {modal === "add" && (
          <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
            <div className="modal">
              <div className="modal-handle" />
              <div className="modal-title">➕ Nuevo Producto</div>
              {scannedCode && (
                <div className="scan-card" style={{ marginBottom: 14 }}>
                  <div className="scan-card-lbl">Código QR escaneado</div>
                  <div className="scan-card-code">{scannedCode}</div>
                </div>
              )}
              <div className="igrp">
                <label className="ilbl">Nombre del producto *</label>
                <input className="ifield" placeholder="Ej. Agua Mineral 1L"
                  value={newProd.name} onChange={(e) => setNewProd((p) => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="igrp">
                <label className="ilbl">Código de barras / QR *</label>
                <input className="ifield" placeholder="Ej. 7501055300101"
                  value={newProd.code} onChange={(e) => setNewProd((p) => ({ ...p, code: e.target.value }))} />
              </div>
              <div className="irow">
                <div className="igrp">
                  <label className="ilbl">Categoría</label>
                  <input className="ifield" placeholder="Bebidas"
                    value={newProd.category} onChange={(e) => setNewProd((p) => ({ ...p, category: e.target.value }))} />
                </div>
                <div className="igrp">
                  <label className="ilbl">Stock mínimo</label>
                  <input className="ifield" type="number" min="1" placeholder="10"
                    value={newProd.minStock} onChange={(e) => setNewProd((p) => ({ ...p, minStock: e.target.value }))} />
                </div>
              </div>
              <div className="btn-row" style={{ marginTop: 6 }}>
                <button className="btn btn-o" style={{ flex: 1 }} onClick={() => setModal(null)}>Cancelar</button>
                <button className="btn btn-p" style={{ flex: 2 }} onClick={addProduct} disabled={saving}>
                  {saving ? "Guardando..." : "Guardar producto"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── MODAL: Movimiento ── */}
        {modal === "movement" && (
          <div className="modal-bg" onClick={(e) => e.target === e.currentTarget && setModal(null)}>
            <div className="modal">
              <div className="modal-handle" />
              <div className="modal-title">📋 Registrar Movimiento</div>
              {selProd ? (
                <div className="prod-row" style={{ marginBottom: 14, cursor: "default" }}>
                  <div className="prod-ico" style={{ background: (selProd.color || C.accent) + "22" }}>{selProd.emoji || "📦"}</div>
                  <div className="prod-info">
                    <div className="prod-name">{selProd.name}</div>
                    <div className="prod-code">{selProd.code}</div>
                  </div>
                  <div>
                    <div className="prod-stock" style={{"--clr": selProd.color || C.accent}}>{selProd.stock}</div>
                    <div className="prod-su">actual</div>
                  </div>
                </div>
              ) : (
                <div className="igrp">
                  <label className="ilbl">Producto</label>
                  <select className="ifield" value={movData.productId}
                    onChange={(e) => { const p = prods.find((x) => x.id === e.target.value); setSelProd(p || null); setMovData((m) => ({ ...m, productId: e.target.value })); }}>
                    <option value="">— Selecciona un producto —</option>
                    {prods.map((p) => <option key={p.id} value={p.id}>{p.emoji} {p.name} (stock: {p.stock})</option>)}
                  </select>
                </div>
              )}

              <div className="type-toggle">
                <button className={`type-btn${movData.type === "entrada" ? " active-in" : ""}`}
                  onClick={() => setMovData((m) => ({ ...m, type: "entrada" }))}>⬆ Entrada</button>
                <button className={`type-btn${movData.type === "salida" ? " active-out" : ""}`}
                  onClick={() => setMovData((m) => ({ ...m, type: "salida" }))}>⬇ Salida</button>
              </div>
              <div className="irow">
                <div className="igrp">
                  <label className="ilbl">Cantidad *</label>
                  <input className="ifield" type="number" min="1" value={movData.qty}
                    onChange={(e) => setMovData((m) => ({ ...m, qty: e.target.value }))} />
                </div>
                <div className="igrp">
                  <label className="ilbl">Nota</label>
                  <input className="ifield" placeholder="Venta, proveedor..."
                    value={movData.note} onChange={(e) => setMovData((m) => ({ ...m, note: e.target.value }))} />
                </div>
              </div>
              <div className="btn-row" style={{ marginTop: 6 }}>
                <button className="btn btn-o" style={{ flex: 1 }} onClick={() => { setModal(null); setSelProd(null); }}>Cancelar</button>
                <button
                  className={`btn ${movData.type === "entrada" ? "btn-g" : "btn-r"}`}
                  style={{ flex: 2 }} onClick={saveMovement} disabled={saving}>
                  {saving ? "Guardando..." : (movData.type === "entrada" ? "✓ Confirmar entrada" : "✓ Confirmar salida")}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && <div className={`toast ${toast.err ? "toast-err" : "toast-ok"}`}>{toast.msg}</div>}
      </div>
    </>
  );
}
