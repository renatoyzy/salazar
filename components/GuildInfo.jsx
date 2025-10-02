"use client"

import { useEffect, useState } from "react"
import LoadingWheel from "./LoadingWheel"

export default function GuildInfo({ guildId }) {
  const [guild, setGuild] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!guildId) return

    setLoading(true)
    fetch(`/api/discord/guild?id=${guildId}`)
      .then(async res => {
        if (!res.ok) {
          const json = await res.json().catch(() => null)
          throw json || { message: "Erro desconhecido" }
        }
        return res.json()
      })
      .then(data => setGuild(data))
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [guildId])

  if (loading) return <LoadingWheel />
  if (error) return <p>Erro: {error.error || JSON.stringify(error)}</p>
  if (!guild) return <p>Servidor não encontrado</p>

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
      {guild.iconUrl && (
        <img
          src={guild.iconUrl}
          alt={guild.name}
          width={64}
          height={64}
          style={{ borderRadius: "12px" }}
        />
      )}
      <div>
        <h2>{guild.name}</h2>
        <p>
          {guild.owner
            ? "Dono"
            : guild.isAdmin
            ? "Administrador"
            : guild.manageGuild
            ? "Gerente"
            : "Membro"}
        </p>
      </div>
    </div>
  )
}