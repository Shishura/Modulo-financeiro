# SISGFPA — Módulo Financeiro

**Sistema de Gerenciamento Financeiro para Papelarias**
Módulo: Recebimentos e Despesas | Framework: Fastify (Node.js)

> ·Murilo Vieira Toledo — Desenvolvimento Baseado em Framework, 2026

---

## Requisitos Funcionais

| ID | Nome | Descrição | Prioridade |
|---|---|---|---|
| RF-FM-001 | Cadastrar Título de Despesa | O sistema deve permitir o registro de novos títulos de despesa, informando: descrição, fornecedor, valor, data de lançamento, data de vencimento, número de parcelas e observações. |  Alta |
| RF-FM-002 | Listar Títulos de Despesa | O sistema deve exibir a lista de todos os títulos de despesa cadastrados, com suporte a filtros por período, fornecedor, status de pagamento e categoria. |  Alta |
| RF-FM-003 | Atualizar Título de Despesa | O sistema deve permitir a edição dos dados de um título de despesa já cadastrado, registrando automaticamente o histórico da alteração. |  Alta |
| RF-FM-004 | Cancelar Título de Despesa | O sistema deve permitir o cancelamento de um título de despesa, impedindo sua exclusão física e mantendo o registro com status `Cancelado`. |  Alta |
| RF-FM-005 | Registrar Pagamento de Despesa | O sistema deve permitir registrar o pagamento de um título de despesa, atualizando o saldo devedor e o status do título. |  Alta |
| RF-FM-006 | Cadastrar Título de Recebimento | O sistema deve permitir o registro de novos títulos de recebimento, informando: descrição, cliente, valor, data de lançamento, data de vencimento, número de parcelas e observações. |  Alta |
| RF-FM-007 | Listar Títulos de Recebimento | O sistema deve exibir a lista de todos os títulos de recebimento cadastrados, com filtros por período, cliente, status de recebimento e categoria. |  Alta |
| RF-FM-008 | Atualizar Título de Recebimento | O sistema deve permitir a edição dos dados de um título de recebimento já cadastrado, registrando automaticamente o histórico da alteração. |  Alta |
| RF-FM-009 | Cancelar Título de Recebimento | O sistema deve permitir o cancelamento de um título de recebimento, mantendo o registro com status `Cancelado`. |  Alta |
| RF-FM-010 | Registrar Baixa de Recebimento | O sistema deve permitir registrar o recebimento (total ou parcial) de um título, atualizando o saldo a receber e o status do título. |  Alta |
| RF-FM-011 | Gerar Relatório de Contas a Pagar | O sistema deve gerar relatório consolidado de contas a pagar, com filtros por período e status, exibindo totais por categoria e vencimento. |  Alta |
| RF-FM-012 | Gerar Relatório de Contas a Receber | O sistema deve gerar relatório consolidado de contas a receber, com filtros por período e status, exibindo totais por cliente e vencimento. | Alta |
| RF-FM-013 | Exportar Relatórios | O sistema deve permitir a exportação dos relatórios financeiros nos formatos PDF e Excel (`.xlsx`). |  Média |
| RF-FM-014 | Controle de Acesso por Perfil | O módulo deve respeitar o controle de acesso definido no sistema: funcionários acessam apenas operações de lançamento; administradores acessam relatórios e cancelamentos. | 

## Requisitos Não Funcionais

| ID | Categoria | Descrição | Prioridade |
|---|---|---|---|
| RNF-FM-001 | Desempenho | As rotas da API devem responder em até 300ms para operações de leitura e até 500ms para operações de escrita em condições normais de uso. |  Alta |
| RNF-FM-002 | Segurança | A API deve implementar rate limiting (`fastify-rate-limit`) limitando cada cliente a no máximo 100 requisições por minuto. |  Alta |
| RNF-FM-003 | Segurança | Dados sensíveis como valores monetários e informações de clientes/fornecedores não devem ser expostos em logs de aplicação. |  Alta |
| RNF-FM-004 | Manutenibilidade | O código deve seguir a arquitetura em camadas (`routes → controllers → services → repositories`), com separação clara de esponsabilidades entre as camadas. |  Alta |
| RNF-FM-005 | Manutenibilidade | Cada rota deve ter seu schema de validação JSON Schema definido, aproveitando o recurso nativo de serialização do Fastify para melhorar desempenho e segurança. |  Alta |
| RNF-FM-006 | Confiabilidade | Operações de escrita no banco de dados (cadastro, pagamento, cancelamento) devem ser executadas dentro de transações, garantindo consistência em caso de falha. |  Alta |
| RNF-FM-007 | Confiabilidade | O sistema deve tratar e retornar erros de validação com mensagens claras (HTTP 400), erros de autenticação (HTTP 401), de autorização (HTTP 403) e erros internos (HTTP 500). |  Alta |
| RNF-FM-008 | Usabilidade da API | A API deve seguir os princípios REST, com nomenclatura consistente de endpoints no padrão `/financeiro/despesas` e `/financeiro/recebimentos`. |  Média |
