import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, StopCircle } from "lucide-react";
import { motion } from "framer-motion";
import { AyahCard } from "./AyahCard";
import { quranApi } from "../api/quran";
import { useLocalStorage } from "../hooks/useLocalStorage";
import type { Bookmark, Settings, LastRead } from "../types/quran";
import { useParams, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { SurahSkeleton } from "./SurahSkeleton";

interface SurahPageProps {
  settings: Settings;
}

export const SurahPage: React.FC<SurahPageProps> = ({ settings }) => {
  const { id } = useParams<{ id: string }>();
  const surahNumber = Number(id);
  const navigate = useNavigate();
  const location = useLocation();

  const [surahData, setSurahData] = useState<any>(null);
  const [translationData, setTranslationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>(
    "bookmarks",
    []
  );
  const [, setLastRead] = useLocalStorage<LastRead | null>("lastRead", null);
  // маппинг для шрифтов
  const fontSizeMap: Record<string, string> = {
    small: "text-sm",
    medium: "text-base",
    large: "text-lg sm:text-xl",
  };

  const fontSizeClass = fontSizeMap[settings.fontSize] || "text-base";

  
  // <-- заменили state на ref для текущего audio
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const [currentAyah, setCurrentAyah] = useState<number | null>(null);

  // Загружаем суру
  useEffect(() => {
    const loadSurah = async () => {
      setLoading(true);
      try {
        const [arabicData, translationData] = await Promise.all([
          quranApi.getSurah(surahNumber),
          quranApi.getSurahWithTranslation(surahNumber, settings.translation),
        ]);

        setSurahData(arabicData);


        setSurahData({ ...arabicData, });
        setTranslationData(translationData);
      } catch (error) {
        console.error("Error loading surah:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSurah();
  }, [surahNumber, settings.translation]);

  useEffect(() => {
    if (!surahData) return;

    setLastRead((prev) => {
      if (prev?.surahNumber === surahNumber) return prev;
      return {
        surahNumber,
        ayahNumber: 1,
        surahName: surahData.englishName,
        timestamp: Date.now(),
      };
    });
  }, [surahData, surahNumber]);

  useEffect(() => {
    const handleScroll = () => {
      const ayahElements = document.querySelectorAll("[data-ayah]");
      let firstVisibleAyah: number | null = null;

      ayahElements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (
          rect.top >= 0 &&
          rect.top < window.innerHeight / 2 &&
          !firstVisibleAyah
        ) {
          firstVisibleAyah = Number(el.getAttribute("data-ayah"));
        }
      });

      if (firstVisibleAyah) {
        setLastRead({
          surahNumber,
          ayahNumber: firstVisibleAyah,
          surahName: surahData.englishName,
          timestamp: Date.now(),
        });
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [surahNumber, surahData, setLastRead]);

  // ⭐ воспроизведение аята с автоплеем (используем ref)
  const playAyah = async (ayahIndex: number) => {
    try {
      // если что-то уже играет — полностью остановим/очистим
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.onended = null;
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }

      const ayah = surahData.ayahs[ayahIndex];
      const audioData = await quranApi.getAyahAudio(
        surahNumber,
        ayah.numberInSurah,
        settings.reciter
      );

      if (audioData.audio) {
        const audio = new Audio(audioData.audio);
        currentAudioRef.current = audio;
        setCurrentAyah(ayah.number);

        audio.onended = () => {
          const nextIndex = ayahIndex + 1;
          if (nextIndex < surahData.ayahs.length) {
            playAyah(nextIndex);
          } else {
            // конец суры
            if (currentAudioRef.current) {
              currentAudioRef.current.onended = null;
              currentAudioRef.current = null;
            }
            setCurrentAyah(null);
          }
        };

        // попытка проиграть
        await audio.play();
      }
    } catch (err) {
      console.error("Ошибка воспроизведения:", err);
      // на всякий случай очищаем
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
        currentAudioRef.current.onended = null;
        currentAudioRef.current.src = "";
        currentAudioRef.current = null;
      }
      setCurrentAyah(null);
    }
  };

  const stopAudio = () => {
    const audio = currentAudioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
      audio.onended = null;
      audio.src = "";
      currentAudioRef.current = null;
    }
    setCurrentAyah(null);
  };

  // ⚡️ останавливаем звук при смене маршрута или при unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
    // cleanup сработает при изменении pathname и при unmount
  }, [location.pathname]);

  // Скроллим только если пришли с Last Read
  useEffect(() => {
    if (location.state?.fromLastRead) {
      const lastRead = JSON.parse(localStorage.getItem("lastRead") || "null");

      if (lastRead && lastRead.surahNumber === surahNumber) {
        const el = document.getElementById(`ayah-${lastRead.ayahNumber}`);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });

          el.classList.add("ring-2", "ring-yellow-400");
          setTimeout(() => {
            el.classList.remove("ring-2", "ring-yellow-400");
          }, 2000);
        }
      }
    }
  }, [surahData, surahNumber, location.state]);

  const handleToggleBookmark = (bookmark: Bookmark) => {
    setBookmarks((prev) => {
      const isBookmarked = prev.some(
        (b) =>
          b.surahNumber === bookmark.surahNumber &&
          b.ayahNumber === bookmark.ayahNumber
      );
      return isBookmarked
        ? prev.filter(
            (b) =>
              !(
                b.surahNumber === bookmark.surahNumber &&
                b.ayahNumber === bookmark.ayahNumber
              )
          )
        : [...prev, bookmark];
    });
  };

  const isBookmarked = (ayahNumber: number) =>
    bookmarks.some(
      (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    );

  if (loading) {
    return <SurahSkeleton />;
  }

  if (!surahData || !translationData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4 text-red-500">Ошибка загрузки суры</p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center px-4 py-2 text-gray-200 transition bg-gray-700 rounded-lg hover:bg-gray-600"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад
        </button>
      </div>
    );
  }
  console.log("fontSize:", settings.fontSize);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl p-6 pt-20 mx-auto"
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="mb-2 text-3xl font-bold text-white">{surahData.name}</h1>
        <div className="text-gray-400">
          {surahData.englishName} — {surahData.englishNameTranslation}
        </div>
        <div className="mt-2 text-sm text-gray-500">
          {surahData.numberOfAyahs} аятов
        </div>
      </div>

      {/* Кнопки */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate("/")}
          className="flex items-center px-3 py-2 text-gray-300 transition bg-gray-800 rounded-lg hover:bg-gray-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад
        </button>
      </div>

      {/* Все аяты */}
      <div className="space-y-5">
        {surahData.ayahs.map((ayah: any, index: number) => (
          <AyahCard
            key={ayah.number}
            fontSizeClass={fontSizeClass}
            ayah={ayah}
            translation={translationData.ayahs[index]}
            surahNumber={surahNumber}
            surahName={surahData.englishName}
            settings={settings}
            isBookmarked={isBookmarked(ayah.numberInSurah)}
            onToggleBookmark={handleToggleBookmark}
            currentAyah={currentAyah}
            onPlay={() => playAyah(index)}
            onStop={stopAudio}
          />
        ))}
      </div>
    </motion.div>
  );
};
