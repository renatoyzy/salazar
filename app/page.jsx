"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import styles from "@/app/page.module.css";

export default function Home() {
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

      <div className={styles.container} style={{ visibility: "hidden" }}>
        <Link href="https://discord.com/oauth2/authorize?client_id=767858186676994070" target="_blank">Adicione no seu servidor</Link>
        <Link href="tos">Termos de serviço</Link>
        <Link href="privacy">Política de privacidade</Link>
      </div>
    </div>
  );
}
