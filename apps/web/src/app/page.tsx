'use client'

import { CabalManager } from '@/components/CabalManager'
import { TransactionBuilder } from '@/components/TransactionBuilder'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function Page() {
  return (
    <div className="mx-auto flex flex-col gap-10 p-10">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Cabal Manager</CardTitle>
        </CardHeader>
        <CardContent>
          <CabalManager />
        </CardContent>
      </Card>

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Transaction Builder</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionBuilder />
        </CardContent>
      </Card>
    </div>
  )
}
