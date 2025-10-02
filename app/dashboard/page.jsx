"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import styles from "@/app/page.module.css";
import GuildList from "@/components/GuildList";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <h1>Salazar</h1>
      
      <div className={styles.container}>
        {session ? (
          <div>
            <p>Logado como {session.user.email}</p>
            <button style={{color: 'black'}} onClick={() => signOut()}>Sair</button>
            <br />
            <Link href="/dashboard">Ir para o dashboard</Link>
          </div>
        ) : (
          <div>
            <p>Você não está logado.</p>
            <button style={{color: 'black'}} onClick={() => signIn('discord')}>Entrar</button>
          </div>
        )}
      </div>

      <div className={styles.container}>
        <GuildList />
      </div>
    </div>
  );
}
