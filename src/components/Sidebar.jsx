import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  LayoutDashboard, CheckSquare, FileText, Calendar,
  Clock, Wrench, HelpCircle, Settings,
  Search, ChevronDown, User, Users, Shield, Crown, ClipboardList, QrCode, Menu, X
} from "lucide-react";

// NAV ITEM
const NavItem = ({ icon: Icon, label, page, currentPage, onClick, badge, permissions, onMobileClick }) => {
  const isActive = currentPage === page;
  const canAccess = permissions?.[page] ?? true;
  if (!canAccess) return null;

  return (
    <button
      onClick={() => {
        if (page) onClick(page);
        if (onMobileClick) onMobileClick();
      }}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
        ${isActive ? "bg-gray-100 text-gray-900 font-medium" : "text-gray-700 hover:bg-gray-50"}
      `}
    >
      <Icon size={18} className={isActive ? "text-gray-900" : "text-gray-500"} />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">{badge}</span>
      )}
    </button>
  );
};

// SIDEBAR
function Sidebar({ currentPage, setCurrentPage, userRole, isDesktopOpen, setIsDesktopOpen }) {
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const [dashboardOpen, setDashboardOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDesktop = () => setIsDesktopOpen(!isDesktopOpen);

  const [permissions, setPermissions] = useState({});
  const [accountInfo, setAccountInfo] = useState(null);

  useEffect(() => {
    const sessionData = localStorage.getItem("userSession");
    if (!sessionData) return;

    const session = JSON.parse(sessionData);

    const fetchAccountInfo = async () => {
      const { data, error } = await supabase
        .from("accounts")
        .select("account_id, email, role, ProfilePicuture")
        .eq("account_id", session.account_id)
        .single();

      if (!error) setAccountInfo(data);
    };
    fetchAccountInfo();

    const fetchPermissions = async () => {
      const { data: rolesData, error: rolesError } = await supabase.from("UserRole").select("*");
      if (rolesError) return;

      const matchedRole = rolesData.find(r => r.role?.toLowerCase() === session.role?.toLowerCase());
      if (!matchedRole) return;

      const { data: permsData, error: permsError } = await supabase
        .from("Role_Permission")
        .select("*")
        .eq("role_id", matchedRole.role_id);

      if (!permsError) setPermissions(permsData.reduce((acc, p) => ({ ...acc, [p.page]: true }), {}));
    };
    fetchPermissions();
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    window.location.href = "/login";
  };
  // SIDEBAR CONTENT
  // ===============================
  const SidebarContent = () => (
    <>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">E8</span>
            </div>
            <span className="font-semibold text-gray-900">BENBY</span>
          </div>

          <button
            onClick={() => {
              closeMobileMenu();
              toggleDesktop();
            }}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-200">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      {/* NAV ITEMS */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Dashboard Dropdown */}
        {dashboardOpen && (
          <div className="pl-4 flex flex-col gap-1">
            {userRole === "admin" && (
              <NavItem
                icon={LayoutDashboard}
                label="Admin Dashboard"
                page="adminDashboard"
                currentPage={currentPage}
                onClick={setCurrentPage}
                permissions={permissions}
                onMobileClick={closeMobileMenu}
              />
            )}
            {userRole === "manager" && (
              <NavItem
                icon={LayoutDashboard}
                label="Manager Dashboard"
                page="ManagerDashboard"
                currentPage={currentPage}
                onClick={setCurrentPage}
                permissions={permissions}
                onMobileClick={closeMobileMenu}
              />
            )}
            {userRole === "customer" && (
              <NavItem
                icon={LayoutDashboard}
                label="Customer Dashboard"
                page="CustomerDashboard"
                currentPage={currentPage}
                onClick={setCurrentPage}
                permissions={permissions}
                onMobileClick={closeMobileMenu}
              />
            )}
            {userRole === "frontdesk" && (
              <NavItem
                icon={LayoutDashboard}
                label="FrontDesk Dashboard"
                page="frontDeskDashboard"
                currentPage={currentPage}
                onClick={setCurrentPage}
                permissions={permissions}
                onMobileClick={closeMobileMenu}
              />
            )}
            {userRole === "superadmin" && (
              <>
                <NavItem
                  icon={LayoutDashboard}
                  label="Admin Dashboard"
                  page="adminDashboard"
                  currentPage={currentPage}
                  onClick={setCurrentPage}
                  permissions={permissions}
                  onMobileClick={closeMobileMenu}
                />
                <NavItem
                  icon={LayoutDashboard}
                  label="Manager Dashboard"
                  page="ManagerDashboard"
                  currentPage={currentPage}
                  onClick={setCurrentPage}
                  permissions={permissions}
                  onMobileClick={closeMobileMenu}
                />
                <NavItem
                  icon={LayoutDashboard}
                  label="Customer Dashboard"
                  page="CustomerDashboard"
                  currentPage={currentPage}
                  onClick={setCurrentPage}
                  permissions={permissions}
                  onMobileClick={closeMobileMenu}
                />
                <NavItem
                  icon={LayoutDashboard}
                  label="FrontDesk Dashboard"
                  page="frontDeskDashboard"
                  currentPage={currentPage}
                  onClick={setCurrentPage}
                  permissions={permissions}
                  onMobileClick={closeMobileMenu}
                />
              </>
            )}
          </div>
        )}


        {(userRole === "admin" || userRole === "superadmin") && (
          <>

            <NavItem icon={Shield} label="Reservation (Admin)" page="reservation_admin"
              currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

          </>
        )}

        {(userRole === "manager" || userRole === "superadmin") && (
          <>
            <NavItem icon={Users} label="Reservation (Manager)" page="reservation_manager"
              currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />
            <NavItem icon={LayoutDashboard} label="Manager Dashboard" page="ManagerDashboard"
              currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

          </>
        )}

        {(userRole === "customer" || userRole === "superadmin") && (
          <>
            <NavItem icon={LayoutDashboard} label="Customer Dashboard" page="CustomerDashboard"
              currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />
            <NavItem icon={ClipboardList} label="Reservation (Customer)" page="CustomerReservation"
              currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

          </>
        )}
        {/* QR & Finalize Payment (FrontDesk only) */}

        {(userRole === "frontdesk" || userRole === "superadmin") && (

          <>
            <NavItem icon={LayoutDashboard} label="FrontDesk Dashboard" page="frontDeskDashboard"
              currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />
            <NavItem icon={User} label="Reservation (Front Desk)" page="ReservationFrontDesk"
              currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

            <NavItem icon={QrCode} label="QR Check-In" page="QRCheckInPage"
              currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

            <NavItem icon={QrCode} label="Finalize Payment" page="FinalizePayment"
              currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />
          </>
        )}


        {/* History */}

        {/* Calendar */}
        <NavItem icon={Calendar} label="Calendar" page="calendar"
          currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

        <NavItem icon={Calendar} label="Profile" page="profile"
          currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />






        {/* Maintenance (admin only) */}
        {(userRole === "admin" || userRole === "superadmin") && (
          <div>
            <button
              onClick={() => setMaintenanceOpen(!maintenanceOpen)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Wrench size={18} className="text-gray-500" />
              <span className="flex-1 text-left">Maintenance</span>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${maintenanceOpen ? "rotate-180" : ""}`}
              />
            </button>

            {maintenanceOpen && (
              <div className="pl-4">

                <NavItem icon={Settings} label="User Management" page="UserManagement"
                  currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

                <NavItem icon={CheckSquare} label="Reference" page="Reference"
                  currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

                <NavItem icon={FileText} label="Audit Trail" page="auditTrail"
                  currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

              </div>
            )}
          </div>
        )}

      </nav>
      <NavItem icon={Clock} label="History" page="history"
        currentPage={currentPage} onClick={setCurrentPage} permissions={permissions} onMobileClick={closeMobileMenu} />

      <NavItem
        icon={HelpCircle}
        label="Support"
        page="Support"
        currentPage={currentPage}
        onClick={setCurrentPage}
        permissions={permissions}
        badge="Online"
        onMobileClick={closeMobileMenu}
      />

      {/* Footer – Profile + Support + Logout */}
      <div className="border-t border-gray-200 p-4">

        {/* PROFILE SECTION */}
        <div className="flex items-center gap-3 mb-3">
          <img
            src={
              accountInfo?.ProfilePicuture
                ? accountInfo.ProfilePicuture
                : "https://ui-avatars.com/api/?name=" + (accountInfo?.email || "User")
            }
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover border"
          />
          <div className="flex flex-col overflow-hidden">
            <span
              className="text-sm font-medium text-gray-900 truncate"
              title={accountInfo?.email || "Loading..."} // tooltip
            >
              {accountInfo?.email || "Loading..."}
            </span>
            <span
              className="text-xs text-gray-500 truncate"
              title={accountInfo?.role?.toUpperCase() || ""}
            >
              {accountInfo?.role?.toUpperCase() || ""}
            </span>
          </div>
        </div>

        {/* SUPPORT */}

        {/* LOGOUT BUTTON */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 mt-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg"
        >
         
          <span>Logout</span>
        </button>
      </div>

    </>
  );

  return (
    <>
      {/* Mobile Menu toggle */}
      <button
        onClick={() => {
          setIsMobileMenuOpen(true);
          setIsDesktopOpen(true);
        }}
        className={`fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-lg border border-gray-200 hover:bg-gray-50 transition-opacity
          ${isMobileMenuOpen || isDesktopOpen ? "lg:opacity-0 lg:pointer-events-none" : ""}`}
      >
        <Menu size={24} className="text-gray-700" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && <div onClick={closeMobileMenu} className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" />}

      {/* Desktop */}
      <div className={`hidden lg:flex border-r border-gray-200 flex-col bg-white h-screen transition-all duration-300
        ${isDesktopOpen ? "w-64" : "w-0 overflow-hidden"}`}>
        <SidebarContent />
      </div>

      {/* Mobile */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <SidebarContent />
      </div>
    </>
  );
}

export default Sidebar;
