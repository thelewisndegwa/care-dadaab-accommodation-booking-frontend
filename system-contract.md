# SYSTEM_CONTRACT.md

# CARE Kenya Dadaab Accommodation Booking System

Version: 1.0

---

# Purpose

This document is the single source of truth for the CARE Kenya Dadaab Accommodation Booking System.

Both the frontend and backend MUST follow this specification.

No workflow, API contract, status, role, or business rule should be changed unless this document is updated.

---

# System Overview

The system manages accommodation bookings for CARE Kenya's Dadaab office.

The accommodation facility consists of one camp.

There are NO multiple locations.

Rooms are identified only by:

- Block
- Room Number

Example

Block A
Room 15

---

# Technology

## Frontend

- HTML
- CSS
- Vanilla JavaScript

---

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

---

# User Roles

## Guest

No account.

No login.

Can

- Submit booking
- Track booking
- Request cancellation

Cannot

- Login
- View other bookings
- Approve bookings

---

## Accommodation Officer

Login required.

Can

- Review bookings
- Approve booking
- Assign room
- Reject booking
- Approve cancellation
- Decline cancellation
- Check guest in
- Check guest out

Cannot

- Change system settings

---

## Super Admin

Everything Accommodation Officer can do.

Additionally

- Manage users
- Manage rooms
- Manage accommodation rates
- Manage settings

---

# Booking Workflow

Guest

↓

Submit Booking

↓

Booking Reference Generated

↓

Confirmation Email Sent

↓

Pending Review

↓

Accommodation Officer Reviews

↓

Approve + Assign Room

OR

Reject

↓

Guest Receives Email

↓

Check In

↓

Check Out

---

# Cancellation Workflow

Guest

↓

Track Booking

↓

Request Cancellation

↓

Status becomes

Cancellation Requested

↓

Accommodation Officer Reviews

↓

Approve Cancellation

OR

Decline Cancellation

---

# Booking Statuses

The following statuses are the ONLY valid booking statuses.

Pending Review

Approved

Rejected

Cancellation Requested

Cancelled

Checked In

Checked Out

---

# Booking Reference

Every booking receives a unique booking reference.

Example

CARE-20260717-000123

Requirements

- Unique
- Human readable
- Never changes
- Included in every email
- Displayed after submission

---

# Public Pages

Home

Accommodation Booking

Booking Submitted

Track Booking

Terms & Conditions

---

# Admin Pages

Login

Dashboard

Bookings

Rooms

Rates

Users

Settings

---

# Facility Settings

Super Admin can configure

Facility Name

Support Email

Support Phone

Booking Instructions

Bookings Enabled

Public pages may read these non-sensitive settings.

When Bookings Enabled is false

- The booking form must be disabled
- The frontend must show the configured support contact
- The backend must reject new booking submissions
- Existing bookings can still be tracked and cancellation requests can still be submitted

Public settings endpoint

GET /api/settings/public

---

# Guest Booking

Guests do NOT create accounts.

Guests submit

First Name

Last Name

Email

Phone Number

Organisation

Reason For Visit

Gender

Contract Type

Arrival Date

Departure Date

Remarks

Driver Pickup

Departure Country

---

# Track Booking

Guests track bookings using

Booking Reference

+

Email Address

The backend must validate BOTH values before returning booking information.

---

# Request Cancellation

Guests cannot directly cancel bookings.

Guests submit a cancellation request.

Status becomes

Cancellation Requested

Accommodation Officer decides

Approve

or

Decline

---

# Approval Process

Approving and assigning a room happen in ONE action.

There is never an approved booking without an assigned room.

Workflow

Select Block

↓

Select Room

↓

Approve

---

# Room Assignment Rules

Before assigning a room

The backend must verify

Room exists

Room is Available

No overlapping booking

Room not under maintenance

Reject assignment if validation fails.

---

# Room Structure

Room

Block

Room Number

Capacity

Status

Room Status

Available

Occupied

Maintenance

---

# Accommodation Rates

Rates are configurable.

Never hardcode accommodation prices.

Only Super Admin can modify rates.

---

# Payments

Payments are NOT implemented in Version 1.

The system must still prepare for future Daraja integration.

Booking should contain

payment.status

payment.method

payment.amount

payment.transactionReference

payment.paidAt

Future payment statuses

Not Required

Pending

Paid

Failed

Waived

---

# Email Notifications

Booking Submitted

Booking Approved

Booking Rejected

Cancellation Approved

Cancellation Declined

Submission email must include

Booking Reference

Arrival Date

Departure Date

Current Status

Reminder to save the Booking Reference

---

# Success Page

After submitting a booking the user should see

Booking Submitted Successfully

Booking Reference

Copy Reference button

Track Booking button

Message

Please save this Booking Reference.

You will need it to

Track your booking

Contact CARE

Request cancellation

A confirmation email has been sent.

---

# Audit Timeline

Every booking maintains an immutable timeline.

Examples

Booking Submitted

Email Sent

Approved

Room Assigned

Cancellation Requested

Cancellation Approved

Checked In

Checked Out

Timeline entries are append-only.

Never edit previous history.

---

# API Standards

REST API

JSON requests

JSON responses

Meaningful HTTP status codes

Consistent response structure

Example Success

{
    "success": true,
    "message": "Booking submitted successfully.",
    "data": {}
}

Example Error

{
    "success": false,
    "message": "Room is already occupied.",
    "errors": []
}

---

# Validation Rules

Arrival Date

Must not be in the past.

Departure Date

Must be after Arrival Date.

Email

Must be valid.

Phone

Required.

Required Fields

Validate on frontend.

Validate again on backend.

Never trust client validation.

---

# Security

Passwords hashed with bcrypt.

JWT authentication.

Role-based authorization.

Validate all API input.

Sanitize request data.

Never expose sensitive information.

---

# Database Collections

users

bookings

rooms

rates

audit_logs

Future

payments

---

# Coding Principles

Keep business logic in the backend.

Frontend must never implement business rules.

Avoid duplicated logic.

Keep components reusable.

Keep APIs RESTful.

Keep naming consistent.

---

# Naming Convention

camelCase

Examples

bookingReference

arrivalDate

departureDate

driverPickup

contractType

roomNumber

firstName

lastName

createdAt

updatedAt

---

# Out of Scope (Version 1)

No multiple camps

No guest accounts

No SMS

No analytics

No reports

No calendar booking

No online payments

No attachments

No mobile application

---

# Future Roadmap

Daraja API Integration

Payment Dashboard

Reports

Analytics

SMS Notifications

Calendar View

Multiple CARE Locations

Room Availability Dashboard
