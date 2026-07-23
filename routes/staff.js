const express = require('express');
const multer = require('multer');
const connection = require('../db');
const { checkStaff } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images/dogs');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage });

router.use(checkStaff);

router.get('/dashboard', (req, res) => {
    const search = req.query.search || '';

    let sql = `
        SELECT *
        FROM dogs
        WHERE status = 'Available'
    `;
    let values = [];

    if (search) {
        sql += ' AND (name LIKE ? OR breed LIKE ?)';
        values = [`%${search}%`, `%${search}%`];
    }

    sql += ' ORDER BY dogId DESC';

    connection.query(sql, values, (error, results) => {
        if (error) {
            console.error('Staff dashboard error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve dogs.'
            });
        }

        res.render('staff/dashboard', {
            dogs: results,
            search: search
        });
    });
});

router.get('/dogs/add', (req, res) => {
    res.render('staff/addDog');
});

router.post('/dogs/add', upload.single('image'), (req, res) => {
    const { name, age, gender, breed, summary } = req.body;

    if (!name || !age || !gender || !breed || !summary || !req.file) {
        req.flash('error', 'All fields and an image are required.');
        return res.redirect('/staff/dogs/add');
    }

    const image = req.file.filename;
    const sql = `
        INSERT INTO dogs (name, age, gender, breed, summary, image, status)
        VALUES (?, ?, ?, ?, ?, ?, 'Available')
    `;

    connection.query(
        sql,
        [name, age, gender, breed, summary, image],
        (error) => {
            if (error) {
                console.error('Add dog error:', error);
                req.flash('error', 'Unable to add dog.');
                return res.redirect('/staff/dogs/add');
            }

            req.flash('success', 'Dog added successfully.');
            res.redirect('/staff/dashboard');
        }
    );
});

router.get('/dogs/:id', (req, res) => {
    const dogId = req.params.id;
    const sql = 'SELECT * FROM dogs WHERE dogId = ?';

    connection.query(sql, [dogId], (error, results) => {
        if (error) {
            console.error('Staff dog details error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve dog details.'
            });
        }

        if (results.length === 0) {
            return res.status(404).render('error', {
                message: 'Dog not found.'
            });
        }

        res.render('staff/dogDetails', {
            dog: results[0]
        });
    });
});

router.get('/dogs/:id/edit', (req, res) => {
    const dogId = req.params.id;
    const sql = 'SELECT * FROM dogs WHERE dogId = ?';

    connection.query(sql, [dogId], (error, results) => {
        if (error) {
            console.error('Retrieve dog for edit error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve dog details.'
            });
        }

        if (results.length === 0) {
            return res.status(404).render('error', {
                message: 'Dog not found.'
            });
        }

        res.render('staff/editDog', {
            dog: results[0]
        });
    });
});

router.post('/dogs/:id/edit', upload.single('image'), (req, res) => {
    const dogId = req.params.id;
    const { name, age, gender, breed, summary, currentImage } = req.body;
    const image = req.file ? req.file.filename : currentImage;

    if (!name || !age || !gender || !breed || !summary || !image) {
        req.flash('error', 'All fields are required.');
        return res.redirect(`/staff/dogs/${dogId}/edit`);
    }

    const sql = `
        UPDATE dogs
        SET name = ?, age = ?, gender = ?, breed = ?, summary = ?, image = ?
        WHERE dogId = ?
    `;

    connection.query(
        sql,
        [name, age, gender, breed, summary, image, dogId],
        (error) => {
            if (error) {
                console.error('Update dog error:', error);
                req.flash('error', 'Unable to update dog.');
                return res.redirect(`/staff/dogs/${dogId}/edit`);
            }

            req.flash('success', 'Dog updated successfully.');
            res.redirect(`/staff/dogs/${dogId}`);
        }
    );
});

router.get('/dogs/:id/delete', (req, res) => {
    const dogId = req.params.id;
    const sql = 'DELETE FROM dogs WHERE dogId = ?';

    connection.query(sql, [dogId], (error) => {
        if (error) {
            console.error('Delete dog error:', error);
            req.flash('error', 'Unable to delete dog.');
            return res.redirect('/staff/dashboard');
        }

        req.flash('success', 'Dog deleted successfully.');
        res.redirect('/staff/dashboard');
    });
});

router.get('/report', (req, res) => {
    const countSql = `
        SELECT
            SUM(status = 'Adopted') AS adoptedDogs,
            SUM(status = 'Available') AS availableDogs
        FROM dogs
    `;

    connection.query(countSql, (countError, countResults) => {
        if (countError) {
            console.error('Report count error:', countError);
            return res.status(500).render('error', {
                message: 'Unable to retrieve report.'
            });
        }

        const requestSql = `
            SELECT
                adoption_requests.requestId,
                adoption_requests.requestDate,
                users.userId,
                users.name AS customerName,
                dogs.dogId,
                dogs.name AS dogName
            FROM adoption_requests
            INNER JOIN users
                ON adoption_requests.userId = users.userId
            INNER JOIN dogs
                ON adoption_requests.dogId = dogs.dogId
            WHERE adoption_requests.requestStatus = 'Pending'
            ORDER BY adoption_requests.requestDate ASC
        `;

        connection.query(requestSql, (requestError, requestResults) => {
            if (requestError) {
                console.error('Report request error:', requestError);
                return res.status(500).render('error', {
                    message: 'Unable to retrieve adoption requests.'
                });
            }

            res.render('staff/report', {
                adoptedDogs: Number(countResults[0].adoptedDogs || 0),
                availableDogs: Number(countResults[0].availableDogs || 0),
                requests: requestResults
            });
        });
    });
});

router.get('/customers/:id', (req, res) => {
    const userId = req.params.id;
    const sql = `
        SELECT userId, name, email, phone
        FROM users
        WHERE userId = ? AND role = 'Customer'
    `;

    connection.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Customer details error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve customer details.'
            });
        }

        if (results.length === 0) {
            return res.status(404).render('error', {
                message: 'Customer not found.'
            });
        }

        res.render('staff/customerDetails', {
            customer: results[0]
        });
    });
});

router.post('/requests/:id/accept', (req, res) => {
    const requestId = req.params.id;
    const findSql = `
        SELECT requestId, dogId
        FROM adoption_requests
        WHERE requestId = ? AND requestStatus = 'Pending'
    `;

    connection.query(findSql, [requestId], (findError, findResults) => {
        if (findError) {
            console.error('Accept request lookup error:', findError);
            req.flash('error', 'Unable to accept request.');
            return res.redirect('/staff/report');
        }

        if (findResults.length === 0) {
            req.flash('error', 'This request is no longer pending.');
            return res.redirect('/staff/report');
        }

        const dogId = findResults[0].dogId;
        const acceptSql = `
            UPDATE adoption_requests
            SET requestStatus = 'Accepted'
            WHERE requestId = ?
        `;

        connection.query(acceptSql, [requestId], (acceptError) => {
            if (acceptError) {
                console.error('Accept request error:', acceptError);
                req.flash('error', 'Unable to accept request.');
                return res.redirect('/staff/report');
            }

            const dogSql = `
                UPDATE dogs
                SET status = 'Adopted'
                WHERE dogId = ?
            `;

            connection.query(dogSql, [dogId], (dogError) => {
                if (dogError) {
                    console.error('Adopt dog status error:', dogError);
                    req.flash('error', 'Request was accepted, but dog status could not be updated.');
                    return res.redirect('/staff/report');
                }

                const closeSql = `
                    UPDATE adoption_requests
                    SET requestStatus = 'Closed'
                    WHERE dogId = ?
                      AND requestId <> ?
                      AND requestStatus = 'Pending'
                `;

                connection.query(closeSql, [dogId, requestId], (closeError) => {
                    if (closeError) {
                        console.error('Close other requests error:', closeError);
                        req.flash('error', 'Dog was adopted, but other requests could not be closed.');
                        return res.redirect('/staff/report');
                    }

                    req.flash('success', 'Adoption request accepted.');
                    res.redirect('/staff/report');
                });
            });
        });
    });
});

router.post('/requests/:id/deny', (req, res) => {
    const requestId = req.params.id;
    const sql = `
        UPDATE adoption_requests
        SET requestStatus = 'Denied'
        WHERE requestId = ? AND requestStatus = 'Pending'
    `;

    connection.query(sql, [requestId], (error) => {
        if (error) {
            console.error('Deny request error:', error);
            req.flash('error', 'Unable to deny request.');
            return res.redirect('/staff/report');
        }

        req.flash('success', 'Adoption request denied.');
        res.redirect('/staff/report');
    });
});

module.exports = router;
