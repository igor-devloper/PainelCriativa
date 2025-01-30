# Levantamento de Custos - Painel Criativa
Data: Janeiro 2024

## 1. Banco de Dados (NeonDB)

### Situação Atual
- Armazenamento: 0.09GB de 0.5GB (18%)
- Computação: 8.43h de 191.9h (4.4%)
- Transferência de Dados: 5.19GB de 5GB (103.8%) ⚠️ CRÍTICO
- Projetos: 2 de 10 (20%)

### Plano Recomendado: Launch
- Custo: $19/mês
- Características:
  - 10GB de armazenamento
  - 300 horas de computação
  - Autoscaling até 4 CU
  - Contas organizacionais
  - Suporte padrão

**Custo Mensal: R$ 111,53** (considerando $1 = R$ 5,87)

## 2. Autenticação (Clerk)

### Situação Atual (Free)
- 10.000 usuários ativos mensais
- 100 organizações mensais
- 3 conexões sociais

### Plano Recomendado: Pro
- Custo: $25/mês
- Características:
  - Usuários ilimitados
  - Organizações ilimitadas
  - Conexões sociais ilimitadas
  - Remoção da marca Clerk
  - Customização avançada
  - Suporte prioritário

**Custo Mensal: R$ 146,75**

## 3. Email (Resend)

### Situação Atual (Free)
- 100 emails/dia
- Domínio não verificado
- Sem recursos avançados

### Plano Recomendado: Pro
- Custo: $20/mês
- Características:
  - 50.000 emails/mês
  - Domínios ilimitados
  - Rastreamento avançado
  - API dedicada
  - Suporte prioritário

**Custo Mensal: R$ 117,40**

## 4. Hospedagem (Vercel)

### Situação Atual
- Storage: 0.06 GB
- Compute: 8.34h
- Data Transfer: 3.98 GB
- Branches: 1/10

### Plano Recomendado: Pro
- Custo: $20/mês
- Características:
  - Builds ilimitados
  - Análises avançadas
  - Previews ilimitados
  - SSL personalizado
  - Suporte prioritário
  - Proteção de senha
  - Métricas avançadas

**Custo Mensal: R$ 117,40**

## Resumo dos Custos Mensais

| Serviço    | Plano   | Custo (R$) |
|------------|---------|------------|
| NeonDB     | Launch  | R$ 111,53  |
| Clerk      | Pro     | R$ 146,75  |
| Resend     | Pro     | R$ 117,40  |
| Vercel     | Pro     | R$ 117,40  |
| **Total**  |         | R$ 493,08  |

## Custo Anual
- Custo Mensal: R$ 493,08
- **Custo Anual: R$ 5.916,96**

## Recomendações e Observações

### Prioridades de Upgrade
1. **NeonDB** (URGENTE)
   - O limite de transferência de dados está ultrapassado (103.8%)
   - Upgrade necessário IMEDIATAMENTE para evitar interrupções

2. **Resend** (ALTA)
   - Necessário para garantir entrega confiável de emails
   - Importante para substituir o Gzappy

3. **Clerk** (MÉDIA)
   - Importante para remover branding e ter recursos avançados
   - Pode aguardar se necessário

4. **Vercel** (BAIXA)
   - Pode permanecer no plano gratuito inicialmente
   - Upgrade recomendado apenas quando necessitar de recursos avançados

### Economia Possível
1. Manter Vercel no plano gratuito inicialmente: -R$ 117,40
2. Manter Clerk no plano gratuito temporariamente: -R$ 146,75

**Custo Mensal Mínimo (Apenas Essenciais)**: R$ 228,93
- NeonDB Launch: R$ 111,53
- Resend Pro: R$ 117,40

### Projeção de Crescimento
- Considerar upgrade do NeonDB se o crescimento de dados continuar no ritmo atual
- Monitorar uso de emails para ajustar plano do Resend
- Avaliar necessidade de recursos premium do Clerk conforme base de usuários cresce

### Recomendações Técnicas
1. Implementar cache para reduzir transferência de dados
2. Otimizar consultas ao banco de dados
3. Implementar rate limiting para emails
4. Monitorar métricas de uso regularmente

## Conclusão

O investimento mínimo necessário para manter a aplicação funcionando adequadamente é de R$ 228,93 mensais, focando nos serviços essenciais (NeonDB e Resend). Este valor pode subir para R$ 493,08 mensais com todos os recursos premium ativados.

Recomenda-se começar com o plano mínimo e escalar conforme necessidade, mantendo monitoramento constante dos limites de uso para evitar interrupções no serviço.
