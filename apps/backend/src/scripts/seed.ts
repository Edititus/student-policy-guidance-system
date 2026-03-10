import bcrypt from 'bcrypt'
import { School, User, connectDatabase, syncDatabase } from '../models'
import sequelize from '../config/database'

/**
 * Seed database with initial data
 * - Schools: Veritas University, Bingham University
 * - Users: Super admin, School admins, Test students
 */
export const seedDatabase = async (force: boolean = false) => {
  try {
    console.log('🌱 Starting database seeding...')

    // Connect and sync database
    await connectDatabase()
    await syncDatabase(force)

    // 1. Create Schools
    console.log('\n📚 Creating schools...')
    
    const schools = await Promise.all([
      School.findOrCreate({
        where: { id: 'veritas-university' },
        defaults: {
          id: 'veritas-university',
          name: 'Veritas University',
          domain: 'veritas.edu.ng',
          country: 'Nigeria',
          type: 'private',
          contactEmail: 'info@veritas.edu.ng',
          website: 'https://veritas.edu.ng',
          settings: {
            allowStudentRegistration: true,
            requireEmailVerification: false,
            enableComparison: true,
          },
          active: true,
        },
      }),
      School.findOrCreate({
        where: { id: 'bingham-university' },
        defaults: {
          id: 'bingham-university',
          name: 'Bingham University',
          domain: 'binghamuni.edu.ng',
          country: 'Nigeria',
          type: 'private',
          contactEmail: 'info@binghamuni.edu.ng',
          website: 'https://binghamuni.edu.ng',
          settings: {
            allowStudentRegistration: true,
            requireEmailVerification: false,
            enableComparison: true,
          },
          active: true,
        },
      }),
    ])

    console.log(`✅ Created ${schools.length} schools`)

    // 2. Create Users
    console.log('\n👥 Creating users...')

    const hashedPassword = await bcrypt.hash('admin123', 10)
    const studentPassword = await bcrypt.hash('student123', 10)

    // Support env-based super admin credentials
    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'superadmin@aipolicyguide.com'
    const superAdminPasswordRaw = process.env.SUPER_ADMIN_PASSWORD || 'admin123'
    const superAdminHashedPassword = superAdminEmail !== 'superadmin@aipolicyguide.com'
      ? await bcrypt.hash(superAdminPasswordRaw, 10)
      : hashedPassword

    const users = await Promise.all([
      // Super Admin
      User.findOrCreate({
        where: { email: superAdminEmail },
        defaults: {
          email: superAdminEmail,
          password: superAdminHashedPassword,
          name: 'Super Administrator',
          role: 'super_admin',
          active: true,
        },
      }),

      // Veritas Admin
      User.findOrCreate({
        where: { email: 'admin@veritas.edu.ng' },
        defaults: {
          email: 'admin@veritas.edu.ng',
          password: hashedPassword,
          name: 'Veritas Administrator',
          role: 'admin',
          schoolId: 'veritas-university',
          schoolName: 'Veritas University',
          schoolDomain: 'veritas.edu.ng',
          active: true,
        },
      }),

      // Bingham Admin
      User.findOrCreate({
        where: { email: 'admin@binghamuni.edu.ng' },
        defaults: {
          email: 'admin@binghamuni.edu.ng',
          password: hashedPassword,
          name: 'Bingham Administrator',
          role: 'admin',
          schoolId: 'bingham-university',
          schoolName: 'Bingham University',
          schoolDomain: 'binghamuni.edu.ng',
          active: true,
        },
      }),

      // Veritas Student (You!)
      User.findOrCreate({
        where: { email: 'ediomo.titus@veritas.edu.ng' },
        defaults: {
          email: 'ediomo.titus@veritas.edu.ng',
          password: studentPassword,
          name: 'Ediomo Titus',
          role: 'student',
          schoolId: 'veritas-university',
          schoolName: 'Veritas University',
          schoolDomain: 'veritas.edu.ng',
          studentId: 'VPG/MSC/CSC/24/13314',
          year: 'MSc Year 1',
          department: 'Computer Science',
          active: true,
        },
      }),

      // Test Veritas Student
      User.findOrCreate({
        where: { email: 'student@veritas.edu.ng' },
        defaults: {
          email: 'student@veritas.edu.ng',
          password: studentPassword,
          name: 'Demo Student (Veritas)',
          role: 'student',
          schoolId: 'veritas-university',
          schoolName: 'Veritas University',
          schoolDomain: 'veritas.edu.ng',
          studentId: 'VU/2024/001',
          year: 'Year 3',
          department: 'Computer Science',
          active: true,
        },
      }),

      // Test Bingham Student
      User.findOrCreate({
        where: { email: 'student@binghamuni.edu.ng' },
        defaults: {
          email: 'student@binghamuni.edu.ng',
          password: studentPassword,
          name: 'Demo Student (Bingham)',
          role: 'student',
          schoolId: 'bingham-university',
          schoolName: 'Bingham University',
          schoolDomain: 'binghamuni.edu.ng',
          studentId: 'BU/2024/001',
          year: 'Year 2',
          department: 'Information Technology',
          active: true,
        },
      }),
    ])

    console.log(`✅ Created ${users.length} users`)

    // Ensure school_id is always correct, even for pre-existing rows
    const [veritasAdmin] = users[1]  // findOrCreate returns [User, wasCreated]
    const [binghamAdmin] = users[2]
    if (veritasAdmin.schoolId !== 'veritas-university') {
      await veritasAdmin.update({ schoolId: 'veritas-university' })
      console.log('[seed] ⚠️  Fixed admin@veritas.edu.ng school_id → veritas-university')
    }
    if (binghamAdmin.schoolId !== 'bingham-university') {
      await binghamAdmin.update({ schoolId: 'bingham-university' })
      console.log('[seed] ⚠️  Fixed admin@binghamuni.edu.ng school_id → bingham-university')
    }

    // 3. Summary
    console.log('\n📊 Database Seeding Summary:')
    console.log('================================')
    console.log(`Schools: ${schools.length}`)
    console.log(`  - Veritas University (veritas.edu.ng)`)
    console.log(`  - Bingham University (binghamuni.edu.ng)`)
    console.log(`\nUsers: ${users.length}`)
    console.log(`  - Super Admin: superadmin@aipolicyguide.com / admin123`)
    console.log(`  - Veritas Admin: admin@veritas.edu.ng / admin123`)
    console.log(`  - Bingham Admin: admin@binghamuni.edu.ng / admin123`)
    console.log(`  - Your Account: ediomo.titus@veritas.edu.ng / student123`)
    console.log(`  - Test Students: student@{school-domain} / student123`)
    console.log('================================\n')

    console.log('✅ Database seeding completed successfully!')
    
    return {
      schools: schools.map(([school]) => school),
      users: users.map(([user]) => user),
    }
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedDatabase(false)
    .then(() => {
      console.log('\n✅ Seed script completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Seed script failed:', error)
      process.exit(1)
    })
}

export default seedDatabase
