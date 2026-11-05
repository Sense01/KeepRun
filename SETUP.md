# Ativar login Google e amigos (Firebase, grátis)

1. Vai a https://console.firebase.google.com e clica em **Criar projeto** (podes desativar o Analytics).
2. **Build > Authentication > Começar > Google > Ativar**. Escolhe o teu email de apoio e guarda.
3. **Authentication > Definições > Domínios autorizados > Adicionar domínio**: `O-TEU-UTILIZADOR.github.io`.
4. **Build > Firestore Database > Criar base de dados** (modo de produção, região europe-west ou eur3).
5. No separador **Regras** do Firestore, cola o conteúdo de `firestore.rules` e clica em **Publicar**.
6. **Definições do projeto (roda dentada) > As tuas apps > Web (</>)**: regista a app e copia o `firebaseConfig`.
7. Cola esses valores em `firebase-config.js`.
8. Envia `index.html`, `social.js`, `firebase-config.js` (e `firestore.rules`, `SETUP.md`) para o repositório do GitHub.

O plano gratuito (Spark) chega para uso pessoal e para um grupo de amigos.

## Privacidade
- Só os amigos aceites veem as tuas atividades.
- Partilha-se apenas um resumo (nome, tipo, data, distância, tempo, subida) e um percurso simplificado
  sem os primeiros e últimos 200 m, para não revelar onde moras.
- Podes desligar a partilha em **Eu > Conta**.
