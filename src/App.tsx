import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navigation from "./components/Navigation";
import { Dashboard } from "./components/Dashboard";
import { SurahPage } from "./components/SurahPage";
import { Bookmarks } from "./components/Bookmarks";
import { Settings } from "./components/Settings";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Settings as SettingsType } from "./types/quran";
import { Footer } from "./components/Footer";

function App() {
  const [settings, setSettings] = useLocalStorage<SettingsType>("settings", {
    translation: "en.asad",
    reciter: "ar.alafasy",
    fontSize: "medium",
    theme: "dark",
  });

  // Apply theme to document
  useEffect(() => {
    if (settings.theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [settings.theme]);

  const handleToggleTheme = () => {
    setSettings((prev) => ({
      ...prev,
      theme: prev.theme === "dark" ? "light" : "dark",
    }));
  };

  function handleNavigateHome(): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className={`min-h-screen transition-colors ${settings.theme}`}>
      <Navigation
        isDark={settings.theme === "dark"}
        onToggleTheme={handleToggleTheme}
      />

      <main>
        <Routes>
          <Route path="/" element={<Dashboard settings={settings} />} />
          <Route path="/surah/:id" element={<SurahPage settings={settings} />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route
            path="/settings"
            element={
              <Settings settings={settings} onSettingsChange={setSettings} />
            }
          />
        </Routes>
      </main>

      <Footer onNavigateHome={handleNavigateHome} />
    </div>
  );
}

export default App;
