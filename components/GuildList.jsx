"use client"

import { useEffect, useState } from "react"
import LoadingWheel from "./LoadingWheel"
import styles from "./GuildList.module.css"
import Link from "next/link"

export default function GuildList() {
  const [guilds, setGuilds] = useState(null)
  const [err, setErr] = useState(null)

  useEffect(() => {
    fetch("/api/discord/guilds")
      .then(r => {
        if (!r.ok) throw r
        return r.json()
      })
      .then(setGuilds)
      .catch(async e => {
        const text = e.json ? await e.json().catch(() => null) : null
        setErr(text || { message: "Erro" })
      })
  }, [])

  if (err) return <div>Erro: {JSON.stringify(err)}</div>
  if (!guilds) return <LoadingWheel />

  return (
    <ul className={styles.guildList}>
      {guilds
      .sort((a, b) => a.name.localeCompare(b.name))
      .sort((a, b) => b.guildConfigExists - a.guildConfigExists)
      .filter(g => (g.owner || g.isAdmin || g.manageGuild)).map(g => (
        <Link key={g.id} className={`${!g.guildConfigExists && styles.disabled} ${styles.guild}`} href={g.guildConfigExists ? `/dashboard/${g.id}` : `https://discord.com/oauth2/authorize?client_id=767858186676994070`}>
          {g.iconUrl ? (
            <img src={g.iconUrl} className={styles.guildIcon} alt={`Ícone de ${g.name}`} width={32} height={32} />
          ) : (
            <span className={styles.guildIcon} />
          )}
          <span className={styles.guildInfo}>
            <strong>{g.name}</strong>
            {g.owner ? "Dono" : g.isAdmin ? "Administrador" : g.manageGuild ? "Gerente" : "Membro"}
          </span>
        </Link>
      ))}
    </ul>
  )
}