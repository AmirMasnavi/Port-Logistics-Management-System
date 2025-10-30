# Development Guide — Port Project API

Este documento descreve as convenções e práticas de desenvolvimento a seguir pela equipa no projeto Port Project API (PortProject.Api). O objetivo é garantir qualidade, consistência e colaboração eficiente, adaptando a metodologia usada noutros projetos da equipa.

CHECKLIST RÁPIDO (o que este ficheiro cobre)
- Coding standards e documentação mínima
- Branching strategy e formato de commits (US{number})
- Testing (TDD), ferramentas de testes e meta de coverage
- Code review e critérios de aceitação para Merge
- Definição de Ready e Definição de Done (inclui 3 critérios que pediu)

---

## 1. Visão geral do projeto

O Port Project API é uma API RESTful construída com ASP.NET Core (.NET 9) que implementa o domínio de operações portuárias. A equipa já tem práticas e templates usados noutros projetos; este documento adapta essas convenções ao ecossistema .NET/C#.

---

## 2. Coding Standards

- C# / .NET Best Practices: siga as boas práticas do ecossistema .NET (nomes PascalCase para tipos, camelCase para parâmetros/variáveis locais, evitar métodos demasiado longos, SRP, injeção de dependências, async/await quando aplicável).
- Análises estáticas: configure o Roslyn analyzers e/ou StyleCop conforme a equipa definir. Use `.editorconfig` para regras de formatação compartilhadas.
- Formato e estilo: configure a IDE (Visual Studio / Rider / VS Code) com `.editorconfig` e, se houver, um `ruleset` ou `Directory.Build.props` para garantir regras consistentes.
- Documentação: escreva comentários XML (///) para APIs públicas e documentação para classes/serviços complexos. Mantenha README e docs atualizados para mudanças que impactem uso ou configuração.

---

## 3. Commit Messages

Adote o formato de commits da equipa (conforme especificado):

- Formato: `US{number}: <type> - <description> (#issue_number)`
  - `US{number}`: número da User Story (ex.: `US101`)
  - `<type>`: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`
  - `<description>`: frase breve em inglês/português usando verbo no imperativo (ex.: `add vessel type endpoint`)
  - `(#issue_number)`: número do issue no GitHub (se aplicável)

Exemplo: `US211: feat - implement vessel type endpoints (#15)`

---

## 4. Testing & TDD

- Abordagem TDD: prefira escrever testes antes do código quando possível.
- Frameworks: use o framework de testes do projecto (ver projetos `*.Tests`). Recomenda-se xUnit para projetos .NET, mas siga o padrão já usado pela equipa.
- Metas de cobertura: objetivo de cobertura mínima (p. ex. 80%) para componentes críticos; foque-se em testes significativos.
- Tipos de testes:
  - Unit tests: isolar unidades de código com mocks (Moq ou substitutos).
  - Integration tests: usar a infraestrutura existente (projetos de integração e system tests) contra uma base SQLite em memória ou um container DB quando necessário.
  - System tests: testes de ponta-a-ponta que validem fluxos complexos.
- Mantenha os testes rápidos e determinísticos; falhas intermitentes devem ser investigadas e corrigidas.

---

## 5. Code Reviews

- Pelo menos 1 aprovação obrigatória para PRs.
- Checklist de revisão:
  - Leitura e clareza do código
  - Correção e robustez (validações, tratamento de erros)
  - Segurança (evitar exposição de dados sensíveis)
  - Performance (complexidade óbvia e impactos)
  - Testes (cobertura e qualidade dos testes adicionados/alterados)
  - Migrações EF Core consistentes (quando aplicável)

---

## 6. Ferramentas recomendadas

- .NET SDK 9
- Entity Framework Core (migrations)
- SQLite para desenvolvimento local (ficheiro `portproject.db`) e testes em memória
- dotnet-ef (CLI) para migrations
- xUnit / NUnit (conforme o projeto)
- Moq / NSubstitute para mocking
- IDE: Rider / Visual Studio / VS Code

---

## 7. Colaboração

- Standups diários (presencial ou remoto), use um canal rápido (WhatsApp / Slack) para bloqueios urgentes.
- Atualize issues, PRs e documentação; vincule PRs às US/Issues correspondentes.
- Documente decisões arquiteturais importantes (por exemplo em docs/ ou em um RFC simples no repo).

---

## 8. Continuous Improvement

- Realizar retrospectives ao fim de cada sprint.
- Priorizar remediação de technical debt em sprints subsequentes.
- Revisar e ajustar processos conforme a equipa e o projeto evoluem.

---

## 9. Definição de Ready (DoR)

Uma User Story (US) deve estar `Ready` para começar quando satisfaz todos os itens seguintes:

- Critérios de aceitação claros e testáveis (documentados na US/issue).
- Dependências externas identificadas e resolvidas (ou bloqueadas com owner identificado).
- Estimativa (story points / horas) atribuída e aceite pela equipa.
- A issue está criada no repositório e vinculada ao sprint/board correspondente.
- Ambiente de desenvolvimento reproduzível: instruções ou scripts para correr localmente (incluindo migrations, fixtures, docker compose, etc.).
- Responsável (assignee) definido para a implementação.

Quando a US está `Ready`, um developer pode começar a implementação sem bloqueios de informação.

---

## 10. Definição de Done (DoD)

Uma User Story (US) considera-se `Done` apenas quando cumprir TODOS os critérios abaixo:

1. Passa nos Critérios de Aceitação
   - Todos os critérios de aceitação descritos na US estão implementados e validados.
   - Exemplos e cenários positivos/negativos cobertos.

2. Passa nos Testes
   - Todos os testes relevantes (unit, integration, system) passam localmente e no CI.
   - Novos comportamentos têm testes automatizados adequados.
   - Mínimo de regressão nos testes existentes.

3. Revisão por outro colega (Peer Verification)
   - Pelo menos uma outra pessoa da equipa fez revisão de código e realizou uma verificação manual/funcional da US.
   - A verificação do colega deve confirmar que os critérios de aceitação foram validados na prática e que não existem regressões óbvias.

4. Documentação e Migrations
   - Documentação atualizada quando necessário.
   - Se a alteração afetou o modelo de dados, as migrations EF Core foram adicionadas e validadas.

5. Build/CI Verde e PR Aprovado
   - O pipeline CI passa (build + testes).
   - PR tem pelo menos 1 aprovação e merge é permitido.



Somente quando todos estes pontos estiverem satisfeitos, a US pode ser considerada entregue e movida para `Done` no board.

---

## 13. Exemplo de checklist para Pull Request

- [ ] Implementação cobre os critérios de aceitação
- [ ] Testes unitários e de integração adicionados / atualizados
- [ ] Migrations adicionadas (quando aplicável) e testadas
- [ ] Documentação atualizada (README, docs/ ou comentários)
- [ ] PR tem descrição clara e vinculação à US/issue
- [ ] Pelo menos 1 revisor aceitou e verificou manualmente
- [ ] CI passou (build + testes)

