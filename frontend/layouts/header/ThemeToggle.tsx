"use client";
// import node module libraries
import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "@tabler/icons-react";

/**
 * ThemeToggle
 * Tombol beralih Light <-> Dark. Preferensi disimpan di localStorage
 * dan diterapkan lewat atribut `data-bs-theme` pada <html> (mekanisme
 * dark mode bawaan tema, lihat styles/theme/_darkmode.scss).
 */
const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Inisialisasi dari localStorage saat mount (client-side)
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const dark = stored === "dark";
    setIsDark(dark);
    document.documentElement.setAttribute(
      "data-bs-theme",
      dark ? "dark" : "light"
    );
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    const value = next ? "dark" : "light";
    document.documentElement.setAttribute("data-bs-theme", value);
    localStorage.setItem("theme", value);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle-btn"
      aria-label={isDark ? "Aktifkan Light Mode" : "Aktifkan Dark Mode"}
      title={isDark ? "Light Mode" : "Dark Mode"}
    >
      {/* Sebelum mounted, tampilkan Moon sebagai default agar tidak flicker */}
      {mounted && isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
    </button>
  );
};

export default ThemeToggle;
