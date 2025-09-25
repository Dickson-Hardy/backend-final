# Database Seeding Scripts

This directory contains scripts to seed the AMHSJ database with initial data.

## Available Scripts

### 1. Admin User Only (`seed-admin.ts`)
Creates only the admin user account.

**Usage:**
```bash
npm run seed:admin
```

**Creates:**
- Admin user: `admin@amhsj.org` / `Admin@2025!`

### 2. Complete Database Seeding (`seed-database.ts`)
Creates comprehensive test data including users, volumes, and news items.

**Usage:**
```bash
npm run seed:all
```

**Creates:**
- Admin user: `admin@amhsj.org` / `Admin@2025!`
- Editor-in-Chief: `editor@amhsj.org` / `Editor@2025!`
- Sample Authors: `mchen@university.edu` / `Author@2025!`
- Sample Authors: `erodriguez@hospital.org` / `Author@2025!`
- Sample Volumes (previous and current year)
- Sample News Items

## Prerequisites

1. Make sure MongoDB is running
2. Ensure the backend application can connect to the database
3. Run from the backend directory: `cd backend`

## Security Notes

- All passwords are hashed using bcrypt with 12 rounds
- Admin password: `Admin@2025!` (strong password with special characters)
- Scripts check for existing users to prevent duplicates
- Email verification is set to `true` for all seeded users

## Troubleshooting

If you encounter errors:
1. Check MongoDB connection
2. Ensure all required services are running
3. Verify database permissions
4. Check console output for specific error messages

## Customization

You can modify the seed scripts to:
- Change user details
- Add more sample data
- Modify password requirements
- Add additional user roles
