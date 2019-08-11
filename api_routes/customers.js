const Customer = require('../models/Customer');

module.exports = server => {

    // Get all customers
    server.get('/customers', async (req, res, next) => {
        try {
            const customers = await Customer.find({});
            res.send(customers);
        } catch(err) {
            return next(new Error('A problem occured when trying to get all users.'));
        }
    });

    // Get one customer
    server.get('/customers/:id', async (req, res, next) => {
        try {
            const customer = await Customer.findById(req.params.id);
            res.send(customer);
        } catch(err) {
            return next(new Error('A problem occured when trying to get one user.'));
        }
    });

    // Add customer
    server.post('/customers', async (req, res, next) => {
        try {
            // Check for JSON
            if (!req.is('application/json')) {
                throw new Error("Expects 'application/json'");
            }

            const { name, email, balance } = req.body; // Destructing the req.body object

            const customer = new Customer({
                name,  // simplified version of name = name,
                email,
                balance
            });

            const newCustomer = await customer.save();
            res.sendStatus(201);
        } catch (err) {
            return next(new Error('A problem occured when trying to add a user.'));
        }
    });

    // Update customer
    server.put('/customers/:id', async (req, res, next) => {
        try {
            // Check for JSON
            if (!req.is('application/json')) {
                throw new Error("Expects 'application/json'");
            }

            

            const customer = await Customer.findOneAndUpdate({ _id: req.params.id }, req.body);
            res.sendStatus(200);
        } catch (err) {
            return next(new Error('A problem occured when trying to update a user.'));
        }
    });

    // Delete Customer
    server.delete('/customers/:id', async (req, res, next) => {
        try {
            const customer = await Customer.findOneAndRemove({ _id: req.params.id });
            res.sendStatus(204);
        } catch (err) {
            return next(new Error('A problem occured when trying to delete a user.'));
        }
    });
};