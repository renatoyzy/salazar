"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import styles from "./page.module.css";
import GuildList from "@/components/GuildList";
import Header from "@/components/Header";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <h1>Escolha um servidor para configurar...</h1>
        <GuildList />
      </main>
    </div>
  );
}
