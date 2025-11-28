import React, { useState } from "react";
import { X, Eye, EyeOff, AlertCircle, CheckCircle, Calendar, ChevronRight, ChevronLeft, Mail } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import emailjs from '@emailjs/browser';

function Register({ isOpen, onClose, onSwitchToLogin }) {
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    birthdate: "",
    gender: "",
    email: "",
    contactNumber: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerStep, setDatePickerStep] = useState('day');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // OTP States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const handleDaySelect = (day) => {
    const selected = new Date(selectedYear, selectedMonth, day);
    const formattedDate = selected.toISOString().split('T')[0];
    setFormData({ ...formData, birthdate: formattedDate });
    setShowDatePicker(false);
    setError("");
  };

  const handleMonthSelect = (month) => {
    setSelectedMonth(month);
    setDatePickerStep('day');
    setCurrentMonth(new Date(selectedYear, month, 1));
  };

  const handleYearSelect = (year) => {
    setSelectedYear(year);
    setDatePickerStep('month');
  };

  const renderDayPicker = () => {
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth));
    const firstDay = getFirstDayOfMonth(new Date(selectedYear, selectedMonth));
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }

    return days.map((day, i) => (
      <button
        key={i}
        type="button"
        onClick={() => day && handleDaySelect(day)}
        disabled={!day}
        className={`p-2 text-sm rounded font-medium transition ${!day ? 'text-transparent cursor-default' : 'text-gray-700 hover:bg-gray-100'
          }`}
      >
        {day}
      </button>
    ));
  };

  const renderMonthPicker = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map((month, i) => (
      <button
        key={i}
        type="button"
        onClick={() => handleMonthSelect(i)}
        className={`p-2 text-sm rounded font-medium transition ${selectedMonth === i ? 'text-gray-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
      >
        {month}
      </button>
    ));
  };

  const renderYearPicker = () => {
    const startYear = Math.floor(selectedYear / 10) * 10;
    const years = [];
    for (let i = startYear; i < startYear + 12; i++) {
      years.push(i);
    }

    return years.map((year) => (
      <button
        key={year}
        type="button"
        onClick={() => handleYearSelect(year)}
        className={`p-2 text-sm rounded font-medium transition ${selectedYear === year ? 'text-gray-700' : 'text-gray-700 hover:bg-gray-100'
          }`}
      >
        {year}
      </button>
    ));
  };

  const prevYearRange = () => {
    setSelectedYear(selectedYear - 10);
  };

  const nextYearRange = () => {
    setSelectedYear(selectedYear + 10);
  };

  const prevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
    setSelectedMonth(newMonth.getMonth());
    setSelectedYear(newMonth.getFullYear());
  };

  const nextMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
    setSelectedMonth(newMonth.getMonth());
    setSelectedYear(newMonth.getFullYear());
  };

  const validateForm = () => {
    if (!formData.firstName || !formData.lastName || !formData.email ||
      !formData.contactNumber || !formData.birthdate || !formData.gender) {
      setError("Please fill in all required fields");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return false;
    }

    const phoneRegex = /^[0-9]{10,11}$/;
    if (!phoneRegex.test(formData.contactNumber.replace(/\D/g, ""))) {
      setError("Please enter a valid contact number");
      return false;
    }

    const birthDate = new Date(formData.birthdate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (age < 13) {
      setError("You must be at least 13 years old to register");
      return false;
    }

    return true;
  };

  const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOTP = async (otpCode) => {
    try {
      // Initialize EmailJS
      emailjs.init("ZohCT5l5sdSd3vD8S");

      const templateParams = {
        to_email: formData.email,  // ← User's email
        to_name: formData.firstName,
        otp_code: otpCode,
        expiry_time: "10 minutes",
        reply_to: formData.email
      };

      const response = await emailjs.send(
        'service_b9m7dbs',
        'template_i8ot2ao',
        templateParams,
        'ZohCT5l5sdSd3vD8S'
      );

      console.log('OTP sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send OTP:', error);
      setError(`Email sending failed: ${error.text || error.message}`);
      return false;
    }
  };

  const startResendTimer = () => {
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      // Generate OTP
      const otpCode = generateOTP();
      setGeneratedOtp(otpCode);

      // Send OTP via EmailJS
      const otpSent = await sendOTP(otpCode);

      if (!otpSent) {
        setError("Failed to send OTP. Please try again.");
        setLoading(false);
        return;
      }

      // Show OTP modal
      setShowOtpModal(true);
      startResendTimer();
      setLoading(false);

    } catch (err) {
      setError(err.message || "Failed to send OTP.");
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setOtpError("");
    const otpCode = generateOTP();
    setGeneratedOtp(otpCode);

    const otpSent = await sendOTP(otpCode);
    if (otpSent) {
      startResendTimer();
      setOtpError("OTP resent successfully!");
      setTimeout(() => setOtpError(""), 3000);
    } else {
      setOtpError("Failed to resend OTP. Please try again.");
    }
  };

  const handleVerifyOTP = async () => {
    if (otp !== generatedOtp) {
      setOtpError("Invalid OTP. Please try again.");
      return;
    }

    setLoading(true);
    setOtpError("");

    try {
      // STEP 1: Insert to accounts table first
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .insert({
          email: formData.email.toLowerCase(),
          password: formData.password,
          role: 'customer'
        })
        .select()
        .single();

      if (accountError) {
        console.error('Account Insert Error:', accountError);
        setOtpError(`Failed to create account: ${accountError.message}`);
        setLoading(false);
        return;
      }

      // STEP 2: Insert to customer table using the account_id
      const { error: customerError } = await supabase
        .from("customer")
        .insert({
          account_id: accountData.account_id, // Use the integer account_id
          first_name: formData.firstName,
          middle_name: formData.middleName || null,
          last_name: formData.lastName,
          birthdate: formData.birthdate,
          gender: formData.gender,
          email: formData.email.toLowerCase(),
          contact_number: formData.contactNumber,
          password: formData.password,
          role: 'customer',
          username: formData.email.split('@')[0]
        });

      if (customerError) {
        console.error('Customer Insert Error:', customerError);
        // Rollback: delete the account if customer insert fails
        await supabase.from("accounts").delete().eq('account_id', accountData.account_id);
        setOtpError(`Registration failed: ${customerError.message}`);
        setLoading(false);
        return;
      }

      setSuccess(true);
      setShowOtpModal(false);
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        birthdate: "",
        gender: "",
        email: "",
        contactNumber: "",
        password: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setSuccess(false);
        onSwitchToLogin();
      }, 2000);

    } catch (err) {
      console.error('Registration Error:', err);
      setOtpError(err.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black bg-opacity-50">
        <div className="relative w-full max-w-2xl p-6 my-8 bg-white rounded-lg shadow-xl">
          <button
            onClick={onClose}
            className="absolute text-gray-400 top-4 right-4 hover:text-gray-600"
          >
            <X size={24} />
          </button>

          <h2 className="mb-2 text-2xl font-bold text-gray-900">Create Account</h2>
          <p className="mb-6 text-gray-600">Join ELEV8 Billiards today</p>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-start gap-2 p-3 mb-4 border border-green-200 rounded-lg bg-green-50">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-600">Registration successful! Redirecting to login...</p>
            </div>
          )}

          <div>
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="FirstName"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Middle Name
              </label>
              <input
                type="text"
                name="middleName"
                value={formData.middleName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="MiddleName"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                placeholder="LastName"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Birthdate *
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDatePicker(!showDatePicker);
                      setDatePickerStep('day');
                    }}
                    className="flex items-center justify-between w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent hover:bg-gray-50"
                  >
                    <span className={formData.birthdate ? "text-gray-900" : "text-gray-400"}>
                      {formData.birthdate ? new Date(formData.birthdate).toLocaleDateString() : "Select date"}
                    </span>
                    <Calendar size={20} className="text-gray-400" />
                  </button>

                  {showDatePicker && (
                    <div className="absolute left-0 z-10 p-4 bg-white border border-gray-300 rounded-lg shadow-lg top-12 w-80">
                      {datePickerStep === 'day' && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <button type="button" onClick={prevMonth} className="p-1 rounded hover:bg-gray-100">
                              <ChevronLeft size={20} />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDatePickerStep('month')}
                              className="text-sm font-medium cursor-pointer hover:bg-gray-100"
                            >
                              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </button>
                            <button type="button" onClick={nextMonth} className="p-1 rounded hover:bg-gray-100">
                              <ChevronRight size={20} />
                            </button>
                          </div>

                          <div className="grid grid-cols-7 gap-2 mb-2">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                              <div key={day} className="text-xs font-semibold text-center text-gray-600">
                                {day}
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-7 gap-2">
                            {renderDayPicker()}
                          </div>
                        </>
                      )}

                      {datePickerStep === 'month' && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <button type="button" onClick={() => setDatePickerStep('year')} className="p-1 rounded hover:bg-gray-100">
                              <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm font-medium">{selectedYear}</span>
                            <div className="w-5" />
                          </div>

                          <div className="grid grid-cols-3 gap-2">
                            {renderMonthPicker()}
                          </div>
                        </>
                      )}

                      {datePickerStep === 'year' && (
                        <>
                          <div className="flex items-center justify-between mb-4">
                            <button type="button" onClick={prevYearRange} className="p-1 rounded hover:bg-gray-100">
                              <ChevronLeft size={20} />
                            </button>
                            <span className="text-sm font-medium">
                              {Math.floor(selectedYear / 10) * 10} - {Math.floor(selectedYear / 10) * 10 + 9}
                            </span>
                            <button type="button" onClick={nextYearRange} className="p-1 rounded hover:bg-gray-100">
                              <ChevronRight size={20} />
                            </button>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            {renderYearPicker()}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Gender *
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  placeholder="@gmail.com"
                />
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Contact Number *
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                  placeholder="ContactNumber"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    placeholder="Minimum 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
                    placeholder="Re-enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute text-gray-400 -translate-y-1/2 right-3 top-1/2 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || success}
              className="w-full py-2 font-medium text-white transition bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending OTP..." : success ? "Success!" : "Create Account"}
            </button>
          </div>

          <p className="mt-4 text-sm text-center text-gray-600">
            Already have an account?{" "}
            <button
              onClick={onSwitchToLogin}
              className="font-medium "
            >
              Log In
            </button>
          </p>
        </div>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50">
          <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
            <button
              onClick={() => {
                setShowOtpModal(false);
                setOtp("");
                setOtpError("");
              }}
              className="absolute text-gray-400 top-4 right-4 hover:text-gray-600"
            >
              <X size={24} />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 mb-4 bg-blue-100 rounded-full">
                <Mail size={32} className="text-blue-600" />
              </div>
              <h3 className="mb-2 text-2xl font-bold text-gray-900">Verify Your Email</h3>
              <p className="text-center text-gray-600">
                We've sent a 6-digit code to<br />
                <span className="font-medium">{formData.email}</span>
              </p>
            </div>

            {otpError && (
              <div className="flex items-start gap-2 p-3 mb-4 border border-red-200 rounded-lg bg-red-50">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{otpError}</p>
              </div>
            )}

            <div className="mb-6">
              <label className="block mb-2 text-sm font-medium text-center text-gray-700">
                Enter OTP Code
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 6) {
                    setOtp(value);
                    setOtpError("");
                  }
                }}
                maxLength={6}
                className="w-full px-4 py-3 text-2xl font-bold text-center border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent tracking-widest"
                placeholder="000000"
              />
            </div>

            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length !== 6}
              className="w-full py-3 mb-4 font-medium text-white transition bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Didn't receive the code?{" "}
                <button
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0}
                  className="font-medium text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Register;