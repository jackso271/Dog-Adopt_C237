const express = require('express');
const crypto = require('crypto');
const connection = require('../db');

const router = express.Router();

function hashPassword(password) {
    return crypto.createHash('sha1').update(password).digest('hex');
}

function redirectByRole(req, res) {
    if (req.session.user.role === 'Customer') {
        return res.redirect('/customer/dashboard');
    }

    if (req.session.user.role === 'Staff') {
        return res.redirect('/staff/dashboard');
    }

    return res.redirect('/admin/dashboard');
}

router.get('/login', (req, res) => {
    if (req.session.user) {
        return redirectByRole(req, res);
    }

    res.render('login');
});

router.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        req.flash('error', 'Email and password are required.');
        return res.redirect('/login');
    }

    const hashedPassword = hashPassword(password);
    const sql = `
        SELECT userId, name, email, phone, role
        FROM users
        WHERE email = ? AND password = ?
    `;

    connection.query(sql, [email, hashedPassword], (error, results) => {
        if (error) {
            console.error('Login error:', error);
            req.flash('error', 'Unable to log in.');
            return res.redirect('/login');
        }

        if (results.length === 0) {
            req.flash('error', 'Invalid email or password.');
            return res.redirect('/login');
        }

        req.session.user = results[0];
        redirectByRole(req, res);
    });
});

router.get('/signup', (req, res) => {
    if (req.session.user) {
        return redirectByRole(req, res);
    }

    res.render('signup');
});

router.post('/signup', (req, res) => {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
        req.flash('error', 'All fields are required.');
        return res.redirect('/signup');
    }

    if (password.length < 6) {
        req.flash('error', 'Password must be at least 6 characters long.');
        return res.redirect('/signup');
    }

    const checkSql = 'SELECT userId FROM users WHERE email = ?';

    connection.query(checkSql, [email], (checkError, checkResults) => {
        if (checkError) {
            console.error('Signup check error:', checkError);
            req.flash('error', 'Unable to create account.');
            return res.redirect('/signup');
        }

        if (checkResults.length > 0) {
            req.flash('error', 'This email is already registered.');
            return res.redirect('/signup');
        }

        const hashedPassword = hashPassword(password);
        const insertSql = `
            INSERT INTO users (name, email, phone, password, role)
            VALUES (?, ?, ?, ?, 'Customer')
        `;

        connection.query(
            insertSql,
            [name, email, phone, hashedPassword],
            (insertError) => {
                if (insertError) {
                    console.error('Signup error:', insertError);
                    req.flash('error', 'Unable to create account.');
                    return res.redirect('/signup');
                }

                req.flash('success', 'Account created successfully. Please log in.');
                res.redirect('/login');
            }
        );
    });
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
});

module.exports = router;
