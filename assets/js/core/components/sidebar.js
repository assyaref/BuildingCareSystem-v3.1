document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.getElementById("sidebar");

    if (!sidebar) return;

    sidebar.innerHTML = `
        <ul class="nav flex-column">

            <li class="nav-item">
                <a class="nav-link" href="dashboard.html">
                    <i class="bi bi-speedometer2"></i>
                    <span>Dashboard</span>
                </a>
            </li>

            <li class="nav-item">
                <a class="nav-link" href="report.html">
                    <i class="bi bi-file-earmark-text"></i>
                    <span>Report</span>
                </a>
            </li>

            <li class="nav-item">
                <a class="nav-link" href="wo.html">
                    <i class="bi bi-tools"></i>
                    <span>Work Order</span>
                </a>
            </li>

            <li class="nav-item">
                <a class="nav-link" href="budget.html">
                    <i class="bi bi-cash-stack"></i>
                    <span>Budget</span>
                </a>
            </li>

            <li class="nav-item">
                <a class="nav-link" href="monitoring.html">
                    <i class="bi bi-display"></i>
                    <span>Monitoring</span>
                </a>
            </li>

            <li class="nav-item">
                <a class="nav-link" href="history.html">
                    <i class="bi bi-clock-history"></i>
                    <span>History</span>
                </a>
            </li>

            <li class="nav-item">
                <a class="nav-link" href="approval.html">
                    <i class="bi bi-check2-square"></i>
                    <span>Approval</span>
                </a>
            </li>

            <li class="nav-item">
                <a class="nav-link" href="admin.html">
                    <i class="bi bi-people"></i>
                    <span>Admin</span>
                </a>
            </li>

        </ul>
    `;
});
