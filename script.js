/* ===================== GLOBAL ===================== */
let expenses = [];
const STORAGE = "expense_data_v3";

/* ===================== UTILITIES ===================== */
const uuid = () => Date.now().toString(36) + Math.random().toString(36).slice(2);
const fdate = d => new Date(d).toLocaleDateString("en-GB");

/* ===================== STORAGE ===================== */
const load = () => expenses = JSON.parse(localStorage.getItem(STORAGE)) || [];
const save = () => localStorage.setItem(STORAGE, JSON.stringify(expenses));

/* ===================== SUMMARY ===================== */
function updateSummary() {
  let inc = 0, exp = 0, monthExp = 0;
  const m = new Date().getMonth();

  expenses.forEach(e => {
    if (e.type === "income") inc += e.amount;
    else exp += e.amount;

    if (new Date(e.date).getMonth() === m && e.type === "expense")
      monthExp += e.amount;
  });

  document.getElementById("totalIncome").textContent = inc;
  document.getElementById("totalExpense").textContent = exp;
  document.getElementById("balance").textContent = inc - exp;
  document.getElementById("monthTotal").textContent = monthExp;
}

/* ===================== MONTH FILTER ===================== */
function monthFilter(list) {
  const mode = monthFilterEl.value;
  if (mode === "all") return list;

  const now = new Date();
  const M = now.getMonth(), Y = now.getFullYear();

  return list.filter(e => {
    const d = new Date(e.date), m = d.getMonth(), y = d.getFullYear();

    if (mode === "this") return m === M && y === Y;
    if (mode === "prev") return m === (M - 1 + 12) % 12 && y === Y;
    if (mode === "3months") return d >= new Date(Y, M - 3, 1);
    if (mode === "year") return y === Y;

    return true;
  });
}

/* ===================== TABLE RENDER ===================== */
const tbody = document.getElementById("expenseTableBody");
const noData = document.getElementById("noDataMessage");
const monthFilterEl = document.getElementById("monthFilter");

function render() {
  tbody.innerHTML = "";

  let list = [...expenses];

  const s = document.getElementById("searchInput").value.toLowerCase();
  if (s) list = list.filter(e => e.title.toLowerCase().includes(s));

  const cat = document.getElementById("filterCategory").value;
  if (cat) list = list.filter(e => e.category === cat);

  const type = document.getElementById("filterType").value;
  if (type) list = list.filter(e => e.type === type);

  const from = document.getElementById("filterFrom").value;
  if (from) list = list.filter(e => new Date(e.date) >= new Date(from));

  const to = document.getElementById("filterTo").value;
  if (to) list = list.filter(e => new Date(e.date) <= new Date(to));

  list = monthFilter(list);

  if (!list.length) {
    noData.classList.remove("d-none");
    return;
  }

  noData.classList.add("d-none");

  list.forEach((e, i) => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${i + 1}</td>
      <td><b>${e.title}</b><br><small>${e.desc || ""}</small></td>
      <td><span class="badge ${e.type === 'income' ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}">${e.type}</span></td>
      <td class="${e.type === 'income' ? 'text-success' : 'text-danger'}">₹${e.amount}</td>
      <td>${e.category}</td>
      <td>${fdate(e.date)}</td>
      <td>
        <button class="btn btn-sm btn-outline-secondary" onclick="edit('${e.id}')"><i class="bi bi-pencil"></i></button>
        <button class="btn btn-sm btn-outline-danger" onclick="remove('${e.id}')"><i class="bi bi-x"></i></button>
      </td>
    `;

    tbody.appendChild(tr);
  });

  updateSummary();
  drawCharts();
}

/* ===================== FORM SUBMIT ===================== */
document.getElementById("expenseForm").addEventListener("submit", e => {
  e.preventDefault();

  const id = document.getElementById("editId").value;

  const data = {
    id: id || uuid(),
    title: document.getElementById("titleInput").value,
    desc: document.getElementById("descInput").value,
    amount: Number(document.getElementById("amountInput").value),
    type: document.getElementById("typeInput").value,
    category: document.getElementById("categoryInput").value,
    date: document.getElementById("dateInput").value,
  };

  if (id) {
    const i = expenses.findIndex(x => x.id === id);
    expenses[i] = data;
  } else {
    expenses.push(data);
  }

  save();
  render();
  e.target.reset();
  document.getElementById("editId").value = "";
  document.getElementById("formTitleText").textContent = "Add Transaction";
});

/* ===================== EDIT / DELETE ===================== */
function edit(id) {
  const e = expenses.find(x => x.id === id);
  document.getElementById("editId").value = e.id;
  document.getElementById("titleInput").value = e.title;
  document.getElementById("descInput").value = e.desc;
  document.getElementById("amountInput").value = e.amount;
  document.getElementById("typeInput").value = e.type;
  document.getElementById("categoryInput").value = e.category;
  document.getElementById("dateInput").value = e.date;

  document.getElementById("formTitleText").textContent = "Edit Transaction";
}

function remove(id) {
  if (!confirm("Delete?")) return;
  expenses = expenses.filter(x => x.id !== id);
  save();
  render();
}

/* ===================== EXPORT CSV ===================== */
document.getElementById("btnExportCSV").addEventListener("click", () => {
  if (!expenses.length) return alert("No data!");

  let csv = "Title,Description,Amount,Type,Category,Date\n";
  expenses.forEach(e => {
    csv += `"${e.title}","${e.desc}",${e.amount},${e.type},${e.category},${e.date}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "expenses.csv";
  a.click();
});

/* ===================== PRINT ===================== */
document.getElementById("btnPrint").addEventListener("click", () => window.print());

/* ===================== SAMPLE DATA ===================== */
document.getElementById("btnSampleData").addEventListener("click", () => {
  expenses = [
    { id: uuid(), title: "Salary", desc: "Month pay", amount: 40000, type: "income", category: "Salary", date: "2025-02-01" },
    { id: uuid(), title: "Groceries", desc: "Rice oil veggies", amount: 1800, type: "expense", category: "Food", date: "2025-02-05" },
    { id: uuid(), title: "Movie", desc: "", amount: 400, type: "expense", category: "Entertainment", date: "2025-02-07" }
  ];
  save();
  render();
});

document.getElementById("btnClearAll").addEventListener("click", () => {
  if (!confirm("Clear all?")) return;
  expenses = [];
  save();
  render();
});

/* ===================== CHARTS ===================== */
let categoryChart, monthlyChart, trendChart;

function drawCharts() {
  const catTotals = {};

  expenses.filter(e => e.type === "expense").forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });

  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById("categoryChart"), {
    type: "pie",
    data: {
      labels: Object.keys(catTotals),
      datasets: [{ data: Object.values(catTotals) }]
    }
  });

  // FULL YEAR MONTHLY BAR
  const months = Array(12).fill(0);
  expenses.filter(e => e.type === "expense").forEach(e => {
    months[new Date(e.date).getMonth()] += e.amount;
  });

  if (monthlyChart) monthlyChart.destroy();
  monthlyChart = new Chart(document.getElementById("monthlyChart"), {
    type: "bar",
    data: {
      labels: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      datasets: [{ data: months, backgroundColor: "#0d6efd" }]
    }
  });

  // TREND
  const sorted = expenses.filter(e => e.type === "expense").sort((a,b)=> new Date(a.date)-new Date(b.date));
  let cum = 0;
  const labels = [], vals = [];

  sorted.forEach(e => {
    cum += e.amount;
    labels.push(fdate(e.date));
    vals.push(cum);
  });

  if (trendChart) trendChart.destroy();
  trendChart = new Chart(document.getElementById("trendChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{ data: vals, tension: 0.4 }]
    }
  });
}

/* ===================== FILTER EVENTS ===================== */
["searchInput","filterCategory","filterType","filterFrom","filterTo","monthFilter"]
 .forEach(id => document.getElementById(id).addEventListener("input", render));

/* ===================== SIDEBAR MOBILE ===================== */
document.getElementById("sidebarToggle").addEventListener("click", () => {
  document.body.classList.toggle("sidebar-open");
});

/* ===================== INIT ===================== */
load();
render();
