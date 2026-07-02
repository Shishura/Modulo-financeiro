import { betterAuth } from 'better-auth'
import { prismaAdapter } from 'better-auth/adapters/prisma'
import { openAPI } from 'better-auth/plugins'

import { prisma } from './db.js'

export const auth = betterAuth({
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? 'http://localhost:8080'],
  emailAndPassword: {
    enabled: true,
  },
  // Campo customizado de perfil. Por padrão todo cadastro entra como
  // FUNCIONARIO; promover para ADMIN é feito diretamente no banco
  // (ou por um endpoint administrativo futuro), nunca pelo próprio cadastro.
  user: {
    additionalFields: {
      role: {
        type: 'string',
        defaultValue: 'FUNCIONARIO',
        input: false, // não pode ser definido pelo próprio usuário no signup
      },
    },
  },
  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  plugins: [openAPI()],
})
