import React, { useState, useEffect } from 'react';
import { supabase } from "../lib/supabaseClient";
import Swal from 'sweetalert2';

const Payment = ({ reservationData, onBack, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [unavailableDates, setUnavailableDates] = useState({});
const [formData, setFormData] = useState({
  paymentMethod: 'GCash',
  paymentType: 'full',
  amountPaid: '',
  proofOfPayment: null
});

  const [totalBill, setTotalBill] = useState(0);
  const [minimumPayment, setMinimumPayment] = useState(0);

  useEffect(() => {
    if (!reservationData) {
      Swal.fire({
        icon: 'error',
        title: 'No Reservation Data',
        text: 'Please select tables first',
      });
      return;
    }

    calculateBill();
  }, [reservationData]);

 const calculateBill = () => {
  if (!reservationData || !reservationData.reservations) return;

  const { reservations } = reservationData;
  
  // Calculate total price for all reservations
  const total = reservations.reduce((sum, reservation) => {
    return sum + (parseFloat(reservation.table.info.price) * reservation.duration.hours);
  }, 0);

  const minimum = Math.ceil(total / 2); // Half payment amount

  setTotalBill(total);
  setMinimumPayment(minimum);
  setFormData(prev => ({
    ...prev,
    amountPaid: total.toString() // Default to full amount
  }));
};

const handleInputChange = (e) => {
  const { name, value } = e.target;
  
  if (name === 'paymentType') {
    // Auto-fill amount based on payment type
    if (value === 'full') {
      setFormData(prev => ({
        ...prev,
        paymentType: value,
        amountPaid: totalBill.toString()
      }));
    } else if (value === 'half') {
      setFormData(prev => ({
        ...prev,
        paymentType: value,
        amountPaid: minimumPayment.toString()
      }));
    } else if (value === 'partial') {
      setFormData(prev => ({
        ...prev,
        paymentType: value,
        amountPaid: minimumPayment.toString() // Default to minimum
      }));
    }
  } else {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
};

 const handleImageUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    Swal.fire({
      icon: 'error',
      title: 'Invalid File',
      text: 'Please upload an image file',
    });
    return;
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({
      icon: 'error',
      title: 'File Too Large',
      text: 'Please upload an image smaller than 5MB',
    });
    return;
  }
 const reader = new FileReader();
  reader.onloadend = () => {
    const base64String = reader.result;
    setImagePreview(base64String);
    setFormData(prev => ({
      ...prev,
      proofOfPayment: base64String // Store base64 string instead of file
    }));
  };
  reader.readAsDataURL(file);
};


const handleSubmit = async () => {
  // Validation
  if (formData.paymentMethod === 'GCash' && !formData.proofOfPayment) {
    Swal.fire({
      icon: 'warning',
      title: 'Missing Proof of Payment',
      text: 'Please upload a screenshot of your GCash payment',
    });
    return;
  }

  const amountPaid = parseFloat(formData.amountPaid);
  
  if (!amountPaid || amountPaid <= 0) {
    Swal.fire({
      icon: 'warning',
      title: 'Invalid Amount',
      text: 'Please enter a valid payment amount',
    });
    return;
  }

  // Validate based on payment type
  if (formData.paymentType === 'partial' && amountPaid < minimumPayment) {
    Swal.fire({
      icon: 'warning',
      title: 'Insufficient Payment',
      text: `Partial payment must be at least ₱${minimumPayment.toFixed(2)} (50% of total)`,
    });
    return;
  }

  if (formData.paymentType === 'half' && amountPaid !== minimumPayment) {
    Swal.fire({
      icon: 'warning',
      title: 'Invalid Amount',
      text: `Half payment amount must be exactly ₱${minimumPayment.toFixed(2)}`,
    });
    return;
  }

  if (formData.paymentType === 'full' && amountPaid !== totalBill) {
    Swal.fire({
      icon: 'warning',
      title: 'Invalid Amount',
      text: `Full payment amount must be exactly ₱${totalBill.toFixed(2)}`,
    });
    return;
  }

  try {
    setLoading(true);

    // Get user session
    const userSessionStr = localStorage.getItem('userSession');
    if (!userSessionStr) {
      throw new Error('Please log in to continue');
    }

    const userSession = JSON.parse(userSessionStr);
    const accountId = userSession.account_id;

    const { reservations } = reservationData;

    // Calculate per-table amounts
    const totalTableBill = reservations.reduce((sum, r) => 
      sum + (parseFloat(r.table.info.price) * r.duration.hours), 0
    );

    // Prepare reservation records
// Prepare reservation records
const reservationInserts = reservations.map(reservation => {
  const tableBill = parseFloat(reservation.table.info.price) * reservation.duration.hours;
  const tableRatio = tableBill / totalTableBill; // Proportion of this table to total
  
  // Determine payment_type label
  let paymentTypeLabel = '';
  if (formData.paymentType === 'full') {
    paymentTypeLabel = 'Full Payment';
  } else if (formData.paymentType === 'half') {
    paymentTypeLabel = 'Half Payment';
  } else if (formData.paymentType === 'partial') {
    paymentTypeLabel = 'Partial Payment';
  }
  
  return {
    account_id: parseInt(accountId),
    table_id: reservation.table.table_id,
    reservation_date: reservation.date,
    billiard_type: reservation.table.info.billiard_type,
    start_time: reservation.time,
    time_end: reservation.timeEnd,
    duration: reservation.duration.id,
    status: 'pending',
    paymentMethod: formData.paymentMethod,
    payment_type: paymentTypeLabel, // Add this line
    total_bill: tableBill,
    full_amount: formData.paymentType === 'full' ? tableBill : null,
    half_amount: formData.paymentType === 'half' ? Math.ceil(tableBill / 2) : null,
    partial_amount: formData.paymentType === 'partial' ? Math.ceil(amountPaid * tableRatio) : null,
    proof_of_payment: formData.paymentMethod === 'GCash' ? formData.proofOfPayment : null
  };
});

    // Insert reservations
    const { data, error } = await supabase
      .from('reservation')
      .insert(reservationInserts)
      .select();

    if (error) throw error;

    // Build success message
    const reservationSummary = reservations.map(r => 
      `<p><strong>${r.table.table_name}:</strong> ${r.date} at ${r.time} - ${r.timeEnd} (${r.duration.hours}hr${r.duration.hours > 1 ? 's' : ''})</p>`
    ).join('');

    const paymentTypeLabel = 
      formData.paymentType === 'full' ? 'Full Payment' :
      formData.paymentType === 'half' ? 'Half Payment (50% Down Payment)' :
      'Partial Payment (Custom Down Payment)';

    await Swal.fire({
      icon: 'success',
      title: 'Reservation Successful!',
      html: `
        <div style="text-align: left; padding: 10px;">
          <p style="margin-bottom: 10px;"><strong>Reservations:</strong></p>
          ${reservationSummary}
          <hr style="margin: 15px 0;">
          <p><strong>Total Bill:</strong> ₱${totalBill.toFixed(2)}</p>
          <p><strong>Payment Method:</strong> ${formData.paymentMethod}</p>
          <p><strong>Payment Type:</strong> ${paymentTypeLabel}</p>
          <p><strong>Amount Paid:</strong> ₱${amountPaid.toFixed(2)}</p>
          ${formData.paymentType !== 'full' ? `<p><strong>Remaining Balance:</strong> ₱${(totalBill - amountPaid).toFixed(2)}</p>` : ''}
        </div>
      `,
      confirmButtonColor: '#28a745',
    });

    if (onSuccess) onSuccess();

  } catch (error) {
    console.error('Error creating reservation:', error);
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: error.message || 'Failed to create reservation',
    });
  } finally {
    setLoading(false);
  }
};
  if (!reservationData) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '40px',
          borderRadius: '12px',
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 20px 0', fontSize: '16px', color: '#666' }}>
            No reservation data found
          </p>
          <button
            onClick={onBack}
            style={{
              padding: '12px 30px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f5f5',
      padding: '40px 20px'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{
            margin: '0 0 10px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#333',
            textAlign: 'center'
          }}>
            Payment Details
          </h1>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#666',
            textAlign: 'center'
          }}>
            Complete your reservation by providing payment details
          </p>
        </div>

      {/* Reservation Summary */}
<div style={{
  backgroundColor: 'white',
  padding: '25px',
  borderRadius: '12px',
  marginBottom: '20px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
}}>
  <h2 style={{
    margin: '0 0 20px 0',
    fontSize: '20px',
    fontWeight: '600',
    color: '#333'
  }}>
    Reservation Summary
  </h2>

  {reservationData.reservations && reservationData.reservations.map((reservation, index) => (
    <div key={reservation.table.table_id} style={{
      marginBottom: index < reservationData.reservations.length - 1 ? '20px' : '0',
      padding: '15px',
      backgroundColor: '#f8f9fa',
      borderRadius: '8px',
      border: '2px solid #28a745'
    }}>
      <div style={{ marginBottom: '10px' }}>
        <span style={{
          padding: '6px 12px',
          backgroundColor: '#28a745',
          color: 'white',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          marginRight: '10px'
        }}>
          {reservation.table.table_name}
        </span>
        <span style={{
          fontSize: '16px',
          fontWeight: '700',
          color: '#28a745'
        }}>
          ₱{parseFloat(reservation.table.info.price).toFixed(2)}/hour
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: '10px',
        marginTop: '10px'
      }}>
        <div>
          <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#666' }}>Date</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#333' }}>
            {reservation.date}
          </p>
        </div>
        <div>
          <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#666' }}>Time</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#333' }}>
            {reservation.time} - {reservation.timeEnd}
          </p>
        </div>
        <div>
          <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#666' }}>Duration</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#333' }}>
            {reservation.duration.hours} hour{reservation.duration.hours > 1 ? 's' : ''}
          </p>
        </div>
        <div>
          <p style={{ margin: '0 0 3px 0', fontSize: '12px', color: '#666' }}>Subtotal</p>
          <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#28a745' }}>
            ₱{(parseFloat(reservation.table.info.price) * reservation.duration.hours).toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  ))}

  <div style={{
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '2px solid #e0e0e0'
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <span style={{ fontSize: '18px', fontWeight: '700', color: '#333' }}>Total Bill:</span>
      <span style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>
        ₱{totalBill.toFixed(2)}
      </span>
    </div>
  </div>
</div>
        {/* Payment Form */}
        <div style={{
          backgroundColor: 'white',
          padding: '25px',
          borderRadius: '12px',
          marginBottom: '100px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{
            margin: '0 0 20px 0',
            fontSize: '20px',
            fontWeight: '600',
            color: '#333'
          }}>
            Payment Information
          </h2>

          {/* Payment Method */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontSize: '14px',
              fontWeight: '600',
              color: '#555'
            }}>
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            >
              <option value="GCash">GCash</option>
              <option value="Cash">Cash</option>
            </select>
          </div>

          {/* Payment Type */}
<div style={{ marginBottom: '20px' }}>
  <label style={{
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#555'
  }}>
    Payment Type
  </label>
  <select
    name="paymentType"
    value={formData.paymentType}
    onChange={handleInputChange}
    style={{
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px',
      boxSizing: 'border-box'
    }}
  >
    <option value="full">Full Payment - ₱{totalBill.toFixed(2)}</option>
    <option value="half">Half Payment (50%) - ₱{minimumPayment.toFixed(2)}</option>
    <option value="partial">Partial Payment (Custom) - Min ₱{minimumPayment.toFixed(2)}</option>
  </select>
  {formData.paymentType === 'partial' && (
    <p style={{
      margin: '8px 0 0 0',
      fontSize: '12px',
      color: '#ff9800',
      fontWeight: '600'
    }}>
      ℹ️ Minimum payment is 50% of total bill (₱{minimumPayment.toFixed(2)}). You can pay more.
    </p>
  )}
  {formData.paymentType === 'half' && (
    <p style={{
      margin: '8px 0 0 0',
      fontSize: '12px',
      color: '#17a2b8',
      fontWeight: '600'
    }}>
      ℹ️ Half payment is exactly 50% of the total bill
    </p>
  )}
</div>

     {/* Amount Paid */}
<div style={{ marginBottom: '20px' }}>
  <label style={{
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#555'
  }}>
    Amount Paid (₱)
  </label>
  <input
    type="number"
    name="amountPaid"
    value={formData.amountPaid}
    onChange={handleInputChange}
    disabled={formData.paymentType === 'full' || formData.paymentType === 'half'}
    min={minimumPayment}
    max={formData.paymentType === 'partial' ? totalBill : undefined}
    step="0.01"
    style={{
      width: '100%',
      padding: '12px',
      border: '1px solid #ddd',
      borderRadius: '8px',
      fontSize: '14px',
      boxSizing: 'border-box',
      backgroundColor: (formData.paymentType === 'full' || formData.paymentType === 'half') ? '#f0f0f0' : 'white',
      cursor: (formData.paymentType === 'full' || formData.paymentType === 'half') ? 'not-allowed' : 'text'
    }}
  />
  <p style={{
    margin: '8px 0 0 0',
    fontSize: '12px',
    color: '#666'
  }}>
    {formData.paymentType === 'full' 
      ? `Full payment amount: ₱${totalBill.toFixed(2)} (Fixed)`
      : formData.paymentType === 'half'
      ? `Half payment amount: ₱${minimumPayment.toFixed(2)} (Fixed)`
      : `Enter amount between ₱${minimumPayment.toFixed(2)} - ₱${totalBill.toFixed(2)}`
    }
  </p>
</div>

          {/* Proof of Payment (for GCash only) */}
          {formData.paymentMethod === 'GCash' && (
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: '#555'
              }}>
                Proof of Payment (Screenshot) *
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
              
              {imagePreview && (
                <div style={{
                  marginTop: '15px',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '10px',
                  textAlign: 'center'
                }}>
                  <p style={{
                    margin: '0 0 10px 0',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#666'
                  }}>
                    Preview:
                  </p>
                  <img 
                    src={imagePreview} 
                    alt="Payment proof preview"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px'
                    }}
                  />
                </div>
              )}
            </div>
          )}

         {/* Summary Box */}
<div style={{
  marginTop: '25px',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '8px',
  border: '2px solid #e0e0e0'
}}>
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  }}>
    <span style={{ fontSize: '14px', color: '#666' }}>Total Bill:</span>
    <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
      ₱{totalBill.toFixed(2)}
    </span>
  </div>
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  }}>
    <span style={{ fontSize: '14px', color: '#666' }}>Payment Type:</span>
    <span style={{ fontSize: '14px', fontWeight: '600', color: '#333' }}>
      {formData.paymentType === 'full' ? 'Full' : formData.paymentType === 'half' ? 'Half (50%)' : 'Partial'}
    </span>
  </div>
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '10px'
  }}>
    <span style={{ fontSize: '14px', color: '#666' }}>Amount to Pay:</span>
    <span style={{ fontSize: '14px', fontWeight: '600', color: '#28a745' }}>
      ₱{parseFloat(formData.amountPaid || 0).toFixed(2)}
    </span>
  </div>
  {formData.paymentType !== 'full' && parseFloat(formData.amountPaid) > 0 && (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      paddingTop: '10px',
      borderTop: '1px solid #ddd'
    }}>
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#ff9800' }}>
        Remaining Balance:
      </span>
      <span style={{ fontSize: '14px', fontWeight: '600', color: '#ff9800' }}>
        ₱{(totalBill - parseFloat(formData.amountPaid || 0)).toFixed(2)}
      </span>
    </div>
  )}
</div>
        </div>

        {/* Fixed Footer with Buttons */}
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#5a5a5a',
          padding: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          zIndex: 100
        }}>
          <button
            onClick={onBack}
            disabled={loading}
            style={{
              padding: '12px 30px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1
            }}
          >
            ← Back
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px 40px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Processing...
              </>
            ) : (
              'Submit Reservation'
            )}
          </button>
        </div>
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default Payment;