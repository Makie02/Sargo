import React, { useState, useEffect } from "react";

import { Facebook, Instagram, Mail, Phone, MapPin, Clock } from "lucide-react";

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">E8</span>
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight">
                  ELEV<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">8</span>
                </span>
                <div className="text-xs tracking-wider text-gray-400">BILLIARDS</div>
              </div>
            </div>
            <p className="text-gray-400 leading-relaxed">
              Modern billiard reservation system designed for convenience and efficiency.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-110"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {['About Us', 'Services', 'Book a Table', 'FAQ', 'Contact'].map((link, index) => (
                <li key={index}>
                  <a
                    href="#"
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center space-x-2 group"
                  >
                    <span className="w-0 h-0.5 bg-cyan-400 group-hover:w-4 transition-all duration-300"></span>
                    <span>{link}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3">
              <li className="flex items-start space-x-3 text-gray-400">
                <MapPin className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <span>123 Billiard Street, Quezon City, Metro Manila, Philippines</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Phone className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span>+63 912 345 6789</span>
              </li>
              <li className="flex items-center space-x-3 text-gray-400">
                <Mail className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                <span>info@elev8billiards.com</span>
              </li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div>
            <h3 className="text-lg font-bold mb-4">Operating Hours</h3>
            <div className="space-y-3">
              <div className="flex items-start space-x-3 text-gray-400">
                <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Monday - Friday</p>
                  <p>10:00 AM - 2:00 AM</p>
                </div>
              </div>
              <div className="flex items-start space-x-3 text-gray-400">
                <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-white">Saturday - Sunday</p>
                  <p>12:00 PM - 3:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-gray-400 text-sm text-center md:text-left">
              © {currentYear} ELEV8 Billiards. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Terms of Service
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;