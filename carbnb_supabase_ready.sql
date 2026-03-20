--
-- PostgreSQL database dump
--


-- Dumped from database version 18.2
-- Dumped by pg_dump version 18.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AccountingEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AccountingEntry" (
    id text NOT NULL,
    "bookingId" text NOT NULL,
    "bookingRef" text NOT NULL,
    "customerName" text NOT NULL,
    "carName" text NOT NULL,
    "ownerName" text NOT NULL,
    "bookingAmount" double precision NOT NULL,
    "platformFee" double precision NOT NULL,
    "ownerPayout" double precision NOT NULL,
    "paymentStatus" text NOT NULL,
    "payoutStatus" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "transactionType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AccountingEntry" OWNER TO postgres;

--
-- Name: ActivityLogEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ActivityLogEntry" (
    id text NOT NULL,
    action text NOT NULL,
    description text NOT NULL,
    type text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ActivityLogEntry" OWNER TO postgres;

--
-- Name: Booking; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Booking" (
    id text NOT NULL,
    "referenceNumber" text NOT NULL,
    "customerId" text NOT NULL,
    "customerName" text NOT NULL,
    "carListingId" text NOT NULL,
    "carName" text NOT NULL,
    "carPhoto" text,
    "plateNumber" text NOT NULL,
    "seatingCapacity" integer NOT NULL,
    "ownerId" text NOT NULL,
    "ownerName" text NOT NULL,
    "pickupDate" timestamp(3) without time zone NOT NULL,
    "returnDate" timestamp(3) without time zone NOT NULL,
    "totalAmount" double precision NOT NULL,
    "platformFee" double precision NOT NULL,
    "ownerPayout" double precision NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    "paymentStatus" text DEFAULT 'UNPAID'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Booking" OWNER TO postgres;

--
-- Name: CarAvailabilityException; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CarAvailabilityException" (
    id text NOT NULL,
    "carListingId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "isAvailable" boolean DEFAULT false NOT NULL,
    reason text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CarAvailabilityException" OWNER TO postgres;

--
-- Name: CarAvailabilityRule; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CarAvailabilityRule" (
    id text NOT NULL,
    "carListingId" text NOT NULL,
    "dayOfWeek" text NOT NULL,
    "isAvailable" boolean DEFAULT true NOT NULL,
    "startTime" text,
    "endTime" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CarAvailabilityRule" OWNER TO postgres;

--
-- Name: CarListing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."CarListing" (
    id text NOT NULL,
    "ownerId" text NOT NULL,
    "plateNumber" text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    year integer NOT NULL,
    color text NOT NULL,
    transmission text NOT NULL,
    "fuelType" text NOT NULL,
    "seatingCapacity" integer NOT NULL,
    location text NOT NULL,
    "dailyPrice" double precision NOT NULL,
    description text,
    photos text[],
    status text DEFAULT 'PENDING_APPROVAL'::text NOT NULL,
    "availabilitySummary" text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CarListing" OWNER TO postgres;

--
-- Name: Customer; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Customer" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    "contactNumber" text NOT NULL,
    email text NOT NULL,
    address text,
    "totalBookings" integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Customer" OWNER TO postgres;

--
-- Name: Owner; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Owner" (
    id text NOT NULL,
    "fullName" text NOT NULL,
    "contactNumber" text NOT NULL,
    email text NOT NULL,
    address text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    remarks text,
    "bankDetails" text,
    "carsCount" integer DEFAULT 0 NOT NULL,
    "totalEarnings" double precision DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Owner" OWNER TO postgres;

--
-- Name: OwnerPayout; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OwnerPayout" (
    id text NOT NULL,
    "ownerId" text NOT NULL,
    "ownerName" text NOT NULL,
    "totalEarnings" double precision NOT NULL,
    "platformCommission" double precision NOT NULL,
    "netPayout" double precision NOT NULL,
    "payoutMethod" text NOT NULL,
    "payoutStatus" text NOT NULL,
    "dateReleased" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."OwnerPayout" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text,
    role text DEFAULT 'ADMIN'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Data for Name: AccountingEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: ActivityLogEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: Booking; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Booking" VALUES ('BK-001', 'BK-2026-0001', 'CUST-001', 'Patrick Tan', 'CAR-001', 'Toyota Vios 2023', NULL, 'ABC 1234', 5, 'OWN-001', 'Juan Dela Cruz', '2026-03-21 00:42:32.304', '2026-03-21 00:42:32.304', 7500, 1500, 6000, 'COMPLETED', 'PAID', '2026-03-21 00:42:32.304', '2026-03-21 00:42:32.304');


--
-- Data for Name: CarAvailabilityException; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: CarAvailabilityRule; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: CarListing; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."CarListing" VALUES ('CAR-001', 'OWN-001', 'ABC 1234', 'Toyota', 'Vios', 2023, 'White', 'AUTOMATIC', 'GASOLINE', 5, 'Makati City', 2500, NULL, NULL, 'ACTIVE', NULL, NULL, '2026-03-21 00:42:32.297', '2026-03-21 00:42:32.297');


--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Customer" VALUES ('CUST-001', 'Patrick Tan', '+63 922 111 2222', 'patrick.tan@email.com', NULL, 0, '2026-03-21 00:42:32.302', '2026-03-21 00:42:32.302');


--
-- Data for Name: Owner; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO public."Owner" VALUES ('OWN-001', 'Juan Dela Cruz', '+63 917 123 4567', 'juan.delacruz@email.com', '123 Rizal St, Makati City', 'VERIFIED', NULL, NULL, 0, 0, '2026-03-21 00:42:32.292', '2026-03-21 00:42:32.292');


--
-- Data for Name: OwnerPayout; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Name: AccountingEntry AccountingEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AccountingEntry"
    ADD CONSTRAINT "AccountingEntry_pkey" PRIMARY KEY (id);


--
-- Name: ActivityLogEntry ActivityLogEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ActivityLogEntry"
    ADD CONSTRAINT "ActivityLogEntry_pkey" PRIMARY KEY (id);


--
-- Name: Booking Booking_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_pkey" PRIMARY KEY (id);


--
-- Name: CarAvailabilityException CarAvailabilityException_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CarAvailabilityException"
    ADD CONSTRAINT "CarAvailabilityException_pkey" PRIMARY KEY (id);


--
-- Name: CarAvailabilityRule CarAvailabilityRule_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CarAvailabilityRule"
    ADD CONSTRAINT "CarAvailabilityRule_pkey" PRIMARY KEY (id);


--
-- Name: CarListing CarListing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CarListing"
    ADD CONSTRAINT "CarListing_pkey" PRIMARY KEY (id);


--
-- Name: Customer Customer_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Customer"
    ADD CONSTRAINT "Customer_pkey" PRIMARY KEY (id);


--
-- Name: OwnerPayout OwnerPayout_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OwnerPayout"
    ADD CONSTRAINT "OwnerPayout_pkey" PRIMARY KEY (id);


--
-- Name: Owner Owner_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Owner"
    ADD CONSTRAINT "Owner_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Booking_referenceNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Booking_referenceNumber_key" ON public."Booking" USING btree ("referenceNumber");


--
-- Name: CarListing_plateNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "CarListing_plateNumber_key" ON public."CarListing" USING btree ("plateNumber");


--
-- Name: Customer_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Customer_email_key" ON public."Customer" USING btree (email);


--
-- Name: Owner_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Owner_email_key" ON public."Owner" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: AccountingEntry AccountingEntry_bookingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AccountingEntry"
    ADD CONSTRAINT "AccountingEntry_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES public."Booking"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_carListingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_carListingId_fkey" FOREIGN KEY ("carListingId") REFERENCES public."CarListing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public."Customer"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Booking Booking_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Booking"
    ADD CONSTRAINT "Booking_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."Owner"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CarAvailabilityException CarAvailabilityException_carListingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CarAvailabilityException"
    ADD CONSTRAINT "CarAvailabilityException_carListingId_fkey" FOREIGN KEY ("carListingId") REFERENCES public."CarListing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CarAvailabilityRule CarAvailabilityRule_carListingId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CarAvailabilityRule"
    ADD CONSTRAINT "CarAvailabilityRule_carListingId_fkey" FOREIGN KEY ("carListingId") REFERENCES public."CarListing"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: CarListing CarListing_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."CarListing"
    ADD CONSTRAINT "CarListing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."Owner"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OwnerPayout OwnerPayout_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OwnerPayout"
    ADD CONSTRAINT "OwnerPayout_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."Owner"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


