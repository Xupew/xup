const STORAGE_KEY = "flowdo-items-v1";

const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const priorityInput = document.getElementById("todo-priority");
const list = document.getElementById("todo-list");
const template = document.getElementById("todo-item-template");
const leftLabel = document.getElementById("items-left");
const totalLabel = document.getElementById("items-total");
const clearDoneButton = document.getElementById("clear-done");
const filterButtons = [...document.querySelectorAll(".filters button")];
const searchInput = document.getElementById("todo-search");
const PRIORITY_ORDER = ["high", "medium", "low"];
const PRIORITY_META = {
  high: { label: "高", className: "high" },
  medium: { label: "中", className: "medium" },
  low: { label: "低", className: "low" },
};

let filter = "all";
let searchQuery = "";
let todos = loadTodos();

render();

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  todos.unshift({
    id: crypto.randomUUID(),
    text,
    priority: normalizePriority(priorityInput.value),
    done: false,
    createdAt: Date.now(),
  });

  input.value = "";
  saveTodos();
  render();
});

list.addEventListener("click", (event) => {
  const itemNode = event.target.closest(".todo-item");
  if (!itemNode) return;
  const id = itemNode.dataset.id;

  if (event.target.classList.contains("delete-btn")) {
    todos = todos.filter((todo) => todo.id !== id);
    saveTodos();
    render();
  }
});

list.addEventListener("change", (event) => {
  if (!event.target.classList.contains("toggle")) return;
  const itemNode = event.target.closest(".todo-item");
  const id = itemNode.dataset.id;
  const target = todos.find((todo) => todo.id === id);
  if (!target) return;

  target.done = event.target.checked;
  saveTodos();
  render();
});

clearDoneButton.addEventListener("click", () => {
  todos = todos.filter((todo) => !todo.done);
  saveTodos();
  render();
});

searchInput.addEventListener("input", (event) => {
  searchQuery = event.target.value;
  render();
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filter = button.dataset.filter;
    filterButtons.forEach((node) => node.classList.toggle("active", node === button));
    render();
  });
});

function render() {
  list.innerHTML = "";
  const query = searchQuery.trim().toLowerCase();

  const visible = todos.filter((todo) => {
    if (filter === "active") return !todo.done;
    if (filter === "done") return todo.done;
    return true;
  }).filter((todo) => {
    if (!query) return true;
    return todo.text.toLowerCase().includes(query);
  });

  for (const todo of visible) {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = todo.id;

    const textNode = node.querySelector(".todo-text");
    const toggle = node.querySelector(".toggle");
    const priorityBadge = node.querySelector(".priority-badge");
    const priority = normalizePriority(todo.priority);
    const priorityMeta = PRIORITY_META[priority];

    textNode.textContent = todo.text;
    toggle.checked = todo.done;
    node.classList.toggle("done", todo.done);
    node.classList.add(`priority-${priority}`);
    priorityBadge.textContent = `${priorityMeta.label}优先级`;
    priorityBadge.classList.add(priorityMeta.className);

    list.appendChild(node);
  }

  const activeCount = todos.filter((todo) => !todo.done).length;
  leftLabel.textContent = `${activeCount} 项进行中`;
  totalLabel.textContent = `共 ${todos.length} 项`;
}

function saveTodos() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

function loadTodos() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item.text === "string")
      .map((item) => ({
        id: typeof item.id === "string" ? item.id : crypto.randomUUID(),
        text: item.text.trim(),
        priority: normalizePriority(item.priority),
        done: Boolean(item.done),
        createdAt: Number(item.createdAt) || Date.now(),
      }))
      .filter((item) => item.text.length > 0)
      .sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function normalizePriority(value) {
  return PRIORITY_ORDER.includes(value) ? value : "medium";
}
