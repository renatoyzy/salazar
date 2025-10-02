import Header from "@/components/Header";
import styles from "./page.module.css";
import LoadingWheel from "@/components/LoadingWheel";
import GuildInfo from "@/components/GuildInfo";
import CategorySelector from "@/components/CategorySelector";

export default async function Dashboard({ params }) {
  const { guildId } = await params;
  const selectedCategory = "countries";

  return (
    <div className={styles.body}>
      <Header />
      <main className={styles.dashboard}>
        <nav className={styles.nav}>
          <GuildInfo guildId={guildId} />
          <hr />
          <CategorySelector category={selectedCategory} />
        </nav>
        <main className={styles.config}>
          
        </main>
      </main>
    </div>
  );
}