import Link from "next/link";
import styles from "@/app/page.module.css";

export default function Tos() {
  return (
    <div>
      <h1>Termos de serviço (TOS)</h1>
      <div className={styles.container}>
        <main>
          <section>
            <h3>1. Aceitação dos Termos</h3>
            <p>Ao usar o bot Salazar, você concorda com estes Termos de Serviço. Se você não concorda, não use o bot.</p>
          </section>
          <section>
            <h3>2. Funcionalidade do Bot</h3>
            <p>O Salazar oferece comandos e funcionalidades para administração de roleplay geopolítico de texto no Discord, conforme descrito no repositório. O desenvolvedor pode adicionar, alterar ou remover funcionalidades a qualquer momento.</p>
          </section>
          <section>
            <h3>3. Uso permitido</h3>
            <p>Você pode usar o bot para interações normais dentro dos servidores.</p>
            <h4>3.1 Proibições</h4>
              <ul>
                <li>Não usar para spam, ataques DDoS, automação abusiva;</li>
                <li>Não violar direitos autorais ou privacidade de terceiro;</li>
                <li>Não postar conteúdo ilegal, ofensivo, discriminatório, etc.</li>
              </ul>
          </section>
          <section>
            <h3>4. Responsabilidades do Desenvolvedor</h3>
            <p>O bot é oferecido “no estado em que se encontra”, sem garantias. O desenvolvedor não será responsável por danos, perda de dados ou interrupções.</p>
          </section>
          <section>
            <h3>5. Suspensão de acesso</h3>
            <p>O desenvolvedor pode bloquear usuários que abusarem do bot ou violarem estes termos, mesmo este tendo pago integralmente o valor do plano.</p>
          </section>
          <section>
            <h3>6. Alterações nos Termos</h3>
            <p>Reservamo-nos o direito de modificar estes Termos. Mudanças significativas serão divulgadas na página ou via mensagem no bot. O uso contínuo implica aceitação.</p>
          </section>
          <section>
            <h3>7. Resolução de disputas</h3>
            <p>Casos não resolvidos amigavelmente serão julgados conforme a legislação brasileira, no foro da comarca onde reside o desenvolvedor.</p>
          </section>
          <section>
            <h3>8. Contato</h3>
            <p>Para dúvidas ou suporte: renato.augusto.almeida.santos@gmail.com</p>
          </section>
        </main>
      </div>
    </div>
  );
}
