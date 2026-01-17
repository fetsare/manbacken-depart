import DepartureBoard from "@/components/DepartureBoard";
import { fetchDepartures } from "@/lib/actions";
import { notFound } from "next/navigation";

export const revalidate = 600000;

export default async function BoardPage({
  params,
}: {
  params: Promise<{ board: string }>;
}) {
  const { board } = await params;

  const initialDepartures = await fetchDepartures(board);

  if (!initialDepartures || initialDepartures.length === 0) {
    notFound();
  }

  return <DepartureBoard initialDepartures={initialDepartures} />;
}

export async function generateStaticParams() {
  return [{ board: "manbacken" }, { board: "slussen" }];
}
