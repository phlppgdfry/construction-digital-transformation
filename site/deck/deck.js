// Presentatie: één slide tegelijk; pijltjes, spatie, Page Up/Down, klik op de knoppen, of #3 in de URL.
(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const count = document.getElementById("count");
  let i = Math.min(slides.length - 1, Math.max(0, Number(location.hash.slice(1)) - 1 || 0));
  const show = (n) => {
    i = Math.min(slides.length - 1, Math.max(0, n));
    slides.forEach((s, k) => s.classList.toggle("on", k === i));
    count.textContent = `${i + 1} / ${slides.length}`;
    history.replaceState(null, "", `#${i + 1}`);
  };
  document.getElementById("prev").addEventListener("click", () => show(i - 1));
  document.getElementById("next").addEventListener("click", () => show(i + 1));
  document.getElementById("print").addEventListener("click", () => print());
  addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); show(i + 1); }
    if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); show(i - 1); }
    if (e.key === "Home") show(0);
    if (e.key === "End") show(slides.length - 1);
  });
  let x0 = null;
  addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", (e) => { if (x0 === null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1)); x0 = null; });
  addEventListener("hashchange", () => { const n = Number(location.hash.slice(1)) - 1; if (n !== i && n >= 0) show(n); });
  show(i);
})();
