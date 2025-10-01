import Link from "next/link";
import styles from "@/app/page.module.css";

export default function Home() {
  return (
    <div>
      <h1>Salazar</h1>

      <div className={styles.container} style={{ visibility: "hidden" }}>
        <Link href="https://discord.com/oauth2/authorize?client_id=767858186676994070" target="_blank">Adicione no seu servidor</Link>
        <Link href="tos">Termos de serviço</Link>
        <Link href="privacy">Política de privacidade</Link>
      </div>
    </div>
  );
}
