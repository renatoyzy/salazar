"use client";

import Tippy from "@tippyjs/react";
import styles from "./Header.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import { FaUser } from "react-icons/fa";
import Link from "next/link";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className={styles.header}>
      <Link href="/">
        <h1 className={styles.title}>Salazar</h1>
      </Link>

      <nav className={styles.nav}>
        <Link href="https://discord.com/oauth2/authorize?client_id=767858186676994070" target="_blank">Adicione no seu servidor</Link>
        {session && <Link href="/dashboard">Dashboard</Link>}
        <Link href="tos">Termos de serviço</Link>
        <Link href="privacy">Política de privacidade</Link>
      </nav>

      <nav className={styles.auth}>
        {session ? (
          <Tippy
            animation="scale-extreme"
            theme="dropdown"
            arrow={false}
            trigger="click"
            interactive={true}
            content={<>
              <section>{session.user.name}</section>
              <section>{session.user.email}</section>
              <button onClick={() => signOut()}>Sair</button>
            </>}
          >
            <img src={session.user.image} alt="User Avatar" width={50} height={50} style={{ borderRadius: '50%' }} />
          </Tippy>
        ) : (
          <FaUser size={50} style={{ color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} onClick={() => signIn('discord')} />
        )}
      </nav>
    </header>
  );
}