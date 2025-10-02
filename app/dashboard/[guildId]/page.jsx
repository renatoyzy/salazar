import Header from "@/components/Header";
import styles from "./page.module.css";
import LoadingWheel from "@/components/LoadingWheel";
import GuildInfo from "@/components/GuildInfo";

export default async function Dashboard({ params }) {
  const { guildId } = await params;
  const [selectedCategory, setSelectedCategory] = useState("countries");

  return (
    <div className={styles.body}>
      <Header />
      <main className={styles.dashboard}>
        <nav className={styles.nav}>
          <GuildInfo guildId={guildId} />
          <hr />
          <span onClick={() => setSelectedCategory("countries")}>Países</span>
          <span onClick={() => setSelectedCategory("members")}>Membros</span>
          <span onClick={() => setSelectedCategory("events")}>Eventos</span>
          <span onClick={() => setSelectedCategory("reports")}>Relatórios</span>
          <span onClick={() => setSelectedCategory("settings")}>Configurações</span>
        </nav>
        <main className={styles.config}>
          
        </main>
      </main>
    </div>
  );
}