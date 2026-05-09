import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderHistory } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { action, ids, value } = await req.json()
    if (!ids?.length) return NextResponse.json({success:false,error:'No IDs'},{status:400})
    const update: any = { updatedAt:new Date() }
    const histEntries: any[] = []
    switch(action) {
      case 'changeStatus':
        update.status=value
        ids.forEach((id:number)=>histEntries.push({orderId:id,status:value,addedById:user.id,addedByName:user.name}))
        break
      case 'changeOwner':
        update.leadOwnerId=parseInt(value)
        update.agentAssignDate=new Date().toISOString().split('T')[0]
        break
      case 'changeDealer':
        update.dealerId=parseInt(value)
        update.dealerAssignDate=new Date().toISOString().split('T')[0]
        break
      case 'delete':
        if (user.role!=='Admin') return NextResponse.json({success:false,error:'Forbidden'},{status:403})
        update.isDeleted=true
        break
      default:
        return NextResponse.json({success:false,error:'Unknown action'},{status:400})
    }
    await db.update(orders).set(update).where(inArray(orders.id,ids))
    if (histEntries.length>0) await db.insert(orderHistory).values(histEntries)
    return NextResponse.json({ success:true, updated:ids.length })
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}
