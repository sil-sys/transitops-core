const Expense = require('../models/Expense');
const Vehicle = require('../models/Vehicle');
const ApiError = require('../utils/ApiError');

const expenseTypes = ['Fuel', 'Toll', 'Maintenance', 'Parking', 'Insurance', 'Other'];

const serializeExpense = (expense) => {
  if (!expense) return expense;

  const object = expense.toObject ? expense.toObject() : expense;
  return {
    ...object,
    amount: Number(object.amount),
  };
};

// @desc   Get all expenses
// @route  GET /api/expenses
// @access Private
const getExpenses = async (req, res, next) => {
  try {
    const expenses = await Expense.find()
      .populate('vehicle', 'name registrationNumber')
      .sort({ date: -1, createdAt: -1 });

    res.status(200).json({ success: true, count: expenses.length, data: expenses.map(serializeExpense) });
  } catch (error) {
    next(error);
  }
};

// @desc   Get single expense
// @route  GET /api/expenses/:id
// @access Private
const getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id).populate('vehicle', 'name registrationNumber');
    if (!expense) return next(new ApiError(404, 'Expense not found'));

    res.status(200).json({ success: true, data: serializeExpense(expense) });
  } catch (error) {
    next(error);
  }
};

// @desc   Create expense
// @route  POST /api/expenses
// @access Private
const createExpense = async (req, res, next) => {
  try {
    const { vehicle, type, amount, date, notes } = req.body;

    if (!vehicle) return next(new ApiError(400, 'Vehicle is required'));
    if (!type || !expenseTypes.includes(type)) return next(new ApiError(400, 'Expense type must be one of Fuel, Toll, Maintenance, Parking, Insurance, Other'));
    if (!amount || Number(amount) <= 0) return next(new ApiError(400, 'Cost must be greater than 0'));

    const vehicleExists = await Vehicle.findById(vehicle);
    if (!vehicleExists) return next(new ApiError(404, 'Vehicle not found'));

    const expense = await Expense.create({
      vehicle,
      type,
      amount: Number(amount),
      date: date || new Date(),
      notes: notes || '',
    });

    const populatedExpense = await expense.populate('vehicle', 'name registrationNumber');

    res.status(201).json({ success: true, data: serializeExpense(populatedExpense) });
  } catch (error) {
    next(error);
  }
};

// @desc   Update expense
// @route  PUT /api/expenses/:id
// @access Private
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return next(new ApiError(404, 'Expense not found'));

    const { vehicle, type, amount, date, notes } = req.body;

    if (vehicle) {
      const vehicleExists = await Vehicle.findById(vehicle);
      if (!vehicleExists) return next(new ApiError(404, 'Vehicle not found'));
    }

    if (type && !expenseTypes.includes(type)) {
      return next(new ApiError(400, 'Expense type must be one of Fuel, Toll, Maintenance, Parking, Insurance, Other'));
    }

    if (amount !== undefined && Number(amount) <= 0) return next(new ApiError(400, 'Cost must be greater than 0'));

    const updatedExpense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        ...(vehicle ? { vehicle } : {}),
        ...(type ? { type } : {}),
        ...(amount !== undefined ? { amount: Number(amount) } : {}),
        ...(date ? { date } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
      { new: true, runValidators: true }
    ).populate('vehicle', 'name registrationNumber');

    res.status(200).json({ success: true, data: serializeExpense(updatedExpense) });
  } catch (error) {
    next(error);
  }
};

// @desc   Delete expense
// @route  DELETE /api/expenses/:id
// @access Private
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) return next(new ApiError(404, 'Expense not found'));

    await Expense.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExpenses, getExpense, createExpense, updateExpense, deleteExpense };
