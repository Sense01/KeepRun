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

## Notificações em tempo real (100% grátis no plano Spark)
- As notificações (pedidos enviados, pedidos aceites, Keeps e comentários) são entregues em tempo real na coleção `users/{uid}/notifications`, com estado lido/não lido sincronizado e **sem precisar de plano Blaze nem cartão de crédito**.
- Basta colar o conteúdo de `firestore.rules` em **Firestore Database > Regras** e clicar em **Publicar**.
- Com a app aberta em segundo plano (ou adicionada ao **Ecrã Principal** no iPhone iOS 16.4+), toca em **🔔 Ativar alertas** para receber avisos do sistema quando chegar uma interação nova. (Nota: notificações remotas com a app totalmente fechada e ecrã bloqueado exigem um servidor externo com chave privada; no Spark gratuito o sino atualiza em tempo real mal abres ou resumes a app.)

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
