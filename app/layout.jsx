import "@/styles/globals.css";
import "@/styles/tippy.css";
import 'tippy.js/animations/scale-extreme.css';
import 'tippy.js/animations/shift-toward-extreme.css';
import Providers from "@/components/Providers";

export const metadata = {
  title: "Salazar",
  description: "Bot do mal para o seu servidor do Discord",
  meta: {
    viewport: "width=device-width, initial-scale=1, viewport-fit=cover"
  }
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
