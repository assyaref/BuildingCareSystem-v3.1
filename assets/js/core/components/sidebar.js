// assets/js/core/components/sidebar.js
// Sidebar Dinamis Premium UI - Match UI Design v4.7
// 🔥 Custom Premium Toast Confirmation for Logout
// 📱 Mobile Responsive: Topbar dengan menu horizontal langsung terlihat
// ✨ User Card Premium dengan Glassmorphism + Inisial Avatar

(function() {
    'use strict';

    console.log('🔄 Premium sidebar.js loaded with Mobile Topbar (all menus on top)');

    const styleId = 'premium-sidebar-css';
    if (!document.getElementById(styleId)) {
        const css = `
            :root {
                --sb-sidebar-bg: #f8fafc;
                --sb-text-dark: #1e293b;
                --sb-text-muted: #64748b;
                --sb-active-gradient: linear-gradient(90deg, #3b82f6 0%, #1d4ed8 100%);
                --sb-active-shadow: rgba(37, 99, 235, 0.25);
                --sb-card-bg: rgba(255, 255, 255, 0.75);
                --sb-card-border: rgba(255, 255, 255, 0.3);
            }
            [data-theme="dark"] {
                --sb-sidebar-bg: #111827;
                --sb-text-dark: #f9fafb;
                --sb-text-muted: #9ca3af;
                --sb-active-gradient: linear-gradient(90deg, #2563eb 0%, #1e40af 100%);
                --sb-active-shadow: rgba(37, 99, 235, 0.4);
                --sb-card-bg: rgba(31, 41, 55, 0.8);
                --sb-card-border: rgba(55, 65, 81, 0.4);
            }
            
            .sidebar {
                width: 280px !important;
                background: var(--sb-sidebar-bg) !important;
                display: flex;
                flex-direction: column;
                height: 100vh;
                position: fixed;
                top: 0;
                left: 0;
                padding: 0 !important;
                box-shadow: 4px 0 25px rgba(0,0,0,0.02);
                border-right: 1px solid rgba(0,0,0,0.05);
                z-index: 1040;
                overflow: hidden;
            }

            /* 🌊 HEADER DENGAN GELOMBANG CEKUNG */
            .sb-header {
                padding: 40px 24px 60px 24px;
                text-align: center;
                position: relative;
                background: linear-gradient(135deg, #0d6efd 0%, #0044cc 100%);
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 280 120' preserveAspectRatio='none'%3E%3Cpath d='M0,0 L280,0 L280,80 C200,120 80,70 0,100 Z' fill='%230044cc'/%3E%3C/svg%3E");
                background-position: bottom center;
                background-size: 100% 45px;
                background-repeat: no-repeat;
                margin-bottom: 15px;
            }
            
            .sb-header::before {
                content: '';
                position: absolute;
                top: 0; left: 0; right: 0; bottom: 40px;
                background: linear-gradient(180deg, #0b5ed7 0%, #0044cc 100%);
                z-index: 0;
            }

            .sb-header-content {
                position: relative;
                z-index: 1;
            }

            .sb-logo-container {
                width: 85px;
                height: 85px;
                background: #ffffff;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin: 0 auto 15px auto;
                box-shadow: 0 10px 20px rgba(0,0,0,0.12);
                padding: 5px;
            }
            .sb-logo-container img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }
            .sb-brand-title {
                color: #ffffff;
                font-size: 24px;
                font-weight: 700;
                margin: 0;
                letter-spacing: 0.5px;
            }
            .sb-brand-subtitle {
                color: rgba(255,255,255,0.8);
                font-size: 13px;
                font-weight: 500;
                margin-top: 4px;
            }

            /* USER MOBILE (hanya muncul di HP) */
            .sb-user-mobile {
                display: none;
                color: rgba(255,255,255,0.9);
                font-size: 12px;
                font-weight: 600;
                margin-left: 8px;
                white-space: nowrap;
            }

            /* BODY MENU */
            .sb-body {
                flex: 1;
                overflow-y: auto;
                padding: 10px 18px;
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .sb-body::-webkit-scrollbar { width: 0px; }

            .sb-menu-item {
                display: flex;
                align-items: center;
                padding: 12px 16px;
                border-radius: 14px;
                text-decoration: none !important;
                color: var(--sb-text-muted) !important;
                font-weight: 600;
                font-size: 14px;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
            }
            .sb-menu-item:hover:not(.active) {
                background: rgba(0, 0, 0, 0.03);
                color: var(--sb-text-dark) !important;
                padding-left: 20px;
            }

            .sb-icon-box {
                width: 36px;
                height: 36px;
                border-radius: 10px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 14px;
                font-size: 16px;
                transition: all 0.2s ease;
            }

            .sb-menu-label {
                flex: 1;
            }
            .sb-arrow {
                font-size: 13px;
                color: var(--sb-text-muted);
                opacity: 0.7;
            }

            /* 🎯 STATE ACTIVE */
            .sb-menu-item.active {
                background: var(--sb-active-gradient) !important;
                color: #ffffff !important;
                box-shadow: 0 8px 20px var(--sb-active-shadow);
            }
            .sb-menu-item.active .sb-icon-box {
                background: #ffffff !important;
                color: #2563eb !important;
                box-shadow: 0 2px 6px rgba(0,0,0,0.06);
            }
            .sb-menu-item.active .sb-arrow {
                color: #ffffff !important;
                opacity: 1;
            }
            .sb-menu-item.active::before {
                content: '';
                position: absolute;
                left: -6px;
                top: 25%;
                height: 50%;
                width: 5px;
                background: #f59e0b;
                border-radius: 0 4px 4px 0;
            }

            /* LOGOUT ITEM */
            .logout-item {
                color: #ff3b30 !important;
            }
            .logout-item .sb-icon-box {
                background: #ffe5e5 !important;
                color: #ff3b30 !important;
            }
            .logout-item:hover {
                background: #fff5f5 !important;
            }

            .sb-divider {
                height: 1px;
                background: rgba(0,0,0,0.05);
                margin: 12px 16px;
            }

            /* ================================================================
               ✨ USER CARD PREMIUM — GLASSMORPHISM + INISIAL AVATAR
               ================================================================ */
            .sb-footer {
                padding: 15px 18px 30px 18px;
                position: relative;
                background: transparent;
            }

            .sb-user-card {
                background: var(--sb-card-bg);
                backdrop-filter: blur(16px);
                -webkit-backdrop-filter: blur(16px);
                border: 1px solid var(--sb-card-border);
                border-radius: 20px;
                padding: 14px 14px 14px 16px;
                display: flex;
                align-items: center;
                gap: 14px;
                position: relative;
                z-index: 2;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(255,255,255,0.5) inset;
                cursor: default;
            }
            .sb-user-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255,255,255,0.6) inset;
                background: rgba(255, 255, 255, 0.85);
            }
            [data-theme="dark"] .sb-user-card:hover {
                background: rgba(31, 41, 55, 0.9);
                box-shadow: 0 12px 28px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(75, 85, 99, 0.4) inset;
            }

            /* AVATAR dengan inisial */
            .sb-avatar-wrapper {
                position: relative;
                flex-shrink: 0;
                width: 48px;
                height: 48px;
            }
            .sb-avatar {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 700;
                font-size: 18px;
                color: #ffffff;
                background: linear-gradient(135deg, #3b82f6, #1d4ed8);
                box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
                text-transform: uppercase;
                transition: all 0.3s ease;
                user-select: none;
            }
            .sb-user-card:hover .sb-avatar {
                transform: scale(1.04);
                box-shadow: 0 6px 18px rgba(59, 130, 246, 0.45);
            }

            /* Status dot dengan animasi pulse */
            .sb-status-dot {
                width: 13px;
                height: 13px;
                background: #22c55e;
                border: 2.5px solid #ffffff;
                border-radius: 50%;
                position: absolute;
                bottom: -1px;
                right: -1px;
                box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5);
                animation: sb-pulse-dot 2s infinite;
            }
            [data-theme="dark"] .sb-status-dot {
                border-color: #1e293b;
            }

            @keyframes sb-pulse-dot {
                0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
                70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
            }

            /* Informasi user */
            .sb-user-info {
                flex: 1;
                min-width: 0;
            }
            .sb-user-name {
                font-weight: 700;
                font-size: 15px;
                color: var(--sb-text-dark);
                margin: 0 0 3px 0;
                line-height: 1.3;
                letter-spacing: -0.01em;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            .sb-user-role-wrap {
                display: flex;
                align-items: center;
                gap: 6px;
                flex-wrap: wrap;
            }
            .sb-badge-role {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                background: linear-gradient(135deg, #3b82f6, #2563eb);
                color: #ffffff;
                font-size: 9px;
                font-weight: 700;
                padding: 2px 10px 2px 8px;
                border-radius: 20px;
                text-transform: uppercase;
                letter-spacing: 0.04em;
                box-shadow: 0 2px 6px rgba(37, 99, 235, 0.2);
                line-height: 1.6;
            }
            .sb-badge-role i {
                font-size: 8px;
                opacity: 0.8;
            }
            .sb-user-email {
                font-size: 11px;
                color: var(--sb-text-muted);
                opacity: 0.7;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                max-width: 100px;
            }

            /* Chevron / action */
            .sb-chevron-down {
                color: var(--sb-text-muted);
                font-size: 16px;
                opacity: 0.5;
                transition: all 0.3s ease;
                flex-shrink: 0;
                margin-left: 4px;
                background: rgba(0,0,0,0.03);
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            .sb-user-card:hover .sb-chevron-down {
                opacity: 0.9;
                background: rgba(0,0,0,0.06);
                transform: rotate(90deg);
            }

            /* 🌟 TOAST OVERLAY & BOX CSS */
            .sb-toast-overlay {
                position: fixed;
                top: 0; left: 0; width: 100vw; height: 100vh;
                background: rgba(15, 23, 42, 0.3);
                backdrop-filter: blur(8px);
                -webkit-backdrop-filter: blur(8px);
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .sb-toast-overlay.show {
                opacity: 1;
                pointer-events: auto;
            }
            .sb-toast-box {
                background: #ffffff;
                border-radius: 24px;
                padding: 32px;
                width: 90%;
                max-width: 400px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                border: 1px solid rgba(255, 255, 255, 0.8);
                transform: scale(0.85) translateY(20px);
                transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .sb-toast-overlay.show .sb-toast-box {
                transform: scale(1) translateY(0);
            }
            .sb-toast-icon {
                width: 64px; height: 64px;
                background: #fff5f5; color: #ff3b30; border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                font-size: 28px; margin: 0 auto 20px auto;
                animation: pulseRed 2s infinite;
            }
            .sb-toast-title { font-size: 20px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
            .sb-toast-desc { font-size: 14px; color: #64748b; margin-bottom: 24px; line-height: 1.5; }
            .sb-toast-actions { display: flex; gap: 12px; }
            .sb-toast-btn { flex: 1; padding: 12px 16px; border-radius: 12px; font-size: 14px; font-weight: 600; cursor: pointer; border: none; transition: all 0.2s ease; }
            .sb-toast-btn-cancel { background: #f1f5f9; color: #64748b; }
            .sb-toast-btn-cancel:hover { background: #e2e8f0; color: #0f172a; }
            .sb-toast-btn-confirm { background: linear-gradient(135deg, #ff5252 0%, #ff3b30 100%); color: #ffffff; box-shadow: 0 4px 12px rgba(255, 59, 48, 0.2); }
            .sb-toast-btn-confirm:hover { transform: translateY(-2px); box-shadow: 0 6px 15px rgba(255, 59, 48, 0.3); }

            @keyframes pulseRed {
                0% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0.2); }
                70% { box-shadow: 0 0 0 12px rgba(255, 59, 48, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 59, 48, 0); }
            }

            /* ===================================================== */
            /* 📱 RESPONSIVE MOBILE – SEMUA MENU DI ATAS (TOPBAR)    */
            /* ===================================================== */
            .content { 
                margin-left: 280px !important; 
                width: calc(100% - 280px) !important; 
                transition: all 0.3s ease;
            }
            
            @media (max-width: 991.98px) {
                .sidebar {
                    width: 100% !important;
                    height: auto !important;
                    position: fixed;
                    top: 0; left: 0; right: 0;
                    border-right: none;
                    border-bottom: 1px solid rgba(0,0,0,0.05);
                    box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                    z-index: 1050;
                    flex-direction: column;
                    overflow: visible;
                }

                .sb-header {
                    padding: 0 20px;
                    height: 60px;
                    margin-bottom: 0;
                    display: flex;
                    align-items: center;
                    justify-content: flex-start;
                    background: linear-gradient(135deg, #0d6efd 0%, #0044cc 100%) !important;
                    background-image: none !important;
                }
                .sb-header::before { display: none; }

                .sb-header-content {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                .sb-logo-container {
                    width: 34px; height: 34px;
                    margin: 0;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
                    padding: 2px;
                }
                .sb-brand-title { font-size: 16px; }
                .sb-brand-subtitle { display: none; }
                .sb-user-mobile {
                    display: inline-block !important;
                }

                .sb-body {
                    display: flex;
                    flex-direction: row !important;
                    overflow-x: auto;
                    overflow-y: hidden;
                    white-space: nowrap;
                    padding: 10px 16px;
                    gap: 8px;
                    background: var(--sb-sidebar-bg);
                    opacity: 1 !important;
                    visibility: visible !important;
                    transform: none !important;
                    transition: none !important;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                    flex: 0 0 auto;
                }
                .sb-body::-webkit-scrollbar { display: none; }

                .sb-menu-item {
                    flex: 0 0 auto;
                    padding: 8px 14px;
                    border-radius: 20px;
                    font-size: 13px;
                    font-weight: 600;
                    white-space: nowrap;
                    text-decoration: none !important;
                    color: var(--sb-text-muted) !important;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    background: rgba(0,0,0,0.02);
                }
                .sb-menu-item.active {
                    background: var(--sb-active-gradient) !important;
                    color: #ffffff !important;
                }
                .sb-menu-item.active .sb-icon-box {
                    background: #ffffff !important;
                    color: #2563eb !important;
                }
                .sb-icon-box {
                    width: 26px; height: 26px;
                    border-radius: 8px;
                    margin-right: 0;
                    font-size: 14px;
                }
                .sb-arrow { display: none; }
                .sb-divider { display: none; }

                .logout-item {
                    color: #ff3b30 !important;
                    background: #fff5f5 !important;
                }
                .logout-item .sb-icon-box {
                    background: #ffe5e5 !important;
                    color: #ff3b30 !important;
                }

                /* Footer user card di mobile: tetap muncul, lebih compact */
                .sb-footer {
                    display: none;
                    padding: 12px 18px 20px 18px;
                    background: var(--sb-sidebar-bg);
                    border-top: 1px solid rgba(0,0,0,0.04);
                }
                .sidebar.open .sb-footer {
                    display: block;
                }

                .sb-user-card {
                    padding: 12px 14px;
                    border-radius: 16px;
                    gap: 12px;
                    background: rgba(255,255,255,0.8);
                    backdrop-filter: blur(8px);
                    box-shadow: 0 2px 10px rgba(0,0,0,0.04);
                }
                .sb-avatar-wrapper {
                    width: 40px;
                    height: 40px;
                }
                .sb-avatar {
                    font-size: 15px;
                }
                .sb-user-name {
                    font-size: 14px;
                }
                .sb-user-email {
                    display: none;
                }
                .sb-chevron-down {
                    width: 28px;
                    height: 28px;
                    font-size: 14px;
                }

                .content {
                    margin-left: 0 !important;
                    width: 100% !important;
                    padding-top: 120px !important;
                }
            }


            /* =====================================================
               BCS SIDEBAR ULTRA PREMIUM — VISUAL UPGRADE
               ===================================================== */
            .sidebar {
                background:
                    radial-gradient(circle at 20% 0%, rgba(59,130,246,.08), transparent 28%),
                    linear-gradient(180deg, #fbfdff 0%, #f4f7fb 100%) !important;
                border-right: 1px solid rgba(148,163,184,.16);
                box-shadow: 12px 0 45px rgba(15,23,42,.07);
            }

            [data-theme="dark"] .sidebar {
                background:
                    radial-gradient(circle at 20% 0%, rgba(59,130,246,.13), transparent 30%),
                    linear-gradient(180deg, #111827 0%, #0b1220 100%) !important;
            }

            .sb-header {
                padding: 32px 22px 58px;
                background:
                    radial-gradient(circle at 80% 10%, rgba(96,165,250,.34), transparent 30%),
                    linear-gradient(145deg, #0b3b82 0%, #0754c9 52%, #2563eb 100%) !important;
                background-image: none !important;
                overflow: hidden;
            }

            .sb-header::before {
                display: block;
                inset: auto -35px -48px -35px;
                height: 88px;
                background: var(--sb-sidebar-bg);
                border-radius: 50% 50% 0 0 / 45% 45% 0 0;
                opacity: 1;
            }

            .sb-header::after {
                content: '';
                position: absolute;
                width: 150px;
                height: 150px;
                right: -70px;
                top: -70px;
                border: 1px solid rgba(255,255,255,.18);
                border-radius: 50%;
                box-shadow: 0 0 0 24px rgba(255,255,255,.035);
            }

            .sb-logo-container {
                width: 92px;
                height: 92px;
                padding: 7px;
                border: 1px solid rgba(255,255,255,.7);
                background: rgba(255,255,255,.92);
                box-shadow:
                    0 18px 35px rgba(3,35,90,.30),
                    0 0 0 7px rgba(255,255,255,.10);
                transition: transform .35s ease, box-shadow .35s ease;
            }

            .sb-logo-container:hover {
                transform: translateY(-3px) scale(1.03);
                box-shadow:
                    0 22px 42px rgba(3,35,90,.34),
                    0 0 0 8px rgba(255,255,255,.12);
            }

            .sb-brand-title {
                font-size: 23px;
                font-weight: 800;
                letter-spacing: -.35px;
                text-shadow: 0 2px 12px rgba(0,0,0,.15);
            }

            .sb-brand-subtitle {
                display: inline-flex;
                margin-top: 7px;
                padding: 4px 10px;
                border: 1px solid rgba(255,255,255,.16);
                border-radius: 999px;
                background: rgba(255,255,255,.10);
                backdrop-filter: blur(8px);
                font-size: 10px;
                letter-spacing: .8px;
                text-transform: uppercase;
            }

            .sb-body {
                padding: 8px 16px 14px;
                gap: 5px;
            }

            .sb-menu-item {
                min-height: 52px;
                padding: 8px 11px;
                border: 1px solid transparent;
                border-radius: 15px;
                font-size: 13.5px;
                letter-spacing: -.05px;
            }

            .sb-menu-item:hover:not(.active) {
                padding-left: 11px;
                transform: translateX(3px);
                background: rgba(255,255,255,.72);
                border-color: rgba(148,163,184,.15);
                box-shadow: 0 8px 20px rgba(15,23,42,.055);
            }

            [data-theme="dark"] .sb-menu-item:hover:not(.active) {
                background: rgba(255,255,255,.045);
            }

            .sb-icon-box {
                width: 38px;
                height: 38px;
                border-radius: 12px;
                margin-right: 12px;
                box-shadow: inset 0 0 0 1px rgba(255,255,255,.35);
            }

            .sb-menu-item.active {
                background:
                    radial-gradient(circle at 90% 10%, rgba(255,255,255,.20), transparent 35%),
                    linear-gradient(135deg, #2563eb 0%, #1746b4 100%) !important;
                border-color: rgba(255,255,255,.16);
                box-shadow:
                    0 12px 26px rgba(37,99,235,.25),
                    inset 0 1px 0 rgba(255,255,255,.18);
                transform: translateY(-1px);
            }

            .sb-menu-item.active::before {
                left: -16px;
                top: 18%;
                height: 64%;
                width: 4px;
                background: linear-gradient(180deg,#fbbf24,#f97316);
                box-shadow: 0 0 14px rgba(245,158,11,.55);
            }

            .sb-menu-item.active .sb-icon-box {
                border-radius: 11px;
                box-shadow: 0 7px 16px rgba(15,23,42,.13);
            }

            .sb-arrow {
                width: 25px;
                height: 25px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                border-radius: 8px;
                transition: transform .25s ease, background .25s ease;
            }

            .sb-menu-item:hover .sb-arrow {
                transform: translateX(2px);
                background: rgba(148,163,184,.10);
            }

            .sb-divider {
                margin: 10px 12px;
                background: linear-gradient(90deg, transparent, rgba(148,163,184,.28), transparent);
            }

            .logout-item {
                margin-top: 2px;
            }

            .logout-item:hover {
                transform: translateX(3px);
                border-color: rgba(239,68,68,.12) !important;
                box-shadow: 0 8px 18px rgba(239,68,68,.07);
            }

            .sb-footer {
                padding: 12px 16px 22px;
            }

            .sb-user-card {
                padding: 13px;
                border-radius: 19px;
                background:
                    linear-gradient(145deg, rgba(255,255,255,.90), rgba(248,250,252,.70));
                border: 1px solid rgba(148,163,184,.16);
                box-shadow:
                    0 14px 30px rgba(15,23,42,.08),
                    inset 0 1px 0 rgba(255,255,255,.9);
            }

            .sb-user-card::before {
                content: '';
                position: absolute;
                left: 16px;
                right: 16px;
                top: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, #60a5fa, #8b5cf6, transparent);
                opacity: .75;
            }

            .sb-avatar {
                background:
                    radial-gradient(circle at 30% 20%, rgba(255,255,255,.30), transparent 28%),
                    linear-gradient(135deg, #2563eb, #4338ca);
                border: 2px solid rgba(255,255,255,.9);
            }

            .sb-badge-role {
                background: linear-gradient(135deg, #1d4ed8, #4f46e5);
                box-shadow: 0 4px 10px rgba(37,99,235,.22);
            }

            .sb-chevron-down {
                border: 1px solid rgba(148,163,184,.14);
                background: rgba(255,255,255,.55);
            }

            [data-theme="dark"] .sb-user-card {
                background: linear-gradient(145deg, rgba(31,41,55,.92), rgba(17,24,39,.82));
                border-color: rgba(148,163,184,.12);
                box-shadow: 0 16px 32px rgba(0,0,0,.28);
            }

            @media (max-width: 991.98px) {
                .sb-header {
                    padding: 0 18px;
                    background: linear-gradient(135deg,#0b3b82,#2563eb) !important;
                }

                .sb-header::before,
                .sb-header::after {
                    display: none;
                }

                .sb-logo-container {
                    width: 36px;
                    height: 36px;
                    padding: 2px;
                    box-shadow: 0 4px 12px rgba(0,0,0,.18);
                }

                .sb-body {
                    box-shadow: 0 8px 22px rgba(15,23,42,.05);
                }

                .sb-menu-item {
                    min-height: auto;
                }
            }

            @media (max-width: 480px) {
                .sb-user-card {
                    padding: 10px 12px;
                    gap: 10px;
                }
                .sb-avatar-wrapper {
                    width: 36px;
                    height: 36px;
                }
                .sb-avatar {
                    font-size: 13px;
                }
                .sb-user-name {
                    font-size: 13px;
                }
                .sb-badge-role {
                    font-size: 8px;
                    padding: 1px 8px 1px 6px;
                }
            }
        `;
        const styleSheet = document.createElement("style");
        styleSheet.id = styleId;
        styleSheet.innerText = css;
        document.head.appendChild(styleSheet);
    }

    // ================================================================
    // 1. FUNGSI GET SESSION
    // ================================================================
    function getSession() {
        try {
            if (typeof BCS !== 'undefined' && BCS.Storage && typeof BCS.Storage.getSession === 'function') {
                return BCS.Storage.getSession();
            }
        } catch (e) {}
        try {
            const raw = localStorage.getItem('bcs_session');
            if (raw) return JSON.parse(raw);
        } catch (e) {}
        return null;
    }

    // ================================================================
    // 2. FUNGSI TOAST KONFIRMASI LOGOUT
    // ================================================================
    function createToastDOM() {
        if (document.getElementById('sb-logout-toast-overlay')) return;

        const overlay = document.createElement('div');
        overlay.id = 'sb-logout-toast-overlay';
        overlay.className = 'sb-toast-overlay';
        overlay.innerHTML = `
            <div class="sb-toast-box">
                <div class="sb-toast-icon">
                    <i class="bi bi-box-arrow-right"></i>
                </div>
                <div class="sb-toast-title">Konfirmasi Keluar</div>
                <div class="sb-toast-desc">Apakah Anda yakin ingin mengakhiri sesi dan keluar dari Building Care System?</div>
                <div class="sb-toast-actions">
                    <button class="sb-toast-btn sb-toast-btn-cancel" id="toast-cancel-btn">Batal</button>
                    <button class="sb-toast-btn sb-toast-btn-confirm" id="toast-confirm-btn">Ya, Keluar</button>
                </div>
            </div>
        `;
        document.body.appendChild(overlay);

        document.getElementById('toast-cancel-btn').addEventListener('click', hideLogoutToast);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) hideLogoutToast();
        });
        
        document.getElementById('toast-confirm-btn').addEventListener('click', function() {
            document.querySelector('.sb-toast-box').innerHTML = `
                <div class="sb-toast-icon" style="background: #e6fbf4; color: #10b981; animation: none;">
                    <i class="bi bi-check-circle-fill"></i>
                </div>
                <div class="sb-toast-title">Berhasil Keluar</div>
                <div class="sb-toast-desc" style="margin-bottom: 0;">Mengarahkan kembali ke halaman login...</div>
            `;
            setTimeout(() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login.html';
            }, 1000);
        });
    }

    function showLogoutToast() {
        createToastDOM();
        const overlay = document.getElementById('sb-logout-toast-overlay');
        if (overlay) overlay.classList.add('show');
    }

    function hideLogoutToast() {
        const overlay = document.getElementById('sb-logout-toast-overlay');
        if (overlay) overlay.classList.remove('show');
    }

    // ================================================================
    // 3. FUNGSI RENDER SIDEBAR
    // ================================================================
    function renderSidebar() {
        const sidebarElement = document.querySelector('.sidebar');
        if (!sidebarElement) return;

        const session = getSession();
        let userName = 'John Doe';
        let userRole = 'ADMIN';
        let userEmail = 'john.doe@example.com';

        if (session && session.user) {
            userName = session.user.nama || session.user.name || 'John Doe';
            userRole = session.user.role || 'ADMIN';
            userEmail = session.user.email || session.user.username || 'user@company.com';
        }

        // Ambil inisial untuk avatar
        const initials = userName
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .slice(0, 2)
            .join('');

        const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';

        const iconStyles = {
            'dashboard.html': { bg: '#e6f0ff', color: '#2563eb' },
            'report.html':    { bg: '#e6fbf4', color: '#10b981' },
            'monitoring.html':{ bg: '#f3e8ff', color: '#a855f7' },
            'history.html':   { bg: '#fef3c7', color: '#d97706' },
            'wo.html':        { bg: '#e0f2fe', color: '#0284c7' },
            'budget.html':    { bg: '#dcfce7', color: '#16a34a' },
            'approval.html':  { bg: '#e0e7ff', color: '#4f46e5' },
            'admin.html':     { bg: '#e0e7ff', color: '#2563eb' }
        };

        // Menu utama + item Logout disatukan di body
        let mainMenus = [
            { href: 'dashboard.html', icon: 'bi-grid-fill', label: 'Dashboard' },
            { href: 'report.html', icon: 'bi-file-earmark-plus-fill', label: 'Report' },
            { href: 'monitoring.html', icon: 'bi-display-fill', label: 'Monitoring' },
            { href: 'history.html', icon: 'bi-clock-fill', label: 'History' },
            { divider: true },
            { href: 'wo.html', icon: 'bi-clipboard-check-fill', label: 'Work Order' },
            { href: 'budget.html', icon: 'bi-wallet2', label: 'Budget' },
            { href: 'approval.html', icon: 'bi-shield-check', label: 'Approval' },
            { divider: true },
            { href: 'admin.html', icon: 'bi-person-fill', label: 'Admin' },
            { href: '#', icon: 'bi-box-arrow-right', label: 'Logout', isLogout: true }
        ];

        let sidebarHTML = `
            <div class="sb-header">
                <div class="sb-header-content">
                    <div class="sb-logo-container">
                        <img src="assets/img/logo.png" onerror="this.src='https://i.ibb.co/VWVg0Ym/logo-placeholder.png'" alt="Logo">
                    </div>
                    <h5 class="sb-brand-title">Building Care</h5>
                    <div class="sb-brand-subtitle">Enterprise v4.3</div>
                    <span class="sb-user-mobile">${userName}</span>
                </div>
            </div>

            <div class="sb-body">
        `;

        mainMenus.forEach(menu => {
            if (menu.divider) {
                sidebarHTML += `<div class="sb-divider"></div>`;
                return;
            }

            const activeClass = (currentPage === menu.href) ? 'active' : '';
            const isLogout = menu.isLogout ? ' logout-item' : '';
            const styleConf = iconStyles[menu.href] || { bg: '#f1f5f9', color: '#64748b' };
            const chevronHTML = !menu.isLogout ? `<i class="bi bi-chevron-right sb-arrow"></i>` : '';
            
            sidebarHTML += `
                <a href="${menu.href}" class="sb-menu-item ${activeClass}${isLogout}">
                    <div class="sb-icon-box" style="background: ${styleConf.bg}; color: ${styleConf.color};">
                        <i class="bi ${menu.icon}"></i>
                    </div>
                    <span class="sb-menu-label">${menu.label}</span>
                    ${chevronHTML}
                </a>
            `;
        });

        sidebarHTML += `
            </div>

            <div class="sb-footer">
                <div class="sb-user-card">
                    <div class="sb-avatar-wrapper">
                        <div class="sb-avatar">${initials}</div>
                        <div class="sb-status-dot"></div>
                    </div>
                    <div class="sb-user-info">
                        <h6 class="sb-user-name">${userName}</h6>
                        <div class="sb-user-role-wrap">
                            <span class="sb-badge-role"><i class="bi bi-shield-fill-check"></i> ${userRole}</span>
                            <span class="sb-user-email">${userEmail}</span>
                        </div>
                    </div>
                    <i class="bi bi-chevron-down sb-chevron-down"></i>
                </div>
            </div>
        `;

        sidebarElement.innerHTML = sidebarHTML;

        // Event Logout pada item dengan class .logout-item
        const logoutItem = document.querySelector('.logout-item');
        if (logoutItem) {
            logoutItem.addEventListener('click', function(e) {
                e.preventDefault();
                showLogoutToast();
            });
        }
    }

    // ================================================================
    // 4. 📱 FUNGSI TOGGLE MOBILE (MASIH BERFUNGSI UNTUK USER CARD)
    // ================================================================
    function initMobileToggle() {
        const toggleBtn = document.getElementById('sidebarToggle');
        const sidebar = document.querySelector('.sidebar');

        if (!sidebar) return;

        function closeSidebar() {
            sidebar.classList.remove('open');
            if (toggleBtn) {
                const icon = toggleBtn.querySelector('i');
                if (icon) icon.className = 'bi bi-list';
            }
        }

        if (!toggleBtn) {
            console.warn('⚠️ Sidebar toggle button (#sidebarToggle) tidak ditemukan.');
        } else {
            toggleBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const isOpen = sidebar.classList.toggle('open');
                const icon = toggleBtn.querySelector('i');
                if (icon) {
                    icon.className = isOpen ? 'bi bi-x-lg' : 'bi bi-list';
                }
            });
        }

        document.addEventListener('click', function(e) {
            if (window.innerWidth <= 991.98 && 
                sidebar.classList.contains('open') &&
                !sidebar.contains(e.target) && 
                (toggleBtn && !toggleBtn.contains(e.target))) {
                closeSidebar();
            }
        });

        window.addEventListener('resize', function() {
            if (window.innerWidth > 991.98 && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
                closeSidebar();
            }
        });
    }

    // ================================================================
    // 5. INITIALIZATION
    // ================================================================
    function startApp() {
        renderSidebar();
        setTimeout(initMobileToggle, 100);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startApp);
    } else {
        startApp();
    }

})();
