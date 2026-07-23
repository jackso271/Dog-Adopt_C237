require('dotenv').config();

const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const flash = require('connect-flash');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customer');
const staffRoutes = require('./routes/staff');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;


// Database connection
const db = mysql.createConnection({
    host: 'c237-eaint-mysql.mysql.database.azure.com',
    user: 'c237_001',
    password: 'c237001@2026!',
    database: 'c237_001_teamaplus',
    //It tells your app to talk to the Azure database using SSL, which is required by Azure for secure connections.
    //Which Azure requires to use SSL for secure connections to the database. The rejectUnauthorized: true option ensures that the SSL certificate is verified.
    ssl: {
        rejectUnauthorized: true
    }
});

db.connect((err) => {
    if (err) {
        throw err;
    }
    console.log('Connected to database');
});


app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
    secret: process.env.SESSION_SECRET || 'c237-pet-adoption-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    }
}));

app.use(flash());

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    res.locals.successMessage = req.flash('success');
    res.locals.errorMessage = req.flash('error');
    next();
});

app.get('/', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }

    if (req.session.user.role === 'Customer') {
        return res.redirect('/customer/dashboard');
    }

    if (req.session.user.role === 'Staff') {
        return res.redirect('/staff/dashboard');
    }

    return res.redirect('/admin/dashboard');
});

app.use('/', authRoutes);
app.use('/customer', customerRoutes);
app.use('/staff', staffRoutes);
app.use('/admin', adminRoutes);

app.use((req, res) => {
    res.status(404).render('error', {
        message: 'Page not found.'
    });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
