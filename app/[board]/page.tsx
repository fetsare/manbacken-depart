import DepartureBoard from "@/components/DepartureBoard";
import { fetchDepartures } from "@/lib/actions";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ board: string }>;
}): Promise<Metadata> {
  const { board } = await params;
  const title = board.charAt(0).toUpperCase() + board.slice(1);

  return {
    title: title,
    description: `Real time departures for ${title}`,
    appleWebApp: {
      title: title,
    },
  };
}

export default async function BoardPage({
  params,
}: {
  params: Promise<{ board: string }>;
}) {
  const { board } = await params;

  const initialDepartures = await fetchDepartures(board);

  return <DepartureBoard initialDepartures={initialDepartures} />;
}

export async function generateStaticParams() {
  return [{ board: "manbacken" }, { board: "slussen" }];
}
