// Configuração do projeto Firebase do KeepRun.
// Estes valores não são segredos: a segurança vem das regras do Firestore.
export const firebaseConfig = {
  apiKey: "AIzaSyCzTE0LYfaZuE4PJ-B48Oi06BdqzlBWwD4",
  authDomain: "keeprun-9055e.firebaseapp.com",
  projectId: "keeprun-9055e",
  storageBucket: "keeprun-9055e.firebasestorage.app",
  messagingSenderId: "541780891300",
  appId: "1:541780891300:web:dd221bc0b31fc84a597831",
  // Push no ecrã bloqueado/principal do iPhone a 0 € (Cloudflare Worker + VAPID):
  pushUrl: "",
  vapidPublicKey: "BFi9RUlmn2JDZWUxI0sIpEsJwDqc6RgOlUAlB1LJYtkC8kJUaineSoo7K_I24fmWHEHIA4SP6GQSKndKNqtbPjE"
};
