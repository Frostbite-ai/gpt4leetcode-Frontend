import React, { useState, useEffect } from "react";

import { XIcon, MenuIcon } from "@heroicons/react/solid";
import clsx from "clsx";

const Sidebar = ({ password, setPassword }) => {
  const initialApiKey =
    localStorage.getItem("apiKey") || "sk-cFhoqOqlwCMIg*******************";
  const initialDifficultyLevel =
    JSON.parse(localStorage.getItem("difficultyLevel")) || 0.5;
  const initialLanguage = localStorage.getItem("language") || "Python";

  const [isOpen, setIsOpen] = useState(false);

  const [apiKey, setApiKey] = useState(initialApiKey);
  const [difficultyLevel, setDifficultyLevel] = useState(
    initialDifficultyLevel
  );
  const [language, setLanguage] = useState(initialLanguage);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("apiKey", apiKey);
    localStorage.setItem("difficultyLevel", JSON.stringify(difficultyLevel));
    localStorage.setItem("language", language);
  }, [apiKey, difficultyLevel, language]);

  const languages = [
    "Python",
    "C++",
    "JavaScript",
    "Java" /* more languages */,
  ];

  return (
    <>
      <button
        className=" top-0 right-0 p-2 z-50"
        onClick={() => setIsOpen(true)}
      >
        <MenuIcon className="h-6 w-6" />
      </button>

      <div
        className={clsx(
          "fixed inset-y-0 right-0 bg-gray-200 w-64 shadow-xl transform transition-transform duration-300 h-full p-4",
          isOpen ? "translate-x-0" : "translate-x-full",
          "z-40"
        )}
      >
        <button
          className="absolute top-0 left-0 p-2"
          onClick={() => setIsOpen(false)}
        >
          <XIcon className="h-6 w-6" />
        </button>

        <div className="mt-16 flex flex-col space-y-8">
          <div>
            <label htmlFor="apiKey">Enter your GPT-4 API Key:</label>
            <input
              type="text"
              id="apiKey"
              className="p-2 mt-2 border  w-full text-gray-500 border-gray-300 rounded bg-gray-300"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              disabled
            />
          </div>

          <div>
            <label htmlFor="difficulty">
              Temperature (0 - 1): {difficultyLevel}
            </label>
            <input
              className="w-full"
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              id="difficulty"
            />
          </div>

          <div>
            <label htmlFor="language">Programming Language:</label>
            <select
              className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              id="language"
            >
              {languages.map((lang) => (
                <option value={lang} key={lang}>
                  {lang}
                </option>
              ))}
            </select>
            <label className="opacity-30 text-sm" htmlFor="language">
              Python Preferred{" "}
            </label>
          </div>

          <div>
            <label htmlFor="Password">Enter Access Password:</label>
            <input
              type="text"
              id="Password"
              className="p-2 mt-2 border w-full text-gray-900 border-gray-300 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
