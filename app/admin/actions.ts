'use server'

import { redirect } from 'next/navigation'
import { clearAdminSession, createAdminSession } from '@/lib/admin/auth'

export async function loginAdmin(formData: FormData): Promise<void> {
  const password = String(formData.get('password') ?? '')
  const expected = process.env.ADMIN_PASSWORD

  if (!expected || password !== expected) {
    redirect('/admin/login?error=1')
  }

  await createAdminSession()
  redirect('/admin/catalog')
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminSession()
  redirect('/admin/login')
}
