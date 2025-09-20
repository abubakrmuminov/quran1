import React, { useEffect, useState } from "react";
import { Star, ArrowRight, BookOpen } from "lucide-react";
import { motion } from "framer-motion";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { SurahList } from "./SurahList";
import type { LastRead, Settings } from "../types/quran";
import { useNavigate } from "react-router-dom";

interface DashboardProps {
  settings: Settings;
}

interface AyahData {
  text: string;
  surah: { englishName: string; name: string };
  numberInSurah: number;
}

export const Dashboard: React.FC<DashboardProps> = ({ settings }) => {
  const [lastRead] = useLocalStorage<LastRead | null>("lastRead", null);
  const [ayahOfTheDay, setAyahOfTheDay] = useState<AyahData | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today.getTime() - start.getTime();
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);

    const ayahNumber = (dayOfYear % 6236) + 1; // всего 6236 аятов

    const fetchAyah = async () => {
      try {
        const res = await fetch(
          `https://api.alquran.cloud/v1/ayah/${ayahNumber}`
        );
        const data = await res.json();
        const ayah = {
          text: data.data.text,
          surah: {
            englishName: data.data.surah.englishName,
            name: data.data.surah.name,
          },
          numberInSurah: data.data.numberInSurah,
        };
        setAyahOfTheDay(ayah);
      } catch (err) {
        console.error("Ошибка при загрузке аята:", err);
      }
    };

    fetchAyah();
  }, []);

  return (
    <div className="min-h-screen pt-16">
      {/* Hero Section */}
      <div className="relative z-10 px-4 py-20 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="mb-6 text-5xl font-bold gradient-text sm:text-6xl lg:text-7xl">
            AlMumin <span className="text-gray-400">Quran Reader</span>
          </h1>

          <p className="max-w-2xl mx-auto mb-12 text-lg text-gray-300 sm:text-xl">
            Dive into the beauty of the Holy Quran — clear recitations,
            thoughtful translations, and a calm design that helps you connect
            with every verse.
          </p>

          {/* Ayah of the Day */}
          {ayahOfTheDay && (
            <div className="max-w-md mx-auto mt-12">
              <div className="p-6 glass rounded-2xl">
                <div className="flex items-center mb-3 space-x-2">
                  <BookOpen className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-gray-300">
                    Ayah of the Day
                  </span>
                </div>
                <p className="mb-4 text-lg italic text-gray-200">
                  “{ayahOfTheDay.text}”
                </p>
                <p className="text-sm text-gray-400">
                  {ayahOfTheDay.surah.englishName} ({ayahOfTheDay.surah.name}) —
                  Ayah {ayahOfTheDay.numberInSurah}
                </p>
              </div>
            </div>
          )}

          {/* Last Read Section */}
          {lastRead && (
            <div className="max-w-md mx-auto mt-12">
              <div className="p-6 glass rounded-2xl">
                <div className="flex items-center mb-3 space-x-2">
                  <Star className="w-5 h-5 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-300">
                    Continue Reading
                  </span>
                </div>
                <h3 className="mb-2 text-lg font-semibold text-white">
                  {lastRead.surahName}
                </h3>
                <p className="mb-4 text-sm text-gray-400">
                  Ayah {lastRead.ayahNumber}
                </p>
                <motion.button
                  onClick={() =>
                    navigate(`/surah/${lastRead.surahNumber}`, {
                      state: { fromLastRead: true },
                    })
                  }
                  className="flex items-center justify-center w-full px-4 py-3 space-x-2 text-white transition-all duration-300 rounded-xl btn-primary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* All Chapters Section */}
      <div className="relative z-10 px-4 pb-20 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <SurahList />
      </div>
    </div>
  );
};
