let salaries = JSON.parse(localStorage.getItem("salaryEntries")) || [];
let expenses = JSON.parse(localStorage.getItem("expenseEntries")) || [];
let currentTab = "all";

const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  KRW: "₩",
  INR: "₹",
  IDR: "Rp",
  MYR: "RM",
  SGD: "S$",
  AUD: "A$",
  CAD: "C$",
  Other: "",
};

const months = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ===== Formatting =====
function formatMoney(amount, currency) {
  const symbol = currencySymbols[currency] || "";
  return (
    symbol +
    parseFloat(amount).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function getPeriodLabel(s) {
  return s.month + " " + s.year;
}

// ===== Update Dropdowns =====
function updateExpensePeriodOptions() {
  const select = document.getElementById("expensePeriod");
  const currentVal = select.value;
  select.innerHTML = '<option value="">-- ជ្រើសរើសខែ --</option>';

  const sorted = [...salaries].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return months.indexOf(b.month) - months.indexOf(a.month);
  });

  sorted.forEach((s) => {
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent =
      getPeriodLabel(s) + " (" + formatMoney(s.salary, s.currency) + ")";
    select.appendChild(opt);
  });

  if (currentVal) select.value = currentVal;
}

function updateFilterOptions() {
  const select = document.getElementById("filterMonth");
  const currentVal = select.value;
  select.innerHTML = '<option value="all">All Months</option>';

  const allPeriods = new Set();
  salaries.forEach((s) => allPeriods.add(getPeriodLabel(s)));
  expenses.forEach((e) => {
    const s = salaries.find((x) => x.id === e.salaryId);
    if (s) allPeriods.add(getPeriodLabel(s));
  });

  Array.from(allPeriods)
    .sort()
    .reverse()
    .forEach((p) => {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = p;
      select.appendChild(opt);
    });

  if (currentVal && Array.from(allPeriods).includes(currentVal)) {
    select.value = currentVal;
  }
}

// ===== Add Entries =====
function addSalary() {
  const month = document.getElementById("salaryMonth").value;
  const year = parseInt(document.getElementById("salaryYear").value);
  const salary = parseFloat(document.getElementById("salaryAmount").value);
  const currency = document.getElementById("salaryCurrency").value;
  const notes = document.getElementById("salaryNotes").value.trim();

  if (!salary || salary <= 0) {
    alert("Please enter a valid salary amount.");
    return;
  }

  const entry = {
    id: Date.now(),
    month,
    year,
    salary,
    currency,
    notes,
    dateAdded: new Date().toISOString(),
  };

  salaries.push(entry);
  salaries.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return months.indexOf(b.month) - months.indexOf(a.month);
  });

  saveData();
  updateExpensePeriodOptions();
  updateFilterOptions();
  renderTable();
  updateSummary();

  document.getElementById("salaryAmount").value = "";
  document.getElementById("salaryNotes").value = "";
}

function addExpense() {
  const salaryId = document.getElementById("expensePeriod").value;
  const category = document.getElementById("expenseCategory").value;
  const amount = parseFloat(document.getElementById("expenseAmount").value);
  const date = document.getElementById("expenseDate").value;
  const notes = document.getElementById("expenseNotes").value.trim();

  if (!salaryId) {
    alert(
      "Please select a salary month first. Add a salary entry if none exists.",
    );
    return;
  }
  if (!amount || amount <= 0) {
    alert("Please enter a valid expense amount.");
    return;
  }

  const entry = {
    id: Date.now(),
    salaryId: parseInt(salaryId),
    category,
    amount,
    date: date || new Date().toISOString().split("T")[0],
    notes,
    dateAdded: new Date().toISOString(),
  };

  expenses.push(entry);
  saveData();
  updateFilterOptions();
  renderTable();
  updateSummary();

  document.getElementById("expenseAmount").value = "";
  document.getElementById("expenseDate").value = "";
  document.getElementById("expenseNotes").value = "";
}

// ===== Delete Entries =====
function deleteSalary(id) {
  if (!confirm("Delete this salary? All linked expenses will also be removed."))
    return;
  salaries = salaries.filter((s) => s.id !== id);
  expenses = expenses.filter((e) => e.salaryId !== id);
  saveData();
  updateExpensePeriodOptions();
  updateFilterOptions();
  renderTable();
  updateSummary();
}

function deleteExpense(id) {
  if (!confirm("Delete this expense?")) return;
  expenses = expenses.filter((e) => e.id !== id);
  saveData();
  updateFilterOptions();
  renderTable();
  updateSummary();
}

function clearAll() {
  if (salaries.length + expenses.length === 0) return;
  if (!confirm("Delete ALL data? This cannot be undone.")) return;
  salaries = [];
  expenses = [];
  saveData();
  updateExpensePeriodOptions();
  updateFilterOptions();
  renderTable();
  updateSummary();
}

// ===== Storage =====
function saveData() {
  localStorage.setItem("salaryEntries", JSON.stringify(salaries));
  localStorage.setItem("expenseEntries", JSON.stringify(expenses));
}

// ===== Tabs =====
function switchTab(tab) {
  currentTab = tab;
  document
    .querySelectorAll(".btn-tab")
    .forEach((b) => b.classList.remove("active"));
  document.getElementById("tab-" + tab).classList.add("active");
  renderTable();
}

// ===== Render Table =====
function renderTable() {
  const container = document.getElementById("tableContainer");
  const filterMonth = document.getElementById("filterMonth").value;

  let displayItems = [];

  if (currentTab === "all" || currentTab === "salary") {
    salaries.forEach((s) => {
      if (filterMonth !== "all" && getPeriodLabel(s) !== filterMonth) return;
      displayItems.push({ type: "salary", data: s });
    });
  }
  if (currentTab === "all" || currentTab === "expense") {
    expenses.forEach((e) => {
      const s = salaries.find((x) => x.id === e.salaryId);
      const period = s ? getPeriodLabel(s) : "Unknown";
      if (filterMonth !== "all" && period !== filterMonth) return;
      displayItems.push({ type: "expense", data: e, salary: s });
    });
  }

  displayItems.sort((a, b) => b.data.dateAdded.localeCompare(a.data.dateAdded));

  if (displayItems.length === 0) {
    container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
                <p>No entries found.</p>
            </div>`;
    return;
  }

  let html = `<table>
        <thead>
            <tr>
                <th>Type</th>
                <th>Month</th>
                <th>Category / Notes</th>
                <th>Amount</th>
                <th style="width: 100px;">Action</th>
            </tr>
        </thead>
        <tbody>`;

  displayItems.forEach((item) => {
    if (item.type === "salary") {
      const s = item.data;
      html += `<tr>
                <td><span class="badge-salary">SALARY</span></td>
                <td>${getPeriodLabel(s)}</td>
                <td>${s.notes || "-"}</td>
                <td class="amount">${formatMoney(s.salary, s.currency)}</td>
                <td><button class="btn-danger" onclick="deleteSalary(${s.id})">Delete</button></td>
            </tr>`;
    } else {
      const e = item.data;
      const s = item.salary;
      const period = s ? getPeriodLabel(s) : "Unknown";
      const currency = s ? s.currency : "USD";
      html += `<tr>
                <td><span class="badge-expense">EXPENSE</span></td>
                <td>${period}</td>
                <td>${e.category}${e.notes ? " — " + e.notes : ""}</td>
                <td class="amount-expense">-${formatMoney(e.amount, currency)}</td>
                <td><button class="btn-danger" onclick="deleteExpense(${e.id})">Delete</button></td>
            </tr>`;
    }
  });

  html += "</tbody></table>";
  container.innerHTML = html;
}

// ===== Summary =====
function updateSummary() {
  const currencyCounts = {};
  salaries.forEach((s) => {
    currencyCounts[s.currency] = (currencyCounts[s.currency] || 0) + 1;
  });
  const mainCurrency =
    Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "USD";

  const totalSal = salaries.reduce((sum, s) => sum + s.salary, 0);

  let totalExp = 0;
  expenses.forEach((e) => {
    const s = salaries.find((x) => x.id === e.salaryId);
    if (s) totalExp += e.amount;
  });

  const net = totalSal - totalExp;

  document.getElementById("totalSalary").textContent = formatMoney(
    totalSal,
    mainCurrency,
  );
  document.getElementById("totalExpense").textContent = formatMoney(
    totalExp,
    mainCurrency,
  );
  document.getElementById("netBalance").textContent = formatMoney(
    Math.abs(net),
    mainCurrency,
  );

  const netEl = document.getElementById("netBalance");
  netEl.style.color = net >= 0 ? "#fff" : "#ffebee";

  document.getElementById("salaryCount").textContent = salaries.length;
  document.getElementById("expenseCount").textContent = expenses.length;
}

// ===== Export =====
function exportData() {
  if (salaries.length === 0 && expenses.length === 0) {
    alert("No data to export.");
    return;
  }
  let csv = "Type,Month,Year,Category,Amount,Currency,Notes,Date\\n";
  salaries.forEach((s) => {
    csv += `Salary,"${s.month}",${s.year},-,"${s.salary}","${s.currency}","${s.notes || ""}","${s.dateAdded}"\\n`;
  });
  expenses.forEach((e) => {
    const s = salaries.find((x) => x.id === e.salaryId);
    const month = s ? s.month : "";
    const year = s ? s.year : "";
    const currency = s ? s.currency : "USD";
    csv += `Expense,"${month}",${year},"${e.category}","${e.amount}","${currency}","${e.notes || ""}","${e.date}"\\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", "salary_expense_history.csv");
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ===== Initialize =====
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("expenseDate").value = new Date()
    .toISOString()
    .split("T")[0];
  updateExpensePeriodOptions();
  updateFilterOptions();
  renderTable();
  updateSummary();
});
