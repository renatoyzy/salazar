import Link from "next/link";
import styles from "./page.module.css";
import Header from "@/components/Header";

export default function Privacy() {
  return (
    <div>
      <Header />

      <main className={styles.main}>
        <h1>Política de Privacidade</h1>
        <main>
          <section>
            <h3>1. Informações coletadas</h3>
            <ul>
              <li><strong>Obrigatórias:</strong> seu ID e nome de usuário, bem como informações públicas do servidor (como qualquer bot).</li>
              <li><strong>Opcionais:</strong> informações fornecidas via comandos (ex: preferências, estatísticas).</li>
              <li><strong>Automáticas:</strong> dados de uso, como frequência de uso e logs de comandos (sem conteúdo de mensagens privadas).</li>
            </ul>
          </section>

          <section>
            <h3>2. Finalidades</h3>
            <ul>
              <li>Operar e melhorar o bot (respostas automáticas, análise de uso).</li>
              <li>Prestar suporte.</li>
              <li>Desenvolver novas funcionalidades.</li>
              <li>Cumprimento de obrigações legais, se for o caso.</li>
            </ul>
          </section>

          <section>
            <h3>3. Compartilhamento</h3>
            <ul>
              <li>Não vendemos nem compartilhamos dados com terceiros.</li>
              <li>Podemos divulgar dados se exigido por lei (ex: por autoridades).</li>
              <li>Não integramos com serviços de marketing externos.</li>
            </ul>
          </section>

          <section>
            <h3>4. Retenção</h3>
            <ul>
              <li>Mantemos seus dados apenas enquanto forem necessários (como configurações e dados do plano do servidor). O restante é temporário e não armazenado.</li>
              <li>Você pode solicitar a exclusão dos seus dados através de contato direto.</li>
              <li>Após exclusão, informações agregadas (anônimas) podem permanecer para estatísticas, sem identificação pessoal.</li>
            </ul>
          </section>

          <section>
            <h3>5. Segurança</h3>
            <p>Utilizamos medidas razoáveis de proteção (armazenamento criptografado), mas nenhuma medida é infalível.</p>
          </section>

          <section>
            <h3>6. Atualizações</h3>
            <p>A política pode mudar. Publicaremos a versão atualizada neste site e comunicaremos caso necessário. O uso contínuo implica aceitação.</p>
          </section>

          <section>
            <h3>7. Seus direitos</h3>
            <ul>
              <li>Solicitar acesso, correção ou exclusão dos seus dados.</li>
              <li>Tirar dúvidas ou registrar reclamações via nosso e-mail.</li>
            </ul>
          </section>

          <section>
            <h3>8. Contato</h3>
            <p>Para questões sobre privacidade: renato.augusto.almeida.santos@gmail.com</p>
          </section>

          <section>
            <h3>9. Data de vigência</h3>
            <p>Esta Política é válida a partir de: 6 de julho de 2025.</p>
          </section>
        </main>
      </main>
    </div>
  );
}
