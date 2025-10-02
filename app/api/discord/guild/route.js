import { authOptions } from "../../auth/[...nextauth]/route"
import { getServerSession } from "next-auth/next"

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const guildId = searchParams.get("id")
  if (!guildId) return new Response(JSON.stringify({ error: "Missing guild id" }), { status: 400 })

  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 })
  }

  // Pega todos os servidores do usuário
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(JSON.stringify({ error: "Discord API error", detail: text }), { status: 502 })
  }

  const guilds = await res.json()

  // Filtra pelo ID
  const guild = guilds.find(g => g.id === guildId)
  if (!guild) return new Response(JSON.stringify({ error: "Guild not found or user not in guild" }), { status: 404 })

  // Monta URL do ícone
  const ext = guild.icon?.startsWith("a_") ? "gif" : "png"
  const iconUrl = guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.${ext}?size=128` : null

  return new Response(JSON.stringify({
    id: guild.id,
    name: guild.name,
    owner: guild.owner,
    isAdmin: !!(parseInt(guild.permissions || "0", 10) & (1 << 3)),
    manageGuild: !!(parseInt(guild.permissions || "0", 10) & (1 << 5)),
    iconUrl,
  }), {
    headers: { "Content-Type": "application/json" },
  })
}