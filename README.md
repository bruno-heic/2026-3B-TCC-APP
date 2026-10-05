<p align="center">
  <img src="./assets/images/logoBr.png" alt="Logo do Petify" width="400">
</p>
<br>

## Petify - Trabalho de Conclusão de Curso

Um aplicativo de monitoramento inteligente para pets, que une uma coleira conectada a um app mobile para acompanhar a saúde, localização e bem-estar do animal em tempo real. O Petify nasce da ideia de que cuidar de um pet à distância não deveria depender de adivinhação.

## Sobre

O Petify simplifica o cuidado com pets por meio de:

* Coleira inteligente com sensores (Arduino/C++) conectada ao app
* Cadastro e gerenciamento de múltiplos pets por usuário
* Alertas configuráveis por regras, disparados a partir dos dados do dispositivo
* Relatórios de saúde e atividade do pet
* Autenticação e sincronização de dados via Supabase
* Onboarding guiado — do cadastro do usuário ao primeiro pet

A proposta é dar tranquilidade ao tutor, tornando visível o que antes só podia ser notado durante o contato direto com o animal.

## Tecnologias

<p align="center">
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg" width="48" alt="React">
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg" width="48" alt="TypeScript">
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/expo/000000" width="48" alt="Expo">
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.simpleicons.org/supabase/3ECF8E" width="48" alt="Supabase">
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/arduino/arduino-original.svg" width="48" alt="Arduino">
  &nbsp;&nbsp;&nbsp;
  <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg" width="48" alt="C++">
</p>
<p align="center">
  React Native &nbsp;·&nbsp; Expo &nbsp;·&nbsp; TypeScript &nbsp;·&nbsp; Supabase (PostgreSQL) &nbsp;·&nbsp; Arduino / C++
</p>

## Como Rodar

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-usuario/petify-app.git
cd petify-app
npm install
```

Configure as variáveis de ambiente criando um arquivo `.env` a partir do `.env.example`:

```bash
EXPO_PUBLIC_SUPABASE_URL=<SUA_URL_SUPABASE>
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<SUA_CHAVE_SUPABASE>
```

Inicie o servidor de desenvolvimento:

```bash
npx expo start
```

Escaneie o QR code com o Expo Go no seu dispositivo.

## Licença

MIT
