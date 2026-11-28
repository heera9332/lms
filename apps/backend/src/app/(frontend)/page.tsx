import { headers as getHeaders } from 'next/headers.js'
import Image from 'next/image'
import { getPayload } from 'payload'
import React from 'react'
import { fileURLToPath } from 'url'
import { Button } from '@lms/ui/components/button'

import config from '@/payload.config'
import './styles.css'

export default async function HomePage() {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  const fileURL = `vscode://file/${fileURLToPath(import.meta.url)}`

  return (
    <div className="flex min-h-screen flex-col items-center justify-between bg-background p-6 text-foreground md:p-12">
      <div className="flex flex-1 flex-col items-center justify-center gap-6 text-center">
        <picture>
          <source srcSet="https://raw.githubusercontent.com/payloadcms/payload/3.x/packages/ui/src/assets/payload-favicon.svg" />
          <Image
            alt="Payload Logo"
            height={65}
            src="https://raw.githubusercontent.com/payloadcms/payload/3.x/packages/ui/src/assets/payload-favicon.svg"
            width={65}
          />
        </picture>
        {!user && <h1 className="text-4xl font-bold tracking-tight">Welcome to your new project.</h1>}
        {user && <h1 className="text-4xl font-bold tracking-tight">Welcome back, {user.email}</h1>}
        <div className="flex items-center gap-3">
          <Button
            nativeButton={false}
            render={
              <a href={payloadConfig.routes.admin} rel="noopener noreferrer" target="_blank" />
            }
          >
            Go to admin panel
          </Button>
          <Button
            variant="outline"
            nativeButton={false}
            render={
              <a href="https://payloadcms.com/docs" rel="noopener noreferrer" target="_blank" />
            }
          >
            Documentation
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <p>Update this page by editing</p>
        <a
          className="rounded bg-muted px-2 py-0.5 font-mono text-foreground hover:underline"
          href={fileURL}
        >
          <code>app/(frontend)/page.tsx</code>
        </a>
      </div>
    </div>
  )
}
