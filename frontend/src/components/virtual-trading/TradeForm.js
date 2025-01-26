import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import { executeTrade, fetchStockQuote } from '../../redux/slices/tradingSlice';
import { toast } from 'react-toastify';

const TradeSchema = Yup.object().shape({
  symbol: Yup.string()
    .required('Symbol is required')
    .matches(/^[A-Z]+$/, 'Must be uppercase letters only'),
  quantity: Yup.number()
    .required('Quantity is required')
    .positive('Must be a positive number')
    .integer('Must be a whole number'),
  type: Yup.string().required('Trade type is required'),
});

const TradeForm = () => {
  const dispatch = useDispatch();
  const { portfolio, stockQuote, isLoading } = useSelector(
    (state) => state.trading
  );
  const [estimatedTotal, setEstimatedTotal] = useState(0);

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      await dispatch(executeTrade(values)).unwrap();
      toast.success('Trade executed successfully!');
      resetForm();
    } catch (error) {
      toast.error(error.message || 'Failed to execute trade');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSymbolBlur = async (symbol) => {
    if (symbol) {
      dispatch(fetchStockQuote(symbol));
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Execute Trade</h2>

      {/* Stock Quote */}
      {stockQuote && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Current Price</p>
              <p className="text-lg font-semibold">${stockQuote.price}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Change</p>
              <p
                className={`text-lg font-semibold ${
                  stockQuote.change >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {stockQuote.change >= 0 ? '+' : ''}
                {stockQuote.change}%
              </p>
            </div>
          </div>
        </div>
      )}

      <Formik
        initialValues={{
          symbol: '',
          quantity: '',
          type: 'buy',
        }}
        validationSchema={TradeSchema}
        onSubmit={handleSubmit}
      >
        {({ errors, touched, values, setFieldValue }) => (
          <Form className="space-y-6">
            <div>
              <label
                htmlFor="symbol"
                className="block text-sm font-medium text-gray-700"
              >
                Stock Symbol
              </label>
              <Field
                type="text"
                name="symbol"
                id="symbol"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                onBlur={(e) => handleSymbolBlur(e.target.value)}
              />
              {errors.symbol && touched.symbol && (
                <p className="mt-2 text-sm text-red-600">{errors.symbol}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-gray-700"
              >
                Trade Type
              </label>
              <Field
                as="select"
                name="type"
                id="type"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </Field>
              {errors.type && touched.type && (
                <p className="mt-2 text-sm text-red-600">{errors.type}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700"
              >
                Quantity
              </label>
              <Field
                type="number"
                name="quantity"
                id="quantity"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                onChange={(e) => {
                  setFieldValue('quantity', e.target.value);
                  if (stockQuote) {
                    setEstimatedTotal(e.target.value * stockQuote.price);
                  }
                }}
              />
              {errors.quantity && touched.quantity && (
                <p className="mt-2 text-sm text-red-600">{errors.quantity}</p>
              )}
            </div>

            {stockQuote && values.quantity && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Estimated Total:</span>
                  <span className="text-sm font-semibold">
                    ${estimatedTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-sm text-gray-500">Available Cash:</span>
                  <span className="text-sm font-semibold">
                    ${portfolio?.cashBalance.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                'Execute Trade'
              )}
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
};

export default TradeForm;
