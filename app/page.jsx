"use client";

import Link from "next/link";
import styles from "./page.module.css";
import Header from "@/components/Header";

export default function Home() {

  return (
    <div>
      <Header />
      <main className={styles.main}>
        <h1>Bem-vindo ao Salazar</h1>
        <p>Gerencie seus roleplays geopolíticos no Discord com facilidade.</p>
        <Link href="/dashboard" className={styles.button}>Ir para o Dashboard</Link>
        <Link href="https://discord.com/oauth2/authorize?client_id=767858186676994070" target="_blank">Adicione no seu servidor</Link>
        <h2>Recursos</h2>
        <ul>
          <li>Criação e gerenciamento de países</li>
          <li>Gerenciamento de membros e cargos</li>
          <li>Eventos globais e locais</li>
          <li>Relatórios e estatísticas</li>
        </ul>
        <h2>Documentação</h2>
        <p>Consulte nossa <Link href="/docs">documentação</Link> para saber mais sobre como usar o Salazar.</p>
        <h2>Suporte</h2>
        <p>Precisa de ajuda? Junte-se ao nosso <Link href="https://discord.gg/your-support-server" target="_blank">servidor de suporte</Link>.</p>
        <h2>Planos</h2>
        <p>Consulte nossos <Link href="/pricing">planos</Link> para escolher a melhor opção para você.</p>
      </main>
    </div>
  );
}
