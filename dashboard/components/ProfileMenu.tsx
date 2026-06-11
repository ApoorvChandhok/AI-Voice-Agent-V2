"use client";

import React, { useState, useEffect, useRef } from "react";
import { LogOut, Settings, User, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProfileMenu({ className }: { className?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState<{
    name: string;
    email: string;
    picture: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Read from localStorage to check if Gmail is connected
    const saved = localStorage.getItem("rapidx_credentials");
    if (saved) {
      try {
        const configs = JSON.parse(saved);
        if (configs.gmail && configs.gmail.email) {
          setProfile({
            name: configs.gmail.name || "User",
            email: configs.gmail.email,
            picture: configs.gmail.picture || "",
          });
        }
      } catch (e) {
        console.error("Failed to parse saved credentials:", e);
      }
    }

    // Optional: listen for storage events to update in real-time across tabs
    const handleStorageChange = () => {
      const updatedSaved = localStorage.getItem("rapidx_credentials");
      if (updatedSaved) {
        try {
          const configs = JSON.parse(updatedSaved);
          if (configs.gmail && configs.gmail.email) {
            setProfile({
              name: configs.gmail.name || "User",
              email: configs.gmail.email,
              picture: configs.gmail.picture || "",
            });
          } else {
            setProfile(null);
          }
        } catch (e) {}
      } else {
        setProfile(null);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!profile) return null; // Only show if user is logged in via Gmail

  return (
    <div className={className || "relative ml-auto"} ref={menuRef}>
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500/30 border border-gray-200/60 dark:border-white/8 bg-white/50 dark:bg-white/5 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-200"
      >
        <div className="w-7 h-7 rounded-full overflow-hidden ring-2 ring-white/50 dark:ring-white/10">
          {profile.picture ? (
            <img
              src={profile.picture}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <User className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate hidden sm:block">
          {profile.name}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 hidden sm:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 mt-2 w-60 bg-white/90 dark:bg-[#161b22]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/8 rounded-2xl shadow-xl shadow-black/5 dark:shadow-black/30 z-50 overflow-hidden"
          >
            <div className="p-4 border-b border-gray-100/80 dark:border-white/5">
              <p className="text-sm font-semibold text-gray-900 dark:text-[#e6edf3] truncate">
                {profile.name}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                {profile.email}
              </p>
            </div>

            <div className="p-1.5">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-gray-600 dark:text-gray-300 hover:bg-gray-50/80 dark:hover:bg-white/5 rounded-xl transition-colors duration-150"
              >
                <Settings className="w-4 h-4 text-gray-400" />
                Settings
              </button>
              <button
                onClick={() => {
                  // For now just close, future implementation can handle logout
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-red-500 dark:text-red-400 hover:bg-red-50/80 dark:hover:bg-red-500/10 rounded-xl transition-colors duration-150"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
