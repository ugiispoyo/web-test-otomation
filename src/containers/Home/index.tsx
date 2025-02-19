"use client";

import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [usecases, setUsecases] = useState<
    { action: string; selector?: string; value?: string }[]
  >([]);
  const [inputUsecase, setInputUsecase] = useState("");
  const [screenshotUrls, setScreenshotUrls] = useState<string[]>([]);
  const [results, setResults] = useState<{ action: string; message: string }[]>(
    []
  );
  const [extractedTexts, setExtractedTexts] = useState<string[]>([]);

  const addUsecase = () => {
    if (inputUsecase.trim() !== "") {
      let actionParts = inputUsecase.split(" ");
      let action = actionParts[0];
      let selector = actionParts.length > 1 ? actionParts[1] : undefined;
      let value =
        actionParts.length > 3 ? actionParts.slice(3).join(" ") : undefined;
      setUsecases([...usecases, { action, selector, value }]);
      setInputUsecase("");
    }
  };

  const runTest = async () => {
    const response = await fetch("/api/run_test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, usecases }),
    });

    const data = await response.json();
    if (response.ok) {
      setScreenshotUrls(data.screenshotUrls || []);
      setResults(data.results || []);
      setExtractedTexts(data.extractedTexts || []);
    } else {
      alert(data.error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Web Automation Test</h1>

      <input
        type="text"
        placeholder="Website URL"
        className="border p-2 w-full mb-2"
        onChange={(e) => setUrl(e.target.value)}
      />
      <input
        type="text"
        placeholder="Tambahkan Use Case (contoh: klik button#submit)"
        className="border p-2 w-full mb-2"
        value={inputUsecase}
        onChange={(e) => setInputUsecase(e.target.value)}
      />
      <button
        onClick={addUsecase}
        className="bg-green-500 text-white px-4 py-2 rounded mb-2"
      >
        Tambah Use Case
      </button>

      <div className="mt-2">
        <h2 className="text-lg font-semibold">Daftar Use Cases:</h2>
        <ul className="list-disc ml-4">
          {usecases.map((usecase, index) => (
            <li key={index}>
              {usecase.action} {usecase.selector}{" "}
              {usecase.value ? `dengan "${usecase.value}"` : ""}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={runTest}
        className="bg-blue-500 text-white px-4 py-2 rounded mt-4"
      >
        Run Test
      </button>

      {results.length > 0 && (
        <div className="mt-4 p-2 border rounded shadow">
          <h2 className="text-lg font-semibold">Hasil Test:</h2>
          <ul className="list-disc ml-4">
            {results.map((result, index) => (
              <li
                key={index}
                className={
                  result.message.includes("✅")
                    ? "text-green-500"
                    : "text-red-500"
                }
              >
                {result.action}: {result.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {extractedTexts.length > 0 && (
        <div className="mt-4 p-2 border rounded shadow">
          <h2 className="text-lg font-semibold">Teks Ditemukan:</h2>
          <ul className="list-disc ml-4">
            {extractedTexts.map((text, index) => (
              <li key={index}>{text}</li>
            ))}
          </ul>
        </div>
      )}

      {screenshotUrls.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg font-semibold">Hasil Screenshot:</h2>
          <div className="grid grid-cols-2 gap-4">
            {screenshotUrls.map((screenshot, index) => (
              <img
                key={index}
                src={screenshot}
                alt={`Screenshot ${index + 1}`}
                className="border rounded shadow"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
