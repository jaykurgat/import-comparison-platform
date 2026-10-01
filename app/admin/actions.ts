'use server'

import { redirect } from 'next/navigation'
import { clearAdminSession, createAdminSession } from '@/lib/admin/auth'

export async function loginAdmin(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const expectedEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const expectedPassword = process.env.ADMIN_PASSWORD

  if (!expectedEmail || !expectedPassword || email !== expectedEmail || password !== expectedPassword) {
    redirect('/admin/login?error=1')
  }

  await createAdminSession()
  redirect('/admin/catalog')
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminSession()
  redirect('/admin/login')
}
