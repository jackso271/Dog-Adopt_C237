const express = require('express');
const connection = require('../db');
const { checkCustomer } = require('../middleware/auth');

const router = express.Router();

router.use(checkCustomer);

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
            console.error('Customer dashboard error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve dogs.'
            });
        }

        res.render('customer/dashboard', {
            dogs: results,
            search: search
        });
    });
});

router.get('/dogs/:id', (req, res) => {
    const dogId = req.params.id;
    const userId = req.session.user.userId;
    const dogSql = `
        SELECT *
        FROM dogs
        WHERE dogId = ? AND status = 'Available'
    `;

    connection.query(dogSql, [dogId], (dogError, dogResults) => {
        if (dogError) {
            console.error('Dog details error:', dogError);
            return res.status(500).render('error', {
                message: 'Unable to retrieve dog details.'
            });
        }

        if (dogResults.length === 0) {
            return res.status(404).render('error', {
                message: 'Dog not found or no longer available.'
            });
        }

        const requestSql = `
            SELECT requestStatus
            FROM adoption_requests
            WHERE userId = ? AND dogId = ?
        `;

        connection.query(requestSql, [userId, dogId], (requestError, requestResults) => {
            if (requestError) {
                console.error('Request check error:', requestError);
                return res.status(500).render('error', {
                    message: 'Unable to check adoption request.'
                });
            }

            res.render('customer/dogDetails', {
                dog: dogResults[0],
                existingRequest: requestResults.length > 0 ? requestResults[0] : null
            });
        });
    });
});

router.post('/dogs/:id/adopt', (req, res) => {
    const dogId = req.params.id;
    const userId = req.session.user.userId;

    const dogSql = `
        SELECT dogId
        FROM dogs
        WHERE dogId = ? AND status = 'Available'
    `;

    connection.query(dogSql, [dogId], (dogError, dogResults) => {
        if (dogError) {
            console.error('Adoption dog check error:', dogError);
            req.flash('error', 'Unable to submit adoption request.');
            return res.redirect(`/customer/dogs/${dogId}`);
        }

        if (dogResults.length === 0) {
            req.flash('error', 'This dog is no longer available.');
            return res.redirect('/customer/dashboard');
        }

        const requestSql = `
            SELECT requestId
            FROM adoption_requests
            WHERE userId = ? AND dogId = ?
        `;

        connection.query(requestSql, [userId, dogId], (requestError, requestResults) => {
            if (requestError) {
                console.error('Duplicate request check error:', requestError);
                req.flash('error', 'Unable to submit adoption request.');
                return res.redirect(`/customer/dogs/${dogId}`);
            }

            if (requestResults.length > 0) {
                req.flash('error', 'You have already submitted a request for this dog.');
                return res.redirect(`/customer/dogs/${dogId}`);
            }

            const insertSql = `
                INSERT INTO adoption_requests (userId, dogId, requestStatus)
                VALUES (?, ?, 'Pending')
            `;

            connection.query(insertSql, [userId, dogId], (insertError) => {
                if (insertError) {
                    console.error('Adoption request error:', insertError);
                    req.flash('error', 'Unable to submit adoption request.');
                    return res.redirect(`/customer/dogs/${dogId}`);
                }

                req.flash(
                    'success',
                    'Your adoption request has been submitted. Please wait for our team to contact you.'
                );
                res.redirect(`/customer/dogs/${dogId}`);
            });
        });
    });
});

router.get('/requests', (req, res) => {
    const userId = req.session.user.userId;
    const sql = `
        SELECT
            adoption_requests.requestId,
            adoption_requests.requestStatus,
            adoption_requests.requestDate,
            dogs.dogId,
            dogs.name AS dogName,
            dogs.image
        FROM adoption_requests
        INNER JOIN dogs
            ON adoption_requests.dogId = dogs.dogId
        WHERE adoption_requests.userId = ?
        ORDER BY adoption_requests.requestDate DESC
    `;

    connection.query(sql, [userId], (error, results) => {
        if (error) {
            console.error('Request history error:', error);
            return res.status(500).render('error', {
                message: 'Unable to retrieve request history.'
            });
        }

        res.render('customer/requestHistory', {
            requests: results
        });
    });
});
// =====================================================
// CUSTOMER REVIEW ROUTES
// =====================================================


// READ - Display all customer reviews
router.get('/reviews', (req, res) => {
    const sql = `
        SELECT
            reviews.reviewId,
            reviews.userId,
            reviews.title,
            reviews.rating,
            reviews.comment,
            reviews.createdAt,
            reviews.updatedAt,
            users.name AS customerName
        FROM reviews
        INNER JOIN users
            ON reviews.userId = users.userId
        ORDER BY reviews.createdAt DESC
    `;

    connection.query(sql, (error, results) => {
        if (error) {
            console.error('Reviews page error:', error);

            return res.status(500).render('error', {
                message: 'Unable to retrieve reviews.'
            });
        }

        res.render('customer/reviews', {
            reviews: results
        });
    });
});


// Display the add-review form
router.get('/reviews/new', (req, res) => {
    res.render('customer/addReview');
});


// CREATE - Add a new review
router.post('/reviews', (req, res) => {
    const userId = req.session.user.userId;

    const title = (req.body.title || '').trim();
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || '').trim();

    if (
        !title ||
        !comment ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {
        req.flash(
            'error',
            'Please enter a title, rating from 1 to 5, and review comment.'
        );

        return res.redirect('/customer/reviews/new');
    }

    const sql = `
        INSERT INTO reviews (
            userId,
            title,
            rating,
            comment
        )
        VALUES (?, ?, ?, ?)
    `;

    connection.query(
        sql,
        [userId, title, rating, comment],
        (error) => {
            if (error) {
                console.error('Create review error:', error);

                req.flash(
                    'error',
                    'Unable to add your review.'
                );

                return res.redirect('/customer/reviews/new');
            }

            req.flash(
                'success',
                'Your review has been added.'
            );

            res.redirect('/customer/reviews');
        }
    );
});


// Display the edit form
router.get('/reviews/:id/edit', (req, res) => {
    const reviewId = req.params.id;
    const userId = req.session.user.userId;

    const sql = `
        SELECT
            reviewId,
            title,
            rating,
            comment
        FROM reviews
        WHERE reviewId = ?
        AND userId = ?
    `;

    connection.query(
        sql,
        [reviewId, userId],
        (error, results) => {
            if (error) {
                console.error(
                    'Edit review page error:',
                    error
                );

                return res.status(500).render('error', {
                    message: 'Unable to retrieve the review.'
                });
            }

            if (results.length === 0) {
                req.flash(
                    'error',
                    'Review not found or you are not allowed to edit it.'
                );

                return res.redirect('/customer/reviews');
            }

            res.render('customer/editReview', {
                review: results[0]
            });
        }
    );
});


// UPDATE - Update the customer's own review
router.post('/reviews/:id/update', (req, res) => {
    const reviewId = req.params.id;
    const userId = req.session.user.userId;

    const title = (req.body.title || '').trim();
    const rating = Number(req.body.rating);
    const comment = (req.body.comment || '').trim();

    if (
        !title ||
        !comment ||
        !Number.isInteger(rating) ||
        rating < 1 ||
        rating > 5
    ) {
        req.flash(
            'error',
            'Please enter a title, rating from 1 to 5, and review comment.'
        );

        return res.redirect(
            `/customer/reviews/${reviewId}/edit`
        );
    }

    const sql = `
        UPDATE reviews
        SET
            title = ?,
            rating = ?,
            comment = ?
        WHERE reviewId = ?
        AND userId = ?
    `;

    connection.query(
        sql,
        [
            title,
            rating,
            comment,
            reviewId,
            userId
        ],
        (error, result) => {
            if (error) {
                console.error(
                    'Update review error:',
                    error
                );

                req.flash(
                    'error',
                    'Unable to update your review.'
                );

                return res.redirect(
                    `/customer/reviews/${reviewId}/edit`
                );
            }

            if (result.affectedRows === 0) {
                req.flash(
                    'error',
                    'Review not found or you are not allowed to edit it.'
                );

                return res.redirect('/customer/reviews');
            }

            req.flash(
                'success',
                'Your review has been updated.'
            );

            res.redirect('/customer/reviews');
        }
    );
});


// DELETE - Delete the customer's own review
router.post('/reviews/:id/delete', (req, res) => {
    const reviewId = req.params.id;
    const userId = req.session.user.userId;

    const sql = `
        DELETE FROM reviews
        WHERE reviewId = ?
        AND userId = ?
    `;

    connection.query(
        sql,
        [reviewId, userId],
        (error, result) => {
            if (error) {
                console.error(
                    'Delete review error:',
                    error
                );

                req.flash(
                    'error',
                    'Unable to delete your review.'
                );

                return res.redirect('/customer/reviews');
            }

            if (result.affectedRows === 0) {
                req.flash(
                    'error',
                    'Review not found or you are not allowed to delete it.'
                );

                return res.redirect('/customer/reviews');
            }

            req.flash(
                'success',
                'Your review has been deleted.'
            );

            res.redirect('/customer/reviews');
        }
    );
});

module.exports = router;
