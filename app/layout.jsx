import "@/styles/globals.css";
import "@/styles/tippy.css";
import 'tippy.js/animations/scale-extreme.css';
import 'tippy.js/animations/shift-toward-extreme.css';
import Providers from "@/components/Providers";

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#393939ff",
}

export const metadata = {
  title: "Salazar",
  description: "Bot para o seu roleplay geopolítico do Discord",
  applicationName: "Salazar",
  authors: ['Renato'],
  generator: "Next.js",
  keywords: ['nextjs', 'salazar', 'bot', 'discord', 'dashboard'],
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt-br">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
