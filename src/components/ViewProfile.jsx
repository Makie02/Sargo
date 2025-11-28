import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import Swal from 'sweetalert2';
import { User, Mail, Phone, Calendar, Edit2, Save, X, Lock, Camera, Upload } from 'lucide-react';

export default function ViewProfile() {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({});
    const [changePasswordModal, setChangePasswordModal] = useState(false);
    const [passwordData, setPasswordData] = useState({
        current: '',
        new: '',
        confirm: ''
    });

    // Image upload & crop states
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);
    const fetchProfile = async () => {
        try {
            setLoading(true);
            const session = JSON.parse(localStorage.getItem('userSession'));

            if (!session || !session.account_id) {
                Swal.fire({
                    icon: 'error',
                    title: 'Not Logged In',
                    text: 'Please log in to view your profile.'
                });
                return;
            }

            const userRole = session?.role;
            let profileData = null;

            // Fetch based on role
            if (userRole === 'frontdesk') {
                // Fetch from front_desk table
                const { data: frontdeskData, error: frontdeskError } = await supabase
                    .from('front_desk')
                    .select('*')
                    .eq('account_id', session.account_id)
                    .single();

                if (frontdeskError) throw frontdeskError;

                // ✅ Fetch from profiles table
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.account_id)
                    .maybeSingle();

                // Fetch profile picture from accounts table
                const { data: accountData } = await supabase
                    .from('accounts')
                    .select('ProfilePicuture')
                    .eq('account_id', session.account_id)
                    .single();

                // ✅ Use profiles data if available, otherwise use front_desk data
                const fullName = profilesData?.full_name || frontdeskData.staff_name || '';
                const nameParts = fullName.split(' ');

                profileData = {
                    account_id: frontdeskData.account_id,
                    frontdesk_id: frontdeskData.frontdesk_id,
                    first_name: nameParts[0] || '',
                    last_name: nameParts.slice(1).join(' ') || '',
                    middle_name: null,
                    email: profilesData?.email || frontdeskData.email,
                    contact_number: profilesData?.phone || '',
                    birthdate: null,
                    gender: profilesData?.Gender || null,
                    username: null,
                    password: frontdeskData.password,
                    role: 'frontdesk',
                    ProfilePicuture: accountData?.ProfilePicuture || null
                };

            } else if (userRole === 'manager') {
                // Fetch from manager table
                const { data: managerData, error: managerError } = await supabase
                    .from('manager')
                    .select('*')
                    .eq('account_id', session.account_id)
                    .single();

                if (managerError) throw managerError;

                // ✅ Fetch from profiles table
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.account_id)
                    .maybeSingle();

                // Fetch profile picture from accounts table
                const { data: accountData } = await supabase
                    .from('accounts')
                    .select('ProfilePicuture')
                    .eq('account_id', session.account_id)
                    .single();

                // ✅ Use profiles data if available
                const fullName = profilesData?.full_name || managerData.manager_name || '';
                const nameParts = fullName.split(' ');

                profileData = {
                    account_id: managerData.account_id,
                    manager_id: managerData.manager_id,
                    first_name: nameParts[0] || '',
                    last_name: nameParts.slice(1).join(' ') || '',
                    middle_name: null,
                    email: profilesData?.email || managerData.email,
                    contact_number: profilesData?.phone || '',
                    birthdate: null,
                    gender: profilesData?.Gender || null,
                    username: null,
                    password: managerData.password,
                    role: 'manager',
                    ProfilePicuture: accountData?.ProfilePicuture || null
                };

            } else if (userRole === 'admin' || userRole === 'superadmin') {
                // ✅ Fetch from admin table first, then profiles table
                const { data: adminData, error: adminError } = await supabase
                    .from('admin')
                    .select('*')
                    .eq('account_id', session.account_id)
                    .maybeSingle();

                // ✅ Fetch from profiles table
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', session.account_id)
                    .maybeSingle();

                // Fetch profile picture from accounts table
                const { data: accountData } = await supabase
                    .from('accounts')
                    .select('ProfilePicuture')
                    .eq('account_id', session.account_id)
                    .single();

                // Determine which data to use
                let fullName = '';
                let email = '';

                if (profilesData) {
                    fullName = profilesData.full_name || '';
                    email = profilesData.email || '';
                } else if (adminData) {
                    fullName = adminData.admin_name || '';
                    email = adminData.email || '';
                }

                const nameParts = fullName.split(' ');

                profileData = {
                    account_id: session.account_id,
                    admin_id: adminData?.admin_id || null,
                    first_name: nameParts[0] || '',
                    last_name: nameParts.slice(1).join(' ') || '',
                    middle_name: null,
                    email: email,
                    contact_number: profilesData?.phone || '',
                    birthdate: null,
                    gender: profilesData?.Gender || null,
                    username: null,
                    password: profilesData?.password || adminData?.password || '',
                    role: userRole,
                    ProfilePicuture: accountData?.ProfilePicuture || null
                };

            } else {
                // Fetch from customer table (default)
                const { data: customerData, error: customerError } = await supabase
                    .from('customer')
                    .select('*')
                    .eq('account_id', session.account_id)
                    .single();

                if (customerError) throw customerError;

                // Fetch profile picture from accounts table
                const { data: accountData } = await supabase
                    .from('accounts')
                    .select('ProfilePicuture')
                    .eq('account_id', session.account_id)
                    .single();

                profileData = {
                    ...customerData,
                    role: 'customer',
                    ProfilePicuture: accountData?.ProfilePicuture || null
                };
            }

            setProfile(profileData);
            setFormData(profileData);
        } catch (err) {
            console.error('Error fetching profile:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to load profile: ' + err.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    const handleSave = async () => {
        try {
            if (!formData.email) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Missing Fields',
                    text: 'Please fill in all required fields.'
                });
                return;
            }

            const session = JSON.parse(localStorage.getItem('userSession'));
            const userRole = profile.role;

            // Update based on role
            if (userRole === 'frontdesk') {
                const fullName = `${formData.first_name} ${formData.last_name}`.trim();

                const { error: frontdeskError } = await supabase
                    .from('front_desk')
                    .update({
                        staff_name: fullName,
                        email: formData.email
                    })
                    .eq('frontdesk_id', profile.frontdesk_id);

                if (frontdeskError) throw frontdeskError;

                // ✅ UPDATE/INSERT to profiles table for frontdesk
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', profile.account_id)
                    .maybeSingle();

                const profilePayload = {
                    email: formData.email,
                    full_name: fullName,
                    phone: formData.contact_number || '',
                    Gender: formData.gender || null,
                    updated_at: new Date().toISOString()
                };

                if (existingProfile) {
                    await supabase
                        .from('profiles')
                        .update(profilePayload)
                        .eq('id', profile.account_id);
                } else {
                    await supabase
                        .from('profiles')
                        .insert({
                            id: profile.account_id,
                            ...profilePayload,
                            role: 'user',
                            password: profile.password
                        });
                }

            } else if (userRole === 'manager') {
                const fullName = `${formData.first_name} ${formData.last_name}`.trim();

                const { error: managerError } = await supabase
                    .from('manager')
                    .update({
                        manager_name: fullName,
                        email: formData.email
                    })
                    .eq('manager_id', profile.manager_id);

                if (managerError) throw managerError;

                // ✅ UPDATE/INSERT to profiles table for manager
                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', profile.account_id)
                    .maybeSingle();

                const profilePayload = {
                    email: formData.email,
                    full_name: fullName,
                    phone: formData.contact_number || '',
                    Gender: formData.gender || null,
                    updated_at: new Date().toISOString()
                };

                if (existingProfile) {
                    await supabase
                        .from('profiles')
                        .update(profilePayload)
                        .eq('id', profile.account_id);
                } else {
                    await supabase
                        .from('profiles')
                        .insert({
                            id: profile.account_id,
                            ...profilePayload,
                            role: 'admin', // manager = admin role
                            password: profile.password
                        });
                }

            } else if (userRole === 'admin' || userRole === 'superadmin') {
                // ✅ UPDATE/INSERT to profiles table for admin/superadmin
                const fullName = `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim();

                const { data: existingProfile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('id', profile.account_id)
                    .maybeSingle();

                const profilePayload = {
                    email: formData.email,
                    full_name: fullName,
                    phone: formData.contact_number || '',
                    Gender: formData.gender || null,
                    updated_at: new Date().toISOString()
                };

                if (existingProfile) {
                    await supabase
                        .from('profiles')
                        .update(profilePayload)
                        .eq('id', profile.account_id);
                } else {
                    await supabase
                        .from('profiles')
                        .insert({
                            id: profile.account_id,
                            ...profilePayload,
                            role: 'admin',
                            password: profile.password
                        });
                }

            } else {
                // ✅ CUSTOMER - save to customer table ONLY
                if (!formData.first_name || !formData.last_name || !formData.contact_number || !formData.birthdate) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Missing Fields',
                        text: 'Please fill in all required fields (First Name, Last Name, Contact Number, Birthdate).'
                    });
                    return;
                }

                const { error: customerError } = await supabase
                    .from('customer')
                    .update({
                        first_name: formData.first_name,
                        middle_name: formData.middle_name || null,
                        last_name: formData.last_name,
                        email: formData.email,
                        contact_number: formData.contact_number,
                        birthdate: formData.birthdate,
                        gender: formData.gender || null,
                        username: formData.username || null
                    })
                    .eq('customer_id', profile.customer_id);

                if (customerError) throw customerError;
            }

            // ✅ Update accounts table (for ALL roles - email only)
            await supabase
                .from('accounts')
                .update({ email: formData.email })
                .eq('account_id', profile.account_id);

            await fetchProfile();
            setEditMode(false);

            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Profile updated successfully!',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (err) {
            console.error('Error updating profile:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update profile: ' + err.message
            });
        }
    };

    const handleChangePassword = async () => {
        if (!passwordData.new || !passwordData.confirm) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Fields',
                text: 'Please fill in all password fields!'
            });
            return;
        }

        if (passwordData.new !== passwordData.confirm) {
            Swal.fire({
                icon: 'error',
                title: 'Mismatch',
                text: 'New passwords do not match!'
            });
            return;
        }

        if (passwordData.new.length < 6) {
            Swal.fire({
                icon: 'warning',
                title: 'Weak Password',
                text: 'Password must be at least 6 characters long!'
            });
            return;
        }

        try {
            const userRole = profile.role;

            // Update password based on role
            if (userRole === 'frontdesk') {
                await supabase
                    .from('front_desk')
                    .update({ password: passwordData.new })
                    .eq('frontdesk_id', profile.frontdesk_id);
            } else if (userRole === 'manager') {
                await supabase
                    .from('manager')
                    .update({ password: passwordData.new })
                    .eq('manager_id', profile.manager_id);
            } else {
                await supabase
                    .from('customer')
                    .update({ password: passwordData.new })
                    .eq('customer_id', profile.customer_id);
            }

            // Update accounts table
            await supabase
                .from('accounts')
                .update({ password: passwordData.new })
                .eq('account_id', profile.account_id);

            // ✅ Update profiles table ONLY for frontdesk, manager, admin, superadmin
            if (['frontdesk', 'manager', 'admin', 'superadmin'].includes(userRole)) {
                await supabase
                    .from('profiles')
                    .update({
                        password: passwordData.new,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', profile.account_id);
            }

            setChangePasswordModal(false);
            setPasswordData({ current: '', new: '', confirm: '' });

            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Password changed successfully!',
                timer: 2000,
                showConfirmButton: false
            });

            await fetchProfile();
        } catch (err) {
            console.error('Error changing password:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to change password: ' + err.message
            });
        }
    };

    const handleCancel = () => {
        setFormData(profile);
        setEditMode(false);
    };

    // Image upload functions
    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                Swal.fire({
                    icon: 'warning',
                    title: 'File Too Large',
                    text: 'Please select an image smaller than 5MB'
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                setSelectedImage(event.target.result);
                setShowImageModal(true);
                setCrop({ x: 0, y: 0 });
                setZoom(1);
            };
            reader.readAsDataURL(file);
        }
    };

    const getCroppedImage = () => {
        const canvas = canvasRef.current;
        const image = imageRef.current;

        if (!canvas || !image) return null;

        const ctx = canvas.getContext('2d');
        const size = 300;

        canvas.width = size;
        canvas.height = size;

        const scale = zoom;
        const imageWidth = image.naturalWidth;
        const imageHeight = image.naturalHeight;

        const sourceX = (crop.x / scale);
        const sourceY = (crop.y / scale);
        const sourceSize = Math.min(imageWidth, imageHeight) / scale;

        ctx.drawImage(
            image,
            sourceX,
            sourceY,
            sourceSize,
            sourceSize,
            0,
            0,
            size,
            size
        );

        return canvas.toDataURL('image/jpeg', 0.9);
    };

    const handleSaveImage = async () => {
        try {
            setUploading(true);
            const croppedImageData = getCroppedImage();

            if (!croppedImageData) {
                throw new Error('Failed to crop image');
            }

            // Update database with base64 image
            const { error } = await supabase
                .from('accounts')
                .update({ ProfilePicuture: croppedImageData })
                .eq('account_id', profile.account_id);

            if (error) throw error;

            setShowImageModal(false);
            setSelectedImage(null);

            Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Profile picture updated!',
                timer: 2000,
                showConfirmButton: false
            });

            await fetchProfile();
        } catch (err) {
            console.error('Error uploading image:', err);
            Swal.fire({
                icon: 'error',
                title: 'Upload Failed',
                text: err.message
            });
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 font-medium">Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100">
                <div className="text-center backdrop-blur-xl bg-white/60 border border-white/50 p-8 rounded-3xl shadow-2xl">
                    <User size={64} className="mx-auto text-blue-400 mb-4" />
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
                    <p className="text-gray-600">Please log in to view your profile.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-2xl overflow-hidden mb-6">
                    <div className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-600 h-32"></div>
                    <div className="px-8 pb-8">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end -mt-16 mb-6">
                            <div className="relative group">
                                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
                                    {profile.ProfilePicuture ? (
                                        <img
                                            src={profile.ProfilePicuture}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <User size={64} className="text-white" />
                                    )}
                                </div>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute bottom-0 right-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg hover:bg-blue-700 transition opacity-0 group-hover:opacity-100"
                                >
                                    <Camera size={20} />
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                    className="hidden"
                                />
                            </div>
                            <div className="sm:ml-6 text-center sm:text-left mt-4 sm:mt-0">
                                <h1 className="text-3xl font-bold text-gray-800">
                                    {profile.first_name} {profile.middle_name ? profile.middle_name + ' ' : ''}{profile.last_name}
                                </h1>
                                <p className="text-gray-600 mt-1">{profile.email}</p>
                                {profile.username && (
                                    <p className="text-sm text-gray-500 mt-1">@{profile.username}</p>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            {!editMode ? (
                                <>
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition shadow-lg"
                                    >
                                        <Edit2 size={18} />
                                        Edit Profile
                                    </button>
                                    <button
                                        onClick={() => setChangePasswordModal(true)}
                                        className="flex items-center gap-2 px-6 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 text-gray-700 rounded-xl hover:bg-white/80 transition shadow-lg"
                                    >
                                        <Lock size={18} />
                                        Change Password
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition shadow-lg"
                                    >
                                        <Save size={18} />
                                        Save Changes
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 px-6 py-3 backdrop-blur-xl bg-white/60 border border-gray-200/50 text-gray-700 rounded-xl hover:bg-white/80 transition shadow-lg"
                                    >
                                        <X size={18} />
                                        Cancel
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Information Card */}
                <div className="backdrop-blur-xl bg-white/60 border border-white/50 rounded-3xl shadow-2xl p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <User className="text-blue-600" />
                        Personal Information
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                First Name <span className="text-red-500">*</span>
                            </label>
                            {editMode ? (
                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition"
                                />
                            ) : (
                                <div className="px-4 py-3 backdrop-blur-xl bg-white/40 border border-blue-100/50 rounded-xl text-gray-800 font-medium">
                                    {profile.first_name}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Middle Name
                            </label>
                            {editMode ? (
                                <input
                                    type="text"
                                    name="middle_name"
                                    value={formData.middle_name || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition"
                                />
                            ) : (
                                <div className="px-4 py-3 backdrop-blur-xl bg-white/40 border border-blue-100/50 rounded-xl text-gray-800 font-medium">
                                    {profile.middle_name || 'N/A'}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Last Name <span className="text-red-500">*</span>
                            </label>
                            {editMode ? (
                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition"
                                />
                            ) : (
                                <div className="px-4 py-3 backdrop-blur-xl bg-white/40 border border-blue-100/50 rounded-xl text-gray-800 font-medium">
                                    {profile.last_name}
                                </div>
                            )}
                        </div>

                 

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Mail size={16} />
                                Email <span className="text-red-500">*</span>
                            </label>
                            {editMode ? (
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition"
                                />
                            ) : (
                                <div className="px-4 py-3 backdrop-blur-xl bg-white/40 border border-blue-100/50 rounded-xl text-gray-800 font-medium">
                                    {profile.email}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Phone size={16} />
                                Contact Number <span className="text-red-500">*</span>
                            </label>
                            {editMode ? (
                                <input
                                    type="text"
                                    name="contact_number"
                                    value={formData.contact_number || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition"
                                />
                            ) : (
                                <div className="px-4 py-3 backdrop-blur-xl bg-white/40 border border-blue-100/50 rounded-xl text-gray-800 font-medium">
                                    {profile.contact_number}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                <Calendar size={16} />
                                Birthdate <span className="text-red-500">*</span>
                            </label>
                            {editMode ? (
                                <input
                                    type="date"
                                    name="birthdate"
                                    value={formData.birthdate || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition"
                                />
                            ) : (
                                <div className="px-4 py-3 backdrop-blur-xl bg-white/40 border border-blue-100/50 rounded-xl text-gray-800 font-medium">
                                    {new Date(profile.birthdate).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Gender
                            </label>
                            {editMode ? (
                                <select
                                    name="gender"
                                    value={formData.gender || ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            ) : (
                                <div className="px-4 py-3 backdrop-blur-xl bg-white/40 border border-blue-100/50 rounded-xl text-gray-800 font-medium">
                                    {profile.gender || 'Not specified'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mt-8 pt-8 border-t border-blue-200/30">
                        <h3 className="text-lg font-bold text-gray-700 mb-4">Account Information</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="px-4 py-3 backdrop-blur-xl bg-gradient-to-br from-blue-400/20 to-cyan-400/20 border border-blue-200/50 rounded-xl">
                                <p className="text-sm text-gray-600">Account ID</p>
                                <p className="font-bold text-gray-800">{profile.account_id}</p>
                            </div>

                            {/* ✅ Show Customer ID only for customers */}
                            {profile.customer_id && (
                                <div className="px-4 py-3 backdrop-blur-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20 border border-blue-200/50 rounded-xl">
                                    <p className="text-sm text-gray-600">Customer ID</p>
                                    <p className="font-bold text-gray-800">{profile.customer_id}</p>
                                </div>
                            )}

                            {/* ✅ Show Frontdesk ID only for frontdesk */}
                            {profile.frontdesk_id && (
                                <div className="px-4 py-3 backdrop-blur-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20 border border-blue-200/50 rounded-xl">
                                    <p className="text-sm text-gray-600">Frontdesk ID</p>
                                    <p className="font-bold text-gray-800">{profile.frontdesk_id}</p>
                                </div>
                            )}

                            {/* ✅ Show Manager ID only for managers */}
                            {profile.manager_id && (
                                <div className="px-4 py-3 backdrop-blur-xl bg-gradient-to-br from-cyan-400/20 to-blue-400/20 border border-blue-200/50 rounded-xl">
                                    <p className="text-sm text-gray-600">Manager ID</p>
                                    <p className="font-bold text-gray-800">{profile.manager_id}</p>
                                </div>
                            )}

                            <div className="px-4 py-3 backdrop-blur-xl bg-gradient-to-br from-blue-400/20 to-indigo-400/20 border border-blue-200/50 rounded-xl">
                                <p className="text-sm text-gray-600">Role</p>
                                <p className="font-bold text-gray-800 capitalize">{profile.role || 'Customer'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Change Password Modal */}

            {changePasswordModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 border border-white/50 rounded-3xl p-8 w-full max-w-md shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
                            <Lock className="text-blue-600" />
                            Change Password
                        </h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.new}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition"
                                    placeholder="Enter new password"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm New Password
                                </label>
                                <input
                                    type="password"
                                    value={passwordData.confirm}
                                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                                    className="w-full px-4 py-3 backdrop-blur-xl bg-white/60 border border-blue-200/50 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition"
                                    placeholder="Confirm new password"
                                />
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => {
                                        setChangePasswordModal(false);
                                        setPasswordData({ current: '', new: '', confirm: '' });
                                    }}
                                    className="flex-1 py-3 backdrop-blur-xl bg-white/60 border border-gray-200/50 text-gray-700 rounded-xl hover:bg-white/80 transition font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleChangePassword}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition font-medium shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Image Crop Modal */}
            {showImageModal && selectedImage && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
                    <div className="backdrop-blur-xl bg-gradient-to-br from-white/90 to-white/70 border border-white/50 rounded-3xl p-8 w-full max-w-2xl shadow-2xl">
                        <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center gap-2">
                            <Upload className="text-blue-600" />
                            Crop Profile Picture
                        </h2>

                        <div className="space-y-6">
                            <div className="relative w-full h-96 bg-gray-100 rounded-xl overflow-hidden flex items-center justify-center">
                                <div
                                    className="relative"
                                    style={{
                                        transform: `scale(${zoom}) translate(${crop.x}px, ${crop.y}px)`,
                                        transition: 'transform 0.1s'
                                    }}
                                >
                                    <img
                                        ref={imageRef}
                                        src={selectedImage}
                                        alt="Crop preview"
                                        className="max-w-full max-h-96"
                                        draggable={false}
                                    />
                                    <div className="absolute inset-0 border-4 border-blue-500 rounded-full pointer-events-none"
                                        style={{
                                            width: '300px',
                                            height: '300px',
                                            left: '50%',
                                            top: '50%',
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Zoom: {zoom.toFixed(1)}x
                                    </label>
                                    <input
                                        type="range"
                                        min="1"
                                        max="3"
                                        step="0.1"
                                        value={zoom}
                                        onChange={(e) => setZoom(parseFloat(e.target.value))}
                                        className="w-full"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Position X
                                        </label>
                                        <input
                                            type="range"
                                            min="-200"
                                            max="200"
                                            value={crop.x}
                                            onChange={(e) => setCrop(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Position Y
                                        </label>
                                        <input
                                            type="range"
                                            min="-200"
                                            max="200"
                                            value={crop.y}
                                            onChange={(e) => setCrop(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setShowImageModal(false);
                                        setSelectedImage(null);
                                    }}
                                    disabled={uploading}
                                    className="flex-1 py-3 backdrop-blur-xl bg-white/60 border border-gray-200/50 text-gray-700 rounded-xl hover:bg-white/80 transition font-medium disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveImage}
                                    disabled={uploading}
                                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 transition font-medium shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Save Photo
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Hidden canvas for cropping */}
                        <canvas ref={canvasRef} className="hidden" />
                    </div>
                </div>

            )}  .
        </div>);
}