import Link from "next/link";
import { promises as fs } from "fs";
import path from "path";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Departures",
};

export default async function Home() {
  const configsDirectory = path.join(process.cwd(), "lib", "configs");
  let configFiles: string[] = [];

  try {
    const files = await fs.readdir(configsDirectory);
    configFiles = files
      .filter((file) => file.endsWith(".json"))
      .map((file) => file.replace(".json", ""));
  } catch (error) {
    console.error("Error reading configs directory:", error);
  }

  return (
    <main className="min-h-screen bg-white text-black p-8">
      <div className="max-w-2xl mx-auto">
        <div className="space-y-4">
          {configFiles.length > 0 ? (
            configFiles.map((config) => (
              <Link
                key={config}
                href={`/${config}`}
                className="block p-6 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <h2 className="text-2xl font-semibold capitalize">{config}</h2>
              </Link>
            ))
          ) : (
            <p className="text-gray-600">No board configurations found.</p>
          )}
        </div>
      </div>
    </main>
  );
}
