// ======================================================
// Building Care System Enterprise v4.3
// PREMIUM RESPONSIVE SIDEBAR - FINAL
// Desktop: premium sidebar seperti referensi
// Mobile : compact topbar + off-canvas drawer + bottom navigation
// ======================================================

(function () {
    "use strict";

    const STYLE_ID = "bcs-premium-sidebar-final-css";
    const MOBILE_BREAKPOINT = 991.98;

    const MENUS = [
        { href: "dashboard",  icon: "bi-grid-fill",               label: "Dashboard",  tone: "blue" },
        { href: "report",     icon: "bi-file-earmark-plus-fill",  label: "Report",     tone: "green" },
        { href: "monitoring", icon: "bi-display-fill",            label: "Monitoring", tone: "purple" },
        { href: "history",    icon: "bi-clock-fill",              label: "History",    tone: "amber" },
        { href: "electricity", icon: "bi-lightning-charge-fill",  label: "Electricity", tone: "yellow" }, // ← TAMBAHAN
        { divider: true },
        { href: "wo",         icon: "bi-clipboard2-check-fill",   label: "Work Order", tone: "blue", mobilePrimary: true },
        { href: "budget",     icon: "bi-wallet2",                 label: "Budget",     tone: "green" },
        { href: "approval",   icon: "bi-shield-check",            label: "Approval",   tone: "indigo" },
        { divider: true },
        { href: "admin",      icon: "bi-people-fill",             label: "User Management", tone: "slate", adminOnly: true },
        { href: "#",          icon: "bi-box-arrow-right",         label: "Logout",     tone: "red", logout: true }
    ];

    function injectStyles() {
        if (document.getElementById(STYLE_ID)) return;

        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = `
            :root {
                --bcs-sb-width: 292px;
                --bcs-blue: #0b57d0;
                --bcs-blue-2: #245fe5;
                --bcs-blue-3: #2f6cf5;
                --bcs-bg: #f8fafc;
                --bcs-surface: #ffffff;
                --bcs-text: #172033;
                --bcs-muted: #70809a;
                --bcs-line: rgba(148,163,184,.16);
                --bcs-shadow: 0 18px 45px rgba(30,64,175,.12);
            }

            [data-theme="dark"] {
                --bcs-bg: #0b1220;
                --bcs-surface: #111827;
                --bcs-text: #f8fafc;
                --bcs-muted: #9ca3af;
                --bcs-line: rgba(148,163,184,.14);
                --bcs-shadow: 0 18px 45px rgba(0,0,0,.28);
            }

            * { box-sizing: border-box; }

            body.sb-mobile-open { overflow: hidden; }

            .sidebar {
                position: fixed !important;
                inset: 0 auto 0 0;
                width: var(--bcs-sb-width) !important;
                height: 100dvh !important;
                padding: 0 !important;
                display: flex;
                flex-direction: column;
                overflow: hidden;
                z-index: 1040;
                background: var(--bcs-bg) !important;
                border-right: 1px solid var(--bcs-line);
                box-shadow: 8px 0 34px rgba(15,23,42,.05);
                font-family: Inter, "Segoe UI", sans-serif;
            }

            .sb-desktop-header {
                position: relative;
                min-height: 258px;
                padding: 30px 24px 52px;
                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;
                overflow: hidden;
                flex-shrink: 0;
                background:
                    radial-gradient(circle at 20% 8%, rgba(255,255,255,.16), transparent 24%),
                    linear-gradient(145deg, #0755cc 0%, #0b52d4 48%, #123ed1 100%);
            }

            .sb-desktop-header::after {
                content: "";
                position: absolute;
                left: -6%;
                right: -6%;
                bottom: -34px;
                height: 70px;
                background: var(--bcs-bg);
                border-radius: 50% 50% 0 0 / 42% 42% 0 0;
                transform: rotate(-1.5deg);
            }

            .sb-brand {
                position: relative;
                z-index: 2;
            }

            .sb-logo {
                width: 88px;
                height: 88px;
                margin: 0 auto 14px;
                display: grid;
                place-items: center;
                overflow: hidden;
                border-radius: 50%;
                background: #fff;
                border: 4px solid rgba(255,255,255,.92);
                box-shadow: 0 12px 28px rgba(3,30,92,.22);
            }

            .sb-logo img {
                width: 100%;
                height: 100%;
                object-fit: contain;
            }

            .sb-title {
                margin: 0;
                color: #fff;
                font-size: 27px;
                font-weight: 800;
                letter-spacing: -.7px;
                line-height: 1.12;
            }

            .sb-version {
                margin-top: 7px;
                color: rgba(255,255,255,.82);
                font-size: 13px;
                font-weight: 500;
            }

            .sb-mobile-topbar { display: none; }

            .sb-body {
                flex: 1;
                min-height: 0;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 14px 20px 12px;
                scrollbar-width: none;
            }

            .sb-body::-webkit-scrollbar { display: none; }

            .sb-menu-item {
                position: relative;
                width: 100%;
                min-height: 56px;
                margin: 4px 0;
                padding: 8px 13px;
                display: flex;
                align-items: center;
                gap: 13px;
                color: var(--bcs-muted) !important;
                text-decoration: none !important;
                border-radius: 15px;
                font-size: 14px;
                font-weight: 700;
                transition: transform .22s ease, background .22s ease, color .22s ease, box-shadow .22s ease;
            }

            .sb-menu-item:hover:not(.active) {
                color: var(--bcs-text) !important;
                background: rgba(37,99,235,.055);
                transform: translateX(3px);
            }

            .sb-icon-box {
                width: 38px;
                height: 38px;
                flex: 0 0 38px;
                display: grid;
                place-items: center;
                border-radius: 11px;
                font-size: 16px;
                transition: inherit;
            }

            .sb-tone-blue   { background: #e8f0ff; color: #2764ea; }
            .sb-tone-green  { background: #dcf8eb; color: #18b56a; }
            .sb-tone-purple { background: #f2e5ff; color: #9a4de7; }
            .sb-tone-amber  { background: #fff0bd; color: #df8b00; }
            .sb-tone-indigo { background: #e5e9ff; color: #6174ed; }
            .sb-tone-slate  { background: #edf2f7; color: #64748b; }
            .sb-tone-red    { background: #ffe7e7; color: #ef4444; }
            .sb-tone-yellow { background: #fff3cd; color: #d39e00; } /* tambahan untuk electricity */

            .sb-menu-label {
                flex: 1;
                min-width: 0;
                white-space: nowrap;
            }

            .sb-arrow {
                color: #a6b2c5;
                font-size: 13px;
                transition: transform .22s ease;
            }

            .sb-menu-item:hover .sb-arrow { transform: translateX(2px); }

            /* ACTIVE MENU */
            .sb-menu-item.active {
                min-height: 64px;
                margin: 10px 0;
                padding: 10px 15px;
                color: #ffffff !important;
                background: linear-gradient(135deg, #3b7af5 0%, #1f55db 100%) !important;
                border-radius: 16px;
                box-shadow:
                    0 14px 26px rgba(37,99,235,.28),
                    inset 0 1px 0 rgba(255,255,255,.16);
                transform: none;
            }

            .sb-menu-item.active::before {
                content: "";
                position: absolute;
                left: -20px;
                top: 14px;
                width: 6px;
                height: 36px;
                border-radius: 0 6px 6px 0;
                background: #ffad00;
                box-shadow: 0 5px 12px rgba(255,173,0,.28);
            }

            .sb-menu-item.active .sb-icon-box {
                width: 42px;
                height: 42px;
                flex-basis: 42px;
                background: #ffffff !important;
                color: #2f6cf5 !important;
                border-radius: 12px;
                box-shadow:
                    0 5px 12px rgba(15,23,42,.10),
                    inset 0 0 0 1px rgba(37,99,235,.05);
                font-size: 17px;
            }

            .sb-menu-item.active .sb-menu-label {
                color: #ffffff;
                font-size: 15px;
                font-weight: 800;
                letter-spacing: -.15px;
            }

            .sb-menu-item.active .sb-arrow {
                color: #ffffff;
                opacity: 1;
                font-size: 16px;
                transform: none;
            }

            .sb-menu-item.sb-logout { color: #ef4444 !important; }

            .sb-divider {
                height: 1px;
                margin: 9px 10px;
                background: var(--bcs-line);
            }

            .sb-footer {
                flex-shrink: 0;
                padding: 12px 20px 20px;
                background: linear-gradient(180deg, transparent, var(--bcs-bg) 28%);
            }

            .sb-user-card {
                min-height: 82px;
                padding: 12px;
                display: flex;
                align-items: center;
                gap: 11px;
                border: 1px solid rgba(255,255,255,.85);
                border-radius: 22px;
                background: color-mix(in srgb, var(--bcs-surface) 92%, transparent);
                box-shadow: 0 10px 28px rgba(15,23,42,.07);
                backdrop-filter: blur(16px);
            }

            .sb-avatar-wrap {
                position: relative;
                width: 46px;
                height: 46px;
                flex: 0 0 46px;
            }

            .sb-avatar {
                width: 100%;
                height: 100%;
                display: grid;
                place-items: center;
                border-radius: 50%;
                color: #fff;
                background: linear-gradient(145deg, #4d8aff, #1f5de4);
                box-shadow: 0 7px 18px rgba(37,99,235,.25);
                font-size: 15px;
                font-weight: 800;
            }

            .sb-online {
                position: absolute;
                right: -1px;
                bottom: 0;
                width: 13px;
                height: 13px;
                border: 2px solid var(--bcs-surface);
                border-radius: 50%;
                background: #2bd67b;
                box-shadow: 0 0 0 2px rgba(43,214,123,.12);
            }

            .sb-user-info { flex: 1; min-width: 0; }

            .sb-user-name {
                margin: 0 0 4px;
                overflow: hidden;
                color: var(--bcs-text);
                font-size: 13px;
                font-weight: 800;
                white-space: nowrap;
                text-overflow: ellipsis;
            }

            .sb-role {
                width: fit-content;
                max-width: 100%;
                padding: 3px 7px;
                display: flex;
                align-items: center;
                gap: 4px;
                overflow: hidden;
                border-radius: 7px;
                color: #fff;
                background: #2864e8;
                font-size: 8px;
                font-weight: 900;
                letter-spacing: .25px;
                text-transform: uppercase;
                white-space: nowrap;
            }

            .sb-email {
                display: block;
                margin-top: 4px;
                overflow: hidden;
                color: #98a4b7;
                font-size: 10px;
                white-space: nowrap;
                text-overflow: ellipsis;
            }

            .sb-user-chevron {
                color: #b0bbca;
                font-size: 14px;
            }

            .content {
                width: calc(100% - var(--bcs-sb-width)) !important;
                margin-left: var(--bcs-sb-width) !important;
                transition: margin .25s ease, width .25s ease;
            }

            .sb-mobile-overlay,
            .sb-mobile-bottomnav { display: none; }

            /* Logout modal */
            .sb-modal-overlay {
                position: fixed;
                inset: 0;
                z-index: 9999;
                display: grid;
                place-items: center;
                padding: 20px;
                background: rgba(15,23,42,.42);
                backdrop-filter: blur(8px);
                opacity: 0;
                visibility: hidden;
                transition: .25s ease;
            }

            .sb-modal-overlay.show { opacity: 1; visibility: visible; }

            .sb-modal {
                width: min(390px, 100%);
                padding: 28px;
                text-align: center;
                border-radius: 25px;
                background: var(--bcs-surface);
                box-shadow: 0 28px 80px rgba(15,23,42,.28);
                transform: translateY(16px) scale(.96);
                transition: .25s ease;
            }

            .sb-modal-overlay.show .sb-modal { transform: none; }

            .sb-modal-icon {
                width: 64px;
                height: 64px;
                margin: 0 auto 17px;
                display: grid;
                place-items: center;
                border-radius: 50%;
                color: #ef4444;
                background: #fff0f0;
                font-size: 27px;
            }

            .sb-modal-title {
                margin: 0 0 7px;
                color: var(--bcs-text);
                font-size: 20px;
                font-weight: 800;
            }

            .sb-modal-text {
                margin: 0 0 22px;
                color: var(--bcs-muted);
                font-size: 13px;
                line-height: 1.6;
            }

            .sb-modal-actions { display: flex; gap: 10px; }

            .sb-modal-btn {
                flex: 1;
                padding: 12px 15px;
                border: 0;
                border-radius: 12px;
                cursor: pointer;
                font-weight: 800;
            }

            .sb-modal-cancel { color: #64748b; background: #eef2f7; }
            .sb-modal-confirm { color: #fff; background: #ef4444; }

            /* ================= MOBILE ================= */
            @media (max-width: 991.98px) {
                :root { --bcs-mobile-topbar: 66px; --bcs-mobile-bottom: 72px; }

                .sidebar {
                    width: min(86vw, 320px) !important;
                    height: 100dvh !important;
                    transform: translateX(-105%);
                    transition: transform .28s cubic-bezier(.2,.8,.2,1);
                    box-shadow: 20px 0 55px rgba(15,23,42,.22);
                    z-index: 1090;
                }

                .sidebar.sb-open { transform: translateX(0); }

                .sb-desktop-header {
                    min-height: 190px;
                    padding: 24px 20px 38px;
                }

                .sb-logo { width: 66px; height: 66px; margin-bottom: 10px; }
                .sb-title { font-size: 22px; }
                .sb-version { font-size: 11px; }

                .sb-body { padding: 10px 16px; }
                .sb-footer { padding: 10px 16px 18px; }

                .sb-mobile-topbar {
                    position: fixed;
                    inset: 0 0 auto 0;
                    height: var(--bcs-mobile-topbar);
                    z-index: 1060;
                    padding: 0 14px;
                    display: flex;
                    align-items: center;
                    gap: 11px;
                    color: #fff;
                    background: linear-gradient(135deg, #0755cc, #244ed8);
                    box-shadow: 0 8px 24px rgba(30,64,175,.18);
                }

                .sb-mobile-menu-btn,
                .sb-mobile-profile-btn {
                    width: 40px;
                    height: 40px;
                    flex: 0 0 40px;
                    display: grid;
                    place-items: center;
                    border: 0;
                    border-radius: 12px;
                    color: #fff;
                    background: rgba(255,255,255,.13);
                    cursor: pointer;
                    font-size: 20px;
                }

                .sb-mobile-mini-logo {
                    width: 38px;
                    height: 38px;
                    flex: 0 0 38px;
                    overflow: hidden;
                    border: 2px solid rgba(255,255,255,.8);
                    border-radius: 50%;
                    background: #fff;
                }

                .sb-mobile-mini-logo img {
                    width: 100%;
                    height: 100%;
                    object-fit: contain;
                }

                .sb-mobile-brand { flex: 1; min-width: 0; }

                .sb-mobile-brand strong {
                    display: block;
                    overflow: hidden;
                    font-size: 14px;
                    font-weight: 800;
                    white-space: nowrap;
                    text-overflow: ellipsis;
                }

                .sb-mobile-brand span {
                    display: block;
                    margin-top: 1px;
                    color: rgba(255,255,255,.72);
                    font-size: 10px;
                }

                .sb-mobile-profile-btn {
                    border-radius: 50%;
                    background: #fff;
                    color: #2864e8;
                    font-size: 12px;
                    font-weight: 900;
                }

                .sb-mobile-overlay {
                    position: fixed;
                    inset: 0;
                    z-index: 1080;
                    display: block;
                    background: rgba(15,23,42,.45);
                    backdrop-filter: blur(4px);
                    opacity: 0;
                    visibility: hidden;
                    transition: .25s ease;
                }

                .sb-mobile-overlay.show { opacity: 1; visibility: visible; }

                .content {
                    width: 100% !important;
                    margin-left: 0 !important;
                    padding-top: calc(var(--bcs-mobile-topbar) + 10px) !important;
                    padding-bottom: calc(var(--bcs-mobile-bottom) + 14px) !important;
                }

                .sb-mobile-bottomnav {
                    position: fixed;
                    left: 10px;
                    right: 10px;
                    bottom: max(10px, env(safe-area-inset-bottom));
                    z-index: 1055;
                    min-height: var(--bcs-mobile-bottom);
                    padding: 7px;
                    display: grid;
                    grid-template-columns: repeat(5, 1fr);
                    gap: 3px;
                    border: 1px solid rgba(255,255,255,.72);
                    border-radius: 22px;
                    background: color-mix(in srgb, var(--bcs-surface) 92%, transparent);
                    box-shadow: 0 16px 42px rgba(15,23,42,.18);
                    backdrop-filter: blur(18px);
                }

                .sb-bottom-item {
                    min-width: 0;
                    padding: 7px 3px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 4px;
                    border-radius: 15px;
                    color: #8996aa !important;
                    text-decoration: none !important;
                    font-size: 9px;
                    font-weight: 800;
                }

                .sb-bottom-item i { font-size: 18px; }

                .sb-bottom-item.active {
                    color: #fff !important;
                    background: linear-gradient(135deg, #2f6cf5, #2051d9);
                    box-shadow: 0 8px 18px rgba(37,99,235,.25);
                }
            }

            @media (max-width: 390px) {
                .sb-mobile-brand strong { font-size: 13px; }
                .sb-bottom-item { font-size: 8px; }
                .sb-bottom-item i { font-size: 17px; }
            }

            @media (prefers-reduced-motion: reduce) {
                .sidebar, .sb-menu-item, .sb-modal, .sb-modal-overlay, .sb-mobile-overlay {
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function getSession() {
        try {
            if (window.BCS?.Storage?.getSession) {
                const session = window.BCS.Storage.getSession();
                if (session) return session;
            }
        } catch (_) {}

        const keys = ["BCS_SESSION", "bcs_session", "BCS_USER"];
        for (const key of keys) {
            try {
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                const parsed = JSON.parse(raw);
                if (parsed) return parsed;
            } catch (_) {}
        }
        return null;
    }

    function getUser() {
        const session = getSession();
        const user = session?.user || session || {};

        const name = user.nama || user.name || user.fullName || "BCS User";
        const role = String(user.role || "USER").toUpperCase();
        const email = user.email || user.username || "";

        return { name, role, email };
    }

    function getInitials(name) {
        return String(name || "BCS")
            .trim()
            .split(/\s+/)
            .slice(0, 2)
            .map(part => part.charAt(0))
            .join("")
            .toUpperCase() || "BC";
    }

    function getCurrentPage() {
        const path = window.location.pathname.toLowerCase();
        const file = path.split("/").pop().replace(/\.(html?|php)$/i, "");

        if (!file || file === "index") {
            const hash = window.location.hash.replace(/^#\/?/, "").split(/[/?]/)[0];
            return hash || "dashboard";
        }

        const aliases = {
            "work-order": "wo",
            "workorder": "wo",
            "user-management": "admin",
            "users": "admin"
        };

        return aliases[file] || file;
    }

    function isAdmin(role) {
        return ["ADMIN", "ADMINISTRATOR", "SUPERADMIN", "SUPER ADMIN"].includes(role);
    }

    function navigateTo(href) {
        if (!href || href === "#") return;

        if (typeof window.navigate === "function") {
            window.navigate(href);
            return;
        }

        const currentPath = window.location.pathname.toLowerCase();
        const usesHtml = currentPath.endsWith(".html") || currentPath.endsWith(".htm");
        window.location.href = usesHtml ? `${href}.html` : href;
    }

    function buildMenu(user) {
        const current = getCurrentPage();

        return MENUS
            .filter(menu => !menu.adminOnly || isAdmin(user.role))
            .map(menu => {
                if (menu.divider) return `<div class="sb-divider" aria-hidden="true"></div>`;

                const active = !menu.logout && current === menu.href;
                const classes = [
                    "sb-menu-item",
                    active ? "active" : "",
                    menu.logout ? "sb-logout" : ""
                ].filter(Boolean).join(" ");

                return `
                    <a href="${menu.logout ? "#" : menu.href}"
                       class="${classes}"
                       data-sb-route="${menu.logout ? "" : menu.href}"
                       ${menu.logout ? 'data-sb-logout="true"' : ""}
                       ${active ? 'aria-current="page"' : ""}>
                        <span class="sb-icon-box sb-tone-${menu.tone}">
                            <i class="bi ${menu.icon}"></i>
                        </span>
                        <span class="sb-menu-label">${menu.label}</span>
                        ${menu.logout ? "" : '<i class="bi bi-chevron-right sb-arrow"></i>'}
                    </a>
                `;
            }).join("");
    }

    function renderSidebar() {
        const sidebar = document.querySelector(".sidebar");
        if (!sidebar) return;

        const user = getUser();
        const initials = getInitials(user.name);

        sidebar.innerHTML = `
            <div class="sb-desktop-header">
                <div class="sb-brand">
                    <div class="sb-logo">
                        <img src="assets/img/logo.png" alt="Building Care">
                    </div>
                    <h2 class="sb-title">Building Care</h2>
                    <div class="sb-version">Enterprise v4.3</div>
                </div>
            </div>

            <nav class="sb-body" aria-label="Main navigation">
                ${buildMenu(user)}
            </nav>

            <div class="sb-footer">
                <div class="sb-user-card">
                    <div class="sb-avatar-wrap">
                        <div class="sb-avatar">${initials}</div>
                        <span class="sb-online" title="Online"></span>
                    </div>
                    <div class="sb-user-info">
                        <div class="sb-user-name" title="${user.name}">${user.name}</div>
                        <div class="sb-role"><i class="bi bi-shield-fill-check"></i>${user.role}</div>
                        <span class="sb-email" title="${user.email}">${user.email}</span>
                    </div>
                    <i class="bi bi-chevron-down sb-user-chevron"></i>
                </div>
            </div>
        `;

        renderMobileChrome(user, initials);
        bindEvents(sidebar);
    }

    function renderMobileChrome(user, initials) {
        document.querySelectorAll(".sb-mobile-topbar, .sb-mobile-overlay, .sb-mobile-bottomnav").forEach(el => el.remove());

        const topbar = document.createElement("header");
        topbar.className = "sb-mobile-topbar";
        topbar.innerHTML = `
            <button class="sb-mobile-menu-btn" type="button" aria-label="Buka menu">
                <i class="bi bi-list"></i>
            </button>
            <div class="sb-mobile-mini-logo">
                <img src="assets/img/logo.png" alt="">
            </div>
            <div class="sb-mobile-brand">
                <strong>Building Care</strong>
                <span>Enterprise v4.3</span>
            </div>
            <button class="sb-mobile-profile-btn" type="button" aria-label="${user.name}">
                ${initials}
            </button>
        `;

        const overlay = document.createElement("div");
        overlay.className = "sb-mobile-overlay";

        const bottom = document.createElement("nav");
        bottom.className = "sb-mobile-bottomnav";
        bottom.setAttribute("aria-label", "Mobile navigation");

        const current = getCurrentPage();
        const mobileMenus = [
            MENUS.find(x => x.href === "dashboard"),
            MENUS.find(x => x.href === "report"),
            MENUS.find(x => x.href === "electricity"), // ← electricity masuk bottom nav
            MENUS.find(x => x.href === "wo"),
            MENUS.find(x => x.href === "history"),
            MENUS.find(x => x.href === "monitoring")
        ].filter(Boolean);

        bottom.innerHTML = mobileMenus.map(menu => `
            <a href="${menu.href}"
               class="sb-bottom-item ${current === menu.href ? "active" : ""}"
               data-sb-route="${menu.href}"
               ${current === menu.href ? 'aria-current="page"' : ""}>
                <i class="bi ${menu.icon}"></i>
                <span>${menu.label === "Work Order" ? "WO" : menu.label}</span>
            </a>
        `).join("");

        document.body.append(topbar, overlay, bottom);
    }

    function openMobileSidebar() {
        document.querySelector(".sidebar")?.classList.add("sb-open");
        document.querySelector(".sb-mobile-overlay")?.classList.add("show");
        document.body.classList.add("sb-mobile-open");
    }

    function closeMobileSidebar() {
        document.querySelector(".sidebar")?.classList.remove("sb-open");
        document.querySelector(".sb-mobile-overlay")?.classList.remove("show");
        document.body.classList.remove("sb-mobile-open");
    }

    function ensureLogoutModal() {
        let overlay = document.getElementById("sb-logout-modal");
        if (overlay) return overlay;

        overlay = document.createElement("div");
        overlay.id = "sb-logout-modal";
        overlay.className = "sb-modal-overlay";
        overlay.innerHTML = `
            <div class="sb-modal" role="dialog" aria-modal="true" aria-labelledby="sbLogoutTitle">
                <div class="sb-modal-icon"><i class="bi bi-box-arrow-right"></i></div>
                <h3 class="sb-modal-title" id="sbLogoutTitle">Keluar dari BCS?</h3>
                <p class="sb-modal-text">Sesi aktif akan diakhiri dan Anda perlu login kembali untuk mengakses Building Care System.</p>
                <div class="sb-modal-actions">
                    <button type="button" class="sb-modal-btn sb-modal-cancel">Batal</button>
                    <button type="button" class="sb-modal-btn sb-modal-confirm">Ya, Keluar</button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector(".sb-modal-cancel").addEventListener("click", () => overlay.classList.remove("show"));
        overlay.addEventListener("click", event => {
            if (event.target === overlay) overlay.classList.remove("show");
        });
        overlay.querySelector(".sb-modal-confirm").addEventListener("click", performLogout);

        return overlay;
    }

    async function performLogout() {
        try {
            if (window.BCS?.Auth?.logout) await window.BCS.Auth.logout();
            else if (typeof window.logout === "function") await window.logout();
        } catch (error) {
            console.warn("[Sidebar] Logout API gagal, sesi lokal tetap dibersihkan.", error);
        } finally {
            ["BCS_SESSION", "bcs_session", "BCS_USER", "BCS_TOKEN"].forEach(key => localStorage.removeItem(key));
            sessionStorage.clear();
            window.location.href = "login.html";
        }
    }

    function bindEvents(sidebar) {
        document.addEventListener("click", event => {
            const routeLink = event.target.closest("[data-sb-route]");
            if (routeLink) {
                const route = routeLink.dataset.sbRoute;
                if (route) {
                    event.preventDefault();
                    closeMobileSidebar();
                    navigateTo(route);
                }
            }

            if (event.target.closest("[data-sb-logout]")) {
                event.preventDefault();
                closeMobileSidebar();
                ensureLogoutModal().classList.add("show");
            }

            if (event.target.closest(".sb-mobile-menu-btn")) openMobileSidebar();
            if (event.target.closest(".sb-mobile-overlay")) closeMobileSidebar();
            if (event.target.closest(".sb-mobile-profile-btn")) openMobileSidebar();
        });

        window.addEventListener("resize", () => {
            if (window.innerWidth > MOBILE_BREAKPOINT) closeMobileSidebar();
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                closeMobileSidebar();
                document.getElementById("sb-logout-modal")?.classList.remove("show");
            }
        });
    }

    function init() {
        injectStyles();
        renderSidebar();
        console.log("✅ BCS Premium Responsive Sidebar v4.3 FINAL loaded");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
