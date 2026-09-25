import { getAllServices } from "@/lib/db";
import ServicesList from "./ServicesList";

export const dynamic = "force-dynamic";

export default function Home() {
  const services = getAllServices();
  return <ServicesList initialServices={services} />;
}