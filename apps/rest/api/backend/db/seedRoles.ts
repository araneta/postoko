import { db } from './index.js';
import { rolesTable } from './schema.js';
import { eq } from 'drizzle-orm';

const defaultRoles = [
  { name: 'admin', description: 'Full access to all features and settings' },
  { name: 'manager', description: 'Manage sales, inventory, employees, view reports' },
  { name: 'cashier', description: 'Process sales, view products, limited access' },
  { name: 'staff', description: 'Limited access, e.g., inventory or support tasks' },
];

async function seedRoles() {
  for (const role of defaultRoles) {
    // Check if role already exists
    const exists = await db.select().from(rolesTable).where(eq(rolesTable.name, role.name));
    if (exists.length === 0) {
      await db.insert(rolesTable).values(role);
      console.log(`Inserted role: ${role.name}`);
    } else {
      console.log(`Role already exists: ${role.name}`);
    }
  }
  process.exit(0);
}

seedRoles().catch((err) => {
  console.error('Error seeding roles:', err);
  process.exit(1);
}); 