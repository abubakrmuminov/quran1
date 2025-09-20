import React from "react";
import { Heart, Trash2, BookOpen, ArrowRight, Hash } from "lucide-react";
import { motion } from "framer-motion";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useNavigate } from "react-router-dom";
import type { Bookmark } from "../types/quran";

export const Bookmarks: React.FC = () => {
  const [bookmarks, setBookmarks] = useLocalStorage<Bookmark[]>(
    "bookmarks",
    []
  );
  const navigate = useNavigate();

  const removeBookmark = (surahNumber: number, ayahNumber: number) => {
    setBookmarks((prev) =>
      prev.filter(
        (b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
      )
    );
  };

  const clearAllBookmarks = () => {
    if (window.confirm("Are you sure you want to remove all bookmarks?")) {
      setBookmarks([]);
    }
  };

  if (bookmarks.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 px-4">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", bounce: 0.5 }}
          className="flex items-center justify-center w-20 h-20 mb-6 text-gray-500 rounded-full bg-gray-800/50"
        >
          <Heart className="w-10 h-10" />
        </motion.div>
        <h1 className="text-2xl font-bold text-white mb-2">No Bookmarks Yet</h1>
        <p className="text-gray-400 max-w-md text-center mb-6">
          Start bookmarking your favorite verses to see them here
        </p>
        <button
          onClick={() => navigate("/")}
          className="flex items-center px-4 py-2 text-blue-400 border border-blue-400 rounded-xl hover:bg-blue-500/10 hover:text-blue-300 transition-all"
        >
          <BookOpen className="w-4 h-4 mr-2" /> Start Reading
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="flex items-center text-3xl font-bold text-white gap-2">
            <Heart className="w-8 h-8 text-red-400" />
            Bookmarks
          </h1>
          <p className="text-gray-400 mt-1">{bookmarks.length} saved verses</p>
        </div>
        {bookmarks.length > 0 && (
          <button
            onClick={clearAllBookmarks}
            className="flex items-center px-4 py-2 space-x-2 text-red-400 rounded-xl hover:text-red-300 hover:bg-red-500/10 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All</span>
          </button>
        )}
      </div>

      {/* Bookmarks List */}
      <div className="space-y-6">
        {bookmarks.map((bookmark, index) => (
          <motion.div
            key={`${bookmark.surahNumber}-${bookmark.ayahNumber}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, type: "spring", bounce: 0.3 }}
            className="relative p-6 bg-gray-800/30 backdrop-blur-md rounded-3xl hover:shadow-lg transition-shadow"
          >
            {/* Gradient Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-t-3xl"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-600">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{bookmark.surahName}</h3>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Hash className="w-3 h-3" /> Verse {bookmark.ayahNumber}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    navigate(`/surah/${bookmark.surahNumber}`, {
                      state: { fromBookmark: true, ayahNumber: bookmark.ayahNumber },
                    })
                  }
                  className="flex items-center px-3 py-1 text-blue-400 rounded-xl hover:bg-blue-500/10 hover:text-blue-300 transition-all"
                >
                  <BookOpen className="w-4 h-4 mr-1" />
                  Read
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>

                <button
                  onClick={() =>
                    removeBookmark(bookmark.surahNumber, bookmark.ayahNumber)
                  }
                  className="p-2 text-red-400 rounded-xl hover:text-red-300 hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Arabic text */}
            <p className="mt-4 text-right text-gray-100 font-arabic leading-relaxed">
              {bookmark.text}
            </p>

            {/* Translation */}
            {bookmark.translation && (
              <p className="mt-2 text-gray-300">{bookmark.translation}</p>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};