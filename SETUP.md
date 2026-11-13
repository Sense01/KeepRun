# Ativar contas e amigos (Firebase, grátis)

1. Vai a https://console.firebase.google.com e clica em **Criar projeto** (podes desativar o Analytics).
2. **Build > Authentication > Começar > Método de início de sessão**: ativa **Google** e, se quiseres uma alternativa que funciona melhor no iPhone, também **Email/palavra-passe**.
3. **Authentication > Definições > Domínios autorizados**: adiciona `O-TEU-UTILIZADOR.github.io`.
4. **Build > Firestore Database > Criar base de dados** (modo de produção, região europe-west ou eur3).
5. No separador **Regras** do Firestore, cola o conteúdo de `firestore.rules` e clica em **Publicar**. Se já tinhas regras antigas, substitui-as: as novas usam uma coleção `codes` para os códigos de amigo.
6. **Definições do projeto > As tuas apps > Web (</>)**: regista a app e copia o `firebaseConfig`.
7. Cola esses valores em `firebase-config.js`.
8. Envia para o repositório, todos na raiz: `index.html`, `anim.js`, `treinos.js`, `social.js`, `sw.js`, `firebase-config.js`, `manifest.webmanifest`, `icon-180.png`, `icon-192.png`, `icon-512.png` (e, para referência, `firestore.rules`, `SETUP.md`, `VENDOR.md` e `README.md`).

O plano gratuito (Spark) chega para uso pessoal, feed e amigos.

## Notificações em tempo real e Push no iPhone (0 €, sem cartão de crédito)
- **Na app (Firebase Spark gratuito):** As notificações (pedidos enviados, pedidos aceites, Keeps e comentários) são entregues em tempo real na coleção `users/{uid}/notifications`, com estado lido/não lido sincronizado. Cola `firestore.rules` em **Firestore Database > Regras** e clica em **Publicar**.
- **No ecrã bloqueado / menu principal do iPhone (Cloudflare Workers Free, 0 €):** A pasta `worker/` envia Web Push W3C direto para a Apple/Google (100 000 pedidos/dia grátis, sem cartão):
  1. Cria conta gratuita em https://dash.cloudflare.com e instala o Wrangler localmente (`npx wrangler login`) **ou** cria o Worker diretamente no painel Cloudflare (**Workers & Pages > Create > Create Worker**, cola `worker/index.js`).
  2. Em **Storage & Databases > KV**, cria um namespace chamado `SUBS`. Se usares Terminal, descomenta `[[kv_namespaces]]` em `worker/wrangler.toml` com o `id` devolvido por `npx wrangler kv namespace create SUBS`; no painel web, associa-o em **Settings > Bindings** com o nome `SUBS`.
  3. Define as variáveis de texto `FIREBASE_PROJECT` (`keeprun-9055e`) e `VAPID_PUBLIC` (valor em `worker/wrangler.toml`) e adiciona o **Secret** encriptado `VAPID_PRIVATE` (via `npx wrangler secret put VAPID_PRIVATE` na pasta `worker/` ou em **Settings > Variables and Secrets > Secret** — **nunca** faças commit da `VAPID_PRIVATE` no GitHub).
  4. Faz deploy (`npx wrangler deploy` na pasta `worker/` ou **Deploy** no painel) e copia o URL `https://keeprun-push.<teu-subdominio>.workers.dev` para o campo `pushUrl` em `firebase-config.js` (faz commit e push para o GitHub Pages).
  5. **No iPhone (iOS 16.4+):** abre o site no Safari, toca em **Partilhar › Adicionar ao Ecrã Principal**, abre a app pelo ícone do Ecrã Principal, entra na tua conta (**Eu**) e toca em **🔔 Ativar alertas**.

## Privacidade (o que é e não é garantido)
- Só os amigos aceites veem as tuas atividades. Cada pessoa decide o que partilha, e remover um amigo corta o acesso dos dois lados.
- Partilha-se um resumo (título, tipo, data, distância, tempo, subida, esforço, descrição) e, **só se escolheres**, um percurso simplificado.
- O percurso só é partilhado se mostrares o mapa nessa atividade ou se definires uma **zona de privacidade** (Eu > Zona de privacidade). Os pontos dentro da zona e os primeiros e últimos 200 m são removidos e as coordenadas são arredondadas.
- Isto **reduz** o risco de revelar onde moras, mas não o elimina: percursos que começam e acabam sempre no mesmo sítio podem indicar a zona. Se isso te preocupa, não mostres o mapa.
- Os códigos de amigo só se consultam um a um (não há lista pública de utilizadores).
- Em Eu > Conta tens "Apagar os meus dados na nuvem", que remove atividades partilhadas, amigos, pedidos, código e a conta. As atividades guardadas no teu dispositivo mantêm-se.

## Notas
- O login Google pode falhar na app instalada no iPhone (limitação do iOS com o domínio do Firebase). O login por email/palavra-passe evita o problema.
- Gostos e comentários entre amigos ficam na nuvem (só os amigos aceites os veem); os teus gostos e comentários também são apagados com "Apagar os meus dados na nuvem".
- A política de privacidade (Eu > Política de privacidade) é um texto-modelo: preenche o teu nome e contacto em `treinos.js` (procura "[email de contacto]") antes de ter utilizadores.
