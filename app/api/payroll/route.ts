/**
 * Payroll API — Prakriti Herbs CRM
 * GET  /api/payroll?month=&year=&userId=
 * POST /api/payroll  (generate salary record)
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { salaryRecords, attendance, users } from '@/lib/db/schema'
import { eq, and, gte, lte, count } from 'drizzle-orm'
import { requireRole, handleApiError } from '@/lib/auth'
import { rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { logAudit } from '@/lib/security/audit'
import { z } from 'zod'

const generatePayrollSchema = z.object({
  userId:      z.number().int().positive(),
  month:       z.number().int().min(1).max(12),
  year:        z.number().int().min(2020).max(2100),
  basicSalary: z.number().positive(),
  allowances:  z.number().min(0).default(0),
  deductions:  z.number().min(0).default(0),
})

export async function GET(req: NextRequest) {
  const rl = rateLimit(req.headers.get('x-forwarded-for') ?? '127.0.0.1', LIMITS.read)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const user = await requireRole('Admin', 'ZM')
    const { searchParams } = new URL(req.url)
    const month  = parseInt(searchParams.get('month')  ?? String(new Date().getMonth() + 1))
    const year   = parseInt(searchParams.get('year')   ?? String(new Date().getFullYear()))
    const userId = searchParams.get('userId') ? parseInt(searchParams.get('userId')!) : undefined

    const conditions: ReturnType<typeof eq>[] = [
      eq(salaryRecords.month, month),
      eq(salaryRecords.year, year),
    ]
    if (userId) conditions.push(eq(salaryRecords.userId, userId))

    const records = await db
      .select({
        id:          salaryRecords.id,
        userId:      salaryRecords.userId,
        month:       salaryRecords.month,
        year:        salaryRecords.year,
        basicSalary: salaryRecords.basicSalary,
        allowances:  salaryRecords.allowances,
        deductions:  salaryRecords.deductions,
        netSalary:   salaryRecords.netSalary,
        presentDays: salaryRecords.presentDays,
        absentDays:  salaryRecords.absentDays,
        leaveDays:   salaryRecords.leaveDays,
        status:      salaryRecords.status,
        paidAt:      salaryRecords.paidAt,
        userName:    users.name,
        userEmail:   users.email,
      })
      .from(salaryRecords)
      .leftJoin(users, eq(salaryRecords.userId, users.id))
      .where(and(...conditions))

    return NextResponse.json({ success: true, data: records })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req.headers.get('x-forwarded-for') ?? '127.0.0.1', LIMITS.api)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const user = await requireRole('Admin')
    const body = await req.json()
    const parsed = generatePayrollSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { userId, month, year, basicSalary, allowances, deductions } = parsed.data

    // Get attendance stats for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`
    const endDate   = new Date(year, month, 0).toISOString().split('T')[0]

    const attRecords = await db
      .select({ status: attendance.status })
      .from(attendance)
      .where(
        and(
          eq(attendance.userId, userId),
          gte(attendance.date, startDate),
          lte(attendance.date, endDate)
        )
      )

    const presentDays = attRecords.filter(r =>
      r.status === 'Present' || r.status === 'Late' || r.status === 'Half Day'
    ).length
    const absentDays  = attRecords.filter(r => r.status === 'Absent').length
    const leaveDays   = attRecords.filter(r => r.status === 'Leave').length

    // Working days in month
    const totalDays = new Date(year, month, 0).getDate()
    const perDaySalary = basicSalary / totalDays
    const absentDeduction = absentDays * perDaySalary

    const netSalary = basicSalary + allowances - deductions - absentDeduction

    // Upsert salary record
    const [record] = await db
      .insert(salaryRecords)
      .values({
        userId, month, year,
        basicSalary: String(basicSalary),
        allowances:  String(allowances),
        deductions:  String(deductions + absentDeduction),
        netSalary:   String(Math.max(0, netSalary)),
        presentDays, absentDays, leaveDays,
        status: 'Draft',
      })
      .onConflictDoUpdate({
        target: [salaryRecords.userId, salaryRecords.month, salaryRecords.year],
        set: {
          basicSalary: String(basicSalary),
          allowances:  String(allowances),
          deductions:  String(deductions + absentDeduction),
          netSalary:   String(Math.max(0, netSalary)),
          presentDays, absentDays, leaveDays,
        },
      })
      .returning()

    await logAudit({
      userId:     user.id,
      userEmail:  user.email,
      action:     'order_create',
      resource:   'salary_records',
      resourceId: record?.id,
      details:    { userId, month, year, netSalary },
    })

    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
