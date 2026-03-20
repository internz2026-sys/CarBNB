import "dotenv/config";
import { PrismaClient } from '@prisma/client'
import { 
  owners, 
  carListings, 
  customers, 
  bookings, 
  availabilityRules, 
  availabilityExceptions, 
  accountingEntries,
  ownerPayouts,
  activityLog
} from '../lib/data/mock-data'

process.env.DATABASE_URL = "postgresql://postgres:password123@localhost:5432/carbnb_admin?schema=public";
const prisma = new PrismaClient()

async function main() {
  console.log('DATABASE_URL:', process.env.DATABASE_URL)
  console.log('Start seeding...')

  // Clear existing data (optional, but good for clean start)
  await prisma.activityLogEntry.deleteMany()
  await prisma.ownerPayout.deleteMany()
  await prisma.accountingEntry.deleteMany()
  await prisma.booking.deleteMany()
  await prisma.carAvailabilityException.deleteMany()
  await prisma.carAvailabilityRule.deleteMany()
  await prisma.carListing.deleteMany()
  await prisma.customer.deleteMany()
  await prisma.owner.deleteMany()
  await prisma.user.deleteMany()

  // 1. Owners
  for (const o of owners) {
    await prisma.owner.create({
      data: {
        id: o.id,
        fullName: o.fullName,
        contactNumber: o.contactNumber,
        email: o.email,
        address: o.address,
        status: o.status,
        remarks: o.remarks,
        bankDetails: o.bankDetails,
        carsCount: o.carsCount,
        totalEarnings: o.totalEarnings,
        createdAt: new Date(o.createdAt),
        updatedAt: new Date(o.updatedAt)
      }
    })
  }

  // 2. Car Listings
  for (const c of carListings) {
    await prisma.carListing.create({
      data: {
        id: c.id,
        ownerId: c.ownerId,
        plateNumber: c.plateNumber,
        brand: c.brand,
        model: c.model,
        year: c.year,
        color: c.color,
        transmission: c.transmission,
        fuelType: c.fuelType,
        seatingCapacity: c.seatingCapacity,
        location: c.location,
        dailyPrice: c.dailyPrice,
        description: c.description,
        photos: c.photos,
        status: c.status,
        availabilitySummary: c.availabilitySummary,
        notes: c.notes,
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt)
      }
    })
  }

  // 3. Customers
  for (const c of customers) {
    await prisma.customer.create({
      data: {
        id: c.id,
        fullName: c.fullName,
        contactNumber: c.contactNumber,
        email: c.email,
        address: c.address,
        totalBookings: c.totalBookings,
        createdAt: new Date(c.createdAt)
      }
    })
  }

  // 4. Bookings
  for (const b of bookings) {
    await prisma.booking.create({
      data: {
        id: b.id,
        referenceNumber: b.referenceNumber,
        customerId: b.customerId,
        customerName: b.customerName,
        carListingId: b.carListingId,
        carName: b.carName,
        carPhoto: b.carPhoto,
        plateNumber: b.plateNumber,
        seatingCapacity: b.seatingCapacity,
        ownerId: b.ownerId,
        ownerName: b.ownerName,
        pickupDate: new Date(b.pickupDate),
        returnDate: new Date(b.returnDate),
        totalAmount: b.totalAmount,
        platformFee: b.platformFee,
        ownerPayout: b.ownerPayout,
        status: b.status,
        paymentStatus: b.paymentStatus,
        createdAt: new Date(b.createdAt)
      }
    })
  }

  // 5. Availability Rules
  for (const r of availabilityRules) {
    await prisma.carAvailabilityRule.create({
      data: {
        id: r.id,
        carListingId: r.carListingId,
        dayOfWeek: r.dayOfWeek,
        isAvailable: r.isAvailable,
        startTime: r.startTime,
        endTime: r.endTime
      }
    })
  }

  // 6. Exceptions
  for (const e of availabilityExceptions) {
    await prisma.carAvailabilityException.create({
      data: {
        id: e.id,
        carListingId: e.carListingId,
        date: new Date(e.date),
        isAvailable: e.isAvailable,
        reason: e.reason
      }
    })
  }

  // 7. Accounting
  for (const a of accountingEntries) {
    await prisma.accountingEntry.create({
      data: {
        id: a.id,
        bookingId: a.bookingId,
        bookingRef: a.bookingRef,
        customerName: a.customerName,
        carName: a.carName,
        ownerName: a.ownerName,
        bookingAmount: a.bookingAmount,
        platformFee: a.platformFee,
        ownerPayout: a.ownerPayout,
        paymentStatus: a.paymentStatus,
        payoutStatus: a.payoutStatus,
        date: new Date(a.date)
      }
    })
  }

  // 8. Payouts
  for (const p of ownerPayouts) {
    await prisma.ownerPayout.create({
      data: {
        id: p.id,
        ownerId: p.ownerId,
        ownerName: p.ownerName,
        totalEarnings: p.totalEarnings,
        platformCommission: p.platformCommission,
        netPayout: p.netPayout,
        payoutMethod: p.payoutMethod,
        payoutStatus: p.payoutStatus,
        dateReleased: p.dateReleased ? new Date(p.dateReleased) : null
      }
    })
  }

  // 9. Activity Logs
  for (const l of activityLog) {
    await prisma.activityLogEntry.create({
      data: {
        id: l.id,
        action: l.action,
        description: l.description,
        type: l.type,
        timestamp: new Date(l.timestamp)
      }
    })
  }

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
