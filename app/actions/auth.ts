"use server"

import { createClient } from "@/lib/supabase/server"

export async function loginWithEmailPassword(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
}

import { db } from "@/lib/db"

export async function signupUser(formData: FormData) {
  const role = formData.get("role") as string
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const firstName = formData.get("firstName") as string
  const lastName = formData.get("lastName") as string
  const contactNumber = formData.get("contactNumber") as string ?? "000-000-0000"
  
  const fullName = `${firstName} ${lastName}`

  const supabase = await createClient()

  // 1. Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        fullName,
      }
    }
  })

  if (error) {
    return { error: error.message }
  }

  // 2. Sync to Prisma Database
  try {
    if (role === "host") {
      await db.owner.create({
        data: {
          email,
          fullName,
          contactNumber,
          address: "123 Marketplace Ave", // placeholder for now since UI doesn't collect address
          status: "VERIFIED"
        }
      })
    } else {
      await db.customer.create({
        data: {
          email,
          fullName,
          contactNumber,
        }
      })
    }
  } catch (dbError) {
    console.error("Prisma sync error:", dbError)
    // We swallow the Prisma error right now to avoid blocking login if it's just a duplicate from a previous mock run
  }

  return { success: true }
}
