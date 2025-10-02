import GuildInfo from "@/components/GuildInfo";
import Header from "@/components/Header";

export default async function Dashboard({ params }) {
  const { guildId } = await params;

  return (
    <div>
      <Header />
      <h1>Dashboard for Guild: {guildId}</h1>
      <GuildInfo guildId={guildId} />
    </div>
  );
}
