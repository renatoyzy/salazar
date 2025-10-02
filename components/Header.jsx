"use client";

import Tippy from "@tippyjs/react";
import styles from "./Header.module.css";
import { useSession, signIn, signOut } from "next-auth/react";
import { FaUser, FaPlus, FaBook } from "react-icons/fa";
import { FaLock } from "react-icons/fa6";
import { RiDashboardFill } from "react-icons/ri";
import Link from "next/link";
import Image from "next/image";

export default function Header() {
  const { data: session } = useSession();

  return (
    <header className={styles.header}>
      <Link href="/" className={styles.logo}>
        <Image src='/salazar.png' alt="Salazar Avatar" width={50} height={50} />
        <h1>Salazar</h1>
      </Link>

      <nav className={styles.nav}>
        <Link className={styles.section} href="https://discord.com/oauth2/authorize?client_id=767858186676994070" target="_blank">
          <FaPlus size={32} className={styles.icon} />
          <span className={styles.label}>
            Adicionar
          </span>
        </Link>
        {session && 
          <Link className={[styles.section, styles.pcOnly].join(' ')} href="/dashboard">
            <RiDashboardFill size={32} className={styles.icon} />
            <span className={styles.label}>
              Dashboard
            </span>
          </Link>
        }
        <Link className={styles.section} href="tos">
          <FaBook size={32} className={styles.icon} />
          <span className={styles.label}>
            TOS
          </span>
        </Link>
        <Link className={styles.section} href="privacy">
          <FaLock size={32} className={styles.icon} />
          <span className={styles.label}>
            Privacidade
          </span>
        </Link>
        {session ? (
          <Tippy
            animation="scale-extreme"
            theme="dropdown"
            arrow={false}
            trigger="click"
            placement="auto"
            interactive={true}
            content={<>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/">Início</Link>
              <button onClick={() => signOut()}>Sair</button>
            </>}
          >
            <div className={[styles.section, styles.mobileOnly].join(' ')}>
              <Image className={styles.icon} src={session.user.image} alt="User Avatar" width={32} height={32} />
              <span className={styles.label}>
                {session.user.name}
              </span>
            </div>
          </Tippy>
        ) : (
          <FaUser className={styles.mobileOnly} size={50} style={{ color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} onClick={() => signIn('discord')} />
        )}
      </nav>

      <nav className={[styles.auth, styles.pcOnly].join(' ')}>
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
            <Image src={session.user.image} alt="User Avatar" width={50} height={50} />
          </Tippy>
        ) : (
          <FaUser size={50} style={{ color: 'white', cursor: 'pointer', padding: '10px', borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.1)' }} onClick={() => signIn('discord')} />
        )}
      </nav>
    </header>
  );
}