# Servir o Leaflet a partir do teu repositório (e ativar SRI)

A app tenta primeiro `vendor/leaflet/leaflet.js` e `vendor/leaflet/leaflet.css`; se não existirem, usa o CDN.
Assim, o mapa deixa de depender de um servidor externo.

1. Descarrega estes dois ficheiros (versão 1.9.4):
   - https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js
   - https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css
2. Guarda-os no repositório com estes nomes: `vendor/leaflet/leaflet.js` e `vendor/leaflet/leaflet.css`.
   (No GitHub: Add file > Upload files, e escreve `vendor/leaflet/` no nome para criar a pasta.)
3. Opcional, para SRI: calcula o hash de cada ficheiro e junta `integrity="sha384-..." crossorigin="anonymous"` às etiquetas
   `<script>` e `<link>` do `index.html`:
   `openssl dgst -sha384 -binary vendor/leaflet/leaflet.js | openssl base64 -A`
   (junta o prefixo `sha384-` ao resultado). Com o ficheiro no próprio repositório, o SRI protege-te de alterações acidentais.
