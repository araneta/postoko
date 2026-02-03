import { Request, Response } from 'express';
import { getAuth } from '@clerk/express';
import { db } from '../db/index.js';
import { employeesTable, rolesTable, storeInfoTable, ordersTable, orderItemsTable, productsTable } from '../db/schema.js';
import { eq, and, sql, desc, gte } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Helper: Check if user has required role
async function hasRole(userId: string, requiredRoles: string[]): Promise<boolean> {
    console.log('Checking roles for userId:', userId, 'against requiredRoles:', requiredRoles);
    // Fetch user and their role from the database (assume usersTable exists)
    const user = await db.select().from(employeesTable).where(eq(employeesTable.id, userId));
    if (user.length === 0) {
        return false;
    }
    const role = await db.select().from(rolesTable).where(eq(rolesTable.id, user[0].roleId));
    if (role.length === 0) {
        return false;
    }
    console.log('User:', user[0].name);
    console.log('User role:', role[0].name);
    let found = false;
    for (const r of role) {
        console.log('Comparing role:', r.name);
        if (requiredRoles.includes(r.name)) {
            console.log('found User role:', r.name);
            found = true;
            break;
        }
    }
    return found;
}

export default class EmployeesController {
    static async getEmployees(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }
        try {
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
            }

            const storeInfoId = storeInfo[0].id;

            // Only allow if user is admin/manager
            if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                //return res.status(403).json({ message: 'Forbidden' });
            }
            const employees = await db.select({
                id: employeesTable.id,
                storeInfoId: employeesTable.storeInfoId,
                name: employeesTable.name,
                email: employeesTable.email,
                password: employeesTable.password,
                roleId: employeesTable.roleId,
                createdAt: employeesTable.createdAt,
                deletedAt: employeesTable.deletedAt,
                role: {
                    id: rolesTable.id,
                    name: rolesTable.name,
                    description: rolesTable.description,
                }
            }).from(employeesTable)
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .where(and(eq(employeesTable.storeInfoId, storeInfoId), sql`${employeesTable.deletedAt} IS NULL`));
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
        // Get storeInfoId for the authenticated user
        const storeInfo = await db.select()
            .from(storeInfoTable)
            .where(eq(storeInfoTable.userId, auth.userId));

        if (storeInfo.length === 0) {
            return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
        }

        const storeInfoId = storeInfo[0].id;
        const { name: empName, email: empEmail, pin: empPIN, roleId: empRoleId } = req.body;
        const missingFields = [];
        if (!empName) missingFields.push('name');
        if (!empEmail) missingFields.push('email');
        if (!empPIN) missingFields.push('pin');
        if (!empRoleId) missingFields.push('roleId');
        if (!storeInfoId) missingFields.push('storeInfoId');
        if (missingFields.length > 0) {
            return res.status(400).json({ message: 'Missing required fields', missingFields });
        }
        try {
            const role = await db.select().from(rolesTable).where(eq(rolesTable.id, empRoleId));
            if (role.length === 0) {
                return res.status(403).json({ message: 'Invalid Role Id' });
            }
            if (role[0].name === 'admin') {
                return res.status(403).json({ message: 'Cannot assign admin role' });
            }
            if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                return res.status(403).json({ message: 'Forbiddenx' });
            }
            //const hashedPassword = await bcrypt.hash(empPassword, 10);
            const newEmployee = await db.insert(employeesTable).values({
                id: uuidv4(),
                name: empName,
                email: empEmail,
                //password: hashedPassword,
                password: empPIN, // Temporarily store plain password for PIN validation
                roleId: empRoleId,
                storeInfoId: storeInfoId,
            }).returning();
            const employeeWithRole = await db.select({
                id: employeesTable.id,
                storeInfoId: employeesTable.storeInfoId,
                name: employeesTable.name,
                email: employeesTable.email,
                password: employeesTable.password,
                roleId: employeesTable.roleId,
                createdAt: employeesTable.createdAt,
                deletedAt: employeesTable.deletedAt,
                role: {
                    id: rolesTable.id,
                    name: rolesTable.name,
                    description: rolesTable.description,
                }
            }).from(employeesTable)
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .where(eq(employeesTable.id, newEmployee[0].id));
            res.status(201).json(employeeWithRole[0]);
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
        // Get storeInfoId for the authenticated user
        const storeInfo = await db.select()
            .from(storeInfoTable)
            .where(eq(storeInfoTable.userId, auth.userId));

        if (storeInfo.length === 0) {
            return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
        }

        const storeInfoId = storeInfo[0].id;
        const employeeId = req.params.id;
        const { name, email, pin, roleId } = req.body;
        if (!name || !email || !roleId) {
            return res.status(400).json({ message: 'Missing required fields' });
        }
        try {
            if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            let updateData: any = { name, email, roleId };
            //if (password) {
            //updateData.password = await bcrypt.hash(password, 10);
            //}
            if (pin) {
                updateData.password = pin;
            }
            const updatedEmployee = await db.update(employeesTable)
                .set(updateData)
                .where(and(eq(employeesTable.storeInfoId, storeInfoId), eq(employeesTable.id, employeeId)))
                .returning();
            if (updatedEmployee.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            const employeeWithRole = await db.select({
                id: employeesTable.id,
                storeInfoId: employeesTable.storeInfoId,
                name: employeesTable.name,
                email: employeesTable.email,
                password: employeesTable.password,
                roleId: employeesTable.roleId,
                createdAt: employeesTable.createdAt,
                deletedAt: employeesTable.deletedAt,
                role: {
                    id: rolesTable.id,
                    name: rolesTable.name,
                    description: rolesTable.description,
                }
            }).from(employeesTable)
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .where(eq(employeesTable.id, updatedEmployee[0].id));
            res.status(200).json(employeeWithRole[0]);
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
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
            }

            const storeInfoId = storeInfo[0].id;
            if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            //can not delete admin
            const employee = await db.select({
                id: employeesTable.id,
                storeInfoId: employeesTable.storeInfoId,
                name: employeesTable.name,
                email: employeesTable.email,
                password: employeesTable.password,
                roleId: employeesTable.roleId,
                createdAt: employeesTable.createdAt,
                deletedAt: employeesTable.deletedAt,
                role: {
                    id: rolesTable.id,
                    name: rolesTable.name,
                    description: rolesTable.description,
                }
            }).from(employeesTable)
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .where(and(eq(employeesTable.storeInfoId, storeInfoId), eq(employeesTable.id, employeeId), sql`${employeesTable.deletedAt} IS NULL`));
            if (employee.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            if (employee[0].role && employee[0].role.name === 'admin') {
                return res.status(403).json({ message: 'Cannot delete admin employee' });
            }

            const deletedEmployee = await db.update(employeesTable)
                .set({ deletedAt: new Date() })
                .where(and(eq(employeesTable.storeInfoId, storeInfoId), eq(employeesTable.id, employeeId)))
                .returning();
            if (deletedEmployee.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            const employeeWithRole = await db.select({
                id: employeesTable.id,
                storeInfoId: employeesTable.storeInfoId,
                name: employeesTable.name,
                email: employeesTable.email,
                password: employeesTable.password,
                roleId: employeesTable.roleId,
                createdAt: employeesTable.createdAt,
                deletedAt: employeesTable.deletedAt,
                role: {
                    id: rolesTable.id,
                    name: rolesTable.name,
                    description: rolesTable.description,
                }
            }).from(employeesTable)
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .where(eq(employeesTable.id, deletedEmployee[0].id));
            res.status(200).json({ message: 'Employee deleted (soft)', employee: employeeWithRole[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error deleting employee' });
        }
    }

    static async validateEmployeePin(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            console.log('Unauthorized access attempt to validate PIN');
            return res.status(401).send('Unauthorized');
        }
        const employeeId = req.params.id;
        const { pin } = req.body;
        if (!pin) {
            console.log('PIN not provided in request body');
            return res.status(400).json({ message: 'Missing PIN in request body' });
        }
        try {
            // Allow if user is admin/manager or the employee themselves
            //if (auth.userId !== employeeId && !(await hasRole(auth.userId, ['admin', 'manager']))) {
            //  return res.status(403).json({ message: 'Forbidden' });
            //}
            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
            }

            const storeInfoId = storeInfo[0].id;

            const employee = await db.select({
                id: employeesTable.id,
                storeInfoId: employeesTable.storeInfoId,
                name: employeesTable.name,
                email: employeesTable.email,
                password: employeesTable.password,
                roleId: employeesTable.roleId,
                createdAt: employeesTable.createdAt,
                deletedAt: employeesTable.deletedAt,
                role: {
                    id: rolesTable.id,
                    name: rolesTable.name,
                    description: rolesTable.description,
                }
            }).from(employeesTable)
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .where(and(eq(employeesTable.storeInfoId, storeInfoId), eq(employeesTable.id, employeeId), sql`${employeesTable.deletedAt} IS NULL`));
            if (employee.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }
            //const isValid = await bcrypt.compare(pin, employee[0].password);
            const isValid = pin === employee[0].password;
            if (isValid) {
                res.status(200).json({ message: 'PIN is valid', employee: employee[0] });
            } else {
                res.status(200).json({ message: 'Invalid PIN' });
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error validating PIN' });
        }
    }

    // Sales tracking methods
    static async getEmployeeSales(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        try {
            const { period = 'month', employeeId } = req.query;

            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
            }

            const storeInfoId = storeInfo[0].id;

            // Check permissions
            if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            // Calculate date range
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            let whereCondition = and(
                eq(ordersTable.storeInfoId, storeInfoId),
                eq(ordersTable.status, 'completed'),
                gte(sql`${ordersTable.date}::timestamp`, startDate.toISOString())
            );

            // Filter by specific employee if provided
            if (employeeId && typeof employeeId === 'string') {
                whereCondition = and(whereCondition, eq(ordersTable.employeeId, employeeId));
            }

            const salesData = await db.select({
                employeeId: ordersTable.employeeId,
                employeeName: employeesTable.name,
                employeeRole: rolesTable.name,
                totalSales: sql`SUM(${ordersTable.total})`,
                orderCount: sql`COUNT(${ordersTable.id})`,
                averageOrderValue: sql`AVG(${ordersTable.total})`,
                totalProfit: sql`SUM(
                    (SELECT SUM(oi.quantity * (oi."unitPrice" - oi."unitCost"))
                     FROM ${orderItemsTable} oi 
                     WHERE oi."orderId" = ${ordersTable.id})
                )`
            })
                .from(ordersTable)
                .leftJoin(employeesTable, eq(ordersTable.employeeId, employeesTable.id))
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .where(whereCondition)
                .groupBy(ordersTable.employeeId, employeesTable.name, rolesTable.name)
                .orderBy(desc(sql`SUM(${ordersTable.total})`));

            res.status(200).json(salesData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching employee sales data' });
        }
    }

    static async getEmployeeSalesDetails(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        try {
            const employeeId = req.params.id;
            const { period = 'month', limit = 50 } = req.query;

            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
            }

            const storeInfoId = storeInfo[0].id;

            // Check permissions
            if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            // Calculate date range
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            // Get detailed sales for specific employee
            const salesDetails = await db.select({
                orderId: ordersTable.id,
                total: ordersTable.total,
                date: ordersTable.date,
                paymentMethod: ordersTable.paymentMethod,
                itemCount: sql`COUNT(${orderItemsTable.productId})`,
                profit: sql`SUM(${orderItemsTable.quantity} * (${orderItemsTable.unitPrice} - ${orderItemsTable.unitCost}))`
            })
                .from(ordersTable)
                .leftJoin(orderItemsTable, eq(ordersTable.id, orderItemsTable.orderId))
                .where(and(
                    eq(ordersTable.storeInfoId, storeInfoId),
                    eq(ordersTable.employeeId, employeeId),
                    eq(ordersTable.status, 'completed'),
                    gte(sql`${ordersTable.date}::timestamp`, startDate.toISOString())
                ))
                .groupBy(ordersTable.id, ordersTable.total, ordersTable.date, ordersTable.paymentMethod)
                .orderBy(desc(ordersTable.date))
                .limit(parseInt(limit as string) || 50);

            // Get employee info
            const employee = await db.select({
                id: employeesTable.id,
                name: employeesTable.name,
                email: employeesTable.email,
                role: rolesTable.name
            })
                .from(employeesTable)
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .where(and(
                    eq(employeesTable.storeInfoId, storeInfoId),
                    eq(employeesTable.id, employeeId),
                    sql`${employeesTable.deletedAt} IS NULL`
                ));

            if (employee.length === 0) {
                return res.status(404).json({ message: 'Employee not found' });
            }

            res.status(200).json({
                employee: employee[0],
                sales: salesDetails
            });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching employee sales details' });
        }
    }

    static async getEmployeePerformanceComparison(req: Request, res: Response) {
        const auth = getAuth(req);
        if (!auth.userId) {
            return res.status(401).send('Unauthorized');
        }

        try {
            const { period = 'month' } = req.query;

            // Get storeInfoId for the authenticated user
            const storeInfo = await db.select()
                .from(storeInfoTable)
                .where(eq(storeInfoTable.userId, auth.userId));

            if (storeInfo.length === 0) {
                return res.status(400).json({ message: 'Store information not found. Please set up your store first.' });
            }

            const storeInfoId = storeInfo[0].id;

            // Check permissions
            if (!(await hasRole(auth.userId, ['admin', 'manager']))) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            // Calculate date range
            const now = new Date();
            let startDate: Date;

            switch (period) {
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                default:
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            }

            // Get performance comparison data
            const performanceData = await db.select({
                employeeId: employeesTable.id,
                employeeName: employeesTable.name,
                employeeRole: rolesTable.name,
                totalSales: sql`COALESCE(SUM(${ordersTable.total}), 0)`,
                orderCount: sql`COUNT(${ordersTable.id})`,
                averageOrderValue: sql`CASE WHEN COUNT(${ordersTable.id}) > 0 THEN AVG(${ordersTable.total}) ELSE 0 END`,
                totalProfit: sql`COALESCE(SUM(
                    (SELECT SUM(oi.quantity * (oi."unitPrice" - oi."unitCost"))
                     FROM ${orderItemsTable} oi 
                     WHERE oi."orderId" = ${ordersTable.id})
                ), 0)`,
                profitMargin: sql`CASE 
                    WHEN SUM(${ordersTable.total}) > 0 THEN 
                        (SUM((SELECT SUM(oi.quantity * (oi."unitPrice" - oi."unitCost"))
                              FROM ${orderItemsTable} oi 
                              WHERE oi."orderId" = ${ordersTable.id})) / SUM(${ordersTable.total})) * 100
                    ELSE 0 
                END`
            })
                .from(employeesTable)
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .leftJoin(ordersTable, and(
                    eq(employeesTable.id, ordersTable.employeeId),
                    eq(ordersTable.status, 'completed'),
                    gte(sql`${ordersTable.date}::timestamp`, startDate.toISOString())
                ))
                .where(and(
                    eq(employeesTable.storeInfoId, storeInfoId),
                    sql`${employeesTable.deletedAt} IS NULL`
                ))
                .groupBy(employeesTable.id, employeesTable.name, rolesTable.name)
                .orderBy(desc(sql`COALESCE(SUM(${ordersTable.total}), 0)`));

            res.status(200).json(performanceData);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error fetching employee performance comparison' });
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
            res.status(200).json({ message: 'Default roles seeded successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error seeding roles' });
        }
    }
    static async getRoles(req: Request, res: Response) {
        try {
            let roles = await db.select().from(rolesTable);
            if (roles.length === 0) {
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
            const employeeWithRole = await db.select({
                id: employeesTable.id,
                storeInfoId: employeesTable.storeInfoId,
                name: employeesTable.name,
                email: employeesTable.email,
                password: employeesTable.password,
                roleId: employeesTable.roleId,
                createdAt: employeesTable.createdAt,
                deletedAt: employeesTable.deletedAt,
                role: {
                    id: rolesTable.id,
                    name: rolesTable.name,
                    description: rolesTable.description,
                }
            }).from(employeesTable)
                .leftJoin(rolesTable, eq(employeesTable.roleId, rolesTable.id))
                .where(eq(employeesTable.id, newEmployee[0].id));
            res.status(201).json({ message: 'Promoted to admin', employee: employeeWithRole[0] });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error promoting to admin' });
        }
    }
} 
