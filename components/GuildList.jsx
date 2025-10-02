"use client"

import { useEffect, useState } from "react"
import LoadingWheel from "./LoadingWheel"

const guildImage = (guild) => {
  if (!guild.icon) return undefined // placeholder se não tiver ícone
  const ext = guild.icon.startsWith("a_") ? "gif" : "png"
  return `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=128`
}

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
    <ul>
      {guilds.filter(g => g.owner || g.isAdmin || g.manageGuild).map(g => (
        <li key={g.id}>
          <strong>{g.name}</strong>
          {g.iconUrl ? (
            <img src={g.iconUrl} alt={`${g.name} icon`} width={32} height={32} />
          ) : (
            <span style={{ width: 32, height: 32, display: "inline-block", backgroundColor: "#eeeeee51" }} />
          )}
          {g.owner ? " (Dono)" : g.isAdmin ? " (Administrador)" : g.manageGuild ? " (Gerente)" : " (Membro)"}
        </li>
      ))}
    </ul>
  )
}