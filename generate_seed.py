import re
import json

# This is a very rough script to extract data from the TS file
with open('lib/data/mock-data.ts', 'r') as f:
    content = f.read()

def extract_array(name):
    match = re.search(f'export const {name}: .*? = \[(.*?)\];', content, re.DOTALL)
    if not match:
        return []
    # This won't work perfectly for complex objects but let's try to get common fields
    # Keep it simple: I'll just manually write a few inserts if needed
    return []

# Actually, I'll just manually write a few key inserts for testing
sql = """
DELETE FROM "ActivityLogEntry";
DELETE FROM "OwnerPayout";
DELETE FROM "AccountingEntry";
DELETE FROM "Booking";
DELETE FROM "CarAvailabilityException";
DELETE FROM "CarAvailabilityRule";
DELETE FROM "CarListing";
DELETE FROM "Customer";
DELETE FROM "Owner";
DELETE FROM "User";

INSERT INTO "Owner" (id, "fullName", "contactNumber", email, address, status, "createdAt", "updatedAt") 
VALUES ('OWN-001', 'Juan Dela Cruz', '+63 917 123 4567', 'juan.delacruz@email.com', '123 Rizal St, Makati City', 'VERIFIED', NOW(), NOW());

INSERT INTO "CarListing" (id, "ownerId", "plateNumber", brand, model, year, color, transmission, "fuelType", "seatingCapacity", location, "dailyPrice", status, "createdAt", "updatedAt")
VALUES ('CAR-001', 'OWN-001', 'ABC 1234', 'Toyota', 'Vios', 2023, 'White', 'AUTOMATIC', 'GASOLINE', 5, 'Makati City', 2500, 'ACTIVE', NOW(), NOW());

INSERT INTO "Customer" (id, "fullName", "contactNumber", email, "createdAt", "updatedAt")
VALUES ('CUST-001', 'Patrick Tan', '+63 922 111 2222', 'patrick.tan@email.com', NOW(), NOW());

INSERT INTO "Booking" (id, "referenceNumber", "customerId", "customerName", "carListingId", "carName", "plateNumber", "seatingCapacity", "ownerId", "ownerName", "pickupDate", "returnDate", "totalAmount", "platformFee", "ownerPayout", status, "paymentStatus", "createdAt", "updatedAt")
VALUES ('BK-001', 'BK-2026-0001', 'CUST-001', 'Patrick Tan', 'CAR-001', 'Toyota Vios 2023', 'ABC 1234', 5, 'OWN-001', 'Juan Dela Cruz', NOW(), NOW(), 7500, 1500, 6000, 'COMPLETED', 'PAID', NOW(), NOW());
"""

with open('seed.sql', 'w') as f:
    f.write(sql)
print("seed.sql created.")
