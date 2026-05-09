import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { inArray, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { generateOrderId, normalizePhone } from '@/lib/utils'
import * as XLSX from 'xlsx'

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (!['Admin','ZM'].includes(user.role)) return NextResponse.json({success:false,error:'Forbidden'},{status:403})
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({success:false,error:'No file'},{status:400})
    const defaultSourceId = formData.get('defaultSourceId')

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, {type:'buffer'})
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws, {defval:''})

    if (rows.length===0) return NextResponse.json({success:false,error:'Empty file'},{status:400})
    if (rows.length>50000) return NextResponse.json({success:false,error:'Max 50,000 rows allowed'},{status:400})

    const [last] = await db.select({id:orders.id}).from(orders).orderBy(desc(orders.id)).limit(1)
    let lastId = last?.id ?? 0

    const rawPhones = rows.map(r=>normalizePhone(String(r['Phone']||r['phone']||r['Mobile']||r['mobile']||r['Contact']||''))).filter(Boolean)
    const existing = rawPhones.length>0 ? await db.select({contactNumber:orders.contactNumber}).from(orders).where(inArray(orders.contactNumber, rawPhones)) : []
    const existingSet = new Set(existing.map(e=>e.contactNumber))

    const { sources } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')
    const allSources = await db.select().from(sources).where(eq(sources.isActive,true))
    const sourceMap = Object.fromEntries(allSources.map(s=>[s.name.toLowerCase(),s.id]))

    const toInsert:any[] = []
    const errors:string[] = []
    const duplicates:string[] = []

    for(let i=0; i<rows.length; i++) {
      const row = rows[i]
      const rawPhone = String(row['Phone']||row['phone']||row['Mobile']||row['mobile']||row['Contact']||'').trim()
      if (!rawPhone) { errors.push(`Row ${i+2}: Phone missing`); continue }
      const phone = normalizePhone(rawPhone)
      if (phone.length!==10) { errors.push(`Row ${i+2}: Invalid phone: ${rawPhone}`); continue }
      if (existingSet.has(phone)) { duplicates.push(phone); continue }

      const sourceName = String(row['Source']||row['source']||'').toLowerCase().trim()
      const sourceId = sourceMap[sourceName]||defaultSourceId||null
      lastId++
      toInsert.push({
        orderId:generateOrderId(lastId-1),
        customerName:String(row['Name']||row['Customer']||row['customer_name']||'UNKNOWN').trim()||'UNKNOWN',
        contactNumber:phone,
        productName:String(row['Product']||row['product']||row['ProductName']||'').trim()||null,
        quantity:parseInt(String(row['Qty']||row['quantity']||'1'))||1,
        price:row['Price']||row['price']||null,
        address:String(row['Address']||row['address']||'').trim()||null,
        city:String(row['City']||row['city']||'').trim()||null,
        pincode:String(row['Pincode']||row['pincode']||'').trim()||null,
        status:'New' as const,
        paymentStatus:'Pending' as const,
        sourceId,
        leadOwnerId:user.id,
        remark:String(row['Remark']||row['remark']||'').trim()||null,
        dateTime:new Date(),
        agentAssignDate:new Date().toISOString().split('T')[0],
      })
    }

    let inserted = 0
    for(let i=0; i<toInsert.length; i+=500) {
      await db.insert(orders).values(toInsert.slice(i,i+500))
      inserted += Math.min(500, toInsert.length-i)
    }

    return NextResponse.json({ success:true, data:{
      total:rows.length, inserted, duplicates:duplicates.length,
      errors:errors.length, errorDetails:errors.slice(0,20),
      duplicatePhones:duplicates.slice(0,10),
    }})
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}
