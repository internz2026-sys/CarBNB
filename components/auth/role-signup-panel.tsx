"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ShieldCheck, UserRound } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

import { signupUser } from "@/app/actions/auth"

export const signupRoles = [
  {
    id: "host",
    badge: "Host Sign-up",
    title: "Create a car owner or host account",
    description:
      "Set up your marketplace profile to list vehicles, manage schedules, and track payouts.",
    firstNamePlaceholder: "Alex",
    lastNamePlaceholder: "Rivera",
    emailPlaceholder: "host@carbnb.com",
    actionHref: "/dashboard",
    actionLabel: "Create Host Account",
    icon: ShieldCheck,
  },
  {
    id: "customer",
    badge: "Customer Sign-up",
    title: "Create a customer account",
    description:
      "Save favorite cars, manage your trips, and book curated vehicles with confidence.",
    firstNamePlaceholder: "Jamie",
    lastNamePlaceholder: "Cruz",
    emailPlaceholder: "traveler@carbnb.com",
    actionHref: "/",
    actionLabel: "Create Customer Account",
    icon: UserRound,
  },
] as const

type SignupRoleKey = typeof signupRoles[number]["id"]

export function RoleSignupPanel({ 
  roleId, 
  redirectUrl 
}: { 
  roleId: SignupRoleKey; 
  redirectUrl?: string 
}) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const role = signupRoles.find((r) => r.id === roleId)!
  const Icon = role.icon

  const finalActionHref = redirectUrl && role.id === "customer" ? redirectUrl : role.actionHref

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    formData.append("role", role.id)
    
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const firstName = formData.get("firstName") as string
    const lastName = formData.get("lastName") as string

    if (!email || !password || !firstName || !lastName) {
      setError("Please fill in all required fields.")
      setIsLoading(false)
      return
    }

    const { error: signUpError } = await signupUser(formData)

    if (signUpError) {
      setError(signUpError)
      setIsLoading(false)
      return
    }

    // Set the legacy visual state so headers know which avatar to display until phase sync
    document.cookie = `mock_role=${role.id}; path=/; max-age=86400`
    router.push(finalActionHref)
  }

  return (
    <Card
      className="rounded-[2rem] border-none bg-surface-container-lowest shadow-[0_22px_50px_rgb(19_27_46_/_0.08)]"
      id={role.id}
    >
      <CardHeader className="space-y-3 px-6 pb-3 pt-8 sm:px-8">
        <div className="grid size-14 place-items-center rounded-[1.25rem] bg-surface-container text-primary shadow-[0_8px_20px_rgb(19_27_46_/_0.05)]">
          <Icon className="size-7" />
        </div>
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
          {role.badge}
        </div>
        <CardTitle className="font-headline text-2xl font-extrabold tracking-tight text-on-surface">
          {role.title}
        </CardTitle>
        <CardDescription className="text-sm leading-6 text-on-surface-variant">
          {role.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4 px-6 pb-8 sm:px-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-error/10 p-3 text-sm font-medium text-error">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={`${role.id}-first-name`}>First Name</Label>
              <Input id={`${role.id}-first-name`} name="firstName" placeholder={role.firstNamePlaceholder} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${role.id}-last-name`}>Last Name</Label>
              <Input id={`${role.id}-last-name`} name="lastName" placeholder={role.lastNamePlaceholder} required />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className="col-span-3 space-y-2">
              <Label htmlFor={`${role.id}-birthday`}>Birthday</Label>
              <Input id={`${role.id}-birthday`} name="birthday" type="date" />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`${role.id}-age`}>Age</Label>
              <Input id={`${role.id}-age`} name="age" type="number" min="18" max="120" placeholder="25" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${role.id}-email`}>Email</Label>
            <Input
              id={`${role.id}-email`}
              name="email"
              placeholder={role.emailPlaceholder}
              type="email"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${role.id}-password`}>Password</Label>
            <Input id={`${role.id}-password`} name="password" type="password" required />
          </div>
          
          <button 
            type="submit" 
            className={cn(buttonVariants(), "mt-2 w-full")}
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : role.actionLabel}
          </button>
        </form>
      </CardContent>
    </Card>
  )
}
