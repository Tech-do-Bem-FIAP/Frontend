<div align="center">

<img src="https://img.shields.io/badge/FIAP-Challenge-ED1C24?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyQzYuNDggMiAyIDYuNDggMiAxMnM0LjQ4IDEwIDEwIDEwIDEwLTQuNDggMTAtMTBTMTcuNTIgMiAxMiAyem0tMiAxNWwtNS01IDEuNDEtMS40MUwxMCAxNC4xN2w3LjU5LTcuNTlMMTkgOGwtOSA5eiIvPjwvc3ZnPg==" />
<img src="https://img.shields.io/badge/Sprint-4-0066CC?style=for-the-badge" />
<img src="https://img.shields.io/badge/Turma-1TDSPR-00AA44?style=for-the-badge" />

<br/><br/>

# 💙 Tech do Bem

### Portal Digital da Turma do Bem — Tecnologia a Serviço do Propósito Social

<p>
  Plataforma web desenvolvida para otimizar a gestão e o acompanhamento dos atendimentos da ONG <strong>Turma do Bem</strong>, unindo tecnologia moderna e impacto humano real.
</p>

<br/>

[![Frontend Repo](https://img.shields.io/badge/🔗%20Frontend-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Tech-do-Bem-FIAP/Frontend)
[![Backend Repo](https://img.shields.io/badge/🔗%20Backend-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/Tech-do-Bem-FIAP/Backend_Java)
[![YouTube Demo](https://img.shields.io/badge/▶%20Video-YouTube-FF0000?style=for-the-badge&logo=youtube)](https://youtu.be/Lg2bjzDWGgQ)

</div>

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Arquitetura](#-arquitetura)
- [Funcionalidades por Cargo](#-funcionalidades-por-cargo)
- [Estrutura de Pastas](#-estrutura-de-pastas)
- [Como Rodar](#-como-rodar)
- [Fluxo de Solicitação de Acesso](#-fluxo-de-solicitação-de-acesso)
- [Autores](#-autores)
- [Contato](#-contato)

---

## 🎯 Sobre o Projeto

O **Tech do Bem** é o portal digital da ONG **Turma do Bem**, uma iniciativa que oferece tratamento odontológico gratuito a jovens em situação de vulnerabilidade social por meio de dentistas voluntários.

Na **Sprint 4**, a plataforma deixou de ser apenas um site institucional e passou a ter um backend completo integrado:

- **Gestão de Pacientes, Dentistas, Colaboradores e Campanhas** — CRUD completo persistido em Oracle
- **Hierarquia de cargos** (Estagiário → Auxiliar → Coordenador → Administrador) com permissões diferenciadas por tela
- **Atendimentos e exames** — registro do progresso clínico de cada paciente
- **Solicitações** — colaboradores internos pedem mudanças; usuários externos solicitam acesso à plataforma
- **Notificações** — comunicação entre dentistas e colaboradores
- **Acesso multiplataforma** — responsivo para desktop, tablet e celular

> 💬 _"Unir tecnologia e propósito social para gerar impacto real e transformar vidas."_

---

## 🛠 Tecnologias Utilizadas

### Frontend

<div align="center">

|                                                       Tecnologia                                                       | Descrição                                                            |
| :--------------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------------- |
|        <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" /> 19        | Biblioteca para construção da SPA                                    |
|     <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" />     | Tipagem estática para segurança e manutenibilidade                   |
|           <img src="https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white" />           | Build/dev server                                                     |
|    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" />   | Estilização utility-first com tokens customizados                    |
|     <img src="https://img.shields.io/badge/React_Router-CA4245?style=flat-square&logo=reactrouter&logoColor=white" />  | Roteamento client-side com rotas protegidas                          |
|     <img src="https://img.shields.io/badge/React_Hook_Form-EC5990?style=flat-square&logo=reacthookform&logoColor=white" /> | Validação e gestão de formulários                                |
|              <img src="https://img.shields.io/badge/Lucide-orange?style=flat-square&logoColor=white" />                | Biblioteca de ícones SVG                                             |

</div>

### Backend

<div align="center">

|                                                     Tecnologia                                                     | Descrição                                                     |
| :----------------------------------------------------------------------------------------------------------------: | :------------------------------------------------------------ |
|      <img src="https://img.shields.io/badge/Java-007396?style=flat-square&logo=java&logoColor=white" /> 17         | Linguagem do backend                                          |
|    <img src="https://img.shields.io/badge/Quarkus-4695EB?style=flat-square&logo=quarkus&logoColor=white" /> 3.x    | Framework REST nativo na nuvem (JAX-RS)                       |
|      <img src="https://img.shields.io/badge/JDBC-DB4437?style=flat-square&logoColor=white" />                      | Acesso direto ao banco via DAOs                               |
|     <img src="https://img.shields.io/badge/Oracle-F80000?style=flat-square&logo=oracle&logoColor=white" />         | Banco de dados (instância da FIAP)                            |
|     <img src="https://img.shields.io/badge/Maven-C71A36?style=flat-square&logo=apachemaven&logoColor=white" />     | Gerenciador de dependências                                   |

</div>

---

## 🏛 Arquitetura

```
┌──────────────────────┐    HTTP/JSON     ┌──────────────────────┐    JDBC    ┌──────────────────┐
│  React 19 + Vite SPA │ ───────────────▶ │  Quarkus REST (BO    │ ─────────▶ │  Oracle (FIAP)   │
│  (Tailwind, RHF)     │ ◀─────────────── │  + DAO + Mapper)     │ ◀───────── │  T_COLABORADOR…  │
└──────────────────────┘                  └──────────────────────┘            └──────────────────┘
       SessionStorage                          ExceptionMappers
       (auth user)                             400/404/409/500
```

- **SPA** consome a API via `fetch` (`src/api/client.ts`), com classe `ApiError` única e tratamento por status.
- **Backend** é dividido em camadas: `resource` (endpoints JAX-RS) → `bo` (regra de negócio) → `dao` (JDBC) → `entities`.
- **Erros** são padronizados pelos `ExceptionMapper`s (`{erro, status, timestamp}`), incluindo violação de unicidade do Oracle (ORA-00001 → 409 Conflict com mensagem amigável).
- **Auth** é simples por sessão: ao logar, a API devolve o `AuthUser` (role + cargo) e o front salva em `sessionStorage`. Não há JWT/refresh — adequado ao escopo acadêmico.

---

## 👥 Funcionalidades por Cargo

A hierarquia interna é numérica (`NIVEL_CARGO`): cada nível herda os acessos do anterior.

| Cargo            | Nível | Acessos principais                                                                   |
| :--------------- | :---- | :----------------------------------------------------------------------------------- |
| **Estagiário**   | 1     | Próprios atendimentos, lista de dentistas, lista de pacientes, criar solicitação     |
| **Auxiliar**     | 2     | Tudo do anterior + editar dados de dentistas e pacientes                             |
| **Coordenador**  | 3     | Tudo do anterior + revisar solicitações de outros colaboradores                      |
| **Administrador**| 4     | Tudo do anterior + CRUD completo de colaboradores e aprovação de cadastros externos  |

A tela de Gestão é **escondida** pra Estagiário (que não tem nada pra gerir) e cada sub-aba aparece de acordo com o cargo.

---

## 📁 Estrutura de Pastas

```
frontend/
├── public/
├── src/
│   ├── api/                     # Cliente HTTP, adapters DTO↔domain, recursos REST tipados
│   ├── assets/                  # Imagens, logos
│   ├── components/              # Reutilizáveis (Header, DashboardHeader, ProtectedRoute,
│   │                            #  ErrorBoundary, Logo, etc.)
│   ├── contexts/                # AuthContext (sessionStorage + user)
│   ├── data/                    # api.ts (use cases de alto nível) + storage local
│   ├── pages/
│   │   ├── Home/ About/ Who/ Contact/ Faq/   # Páginas institucionais
│   │   ├── Login/               # Tela de login + modal de signup externo
│   │   ├── NotFound/            # Página 404
│   │   ├── Colaborador/         # Dashboard do colaborador
│   │   │   ├── Colaborador.tsx  # Layout principal com abas
│   │   │   └── gestao/          # CRUDs (Pacientes, Campanhas, Dentistas, Colaboradores,
│   │   │                        #  Solicitações)
│   │   └── Dentista/            # Dashboard do dentista
│   ├── styles/
│   ├── types/                   # Tipos de domínio (AuthUser, Paciente, Dentista, …)
│   ├── utils/                   # Funções auxiliares (permissões, datas…)
│   ├── App.tsx                  # Router + ErrorBoundary + AuthProvider
│   └── main.tsx
├── .env.example                 # VITE_API_URL=http://localhost:8080
├── package.json
└── README.md
```

---

## 🚀 Como Rodar

### Deploy na Vercel

O projeto está online via deploy na Vercel. O link de acesso está em  [`Tech do Bem`](https://techdobem.vercel.app)

### Login de teste

Para teste possuímos alguns logins de acordo com cada role: 

Administrador -                      admin@admin.com                    / admin

Coordenador -                        bruno.melo@techbem.com             / bru456

Auxiliar -                           carla.souza@techbem.com            / car789

Auxiliar promovido a estagiário -    diego.rocha.atualizado@techbem.com / die012

Dentista -                           paulo.alves@techbem.com            / pau111


### Pré-requisitos

Caso queira rodar localmente siga o passo a passo a seguir:

- [Node.js](https://nodejs.org/) 20+ e npm
- [JDK 17](https://adoptium.net/)
- [Maven 3.9+](https://maven.apache.org/)
- VPN da FIAP ativa (necessária pra alcançar o Oracle da faculdade)

### 1. Banco de dados

O backend conecta direto na instância Oracle da FIAP usando JDBC. As credenciais ficam no `ConexaoFactory` do projeto Java. O schema (CREATE TABLE + INSERTs de seed) está em [`database/Tech do Bem - SQL - sprint 4.sql`](../database).

### 2. Backend (Quarkus)

```bash
cd ../java        # entra no repositório do backend
mvn quarkus:dev   # sobe em http://localhost:8080 com hot-reload
```

Endpoints REST disponíveis em `/colaboradores`, `/dentistas`, `/pacientes`, `/campanhas`, `/atendimentos`, `/exames`, `/notificacoes`, `/anotacoes`, `/solicitacoes`, `/auth/login`.

### 3. Frontend (React + Vite)

```bash
# Na raiz do frontend:
cp .env.example .env
# Ajuste VITE_API_URL caso o backend não esteja em localhost:8080.

npm install
npm run dev       # http://localhost:5173
```

### Scripts úteis

| Comando            | O que faz                              |
| :----------------- | :------------------------------------- |
| `npm run dev`      | Inicia o servidor de desenvolvimento   |
| `npm run build`    | Build de produção (gera `dist/`)       |
| `npm run preview`  | Pré-visualiza o build                  |
| `npm run lint`     | Roda o ESLint                          |


---

## 📨 Fluxo de Solicitação de Acesso

Para colaboradores **externos** (que ainda não estão no banco):

1. Na tela de **Login**, clica em "Solicitar acesso".
2. Preenche o modal (nome, CPF, email, telefone, senha desejada, motivo) — todos os dados são validados localmente antes de irem para a API.
3. A API persiste em `T_SOLICITACAO` com `STATUS = 'pendente'` e os campos externos (`CPF_EXTERNO`, `EMAIL_EXTERNO`, `SENHA_EXTERNO`, …).
4. Um **Administrador** abre a aba **Solicitações**, escolhe um cargo (default: Auxiliar) e clica em **Aprovar**.
5. O backend cria um novo `T_COLABORADOR` com os dados informados, marca a solicitação como `aprovada` e devolve o `idColaboradorCriado` para a UI.
6. O usuário externo passa a poder logar com o email e senha que cadastrou.

Se houver violação de unicidade (email/CPF já cadastrado), o backend devolve `409 Conflict` com mensagem clara, exibida diretamente no modal.

---

## 👥 Autores

<div align="center">

<table>
  <tr>
    <td align="center">
      <img src="https://raw.githubusercontent.com/Tech-do-Bem-FIAP/Challenge/main/Front-End_Design_Engineering/src/assets/fotoHugo.png" width="100px" style="border-radius:50%" /><br/>
      <strong>Hugo Souza de Jesus</strong><br/>
      <sub>RM: 568542 | Turma: 1TDSPR</sub><br/><br/>
      <sub>Focado em experiência de usuário, une usabilidade e design moderno com aspecto humano. Responsável por trazer inovações à equipe.</sub><br/><br/>
      <a href="https://www.linkedin.com/in/hugo-souza-34482222a">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" />
      </a>
      <a href="https://github.com/hgsouz">
        <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" />
      </a>
    </td>
    <td align="center">
      <img src="https://github.com/Tech-do-Bem-FIAP/Challenge/blob/main/Front-End_Design_Engineering/src/assets/FotoLucasCampanha.png?raw=true" width="100px" style="border-radius:50%" /><br/>
      <strong>Lucas Campanhã dos Santos</strong><br/>
      <sub>RM: 566815 | Turma: 1TDSPR</sub><br/><br/>
      <sub>Advogado de formação, agrega visão interdisciplinar ao projeto, utilizando tecnologia como ferramenta para transformar vidas reais.</sub><br/><br/>
      <a href="https://www.linkedin.com/in/lucas-campanh%C3%A3-342707193/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" />
      </a>
      <a href="https://github.com/Labs-LCS">
        <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" />
      </a>
    </td>
    <td align="center">
      <img src="https://raw.githubusercontent.com/Tech-do-Bem-FIAP/Challenge/main/Front-End_Design_Engineering/src/assets/fotoLucasPompeu.png" width="100px" style="border-radius:50%" /><br/>
      <strong>Lucas Marcelino Pompeu</strong><br/>
      <sub>RM: 567010 | Turma: 1TDSPR</sub><br/><br/>
      <sub>Com experiência em ONGs e formação na área da saúde, contribui com empatia e sabedoria de quem conhece as dores do setor.</sub><br/><br/>
      <a href="https://www.linkedin.com/in/lucaspompeu/">
        <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=flat-square&logo=linkedin&logoColor=white" />
      </a>
      <a href="https://github.com/PompeuDev">
        <img src="https://img.shields.io/badge/GitHub-181717?style=flat-square&logo=github&logoColor=white" />
      </a>
    </td>
  </tr>
</table>

</div>

---

## 📬 Contato

Tem alguma dúvida ou quer saber mais sobre o projeto? Fale com a equipe:

| Área     | E-mail             |
| :------- | :----------------- |
| 📩 Geral | tdb.fiap@gmail.com |

---

<div align="center">

Feito com 💙 pela equipe **Tech do Bem** — FIAP 2026

<sub>Sprint 4 · Turma 1TDSPR</sub>

</div>
