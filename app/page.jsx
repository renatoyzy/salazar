"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import styles from "@/app/page.module.css";
import Header from "@/components/Header";

export default function Home() {
  const { data: session } = useSession();

  return (
    <div>
      <Header />
      
      <div className={styles.container} style={{ visibility: "hidden" }}>
        <Link href="https://discord.com/oauth2/authorize?client_id=767858186676994070" target="_blank">Adicione no seu servidor</Link>
        <Link href="tos">Termos de serviço</Link>
        <Link href="privacy">Política de privacidade</Link>
      </div>
    </div>
  );
}
