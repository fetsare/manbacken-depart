import DepartureBoard from "@/components/DepartureBoard";
import { fetchDepartures } from "@/lib/actions";
import { notFound } from "next/navigation";

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
