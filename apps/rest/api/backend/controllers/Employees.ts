import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { db } from '../db';
import { employeesTable, rolesTable, storeInfoTable } from '../db/schema';
import { eq, and, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Helper: Check if user has required role
async function hasRole(userId: string, requiredRoles: string[]): Promise<boolean> {
    // Fetch user and their role from the database (assume usersTable exists)
    const user = await db.select().from(employeesTable).where(eq(employeesTable.id, userId));
    if (user.length === 0) return false;
    const role = await db.select().from(rolesTable).where(eq(rolesTable.id, user[0].roleId));
    if (role.length === 0) return false;
    return requiredRoles.includes(role[0].name);
}

export default class EmployeesController {
    static async getEmployees(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            // Only allow if user is admin/manager
            //if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                //return res.status(403).json({ message: 'Forbidden' });
            //}
            const employees = await db.select().from(employeesTable).where(sql`${employeesTable.deletedAt} IS NULL`);
            res.status(200).json(employees);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching employees' });
        }
    }

    static async createEmployee(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const { name: empName, email: empEmail, password: empPassword, roleId: empRoleId, storeInfoId: empStoreInfoId } = req.body;
        const missingFields = [];
        if (!empName) missingFields.push('name');
        if (!empEmail) missingFields.push('email');
        if (!empPassword) missingFields.push('password');
        if (!empRoleId) missingFields.push('roleId');
        if (!empStoreInfoId) missingFields.push('storeInfoId');
        if (missingFields.length > 0) {
            return res.status(400).json({ message: 'Missing required fields', missingFields });
        }
        try {
            //if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                //return res.status(403).json({ message: 'Forbidden' });
            //}
            const hashedPassword = await bcrypt.hash(empPassword, 10);
            const newEmployee = await db.insert(employeesTable).values({
                id: uuidv4(),
                name: empName,
                email: empEmail,
                password: hashedPassword,
                roleId: empRoleId,
                storeInfoId: empStoreInfoId,
            }).returning();
            res.status(201).json(newEmployee[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error creating employee' });
        }
    }

    static async updateEmployee(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const employeeId = req.params.id;
        const { name, email, password, roleId } = req.body;
        if (!name || !email || !roleId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        try {
            if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            let updateData: any = { name, email, roleId };
            if (password) {
                updateData.password = await bcrypt.hash(password, 10);
            }
            const updatedEmployee = await db.update(employeesTable)
                .set(updateData)
                .where(eq(employeesTable.id, employeeId))
                .returning();
            if (updatedEmployee.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            res.status(200).json(updatedEmployee[0]);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error updating employee' });
        }
    }

    static async deleteEmployee(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        const employeeId = req.params.id;
        try {
            if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            const deletedEmployee = await db.update(employeesTable)
                .set({ deletedAt: new Date() })
                .where(eq(employeesTable.id, employeeId))
                .returning();
            if (deletedEmployee.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            res.status(200).json({ message: 'Employee deleted (soft)', employee: deletedEmployee[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting employee' });
        }
    }
}

export class RolesController {
    static async doSeedDefaultRoles() {
        const defaultRoles = [
            { name: 'admin', description: 'Full access to all features and settings' },
            { name: 'manager', description: 'Manage sales, inventory, employees, view reports' },
            { name: 'cashier', description: 'Process sales, view products, limited access' },
            { name: 'staff', description: 'Limited access, e.g., inventory or support tasks' },
        ];
        const inserted: string[] = [];
        const existed: string[] = [];
        
        for (const role of defaultRoles) {
            const exists = await db.select().from(rolesTable).where(eq(rolesTable.name, role.name));
            if (exists.length === 0) {
                await db.insert(rolesTable).values(role);
                inserted.push(role.name);
            } else {
                existed.push(role.name);
            }
        }
    }
    static async seedDefaultRoles(req: Request, res: Response) {
        
        try {
            RolesController.doSeedDefaultRoles();
            res.status(200).json({message: 'Default roles seeded successfully'});
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error seeding roles' });
        }
    }
    static async getRoles(req: Request, res: Response) {
        try {
            let roles = await db.select().from(rolesTable);
            if(roles.length === 0) {
                await RolesController.doSeedDefaultRoles();
                roles = await db.select().from(rolesTable);
            }
            res.status(200).json(roles);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching roles' });
        }
    }

    

    static async promoteMeAdmin(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        try {
            // Check if already in employees
            const existing = await db.select().from(employeesTable).where(eq(employeesTable.id, auth.userId));
            if (existing.length > 0) {
                return res.status(200).json({ message: 'Already an employee', employee: existing[0] });
            }
            // Get admin roleId
            const roles = await db.select().from(rolesTable).where(eq(rolesTable.name, 'admin'));
            if (roles.length === 0) {
                return res.status(400).json({ message: 'Admin role not found. Please seed roles first.' });
            }
            const roleId = roles[0].id;
            // Get storeInfoId for this user
            const stores = await db.select().from(storeInfoTable).where(eq(storeInfoTable.userId, auth.userId));
            if (stores.length === 0) {
                return res.status(400).json({ message: 'No storeInfo found for this user. Please set up your store first.' });
            }
            const storeInfoId = stores[0].id;
            // Get user info from Clerk
            let name = 'Admin';
            let email = '';
            if (auth.sessionClaims && auth.sessionClaims.email) {
                email = typeof auth.sessionClaims.email === 'string' ? auth.sessionClaims.email : '';
            } else if (auth.sessionClaims && auth.sessionClaims['email_address']) {
                email = typeof auth.sessionClaims['email_address'] === 'string' ? auth.sessionClaims['email_address'] : '';
            } else {
                email = auth.userId + '@example.com';
            }
            if (auth.sessionClaims && auth.sessionClaims.name) {
                name = typeof auth.sessionClaims.name === 'string' ? auth.sessionClaims.name : name;
            }
            // Insert as admin
            const newEmployee = await db.insert(employeesTable).values({
                id: auth.userId,
                storeInfoId,
                name,
                email,
                password: '', // Not used with Clerk
                roleId,
            }).returning();
            res.status(201).json({ message: 'Promoted to admin', employee: newEmployee[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error promoting to admin' });
        }
    }
} 
