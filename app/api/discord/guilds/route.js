import { authOptions } from "../../auth/[...nextauth]/route"
import { getServerSession } from "next-auth/next"
import { MongoClient, ServerApiVersion } from "mongodb"

const client = new MongoClient(process.env.DB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

export async function GET(req) {
  const session = await getServerSession(authOptions)
  if (!session?.accessToken) {
    return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401 })
  }

  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    return new Response(JSON.stringify({ error: "Discord API error", detail: text }), { status: 502 })
  }

  const guilds = await res.json() // array de guild objects

  await client.connect();
  const configurationDb = await client.db('Salazar').collection("configuration").find().toArray();
  const setupDb = await client.db('Salazar').collection("setup").find().toArray();
  await client.close();

  // identifica se o user é dono (owner) ou tem permissão de admin
  // permissão ADMINISTRATOR = bit 0x8 (8)
  // ou considerar MANAGE_GUILD = 0x20 (32) se quiser menos abrangente
  const ADMIN_BIT = 0x8 // 8

  const parsed = guilds.map(g => {
    // permissions pode vir como string -> converte pra int
    const perms = parseInt(g.permissions || "0", 10)

    const ext = g.icon && g.icon.startsWith("a_") ? "gif" : "png"
    const iconUrl = g.icon
      ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${ext}?size=128`
      : null

    const guildObject = {
      id: g.id,
      name: g.name,
      icon: g.icon,
      owner: !!g.owner,
      isAdmin: !!(perms & ADMIN_BIT),
      iconUrl,
      // se quiser considerar MANAGE_GUILD como admin:
      manageGuild: !!(perms & (1 << 5)),
      guildConfigExists: configurationDb.some((server) => server.server_id == g.id),
      guildSetupExists: setupDb.some((server) => server.server_id == g.id),
    }

    return guildObject;
  })

  return new Response(JSON.stringify(parsed), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  })
}