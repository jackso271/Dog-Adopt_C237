const express = require('express');
const crypto = require('crypto');
const connection = require('../db');
const { checkAdmin } = require('../middleware/auth');

const router = express.Router();

function hashPassword(password) {
    return crypto.createHash('sha1').update(password).digest('hex');
}

router.use(checkAdmin);

router.get('/dashboard', (req, res) => {
    res.render('admin/dashboard');
});

router.get('/customers', (req, res) => {
    const search = req.query.search || '';

    let sql = `
        SELECT userId, name, email, phone
        FROM users
        WHERE role = 'Customer'
    `;
    let values = [];

    if (search) {
        sql += ' AND (name LIKE ? OR email LIKE ?)';
        values = [`%${search}%`, `%${search}%`];
    }

    sql += ' ORDER BY name';

    connection.query(sql, values, (error, results) => {
        if (error) {
            console.error('Customer list error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve customers.'
            });
        }

        res.render('admin/customers', {
            customers: results,
            search: search
        });
    });
});

router.get('/customers/:id/edit', (req, res) => {
    const userId = req.params.id;
    const sql = `
        SELECT userId, name, email, phone
        FROM users
        WHERE userId = ? AND role = 'Customer'
    `;

    connection.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Retrieve customer error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve customer.'
            });
        }

        if (results.length === 0) {
            return res.status(404).render('error', {
                message: 'Customer not found.'
            });
        }

        res.render('admin/editCustomer', {
            customer: results[0]
        });
    });
});

router.post('/customers/:id/edit', (req, res) => {
    const userId = req.params.id;
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        req.flash('error', 'All fields are required.');
        return res.redirect(`/admin/customers/${userId}/edit`);
    }

    const sql = `
        UPDATE users
        SET name = ?, email = ?, phone = ?
        WHERE userId = ? AND role = 'Customer'
    `;

    connection.query(sql, [name, email, phone, userId], (error) => {
        if (error) {
            console.error('Update customer error:', error);
            req.flash('error', 'Unable to update customer. The email may already be in use.');
            return res.redirect(`/admin/customers/${userId}/edit`);
        }

        req.flash('success', 'Customer updated successfully.');
        res.redirect('/admin/customers');
    });
});

router.get('/customers/:id/delete', (req, res) => {
    const userId = req.params.id;
    const sql = `
        DELETE FROM users
        WHERE userId = ? AND role = 'Customer'
    `;

    connection.query(sql, [userId], (error) => {
        if (error) {
            console.error('Delete customer error:', error);
            req.flash('error', 'Unable to delete customer.');
            return res.redirect('/admin/customers');
        }

        req.flash('success', 'Customer deleted successfully.');
        res.redirect('/admin/customers');
    });
});

router.get('/staff', (req, res) => {
    const search = req.query.search || '';

    let sql = `
        SELECT userId, name, email, phone
        FROM users
        WHERE role = 'Staff'
    `;
    let values = [];

    if (search) {
        sql += ' AND (name LIKE ? OR email LIKE ?)';
        values = [`%${search}%`, `%${search}%`];
    }

    sql += ' ORDER BY name';

    connection.query(sql, values, (error, results) => {
        if (error) {
            console.error('Staff list error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve staff.'
            });
        }

        res.render('admin/staff', {
            staffMembers: results,
            search: search
        });
    });
});

router.get('/staff/add', (req, res) => {
    res.render('admin/addStaff');
});

router.post('/staff/add', (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/admin/staff/add');
    }

    if (password.length < 6) {
        req.flash('error', 'Password must be at least 6 characters long.');
        return res.redirect('/admin/staff/add');
    }

    const hashedPassword = hashPassword(password);
    const sql = `
        INSERT INTO users (name, email, phone, password, role)
        VALUES (?, ?, ?, ?, 'Staff')
    `;

    connection.query(sql, [name, email, phone, hashedPassword], (error) => {
        if (error) {
            console.error('Add staff error:', error);
            req.flash('error', 'Unable to add staff. The email may already be in use.');
            return res.redirect('/admin/staff/add');
        }

        req.flash('success', 'Staff account created successfully.');
        res.redirect('/admin/staff');
    });
});

router.get('/staff/:id/edit', (req, res) => {
    const userId = req.params.id;
    const sql = `
        SELECT userId, name, email, phone
        FROM users
        WHERE userId = ? AND role = 'Staff'
    `;

    connection.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Retrieve staff error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve staff.'
            });
        }

        if (results.length === 0) {
            return res.status(404).render('error', {
                message: 'Staff member not found.'
            });
        }

        res.render('admin/editStaff', {
            staffMember: results[0]
        });
    });
});

router.post('/staff/:id/edit', (req, res) => {
    const userId = req.params.id;
    const { name, email, phone } = req.body;

    if (!name || !email || !phone) {
        req.flash('error', 'All fields are required.');
        return res.redirect(`/admin/staff/${userId}/edit`);
    }

    const sql = `
        UPDATE users
        SET name = ?, email = ?, phone = ?
        WHERE userId = ? AND role = 'Staff'
    `;

    connection.query(sql, [name, email, phone, userId], (error) => {
        if (error) {
            console.error('Update staff error:', error);
            req.flash('error', 'Unable to update staff. The email may already be in use.');
            return res.redirect(`/admin/staff/${userId}/edit`);
        }

        req.flash('success', 'Staff updated successfully.');
        res.redirect('/admin/staff');
    });
});

router.get('/staff/:id/delete', (req, res) => {
    const userId = req.params.id;
    const sql = `
        DELETE FROM users
        WHERE userId = ? AND role = 'Staff'
    `;

    connection.query(sql, [userId], (error) => {
        if (error) {
            console.error('Delete staff error:', error);
            req.flash('error', 'Unable to delete staff.');
            return res.redirect('/admin/staff');
        }

        req.flash('success', 'Staff deleted successfully.');
        res.redirect('/admin/staff');
    });
});

module.exports = router;
